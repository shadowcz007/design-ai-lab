const { remote, clipboard } = require("electron");
const storage = require('electron-json-storage');
const fs = require("fs"),
    path = require("path");
const timeago = require('timeago.js');
const Resizer = require('resizer-cl');

const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Win = require("./win");
const fileDb = require('./fileDb');
const Log = require('./log');
const Layout = require('./layout');


// window.Win = Win;
// window.Editor=Editor;

const _package = remote.getGlobal('_PACKAGE');

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
            document.querySelector("#course"));


        /**
             * 编辑器对象
             * 
                检查编辑器 写的代码 本身的错误
                TODO 对预设库的调用，比如cv的兼容
                是否是p5的代码
                runtime.isP5Function(code);
                let preRun = ['preload', 'setup', 'draw'];
                preRun会不断执行;

                每次代码改变的时候，都会重新加载
                Editor.onDidChangeModelContent=openPractice;
        */

        Editor.init(
            document.querySelector("#editor"),
            (code, codeId) => Win.executeJavaScript2Preview(
                this.createExecuteJs(code))
            // .then((result) => this.onPreviewWindowError())
            // .catch((err) => this.onPreviewWindowError())
        );
        //鼠标按键抬起
        // Editor.onMouseUp = () => console.log("onMouseUp");
        //鼠标按键按下
        //Editor.onMouseDown = () => this.onPreviewWindowError();



        /**
         * dev tool
         */

        //主界面提示
        this.info = document.querySelector('#info');


    }

    //生成注入的js代码
    createExecuteJs(code) {
        return `console.clear();
                            if (p5.instance) { p5.instance.remove() };
                            if(!document.querySelector("#p5")){
                                let div=document.createElement('div');
                                div.id='p5';
                                document.body.appendChild(div);
                            };
                            document.querySelector("#p5").innerHTML = "";
                            new p5(null, 'p5');
                            ${code.trim()};
                            if(window.gui) {
                                document.querySelector("#gui-main").innerHTML="";
                                //console.log(Object.is(window.Lab,undefined)?3000:100)
                                gui();
                            }else{
                                Lab.base.isDisplay();
                            }
                            console.log('createExecuteJs-success')
                            `
    }

    init() {

        /**
         * knowledge面板
         */
        this.editFileBtn = document.querySelector("#edit-file");


        /**
         * editor面板
         */
        this.practiceBtn = document.querySelector("#practice-btn");
        this.openBtn = document.querySelector("#open-btn");
        // this.devBtn = document.querySelector("#devtool-btn");


        /**
         * 欢迎页面
         */
        this.setupBtn = document.querySelector("#setup");
        this.myCourseBtn = document.querySelector("#my-course-btn");
        this.recentBtn = document.querySelector("#recent-btn");

        /**
         * editor面板中的窗口resize功能
         */
        this.resizer = null;


        //编辑/预览 切换
        this.addClickEventListener(this.editFileBtn, () => this.editFileFn());
        //实时编辑代码
        this.addClickEventListener(this.practiceBtn, () => this.practiceFn());

        // 暂停实时更新
        this.addClickEventListener(this.openBtn, () => {
            this.openBtn.classList.toggle('button-active');
            this.toggleEditorWin();
        });

        //调试界面打开
        // this.addClickEventListener(this.devBtn, () => {
        //     // Win.get(1).devToolsWebContents.isDestroyed()
        //     if (Win.get(1).devToolsWebContents == null || (Win.get(1).devToolsWebContents && Win.get(1).devToolsWebContents.isDestroyed())) {
        //         this.openDevTool();
        //         this.devBtn.classList.add('button-active');
        //         // this.devOpen = true;
        //     } else {
        //         this.closeDevTool();
        //         this.devBtn.classList.remove('button-active');
        //         // this.devOpen = false;
        //     }
        // });
        //设置路径
        this.addClickEventListener(this.setupBtn, () => this.setupExampleFilePath());
        //我的
        this.addClickEventListener(this.myCourseBtn, e => {
            e.stopPropagation();
            this.myCourseBtn.classList.add('button-select');
            this.recentBtn.classList.remove('button-select');
            this.exampleFiles();
        });
        //最近
        this.addClickEventListener(this.recentBtn, e => {
            e.stopPropagation();
            this.myCourseBtn.classList.remove('button-select');
            this.recentBtn.classList.add('button-select');
            this.recentFiles();
        });


    }



    //保存窗口状态
    // 0 主窗口 1 主窗口 预览窗口 2 预览窗口
    saveWindowsStatus(status = 0) {
        let obj = Win.getWindowStatus(status);
        if (status === 2) {
            obj.executeJavaScript = this.createExecuteJs(Editor.getCode().trim());
            let knowledgeJson = Knowledge.get();
            obj.title = knowledgeJson.title;
        };
        storage.set('app', obj, function(error) {
            if (error) throw error;
        });
    }
    loadWindowStatus() {
        storage.get('app', function(error, data) {
            console.log('storage', data)
        })
    }

    //默认读取examples的地址
    setupExampleFilePath() {
        return new Promise((resolve, reject) => {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then(result => {
                if (result.canceled === false) {
                    storage.set('example_file_path', { data: result.filePaths[0] }, error => {
                        if (error) throw error;
                        this.exampleFiles();
                    });
                };

            }).catch(err => {
                console.log(err)
            })

        });
    }

    loadExampleFiles() {
        return new Promise((resolve, reject) => {
            storage.get('example_file_path', (error, data) => {
                // console.log('storage', data)
                if (error) throw error;
                let dirname = data.data || path.join(__dirname, '../examples');
                fs.readdir(dirname, 'utf-8', (err, files) => {

                    files = Array.from(files, f => path.join(dirname, f));
                    // console.log(files)
                    files = files.filter(f => path.extname(f).match(_package.build.fileAssociations[0].ext));

                    Promise.all(Array.from(files, f => fs.readFileSync(f, 'utf-8'))).then((res) => {
                        res = Array.from(res, r => JSON.parse(r));
                        resolve(res);
                    });

                });

            });

        });
    }

    //获得需要存储的数据,定义文件格式(数据结构)
    getSaveFileContent() {

        return new Promise((resolve, reject) => {
            let previewWindow = Win.get(1);
            //截图
            previewWindow.webContents.capturePage().then(img => {
                // 压缩图片大小
                img = img.resize({ width: 120 });
                // console.log(img.toDataURL())
                let knowledgeJson = Knowledge.get();
                resolve({
                    //封面图
                    poster: img.toDataURL(),
                    //标题
                    title: knowledgeJson.title,
                    //知识内容、课程介绍、代码解释等，markdown
                    knowledge: {
                        readme: knowledgeJson.readme,
                        course: knowledgeJson.course
                    },
                    //代码
                    code: Editor.getCode(),
                    //代码量
                    code_length: (Editor.count()).length,
                    //预览窗口尺寸
                    size: previewWindow.getSize(),
                    //文件类型
                    extname: _package.build.fileAssociations[0].ext,
                    //版本
                    version: _package.version,
                    //依赖id、用来标记版本、依赖包等
                    package_id: fileDb.id(_package),
                    //创建时间
                    create_time: (new Date()).getTime()
                })
            });
        });
    }

    /**
     * devtool
     */
    // closeDevTool() {
    //     document.getElementById("devtools").style.display = "none";
    //     document.getElementById("frame").style.height = "100%";
    //     Win.get(1).closeDevTools();
    // }
    // openDevTool(inner = true) {
    //     const devtoolsView = document.getElementById("devtools");
    //     Win.get(1).openDevTools({
    //         activate: inner,
    //         mode: 'undocked'
    //     });
    //     if (inner == true) return;
    //     const port = remote.getGlobal('_DEBUG_PORT');
    //     fetch(`http://127.0.0.1:${port}/json/list?t=` + new Date().getTime()).then(res => res.json()).then(
    //         res => {
    //             let target = res.filter(r => r.url === Win.get(1).getURL());
    //             if (target[0]) {

    //                 devtoolsView.setAttribute("src", `http://127.0.0.1:${port}${target[0].devtoolsFrontendUrl}`);
    //                 //devtoolsView.setAttribute("src", Win.get(1).devToolsWebContents.getURL());

    //                 devtoolsView.addEventListener('did-finish-load', e => {
    //                     // const { webContents } = remote.webContents;

    //                     const browser = Win.get(1).webContents;
    //                     const devtools = remote.webContents.fromId(devtoolsView.getWebContentsId());

    //                     browser.setDevToolsWebContents(devtools);
    //                     browser.openDevTools();

    //                     document.getElementById("devtools").style.display = "flex";
    //                     if (this.resizer) return document.body.querySelector('#frame').style.borderWidth = '12px';
    //                     this.resizer = new Resizer('#frame', {
    //                         grabSize: 10,
    //                         resize: 'vertical',
    //                         handle: 'bar'
    //                     });

    //                     // console.log('====21=====', this.resizer)

    //                 });
    //                 devtoolsView.addEventListener('did-fail-load', event => {
    //                     console.log(event)
    //                 })

    //             }
    //         }
    //     )
    // }

    // openPreviewDev() {
    //     Win.get(1).openDevTools({
    //         activate: true,
    //         mode: 'undocked'
    //     });
    // }

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
                { name: _package.build.fileAssociations[0].name, extensions: ['json', _package.build.fileAssociations[0].ext] }
            ]
        });
        if (filePath) {

            this.backup();
            // let mainWindow = this.get(0);
            let res = fs.readFileSync(filePath[0], 'utf-8');
            res = JSON.parse(res);
            res.filePath = filePath;

            this.openFile(res);
            Win.changeAppIcon([{
                label: '发布',
                click: this.pubilcFn
            }]);
        };
    }


    openFile(res) {
        // console.log('openFile', res)
        Knowledge.set(res.knowledge);
        Editor.setCode(res.code);

        //预览窗口的尺寸更新
        Win.resize(res.size, 1);
        Win.move();

        //预览窗口注入代码
        this.previewWinExecuteJavaScript(res.code, true);

        // 关闭自动更新
        setTimeout(Win.stopExecuteJavaScript2Preview(), 1000);

        //存至数据库
        // fileDb.fileAdd(res);

        document.querySelector(".grid").style.display = "block";
        document.getElementById("blank-pannel").style.display = "none";

        Editor.toggle(true);
        Knowledge.toggle(true);
        this.closePracticeHtml();

        // 预览状态
        this.previewStatus();

        Layout.clearAndReset();

    }

    practiceFn() {
        // console.log('practiceFn')
        Editor.toggle(false);
        // console.log('编程模式', this.practiceBtn.getAttribute('sync-stop'))
        if (!this.practiceBtn.getAttribute('sync-stop')) {
            Win.stopExecuteJavaScript2Preview();
            this.closePracticeHtml();
        } else {
            //编程模式
            Win.startExecuteJavaScript2Preview();
            this.openPracticeHtml();
            this.openPracticeFn(false);
        };
    };

    editStatus() {
        //编辑状态
        this.editFileBtn.innerHTML = `<i class="far fa-lightbulb"></i>`;
        //document.getElementById("knowledge-pannel").classList.add("pannel-large");
        Layout.destroy();
        // Layout.dragEnabled(false);
    }

    previewStatus() {
            //预览状态
            // console.log("预览状态")
            this.editFileBtn.innerHTML = `<i class="far fa-eye"></i>`;
            document.getElementById("knowledge-pannel").classList.remove("pannel-large");
            Layout.init();
        }
        //编辑状态切换
    editFileFn(hardReadOnly = null) {

        //code编辑器只读
        Editor.toggle(true);
        this.closePracticeHtml();

        let isReadOnly = Knowledge.toggle(hardReadOnly);
        // console.log('isReadOnly',isReadOnly)
        Win.show(0, true);
        Win.changeAppIcon([{
            label: '发布',
            click: this.pubilcFn
        }]);
        this.saveWindowsStatus(1);

        if (isReadOnly) {
            //预览状态
            this.previewStatus();
        } else {
            //编辑状态
            this.editStatus();
            Win.edit();
        };
    }

    backup() {
        this.getSaveFileContent().then(res => {
            fileDb.fileAdd(res);
            this.info.innerText = '已备份';
            // remote.dialog.showMessageBox({
            //     type: 'info',
            //     message: '已备份',
            //     buttons: ['好的']
            // });
        });
    }


    //新建文件
    newFileFn() {
        //新建的时候先保存上次的编辑的内容
        this.backup();

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
        Layout.clearAndReset();

        Win.showWinControl(true, false);
        Win.changeAppIcon([{
            label: '保存',
            click: () => this.saveFileFn()
        }]);
    }

    saveFileFn() {
        this.getSaveFileContent().then(res => {
            let filePath = remote.dialog.showSaveDialogSync({
                title: "另存为……",
                defaultPath: res.title.trim() + '.' + res.extname
            });
            if (filePath) {
                res.title = path.basename;
                fs.writeFile(filePath, JSON.stringify(res, null, 2), 'utf8', function(err) {
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
                        label: '发布',
                        click: this.pubilcFn
                    }]);

                });
                this.saveWindowsStatus(1);
            };
        });

    }

    closeFn() {
        //TODO 确定关闭？未保存将丢失
        this.backup();

        //code编辑器只读
        Editor.toggle(true);
        Knowledge.toggle(true);

        this.closeEditorWin();
        this.closePracticeHtml();

        this.previewStatus();
        // console.log('closeFn')
        // this.editFileFn(true);
        // this.practiceFn(true);

        document.querySelector(".grid").style.display = "none";
        document.getElementById("blank-pannel").style.display = "block";

        //读取版本信息等
        let keywords = document.createElement('p');
        keywords.innerHTML = `关键词:${Array.from(_package.keywords, k => '<span>' + k + '</span>').join('')}`
        let version = document.createElement('p');
        version.innerText = `版本 ${_package.version}`;

        document.querySelector("#blank-pannel .info").innerHTML = '<h1>HELLO AI WORLD!</h1>';
        document.querySelector("#blank-pannel .info").appendChild(keywords);
        document.querySelector("#blank-pannel .info").appendChild(version);

        //Win.showWinControl(true,false);

        //从默认路径，读取卡片信息
        this.exampleFiles();

        //窗口
        Win.showWinControl(true, false);
        Win.changeAppIcon([{
            label: '新建',
            click: this.newFileFn
        }]);

    }

    //创建卡片集
    createCards(data, isCanClose = false) {
        // console.log(data)
        document.getElementById("recent-files").innerHTML = '';

        let div = document.createDocumentFragment();
        data = data.sort((a, b) => b.create_time - a.create_time);
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
        this.loadExampleFiles().then((ds) => this.createCards(ds));
    }

    //最近打开的卡片
    recentFiles() {
        this.createCards(fileDb.fileGetAll(), true);
    }

    // 
    openEditorWin() {
        Layout.destroy();
        document.getElementById("knowledge-pannel").style.display = "none";
        document.getElementById("editor-pannel").classList.add("pannel-large");
        this.openBtn.classList.add('button-active');
    }

    closeEditorWin() {
            document.getElementById("knowledge-pannel").style.display = "block";
            document.getElementById("editor-pannel").classList.remove("pannel-large");
            document.body.querySelector('#frame').style.borderWidth = '0px !important;';
            document.body.querySelector('#frame').style.height = "100%";
            Layout.reset();
            this.openBtn.classList.remove('button-active');
        }
        // 放大编程页面
    toggleEditorWin() {
        if (this.openBtn.classList.contains('button-active')) {
            this.openEditorWin();
        } else {
            this.closeEditorWin();
        }
    }

    //编程，UI状态关闭
    closePracticeHtml() {
        // document.getElementById("knowledge-pannel").style.display = "block";
        // document.getElementById("editor-pannel").classList.remove("pannel-large");
        this.practiceBtn.innerHTML = `<i class="fas fa-sync"></i>`;
        // console.log(Editor)
        Editor.toggle(false);
        this.practiceBtn.setAttribute('sync-stop', 1);
        // this.closeDevTool();
    };

    //编程，UI状态
    openPracticeHtml() {
        // document.getElementById("knowledge-pannel").style.display = "none";
        // document.getElementById("editor-pannel").classList.add("pannel-large");
        this.practiceBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
        this.practiceBtn.removeAttribute('sync-stop');
        // document.getElementById("log").style.display = "block";
        // if (this.resizer) return document.body.querySelector('#frame').style.borderWidth = '12px';
        // this.resizer = new Resizer('#frame', {
        //     grabSize: 10,
        //     resize: 'vertical',
        //     handle: 'bar'
        // });
    }

    //编程功能，按钮
    openPracticeFn(shouldReload = true) {
        this.openPractice(true, true, shouldReload);
    };

    //打开编程功能
    openPractice(mShow = true, pShow = true, shouldReload = true) {
        this.loadWindowStatus();
        Win.showWinControl(mShow, pShow);
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
        Editor.toggle(true);
        this.closePracticeHtml();

        Win.showWinControl(false, true);

        Win.public();

        //this.openPractice(false, true);

        this.saveWindowsStatus(2);
        Win.changeAppIcon([{
            label: '编辑',
            click: () => this.editFileFn(false)
        }]);
    }

    // forceRun强制执行
    previewWinExecuteJavaScript(code = null, forceRun = false) {
        Editor.format();
        code = this.createExecuteJs(code || Editor.getCode());
        //Win.startExecuteJavaScript2Preview();
        // 自动更新
        console.log('自动更新', !this.practiceBtn.getAttribute('sync-stop'))
        if (!this.practiceBtn.getAttribute('sync-stop') || forceRun) {
            Win.executeJavaScript2Preview(code);
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
        //创建卡片
    createCard(data, isCanClose = false) {
        let div = this.createElement("card");
        let card = this.createElement("card-body");
        let img = this.createElement("img");
        let content = this.createElement("content");
        let readme = this.createElement('', 'h5');
        let t = this.createElement('', 'p');
        let version = this.createElement("version");
        let close = this.createElement('close');


        img.style.backgroundImage = `url(${URL.createObjectURL(this.base64ToBlob(data.poster))})`;
        //img.innerHTML = '<div><i class="fas fa-eye"></i></div>';
        readme.innerHTML = Knowledge.marked(data.knowledge.readme);
        readme.innerText = readme.innerText;
        t.innerHTML = data.create_time ? timeago.format(data.create_time, 'zh_CN') + " " : "";
        version.innerHTML = `代码量 ${data.code_length}<br>版本 ${data.version} ${((fileDb.id(_package) === data.package_id) ? '<i class="far fa-check-circle"></i>' : '<i class="fas fa-ban"></i>')}`;
        close.innerHTML = '<i class="fas fa-times"></i>';


        div.appendChild(card);
        card.appendChild(img);
        card.appendChild(content);
        content.appendChild(close);
        content.appendChild(readme);
        content.appendChild(t);
        t.appendChild(version);

        isCanClose === true ? this.addClickEventListener(close, e => {
            e.stopPropagation();
            // console.log(e)
            div.remove();
            fileDb.fileRemoveById(data.id);
        }) : close.style.color = 'white';

        this.addClickEventListener(img, e => {
            e.stopPropagation();
            // console.log(data)
            //控制窗口大小
            Win.resize(data.size, 1);

            //移动窗口
            Win.move();

            //注入的js
            this.previewWinExecuteJavaScript(data.code, true);
        });

        this.addClickEventListener(div, e => this.openFile(data));

        return div;
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