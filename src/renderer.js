// 渲染进程
const { ipcRenderer, remote } = require("electron");
const md5 = require('md5');
const fs = require("fs");
const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Rewrite = require("./rewrite");
const db = require('./db');
const ffmpeg=require('./ffmpeg');
const Log=require('./log');

ffmpeg.mergeVideos(remote.dialog);

(() => {
        //改写代码
        //TODO 错误捕捉
        const rewrite = new Rewrite(["setup", "draw"]);

        //编辑器
        let previewWindow = null,
            mainWindow = null;

        const editor = new Editor(
                document.querySelector("#editor"),
                localStorage.getItem("code"),
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
        document.querySelector("#course"),
        localStorage.getItem("knowledge"));

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
    const newFile = document.querySelector("#new-file"),
        editFile = document.querySelector("#edit-file"),
        openFile = document.querySelector("#open-file"),
        saveFile = document.querySelector("#save-file"),
        publicFile = document.querySelector("#public-file");

    openFile.addEventListener("click", e => {
        e.preventDefault();

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
            knowledge.set(res.knowledge);
            editor.setCode(res.code);
            saveFile.style.display = "none";
            editFile.style.display = "block";
            // openFile.style.display="none";
            newFile.style.display = "block";
            knowledge.toggle(true);

            localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
            localStorage.setItem("code", editor.getCode());

            //存至数据库
            db.add(res);
        };
    });
    //编辑/预览 切换
    editFile.addEventListener("click", e => {
        e.preventDefault();
        let isReadOnly = knowledge.toggle();
        // console.log(isReadOnly)
        if (!isReadOnly) {
            //编辑状态
            editFile.innerHTML = `<i class="fas fa-toggle-off"></i>`;
            document.getElementById("knowledge-pannel").classList.remove("knowledge-pannel-small");
            document.getElementById("editor-pannel").classList.remove("editor-pannel-large");
        } else {
            //预览状态
            editFile.innerHTML = `<i class="fas fa-toggle-on"></i>`;
        }
        newFile.style.display = "block";
        saveFile.style.display = "block";

    });
    //新建
    newFile.addEventListener("click", e => {
        e.preventDefault();
        saveFile.style.display = "block";
        //editFile.style.display = "none";
        newFile.style.display = "none";
        //编辑状态
        editFile.innerHTML = `<i class="fas fa-toggle-off"></i>`;
        knowledge.toggle(false);
        knowledge.set({
                readme: "",
                course: ""
            })
            // console.log(knowledge)
        editor.setCode('//Hello AI world!');
        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        localStorage.setItem("code", editor.getCode());
        openPractice();
    });
    saveFile.addEventListener("click", e => {
        e.preventDefault();

        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        localStorage.setItem("code", editor.getCode());

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
                    saveFile.style.display = "none";
                    editFile.style.display = "block";
                    newFile.style.display = "block";
                });
            })
            
        };
        // console.log(filePath)
    });
    //发布
    publicFile.addEventListener("click", e => {
        e.preventDefault();
        pubilc();
    });


    document.querySelector("#course").addEventListener("input", e => {
        e.preventDefault();
        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
    });
    document.querySelector("#readme").addEventListener("input", e => {
        e.preventDefault();
        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
    });

    const practiceBtn = document.querySelector("#practice-btn");
    // console.log(saveBtn)
    practiceBtn.addEventListener("click", e => {

        let t = editor.toggle();

        if (t === true) {
            practiceBtn.innerHTML = `<i class="fas fa-sync"></i>`;
            editor.execute();
            localStorage.setItem("code", editor.getCode());
            editor.format();
        } else {
            openPractice();
        };

    });

    function openPractice() {
        document.getElementById("knowledge-pannel").classList.add("knowledge-pannel-small");
        document.getElementById("editor-pannel").classList.add("editor-pannel-large");
        practiceBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
        previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
        mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
        if (previewWindow && mainWindow) {
            previewWindow.show();
            previewWindow.webContents.reload();
            mainWindow.focus();
            previewWindow.webContents.once('dom-ready', () => {
                editor.execute();
                localStorage.setItem("code", editor.getCode());
                editor.format();
            })
        };
    };

    function pubilc() {
        editor.toggle(false);
        openPractice();
        mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
        mainWindow.hide();
        previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
        previewWindow.setResizable(false);
        previewWindow.setClosable(true);
        // console.log(previewWindow.getSize())
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

    ipcRenderer.on("public-file", (event, arg) => {
        // console.log(arg)
        pubilc(arg);
    });

})();


ipcRenderer.on("executeJavaScript-result", (event, arg) => {
    // console.log(arg)
    Log.add(arg);
});




// document.getElementById('run').addEventListener("click",()=>{
//     loadImage().then(image=>{

//         let canvas = document.createElement('canvas');
//         canvas.style.width="300px";
//         canvas.width = image.naturalWidth;			  			
//         canvas.height = image.naturalHeight;
//         let ctx=canvas.getContext('2d');
//         ctx.drawImage(image,0,0,canvas.width,canvas.height);
//         document.body.appendChild(canvas);

//         loadface(ctx);
//         loadtext(ctx);
//     })
// })