const { ipcRenderer,remote } = require("electron");
const storage = require('electron-json-storage');
const fs = require("fs"),
    path = require("path");
const timeago = require('timeago.js');

const App = require('./app');
const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Win = require("./win");
const fileDb = require('./fileDb');
const Log = require('./log');
const utils = require('./utils');

const _package = remote.getGlobal('_PACKAGE');


// 缓存
class Storage{
    constructor(){
        this.types={
            // 存储APP的窗口状态
            0:'app',
            // 用来保存app所在的路径
            1:'example_file_path',
            // app的状态缓存
            2:'example_file_status'
        }
    }
    set(index=0,data){
        return new Promise((resolve, reject) => {
            storage.set(this.types[index], data, function(error) {
                if (error) throw error;
                resolve();
            });
        });
    }
    get(index=0){
        return new Promise((resolve, reject) => {
            storage.get(this.types[index], function(error, data) {
                if (error) throw error;
                resolve(data);
            });
        });
    }
};

const store=new Storage();



if(remote.getGlobal('_DEV')){
    // window.GUI = GUI;
    window.Win = Win;
    window.Knowledge = Knowledge;
    window.store=store;
}


/**
 * GUI界面
 * - DOM的封装
 */
class GUI {

    constructor() {

        /**
         * 记录是否点击过保存
         */
        this.isSave = false;

        /**
         * 知识对象
         * 分为标题readme和正文course
         */
        Knowledge.init(
            document.querySelector("#readme"),
            document.querySelector("#course"),
            document.querySelector("#author"),
            document.querySelector("#version")
        );


        /**
         * 编辑器对象
         * 
         */

        Editor.init(
            document.querySelector("#editor"),
            (code, codeId) => Win.executeJavaScript2Preview(
                this.createExecuteJs(code))
            // .then((result) => this.onPreviewWindowError())
            // .catch((err) => this.onPreviewWindowError())
        );

        this.mShow = false;
        this.pShow = false;
        this.toastError = false;
        Win.callback = async(t) => {
            console.log('this.updateDevCard();', t)
            await this.updateDevCard();

            Editor.updateStatus(t);
            console.log(t, this.mShow, this.pShow);
            if (this.mShow) this.loading.style.display = 'none';
            if (t == '#JS:完成') Win.showWinControl(this.mShow, this.pShow);

            if (t == '#JS:错误' && this.toastError === false) {
                $('body')
                    .toast({
                        message: '发生错误，建议检查代码版本',
                        displayTime: 0,
                        class: 'black',
                        classActions: 'basic left',
                        actions: [{
                            text: '确定',
                            class: 'yellow',
                            click: function() {
                                this.toastError = false;
                                // $('body').toast({message:'You clicked "yes", toast closes by default'});
                            }
                        }]
                    });
                this.toastError = true;
            }
        };

        /**
         * dev tool
         */

        //主界面提示
        this.info = document.querySelector('#info');

        this.loading = document.querySelector('#loading');
    }

    //生成注入的js代码
    createExecuteJs(code) {
        // p5的注入
        /*if (p5 && p5.instance) { p5.instance.remove() };
        if (!document.querySelector("#p5")) {
            let div = document.createElement('div');
            div.id = 'p5';
            document.body.appendChild(div);
        };
        document.querySelector("#p5").innerHTML = "";
        if (p5 && typeof (p5) == 'function') new p5(null, 'p5');
        */
        return `console.clear();
                try{
                    ${code.trim()};
                }catch(err){
                    console.log(err);
                }
                if(window.gui) {
                    document.querySelector("#gui-main").innerHTML="";
                    gui();
                };
                console.log('createExecuteJs-success')`;
    }

    init() {

        // app管理
        this.newFolderBtn = document.querySelector('#new-folder-btn');
        this.devFolderBtn = document.querySelector('#dev-folder-btn');
        this.modelConfirmBtn = document.querySelector('#model-confirm-btn');

        // 主页
        this.openFilesBtn = document.querySelector("#open-files");

        /**
         * editor面板
         */
        this.buildAppBtn = document.querySelector('#build-code-btn');
        this.devToolBtn = document.querySelector("#dev-tool-btn");
        this.setupCodeBtn = document.querySelector("#setup-code-btn");
        this.runBtn = document.querySelector("#run-code-btn");


        /**
         * 欢迎页面
         */
        this.myCourseBtn = document.querySelector("#my-course-btn");
        this.setupBtn = document.querySelector('#setup-btn');
        // this.nextPageBtn = document.querySelector('#next-page-btn');
        // this.prePageBtn = document.querySelector('#pre-page-btn');
        // this.pageNumInfo = document.querySelector('#page-num-info');

 
        // 设置页
        this.setupExampleFilePathBtn = document.querySelector("#setup-example-file-path");


        //
        this.addClickEventListener(this.buildAppBtn, () => this.saveFileFn());

        //调试代码
        this.addClickEventListener(this.devToolBtn, () => {
            // 打开调试窗口
            this.openPreviewDev();
        });

        // 打开设置页
        this.addClickEventListener(this.setupCodeBtn, () => {
            this.modelConfirmBtn.style.display = 'none';
            $('#knowledge-pannel').modal({
                onHidden: async() => {
                    await this.updateDevCard();
                }
            }).modal('show');
        });

        // 导入代码文件夹 - 转成 插件
        // this.addClickEventListener(this.importFolderBtn, () => {
        //     // App.create
        //     alert('开发中')
        // });

        // 新建代码文件夹
        this.addClickEventListener(this.newFolderBtn, () => {
            Knowledge.set({
                author: '',
                readme: '未命名',
                course: '示例模版',
                version: 0.1
            });
            Editor.setCode(`
            //Hello AI world!
            function gui() {
                let h = Lab.ui.createHeader(1, 'HELLO AI WORLD');
                Lab.ui.add(h);
            }`);
            $('#knowledge-pannel').modal('show');
            //  $('body').toast({message:'Great!'});

        });

        // TODO bug
        this.addClickEventListener(this.modelConfirmBtn, async e => {

            let data = await this.createSaveFileContent();
            let size = [400, 400];

            let exRes = await App.exportApp(
                data.id,
                data.poster,
                data.code,
                data.knowledge.course,
                data.knowledge.readme,
                size,
                data.author,
                data.version
            );

            if (exRes) {
                let { dirname } = exRes;
                let res = await App.loadConfigFromDir(dirname);
                // console.log(res)

                if (res) {
                    this.devPath = dirname;
                    this.openDevCard(res)
                };

            };
            $('#knowledge-pannel').modal('hide');

        })

        // this.addClickEventListener()
        // 打开代码文件夹
        // TODO 扩展参数
        this.addClickEventListener(this.devFolderBtn, async() => {
            let res = await App.dev();
            if (res) {
                // console.log(res)
                this.devPath = res.devPath;
                this.openDevCard(res);
                this.modelConfirmBtn.style.display = 'none';
            };
        });

        // 运行一次
        this.addClickEventListener(this.runBtn, () => {
            let res = App.loadConfig();
            if (res) {
                this.mShow = true;
                this.pShow = true;
                let { code } = res;
                Editor.setCode(code);
                Win.startExecuteJavaScript2Preview();
                this.openPracticeFn();
            }
        });

        // 设置
        this.addClickEventListener(this.setupBtn, () => {
            document.querySelector('#setup-pannel').style.display = 'flex';
            document.querySelector('#blank-pannel').style.display = 'none';
            //读取版本信息等
            let keywords = document.createElement('p');
            keywords.innerHTML = `关键词:${Array.from(_package.keywords, k => '<span>' + k + '</span>').join('')}`
            let version = document.createElement('p');
            version.innerText = `版本 ${_package.version}`;

            document.querySelector("#setup-pannel .info").innerHTML = '<h1>HELLO AI WORLD!</h1>';
            document.querySelector("#setup-pannel .info").appendChild(keywords);
            document.querySelector("#setup-pannel .info").appendChild(version);
            $('.ui.labeled.icon.sidebar').sidebar('toggle');
        });

        //设置路径
        this.addClickEventListener(this.setupExampleFilePathBtn, () => this.setupExampleFilePath());

        //APP
        this.addClickEventListener(this.myCourseBtn, e => {
            e.stopPropagation();
            // this.currentCardsFrom = 0;
            // this.currentPage = 1;
            this.exampleFiles().then(() => {
                document.querySelector('#setup-pannel').style.display = 'none';
                document.querySelector('#blank-pannel').style.display = 'flex';
                $('.ui.labeled.icon.sidebar').sidebar('toggle');
            });

        });
       
    }

    // 打开开发文件
    openDevCard(res) {
        let { code, config, size,id } = res;
        // console.log('appId',id)
        ipcRenderer.send('open-app',{id,name:config.readme});
        this.openFile({
            code,
            config,
            size: size
        });
        this.openFilesBtn ? this.openFilesBtn.style.display = 'none' : null;
        this.updateDevCard();
    }

    //保存窗口状态
    // 0 主窗口 1 主窗口 预览窗口 2 预览窗口
    saveWindowsStatus(status = 0) {
        let obj = Win.getWindowStatus(status);
        if (status === 2 || status === 1) {
            obj.executeJavaScript = this.createExecuteJs(Editor.getCode().trim());
            let knowledgeJson = Knowledge.get();
            obj.title = knowledgeJson.title;
        };
        return store.set(0,obj);
    }
    loadWindowStatus() {
        return new Promise((resolve, reject) => {
            store.get(0).then(data=>{
                // console.log('storage', data)
                Win.resize(data.size, 1);
                if (data.status === 1 && data.mainWindow.show) {
                    Win.resize([data.mainWindow.bound.width, data.mainWindow.bound.height], 0);
                };
                resolve();
            });
        });
    }

    //默认读取examples的地址
    setupExampleFilePath() {
        return new Promise((resolve, reject) => {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then(async result => {
                if (result.canceled === false) {
                    await store.set(1,{ data: result.filePaths[0] });
                    this.exampleFiles();
                };
                resolve();
            }).catch(err => {
                console.log(err);
                resolve();
            })
        });
    }

    loadExampleFiles() {
        return new Promise(async (resolve, reject) => {
            let data=await store.get(1);
            // console.log(data)
            let dirname = data.data || path.join(__dirname, '../examples');
                utils.loadDirFiles(dirname).then(files => {
                    files = files.filter(f => f.extname.match(_package.fileAssociations[0].ext));
                    Promise.all(Array.from(files, f => fs.readFileSync(f.filepath, 'utf-8'))).then((res) => {
                        res = Array.from(res, r => JSON.parse(r));
                        resolve(res);
                    });
                });
        });
    }

    async createSaveFileContent() {
        let previewWindow = Win.get(1);
        let knowledgeJson = Knowledge.get();

        let img = await Win.capturePage(0);
        // 压缩图片大小
        if (img) img = img.resize({ width: 120 });

        let data={
            //封面图
            poster: img ? img.toDataURL() : utils.readImageToBase64(path.join(__dirname, '../assets/ios/AppIcon.appiconset/icon-40.png')),
            //标题
            title: knowledgeJson.readme,
            //知识内容、课程介绍、代码解释等，markdown
            knowledge: knowledgeJson,
            //代码
            code: Editor.getCode(),
            //代码量
            code_length: (Editor.count()).length,
            //预览窗口尺寸
            size: previewWindow.getSize(),
            //文件类型
            extname: _package.fileAssociations[0].ext,
            //版本
            version: knowledgeJson.version,
            package_version: _package.version,
            //依赖id、用来标记版本等
            package_id: fileDb.id(_package),
            // 依赖包等
            dependencies: _package.dependencies,
            author: knowledgeJson.author,
            //创建时间
            create_time: (new Date()).getTime()
        }

        return {
            id:fileDb.id(data),
            ...data
        }

    }

    //获得需要存储的数据,定义文件格式(数据结构)
    getSaveFileContent() {
        return new Promise(async(resolve, reject) => {
            let res = await this.createSaveFileContent();
            let img = await Win.capturePage(1);
            // console.log(img)
            //TODO 压缩图片大小
            if (img) {
                img = img.resize({ width: 120 });
                res.poster = img.toDataURL();
            };
            resolve(res);
        });
    }

    async updateDevCard() {
        let res = await this.getSaveFileContent();
        // console.log(res)
        let card = this.createConfigCard({...res, devPath: this.devPath });
        Editor.updateCard(card);
    }

    openPreviewDev() {
        let wv = Win.get(1);
        // console.log(Win.get(1))
        if (!wv.webContents.isDevToolsFocused()) {
            wv.webContents.closeDevTools();
            wv.webContents.openDevTools({
                activate: true,
                mode: 'undocked'
            });
        };
    }

    /*
    捕捉previewWindow的错误
    TODO 捕捉console.log信息
    */
    onPreviewWindowError() {
        if ((Win.get(1)).devToolsWebContents) setTimeout(() => (Win.get(1)).devToolsWebContents.executeJavaScript(`
            Array.from(document.querySelectorAll('.console-error-level .console-message-text'),ms=>ms.innerHTML);
            `, false).then((result) => {
            if (result.length === 0) return Log.add('success');
            result = Array.from(result, r => {
                let d = document.createElement('div');
                d.innerHTML = r;
                return d.innerText.split('\n');
            }).reverse();
            Array.from(result, r => Log.add(r));
        }), 500);
    }

    //打开文件
    openFileFn() {
        let filePath = remote.dialog.showOpenDialogSync({
            title: "打开……",
            properties: ['openFile'],
            filters: [
                { name: _package.fileAssociations[0].name, extensions: ['json', _package.fileAssociations[0].ext] }
            ]
        });
        if (filePath) {

            // this.backup();
            // let mainWindow = this.get(0);
            let res = fs.readFileSync(filePath[0], 'utf-8');
            res = JSON.parse(res);
            res.filePath = filePath;
            console.log('!!!!', res);
            this.openFile(res);
            Win.changeAppIcon([{
                label: '关闭',
                click: () => {
                    this.closeFn();
                }
            }]);
        };
    }

    appMode(status = 1) {
        if (status == 0) {
            this.mShow = true;
            this.pShow = false;
            Win.getMainBound();
        };
        if (status == 1) {
            this.mShow = true;
            this.pShow = true;
        };
        if (status === 2) {
            this.mShow = false;
            this.pShow = true;
        }

        if (status != 0) {
            Win.changeAppIcon([{
                label: '关闭',
                click: () => {
                    this.closeFn();
                }
            }]);
        }

    }


    openFile(res) {
        this.appMode(1);

        // console.log('openFile', res)
        Knowledge.set(res.config);
        Editor.setCode(res.code);
        Editor.clearCard();
        // 重设
        // Win.resetPreview();

        Win.resetPreview();
        // 主窗口尺寸更新
        Win.resize([300, 300], 0);
        console.log('打开文件夹中ing………………')
        this.loading.style.display = 'block';
        //预览窗口的尺寸更新
        Win.resize(res.size, 1);
        Win.move();

        this.mShow = true;
        this.pShow = true;
        // Win.showWinControl(true,true);
        //预览窗口注入代码
        this.previewWinExecuteJavaScript(res.code, true);
        // this.createPreviewHtml().then(async() => {
        //     // console.log(res, erro)
        //     await utils.timeoutPromise(500);
        // });

        // 关闭自动更新
        setTimeout(Win.stopExecuteJavaScript2Preview(), 1000);

        //存至数据库
        // fileDb.fileAdd(res);

        document.getElementById("editor-pannel").style.display = "block";
        document.getElementById("blank-pannel").style.display = "none";

        this.saveWindowsStatus(1);

    }

    // 热更新模式
    // TODO 修复
    practiceFn() {
        if (!this.practiceBtn.getAttribute('sync-stop')) {
            Win.stopExecuteJavaScript2Preview();
        } else {
            //编程模式
            Win.startExecuteJavaScript2Preview();
            this.openPracticeFn(false);
        };
    };




    //编辑状态切换
    editFileFn(hardReadOnly = null) {

        //code编辑器只读
        // Editor.toggle(true);
        // this.closePracticeHtml();

        let isReadOnly = Knowledge.toggle(hardReadOnly);
        // console.log('isReadOnly',isReadOnly)
        Win.show(0, true);
        Win.changeAppIcon([{
            label: '发布',
            click: this.pubilcFn
        }]);
        this.saveWindowsStatus(1);

        if (!isReadOnly) {
            //编辑状态
            Win.edit();
        };
    }
 
    //新建文件
    newFileFn() {
        //新建的时候先保存上次的编辑的内容
        // this.backup();
        this.appMode(1);

        document.querySelector(".grid").style.display = "block";
        document.getElementById("blank-pannel").style.display = "none";

        //预览状态
        this.editFileFn(true);

        // this.editFileBtn.innerHTML = `<i class="fas fa-toggle-off"></i>`;
        Knowledge.set({
            readme: "",
            course: ""
        });
        Editor.setCode('//Hello AI world!');
        // Layout.clearAndReset();

    }

    saveFileFn() {
        this.getSaveFileContent().then(res => {
            let filename = res.title.trim();
            filename = filename === '' ? '未命名' : filename

            let filePath = path.join(__dirname, `../examples/${filename}.${res.extname}`);

            if (filePath) {
                // res.title = path.basename;
                // console.log(res.title)
                fs.writeFile(filePath, JSON.stringify(res, null, 2), 'utf8', err => {
                    if (err) console.error(err);
                    console.log("保存成功");
                    //保存成功
                    this.isSave = true;
                    Knowledge.toggle(true);
                    remote.dialog.showMessageBox({
                        type: 'info',
                        message: '保存成功',
                        buttons: ['好的']
                    });

                    Win.changeAppIcon([{
                        label: '关闭',
                        click: () => {
                            this.closeFn();
                        }
                    }]);

                });
                this.saveWindowsStatus(1);
            };
        });

    }

    initWin() {
        this.modelConfirmBtn.style.display = 'inline-block';
        Knowledge.toggle(true);
        document.getElementById("editor-pannel").style.display = "none";
        document.getElementById("blank-pannel").style.display = "flex";
        this.openFilesBtn ? this.openFilesBtn.style.display = 'block' : null;
        //从默认路径，读取卡片信息
        this.exampleFiles();
        this.mShow = true;
        this.pShow = false;
        setTimeout(() => this.loading.style.display = 'none', 2000);
    }

    closeFn() {

        this.initWin();
        Win.resetPreview();
        //窗口
        Win.showWinControl(true, false);
        Win.changeAppIcon();
        Win.setMainBound();
        setTimeout(() => this.saveWindowsStatus(0), 1500);
        //this.loadWindowStatus().then(() => setTimeout(() => this.saveWindowsStatus(0), 1500));
    }

    //创建卡片集
    createCards(data, isCanClose = false) {
        // console.log(data)
        document.getElementById("recent-files").innerHTML = '';

        let div = document.createDocumentFragment();

        Array.from(data, d => {
            div.appendChild(
                //插件/课程-卡片
                this.createCard(d, isCanClose)
            );
        });

        document.getElementById("recent-files").appendChild(div);
    }

    //我的卡片
    exampleFiles() {
        return new Promise((resolve, reject) => {
            this.loadExampleFiles().then((ds) => {
                document.querySelector('#toolsbox-nums').innerText = ds.length;
                // 根据最近使用过的调整排序
                store.get(2).then(newData=>{
                    if(newData){
                        for (let index = 0; index < ds.length; index++) {
                            if(newData[ds[index].id]){
                                ds[index].create_time=newData[ds[index].id];
                                ds[index].isHot=true;
                            }
                         }
                    };
                    ds = ds.sort((a, b) => b.create_time - a.create_time);
                    this.createCards(ds, false);
                    resolve();
                })
            });
        })
    }

    closeEditorWin() {
            document.getElementById("knowledge-pannel").style.display = "block";
            document.getElementById("editor-pannel").classList.remove("pannel-large");
            document.body.querySelector('#frame').style.borderWidth = '0px !important;';
            document.body.querySelector('#frame').style.height = "100%";
            // Layout.reset();
            // this.openBtn.classList.remove('button-active');
        }
      
    //编程，UI状态
    openPracticeHtml() {
       this.practiceBtn.innerHTML = `<i class="sync icon fa-spin"></i>`;
        this.practiceBtn.removeAttribute('sync-stop');    
    }

    //编程功能，按钮
    openPracticeFn(shouldReload = true) {
        this.openPractice(true, true, shouldReload);
        this.saveWindowsStatus(1);
    };

    //打开编程功能
    openPractice(mShow = true, pShow = true, shouldReload = true) {
        this.loadWindowStatus();
        this.mShow = mShow;
        this.pShow = pShow;
        console.log('openPractice:', this.mShow, this.pShow);
        let previewWindow = Win.get(1),
            mainWindow = Win.get(0);
        if (previewWindow && mainWindow) {
            mainWindow.focus();
            // TODO 优化，判断是否需要重载 
            if (shouldReload) {
                previewWindow.webContents.reload();
                previewWindow.webContents.once('dom-ready', () => {
                    this.previewWinExecuteJavaScript(null, true);
                    Win.edit();
                });
            } else {
                this.previewWinExecuteJavaScript(null, true);
                Win.edit();
            }

        };
    }


    //发布按钮
    pubilcFn() {
        //code编辑器状态设为只读
        this.mShow = false;
        this.pShow = true;

        Win.public();

        this.saveWindowsStatus(2);
        Win.changeAppIcon([{
            label: '编辑',
            click: () => this.editFileFn(false)
        }]);
    }

    // forceRun强制执行
    previewWinExecuteJavaScript(code = null, forceRun = false) {
        // console.log('previewWinExecuteJavaScript', forceRun)
        code = this.createExecuteJs(code || Editor.getCode());
        if (forceRun) {
            Win.executeJavaScript2Preview(code, forceRun);
        } else {
            // 关闭自动更新
            Win.stopExecuteJavaScript2Preview();
        }
    }

    createElement(className, type = 'div') {
        let div = document.createElement(type);
        div.className = className;
        return div
    }

    // 创建基础卡片
    createBaseCard(data) {
            let readme = this.createElement('', 'h5');
            readme.innerHTML = Knowledge.marked(data.knowledge.readme);
            readme.innerText = readme.innerText;
            // console.log(data)
            let html = `<img class="ui avatar image" 
                            src="${data.poster ? URL.createObjectURL(this.base64ToBlob(data.poster)) : path.join(__dirname, '../assets/ios/AppIcon.appiconset/icon-40.png')}"
                            style='border-radius: 0;outline: 1px solid #e2e2e2;margin: 8px 0;margin-right: 18px;'>
                    <div class="content">
                        <div class="header" style='width: 180px;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;'>${readme.innerText}</div>
                        <div class="description" style='font-size: 12px;margin: 4px 0;'>
                            <div class="meta">${data.create_time ? timeago.format(data.create_time, 'zh_CN') + " " : ""} </div>
                            ${data.id?'<i class="infinity icon"></i>':''}
                            ${data.isHot?'<i class="heart icon"></i>':''}
                            代码量 ${data.code_length} ${((fileDb.id(_package) === data.package_id) ? `版本 ${data.version}` : '<i class="exclamation circle icon"></i>')}
                            ${data.devPath ? `<p style='display: -webkit-box;
                            -webkit-box-orient: vertical;
                            -webkit-line-clamp: 2;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            width: 80%;'>路径  <span class="ui small gray text">${data.devPath}</span></p>` : ''}
                        </div>
                    </div>
                    <div class="ui right floated content buttons">
                   
                    </div>`

        let div = this.createElement('item');
        div.innerHTML = html;
        return div;
    }

    //创建卡片
    createCard(data, isCanClose = false) {
        let div = this.createBaseCard(data);
        if (isCanClose !== true) {
            let runBtn = this.createElement("mini ui button");
            runBtn.innerText = '运行';

            div.querySelector('.buttons').appendChild(runBtn);
            this.addClickEventListener(runBtn, e => {
                e.stopPropagation();
                if (this.newRun === true) return;
                if (!runBtn.classList.contains('disabled')) runBtn.classList.add('disabled');
                if (!runBtn.classList.contains('loading')) runBtn.classList.add('loading');
                this.newRun = true;

                //控制窗口大小
                Win.resize(data.size, 1);
                //移动窗口
                Win.move();
                Win.show(0, false);
                this.mShow = false;
                this.pShow = true;
                //注入的js
                this.previewWinExecuteJavaScript(data.code, true);
                // console.log('data',data)
                // 记录打开次数
                store.get(2).then(d=>{
                    if(data.id){
                        if(!d) d={};
                        d[data.id]=(new Date()).getTime();
                        store.set(2,d);
                    }
                });
                
                // 
                ipcRenderer.send('open-app',{id:data.id,name:data.title});
                // 3秒后取消
                setTimeout(() => {
                    if (runBtn.classList.contains('disabled')) runBtn.classList.remove('disabled');
                    if (runBtn.classList.contains('loading')) runBtn.classList.remove('loading');
                    this.newRun = false;
                }, 10000);

                this.appMode(2);

            });
        };

        let exportBtn = this.createElement("mini ui button");
        exportBtn.innerText = '导出';
        div.querySelector('.buttons').appendChild(exportBtn);
        this.addClickEventListener(exportBtn, e => {
            // console.log(data)
            App.exportApp(
                data.id,
                data.poster,
                data.code,
                data.knowledge.course,
                data.knowledge.readme,
                data.size,
                data.author,
                data.version
            )
        });

        if (isCanClose === true) {
            let closeBtn = this.createElement("mini ui button");
            div.querySelector('.buttons').appendChild(closeBtn);
            closeBtn.innerText = '删除';
            this.addClickEventListener(closeBtn, e => {
                e.stopPropagation();
                div.remove();
                // fileDb.fileRemoveById(data.id);
                // setTimeout(()=>{
                //     this.recentFiles(this.currentPage);
                // },1000);
            })
        };

        return div;
    }

    // 创建配置卡片
    createConfigCard(data) {
        return this.createBaseCard(data);
    }

    addClickEventListener(element, fn) {
        let isClicked = false;
        if (element) element.addEventListener("click", e => {
            //e.preventDefault();
            if (isClicked === true) return;
            isClicked = true;
            fn(e);
            setTimeout(() => {
                isClicked = false;
            }, 500);
        });
    };

    base64ToBlob(urlData, type) {
        let arr = urlData.split(',');
        let mime = arr[0].match(/:(.*?);/)[1] || type;
        let bytes = window.atob(arr[1]);
        let ab = new ArrayBuffer(bytes.length);
        let ia = new Uint8Array(ab);
        for (let i = 0; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ab], {
            type: mime
        });
    }
}

module.exports = new GUI();