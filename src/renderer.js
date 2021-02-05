// 渲染进程
const { ipcRenderer, remote } = require("electron");
const md5 = require('md5');
const fs = require("fs"),path=require("path");
const timeago = require('timeago.js');
const Muuri = require("muuri");
const Resizer =require('resizer-cl');
// console.log(Marklib)


const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Rewrite = require("./rewrite");
const db = require('./db');
const Log = require('./log');
// const { read } = require("jimp");
// const ffmpeg=require('./ffmpeg');

//改写代码
//TODO 错误捕捉
const rewrite = new Rewrite(["setup", "draw"]);

//编辑器
let previewWindow = null,
    mainWindow = null;

const editor = new Editor(
        document.querySelector("#editor"),
        (code) => {
            previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
            //const code=this.editor.getValue();
            //检查编辑器 写的代码 本身的错误
            let isError = false;
            try {
                new Function(code.trim())();
            } catch (error) {
                //console.log(error)
                Log.add(error);
                isError = true;
            };

            // // console.log(code)
            // try {
            //     code = rewrite.create(code.trim());
            // } catch (error) {
            //     //console.log(error)
            //     Log.add(error);
            // }

            // previewWindow.webContents.executeJavaScript(`

            //     try {
            //         if (p5.instance) { p5.instance.remove() };
            //         document.querySelector("#p5").innerHTML = "";
            //         ${code.trim()};
            //         new p5(null, 'p5');
            //         ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
            //     } catch (error) {
            //         console.log(error);
            //         ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
            //     };

            //     `, false)
            //     .then((result) => {
            //         //console.log("成功", result)
            //         // editorElement.classList.remove("ui-error");
            //         // editorElement.classList.add("ui-success");
            //     }).catch(err => {
            //         Log.add(err)
            //             // console.log("失败")
            //             // editorElement.classList.add("ui-error");
            //             // editorElement.classList.remove("ui-success");
            //     });

            if (isError) return;

            let preRun = ['preload', 'setup', 'draw'];

            previewWindow.webContents.executeJavaScript(`
                try {
                    if (p5.instance) { p5.instance.remove() };
                    document.querySelector("#p5").innerHTML = "";
                    ${code.trim()};
                    new p5(null, 'p5');
                    ${Array.from(preRun,r=>`if(window.${r}) ${r}();`).join("\n")}
                    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
                } catch (error) {
                    console.log(error);
                    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
                };
                `, false)
                .then((result) => {
                    console.log("executeJavaScript", result)
                        //Log.add('success')
                        // editorElement.classList.remove("ui-error");
                        // editorElement.classList.add("ui-success");
                }).catch(err => {
                    Log.add(err)
                        // console.log("失败")
                        // editorElement.classList.add("ui-error");
                        // editorElement.classList.remove("ui-success");
                });

        }
    );

    const knowledge = new Knowledge(
        document.querySelector("#readme"),
        document.querySelector("#course"));

    //获得需要存储的数据
    function getSaveFileContent() {
        return new Promise((resolve,reject)=>{
         //截图
        //  console.log('截图');
        previewWindow=previewWindow||(remote.getGlobal("_WINS")).previewWindow;
        (remote.getGlobal("_WINS")).previewWindow.webContents.capturePage().then(img=>{
            // console.log(img.toDataURL())
            resolve({   
                poster:img.toDataURL(),
                knowledge: knowledge.get(),
                code: editor.getCode(),
                size: previewWindow.getSize()
            })
        });
        });
    }


    


    //GUI
    //界面
    
    // console.log(Resizer)
    let resizer=null;

    // 布局
    let grid=initGrid();

    editor.onMouseUp=function(){
        console.log("onMouseUp",window.grid)
    }
    editor.onMouseDown=function(){
        // grid.destroy();
        // grid=initGrid(false);
        console.log("onMouseDown",window.grid)
    }
    function initGrid(dragEnabled=true) {
        try {
            // console.log('initGrid')
            let _grid = new Muuri('.grid', {
                dragEnabled: true,
                layoutOnInit: false
            }).on('move', function () {
                saveLayout(_grid);
            });

            let layout = window.localStorage.getItem('layout');
            if (layout) {
                loadLayout(_grid, layout);
            } else {
                _grid.layout(true);
            };

            window.addEventListener('load',()=> _grid.refreshItems().layout());

            _grid.on('dragReleaseEnd', function (item) {
                console.log(item);
            });

            return _grid;
        } catch (error) {
            return null;
        }
        
    }

    function serializeLayout(grid) {
        var itemIds = grid.getItems().map(function (item) {
            return item.getElement().getAttribute('data-id');
        });
        return JSON.stringify(itemIds);
    }

    function saveLayout(grid) {
        var layout = serializeLayout(grid);
        window.localStorage.setItem('layout', layout);
    }

    function loadLayout(grid, serializedLayout) {
        var layout = JSON.parse(serializedLayout);
        var currentItems = grid.getItems();
        var currentItemIds = currentItems.map(function (item) {
            return item.getElement().getAttribute('data-id')
        });
        var newItems = [];
        var itemId;
        var itemIndex;

        for (var i = 0; i < layout.length; i++) {
            itemId = layout[i];
            itemIndex = currentItemIds.indexOf(itemId);
            if (itemIndex > -1) {
            newItems.push(currentItems[itemIndex])
            }
        }

        grid.sort(newItems, {layout: 'instant'});
    };



    //ui
    const editFile = document.querySelector("#edit-file"),
        // newFile = document.querySelector("#new-file"),
        // openFile = document.querySelector("#open-file"),
        // saveFile = document.querySelector("#save-file"),
        publicFile = document.querySelector("#public-file");
    const practiceBtn = document.querySelector("#practice-btn");

    function addClickEventListener(element,fn){
        let isClicked=false;
        element?.addEventListener("click", e => {
            e.preventDefault();
            if(isClicked===true) return;
            isClicked=true;
            fn();
            setTimeout(()=>{
                isClicked=false;
            },500);
        });
    }

    //打开文件
    // addClickEventListener(openFile,openFileFn);
    //编辑/预览 切换
    addClickEventListener(editFile,editFileFn);
    //新建
    // addClickEventListener(newFile,newFileFn);
    //保存
    // addClickEventListener(saveFile,saveFileFn);
    //发布
    addClickEventListener(publicFile,pubilcFn);
    //实时编辑代码
    addClickEventListener(practiceBtn,practiceFn);

    //打开文件
    ipcRenderer.on("open-file",openFileFn);
    //编辑/预览 切换
    ipcRenderer.on("edit-file",(event,arg)=>{
        // console.log(arg)
        editFileFn(arg.hardReadOnly);
    });
    //新建
    ipcRenderer.on("new-file",newFileFn);
    //保存
    ipcRenderer.on("save-file",saveFileFn);
    //关闭
    ipcRenderer.on("close-file",closeFn);
    //发布
    ipcRenderer.on("public-file",pubilcFn);
   
    

    //显示代码错误
    ipcRenderer.on("executeJavaScript-result", (event, arg) => {
        Log.add(arg);
    });

    //仅显示主窗口,
    //仅显示预览窗口
    function showWinControl(mShow=true,pShow=true){
        previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
        mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
        if (previewWindow && mainWindow) {
            pShow==true?previewWindow.show():previewWindow.hide();
            mShow===true?mainWindow.show():mainWindow.hide();
        };
    };

    //打开文件
    function openFileFn(){
        let filePath = remote.dialog.showOpenDialogSync({
            title: "打开……",
            properties: ['openFile'],
            filters: [
                { name: 'Json', extensions: ['json'] }
            ]
        });
        if (filePath) {
            // 
            let res = fs.readFileSync(filePath[0], 'utf-8');
            res = JSON.parse(res);
            
            openFile(res);
             
        };
    }

    //编辑状态切换
    function editFileFn(hardReadOnly=null){
        let isReadOnly = knowledge.toggle(hardReadOnly);
        showWinControl(true,true);
        if (!isReadOnly) {
            // openPractice();
            // console.log(grid)
            //编辑状态
            editFile.innerHTML = `<i class="far fa-lightbulb"></i>`;
            // document.getElementById("knowledge-pannel").classList.remove("knowledge-pannel-small");
            document.getElementById("knowledge-pannel").classList.add("pannel-large");
            grid?.destroy();
        } else {
            //预览状态
            console.log("预览状态")
            editFile.innerHTML = `<i class="far fa-eye"></i>`;
            document.getElementById("knowledge-pannel").classList.remove("pannel-large");
            grid=initGrid();
        };
    };

    //新建文件
    function newFileFn(){
        document.querySelector(".grid").style.display="block";
        document.getElementById("blank-pannel").style.display="none";
        //编辑状态
        editFile.innerHTML = `<i class="fas fa-toggle-off"></i>`;
        knowledge.toggle(false);
        knowledge.set({
                readme: "",
                course: ""
            })
        //console.log(document.getElementById("editor-pannel"))
        //document.getElementById("editor-pannel").classList.remove("pannel-large");
        editor.setCode('//Hello AI world!');
        // localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        //localStorage.setItem("code", editor.getCode());
        localStorage.removeItem('layout');
        grid.destroy();
        grid=initGrid();

        showWinControl(true,false);
        // openPracticeFn();
    }

    function saveFileFn(){
        // localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        //localStorage.setItem("code", editor.getCode());

        let filePath = remote.dialog.showSaveDialogSync({
            title: "另存为……",
            defaultPath: `AICODE_${(new Date()).getDay()}.json`
        });
        if (filePath) {
            getSaveFileContent().then(res=>{

                fs.writeFile(filePath, JSON.stringify(res, null, 2), 'utf8', function(err) {
                    if (err) console.error(err);
                    console.log("保存成功");
                    knowledge.toggle(true);
                    // saveFile.style.display = "none";
                    editFile.style.display = "block";
                    // newFile.style.display = "block";
                });
            })
            
        };
        // console.log(filePath)
    };

    
    
    function closeFn(){
        // console.log('closeFn')
        document.querySelector(".grid").style.display="none";
        document.getElementById("blank-pannel").style.display="block";

        previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
        mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
        if (previewWindow && mainWindow) {
            previewWindow.hide();
            mainWindow.show();
        };
        
        let div=document.createDocumentFragment();
        Array.from(db.getAll(),d=>{
            div.appendChild(createCard(d));
        });
        document.getElementById("recent-files").innerHTML='';
        document.getElementById("recent-files").appendChild(div);
        
        showWinControl(true,false);
    }

    function openFile(res){
        knowledge.set(res.knowledge);
        editor.setCode(res.code);
       
        // localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        //localStorage.setItem("code", editor.getCode());
        localStorage.removeItem('layout');
            
        //存至数据库
        db.add(res);

        document.querySelector(".grid").style.display="block";
        document.getElementById("blank-pannel").style.display="none";

        grid.destroy();
        grid=initGrid();

        openPractice();
    }

    function createCard(data){
        let div=document.createElement('div');
        div.className="card";
        
        let card=document.createElement('div');
        card.className="card-body";

        let img=document.createElement('div');
        img.className="img"
        img.style.backgroundImage=`url(${data.poster})`
        
        let content=document.createElement('div');
        content.className="content";
        
        let readme=document.createElement('h5');
        readme.innerHTML=data.knowledge.readme;
        
        let t=document.createElement('p');
        t.innerHTML=timeago.format(data.createDate, 'zh_CN');

        div.appendChild(card);
        card.appendChild(img);
        card.appendChild(content);
        content.appendChild(readme);
        content.appendChild(t);
        // console.log(data)
        addClickEventListener(div,()=>openFile(data));
        return div;
    }

    function practiceFn(){
        let t = editor.toggle();
        if (t === true) {
            closePracticeHtml();
        } else {
            //编程模式
            grid?.destroy();
            openPracticeFn();
        };
    };

    //编程，UI状态关闭
    function closePracticeHtml(){
        document.getElementById("editor-pannel").classList.remove("pannel-large");
        document.getElementById("log").style.display="none";
        document.body.querySelector('#frame').style.borderWidth='0px !important;'
        grid=initGrid();
        practiceBtn.innerHTML = `<i class="fas fa-sync"></i>`;
        editor.execute();
        //localStorage.setItem("code", editor.getCode());
        editor.format();
    }

    //编程，UI状态
    function openPracticeHtml(){
        // document.getElementById("knowledge-pannel").classList.add("knowledge-pannel-small");
        document.getElementById("editor-pannel").classList.add("pannel-large");
        document.getElementById("log").style.display="block";
        // document.getElementById("editor-container").style.height="80%";
        practiceBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
        if(resizer) return document.body.querySelector('#frame').style.borderWidth='12px';
        resizer =new Resizer('#frame', {
            grabSize: 10,
            resize: 'vertical',
            handle: 'bar'
        });
    }

    //编程功能，按钮
    function openPracticeFn() {
        openPracticeHtml();
        openPractice(true,true);
    };
    //打开编程功能
    function openPractice(mShow=true,pShow=true){
        showWinControl(mShow,false);
        if (previewWindow && mainWindow) {
            mainWindow.focus();
            previewWindow.webContents.reload();
            previewWindow.webContents.once('dom-ready', () => {
                editor.execute();
                //localStorage.setItem("code", editor.getCode());
                editor.format();
                pShow===true?previewWindow.show():previewWindow.hide();
                previewWindow.setResizable(true);
                previewWindow.setClosable(true);
            });
        };
    };

//发布按钮
function pubilcFn() {
    editor.toggle(false);
    showWinControl(false,true);
    previewWindow.setResizable(false);
    previewWindow.setClosable(true);
    openPractice(false,true);
    const storage = require('electron-json-storage');
    storage.set('app', {
        public: 1,
        executeJavaScript: `
                    if (p5.instance) { p5.instance.remove() };
                    document.querySelector("#p5").innerHTML = "";
                    ${editor.getCode().trim()};
                    new p5(null, 'p5');`,
        size: previewWindow.getSize()
    }, function(error) {
        if (error) throw error;
    });
};