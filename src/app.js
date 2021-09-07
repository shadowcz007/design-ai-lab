/**负责APP的管理
 * 导入
 * 开发
 * 导出
 */

const utils = require('./utils');
const path = require('path');

const { remote } = require('electron');
const { resolve } = require('path');

class App {
    constructor() {
        // 开发状态的文件地址
        this.devConfigFile = this.loadConfigFileFromLocal();

    };

    // 导出
    exportApp(id,poster, code = "", course = "", readme = "", size, author = "", version = "") {
        // {
        //     "poster": "demo.png",
        //     "main": "main.js",
        //     "author":"shadow",
        //     "version":"0.1",
        //     "imports":[]
        // }
        let data = {
            filenames: {
                filename: readme.trim(),
                poster: "demo.png",
                main: 'main.js',
                config: 'config.json',
            },
            size,
            code,
            poster,
            knowledge: { course, readme },
            id,
            author,
            version
        };

        return new Promise((resolve, reject) => {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory']
            }).then(async result => {
                if (result.canceled === false && result.filePaths && result.filePaths[0]) {
                    let dirname = path.join(result.filePaths[0], data.filenames.filename + '_v' + data.version);
                    // console.log(data,result.filePaths[0],dirname)
                    let isNew = true;
                    if (utils.existsSync(dirname)) {
                        // 文件夹存在
                        // resolve({ dirname });
                        const cid = remote.dialog.showMessageBoxSync({
                            title: "覆盖文件夹",
                            message: "文件夹已存在，即将覆盖",
                            buttons: ["覆盖", "取消"],
                            type: "error",//图标类型
                        });
                        if (cid === 0) {
                            isNew = false;
                        }else if(cid===1){
                            // 取消
                            resolve(null);
                        }
                    };

                    // 新建文件夹
                    if (isNew === true) utils.mkdirSync(dirname);

                    // 保存main.js
                    utils.writeFileSync(path.join(dirname, data.filenames.main), data.code);
                    // 保存poster图片到本地
                    utils.writeImageFromBase64(path.join(dirname, data.filenames.poster), data.poster);
                    // 保存config.json
                    utils.writeFileSync(path.join(dirname, data.filenames.config), JSON.stringify({
                        poster: data.filenames.poster,
                        main: data.filenames.main,
                        knowledge: data.knowledge,
                        size: data.size,
                        id,
                        author: data.author,
                        version: data.version
                    }, null, 2));
                    resolve({ dirname });
                } else {
                    resolve(null);
                }

            }).catch(err => {
                console.log(err);
                resolve(null);
            })
        })


    }

    setConfigFile(configFile) {
        this.devConfigFile = configFile;
        localStorage.setItem('_App_devConfigFile', JSON.stringify(this.devConfigFile));
    }
    loadConfigFileFromLocal() {
        let res = localStorage.getItem('_App_devConfigFile');
        this.devConfigFile = res ? JSON.parse(res) : null;
    }
    dev() {
        return new Promise((resolve, reject) => {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then(async result => {
                if (result.canceled === false && result.filePaths && result.filePaths[0]) {
                    const res = this.loadConfigFromDir(result.filePaths[0])
                    resolve(res);
                };
            }).catch(err => {
                console.log(err);
                resolve(null);
            })
        });
    }
    loadConfigFromDir(dirname) {
        return new Promise(async (resolve, reject) => {
            let files = await utils.loadDirFiles(dirname);
            // console.log(files)
            let configFile = files.filter(f => f.filename === 'config.json')[0]
            if (configFile) {
                this.setConfigFile(configFile);
                const res = this.loadConfig();
                // 把本地开发的路径带上
                res.devPath=dirname;
                resolve(res);
            }
        });
    }
    loadConfig() {
        if (!this.devConfigFile) this.loadConfigFileFromLocal();
        if (!this.devConfigFile) return
        let res = utils.readJsonSync(this.devConfigFile.filepath);
        let code = utils.readFileSync(path.join(this.devConfigFile.dirname, res.main));
        let poster = utils.readImageToBase64(path.join(this.devConfigFile.dirname, res.poster));
        let { knowledge, author, version ,id} = res;
        let size = res.size || [600, 600];
        let course = knowledge ? knowledge.course : '',
            readme = knowledge ? knowledge.readme : '';
        return {
            id,
            code,
            poster,
            size,
            config: {
                course,
                readme,
                author,
                version
            },
        }
    }
    // 保存除了代码以外的信息 例如 poster,knowledge:course,readme
    saveConfig(poster, course, readme, author, version) {
        console.log('saveConfig', poster, course, readme, author, version)
    }
}

module.exports = new App();