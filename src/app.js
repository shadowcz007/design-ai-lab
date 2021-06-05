/**负责APP的管理
 * 导入
 * 开发
 * 导出
*/

const utils = require('./utils');
const path = require('path');

const { remote } = require('electron');

class App {
    constructor() {
        // 开发状态的文件地址
        this.devConfigFile = this.loadConfigFileFromLocal();

    };

    // 导出
    exportApp(poster, code = "", course = "", readme = "", size, author = "", version = "") {
        // {
        //     "poster": "demo.png",
        //     "main": "main.js",
        //     "author":"shadow",
        //     "version":"0.1"
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
            author, version
        };

        remote.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory']
        }).then(async result => {
            if (result.canceled === false && result.filePaths && result.filePaths[0]) {
                let dirname = path.join(result.filePaths[0], data.filenames.filename + '_v' + data.version);
                // console.log(data,result.filePaths[0],dirname)
                // 新建文件夹
                utils.mkdirSync(dirname);
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
                    author: data.author,
                    version: data.version
                }, null, 2));

            };
        }).catch(err => {
            console.log(err);
            // resolve(null);
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
                    let files = await utils.loadDirFiles(result.filePaths[0]);
                    // console.log(files)
                    let configFile = files.filter(f => f.filename === 'config.json')[0]
                    if (configFile) {
                        this.setConfigFile(configFile);
                        // console.log(this.devConfigFile)
                        const res = this.loadConfig();
                        resolve(res);
                    }
                };
            }).catch(err => {
                console.log(err);
                resolve(null);
            })
        });
    }
    loadConfig() {
        if (!this.devConfigFile) this.loadConfigFileFromLocal();
        if (!this.devConfigFile) return
        let res = utils.readJsonSync(this.devConfigFile.filepath);
        let code = utils.readFileSync(path.join(this.devConfigFile.dirname, res.main));
        let poster = utils.readImageToBase64(path.join(this.devConfigFile.dirname, res.poster));
        let knowledge = res.knowledge;
        let author = res.author;
        let version = res.version;
        let size=res.size||[600,600];
        let course = knowledge ? knowledge.course : '', readme = knowledge ? knowledge.readme : '';
        return {
            code,
            poster,
            size,
            knowledge: {
                course, readme, author,
                version
            }
        }
    }
    // 保存除了代码以外的信息 例如 poster,knowledge:course,readme
    saveConfig(poster, course, readme,author,version) {
        console.log('saveConfig', poster, course, readme,author,version)
    }
}

module.exports = new App();