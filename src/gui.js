const { remote } = require("electron");

const storage = require('electron-json-storage');

const fs = require("fs"),
    path = require("path");
const timeago = require('timeago.js');

const Resizer = require('resizer-cl');

const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Win = require("./win");
const db = require('./db');
const Log = require('./log');
const Layout=require('./layout');
const win = require("./win");

const _package=remote.getGlobal('_PACKAGE');


/**
 * GUI界面
 * - DOM的封装
 */
class GUI{
    constructor(){

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
            (code) => (Win.get(1)).webContents.executeJavaScript(`
                            console.clear();
                            if (p5.instance) { p5.instance.remove() };
                            if(!document.querySelector("#p5")){
                                let div=document.createElement('div');
                                div.id='p5';
                                document.body.appendChild(div);
                            };
                            document.querySelector("#p5").innerHTML = "";
                            ${code.trim()};
                            if(window.gui) {
                                document.querySelector("#gui-main").innerHTML="";
                                gui();
                            };
                            new p5(null, 'p5');
                            `, false)
                    .then((result) => this.onPreviewWindowError())
                    .catch((err) => this.onPreviewWindowError())
        );
        //鼠标按键抬起
        Editor.onMouseUp = ()=> console.log("onMouseUp");
        //鼠标按键按下
        Editor.onMouseDown = ()=> this.onPreviewWindowError();
    }

    init(){

        /**
         * knowledge面板
         */
        this.editFileBtn = document.querySelector("#edit-file");


        /**
         * editor面板
         */
        this.practiceBtn = document.querySelector("#practice-btn");
        this.logdBtn=document.querySelector("#log-btn");


        /**
         * editor面板中的窗口resize功能
         */
        this.resizer = null;


        //打开文件
        // addClickEventListener(openFile,openFileFn);
        //编辑/预览 切换
        this.addClickEventListener(this.editFileBtn,()=>this.editFileFn());
        //新建
        // addClickEventListener(newFile,newFileFn);
        //保存
        // addClickEventListener(saveFile,saveFileFn);
        //发布
        // addClickEventListener(publicFile, pubilcFn);

        //重载代码
        // addClickEventListener(reloadBtn,openPractice);
        //实时编辑代码
        this.addClickEventListener(this.practiceBtn,()=>this.practiceFn());

        // log
        this.addClickEventListener(this.logdBtn,()=>{
            Log.add('success');
            this.onPreviewWindowError();
        });
    }

    //保存窗口状态
    // 0 主窗口 1 主窗口 预览窗口 2 预览窗口
    saveWindowsStatus(status = 0) {
        let obj = Win.getWindowStatus(status);
        if (status === 2) {

            obj.executeJavaScript = `
                        if (p5.instance) { p5.instance.remove() };
                        document.querySelector("#p5").innerHTML = "";
                        ${Editor.getCode().trim()};
                        new p5(null, 'p5');`;
            let knowledgeJson = Knowledge.get();
            obj.title=knowledgeJson.title;
        };
        storage.set('app', obj, function(error) {
            if (error) throw error;
        });
    }


    //获得需要存储的数据
    getSaveFileContent() {
        return new Promise((resolve, reject) => {
            let previewWindow=Win.get(1);
            //截图
            previewWindow.webContents.capturePage().then(img => {
                // console.log(img.toDataURL())
                let knowledgeJson = Knowledge.get();
                resolve({
                    poster: img.toDataURL(),
                    title: knowledgeJson.title,
                    knowledge: {
                        readme: knowledgeJson.readme,
                        course: knowledgeJson.course
                    },
                    code: Editor.getCode(),
                    size: previewWindow.getSize(),
                    version: db.id(_package)
                })
            });
        });
    }

    /*
    捕捉previewWindow的错误
    TODO 捕捉console.log信息
    */
    onPreviewWindowError() {
        setTimeout(() => (Win.get(1)).devToolsWebContents.executeJavaScript(`
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
                { name: 'Json', extensions: ['json'] }
            ]
        });
        if (filePath) {
            // let mainWindow = this.get(0);
            let res = fs.readFileSync(filePath[0], 'utf-8');
            res = JSON.parse(res);
            this.openFile(res);
            Win.changeAppIcon([{
                label: '发布',
                click: this.pubilcFn
            }]);
        };
    }


    openFile(res) {
        // console.log(res)
        Knowledge.set(res.knowledge);
        Editor.setCode(res.code);
        
        //预览窗口的尺寸更新
        Win.resize(res.size,1);

        //存至数据库
        db.add(res);

        document.querySelector(".grid").style.display = "block";
        document.getElementById("blank-pannel").style.display = "none";
        
        Editor.toggle(true);
        Knowledge.toggle(true);
        this.closePracticeHtml();
        // 预览状态
        this.previewStatus();

        Layout.clearAndReset();
        // this.editFileFn(true);
        // this.practiceFn(true);
    }

    practiceFn(readOnly=null) {
        // console.log('practiceFn')
        let t = Editor.toggle(readOnly);
        if (t === true) {
            this.closePracticeHtml();
            Layout.reset();
            Editor.execute();
            Editor.format();
        } else {
            //编程模式
            Layout.destroy();
            this.openPracticeFn();
        };
    };

    editStatus(){
        //编辑状态
        this.editFileBtn.innerHTML = `<i class="far fa-lightbulb"></i>`;
        //document.getElementById("knowledge-pannel").classList.add("pannel-large");
        // Layout.destroy();
        // Layout.dragEnabled(false);
    }

    previewStatus(){
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
        if (isReadOnly) {
            //预览状态
            this.previewStatus();
        } else {
            //编辑状态
            this.editStatus();
            Win.edit();
        };
    }


    //新建文件
    newFileFn() {
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
            click: ()=>this.saveFileFn()
        }]);
    }

    saveFileFn() {
        this.getSaveFileContent().then(res => {
            let filePath = remote.dialog.showSaveDialogSync({
                title: "另存为……",
                defaultPath: res.title.trim() + `.json`
            });
            if (filePath) {
                res.title = path.basename;
                fs.writeFile(filePath, JSON.stringify(res, null, 2), 'utf8', function(err) {
                    if (err) console.error(err);
                    console.log("保存成功");
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
            };

        });
  
    }
        
    closeFn() {
        //TODO 确定关闭？未保存将丢失

        //code编辑器只读
        Editor.toggle(true);
        Knowledge.toggle(true);
        this.closePracticeHtml();
        this.previewStatus();
        // console.log('closeFn')
        // this.editFileFn(true);
        // this.practiceFn(true);
        
        document.querySelector(".grid").style.display = "none";
        document.getElementById("blank-pannel").style.display = "block";

        //Win.showWinControl(true,false);

        let div = document.createDocumentFragment();
        Array.from(db.getAll(), d => {
            div.appendChild(
                this.createCard(d)
            );
        });
        document.getElementById("recent-files").innerHTML = '';
        document.getElementById("recent-files").appendChild(div);

        Win.showWinControl(true, false);
        Win.changeAppIcon([{
            label: '新建',
            click: this.newFileFn
        }]);

    }


    //编程，UI状态关闭
    closePracticeHtml() {
        document.getElementById("knowledge-pannel").style.display="block";
        document.getElementById("editor-pannel").classList.remove("pannel-large");
        document.getElementById("log").style.display = "none";
        document.body.querySelector('#frame').style.borderWidth = '0px !important;';
        this.practiceBtn.innerHTML = `<i class="fas fa-sync"></i>`;
    }

    //编程，UI状态
    openPracticeHtml() {
        document.getElementById("knowledge-pannel").style.display="none";
        document.getElementById("editor-pannel").classList.add("pannel-large");
        document.getElementById("log").style.display = "block";
        this.practiceBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
        //let resizer = null;
        if (this.resizer) return document.body.querySelector('#frame').style.borderWidth = '12px';
        this.resizer = new Resizer('#frame', {
            grabSize: 10,
            resize: 'vertical',
            handle: 'bar'
        });
    }

    //编程功能，按钮
    openPracticeFn() {
        this.openPracticeHtml();
        this.openPractice(true, true);
    };

    //打开编程功能
    openPractice(mShow = true, pShow = true) {
        Win.showWinControl(mShow, pShow);
        let previewWindow=Win.get(1),
          mainWindow=Win.get(0);
        if (previewWindow && mainWindow) {
            mainWindow.focus();
            previewWindow.webContents.reload();
            previewWindow.webContents.once('dom-ready', () => {
                Editor.execute();
                Editor.format();
                
                Win.edit();
                
            });
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
    };


    createElement(className,type='div'){
        let div = document.createElement(type);
        div.className = className;
        return div
    }
    //创建卡片
    createCard(data) {
        let div = this.createElement("card");
        let card = this.createElement("card-body");
        let img = this.createElement("img");
        let content = this.createElement("content");
        let readme = this.createElement('','h5');
        let t = this.createElement('','p');
        let version=this.createElement("version");
        let close=this.createElement('close');
        
        img.style.backgroundImage = `url(${data.poster})`
        readme.innerHTML = Knowledge.marked(data.knowledge.readme);
        readme.innerText=readme.innerText;
        t.innerHTML = timeago.format(data.createDate, 'zh_CN');
        version.innerHTML=(db.id(_package)===data.version)?'<i class="far fa-check-circle"></i>':'<i class="fas fa-ban"></i>';
        close.innerHTML='<i class="fas fa-times"></i>';


        div.appendChild(card);
        card.appendChild(img);
        card.appendChild(content);
        content.appendChild(close);
        content.appendChild(readme);
        content.appendChild(t);
        t.appendChild(version);

        this.addClickEventListener(close,e=>{
            e.stopPropagation();
            // console.log(data.id)
            div.remove();
            db.removeById(data.id);
        });
        this.addClickEventListener(div, e => {
            e.preventDefault();
            this.openFile(data);
        });

        return div;
    }
    addClickEventListener(element, fn) {
        let isClicked = false;
        if(element) element.addEventListener("click", e => {
            //e.preventDefault();
            if (isClicked === true) return;
            isClicked = true;
            fn(e);
            setTimeout(() => {
                isClicked = false;
            }, 500);
        });
    };

}

module.exports =new GUI();
