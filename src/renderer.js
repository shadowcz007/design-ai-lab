// 渲染进程
const { ipcRenderer, remote } = require("electron");
const md5 = require('md5');
const fs = require("fs");
const Knowledge = require("./knowledge");
const Editor = require("./editor");
const Rewrite = require("./rewrite");

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

            try {
                new Function(code.trim())();
            } catch (error) {
                //console.log(error)
                executeJavaScriptResult(error);
            }

            // console.log(code)
            try {
                code = rewrite.create(code.trim());
            } catch (error) {
                //console.log(error)
                executeJavaScriptResult(error);
            }

            previewWindow.webContents.executeJavaScript(`
              
                try {
                    if (p5.instance) { p5.instance.remove() };
                    document.querySelector("#p5").innerHTML = "";
                    ${code.trim()};
                    new p5(null, 'p5');
                    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
                } catch (error) {
                    console.log(error);
                    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
                };
                     
                `, false)
                .then((result) => {
                    //console.log("成功", result)
                    // editorElement.classList.remove("ui-error");
                    // editorElement.classList.add("ui-success");
                }).catch(err => {
                    executeJavaScriptResult(err)
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
        return {
            knowledge: knowledge.get(),
            code: editor.getCode()
        }
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
        console.log(knowledge)
        editor.setCode('//Hello AI world!');
        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        localStorage.setItem("code", editor.getCode());
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
            fs.writeFile(filePath, JSON.stringify(getSaveFileContent(), null, 2), 'utf8', function(err) {
                if (err) console.error(err);
                console.log("保存成功");
                knowledge.toggle(true);
                saveFile.style.display = "none";
                editFile.style.display = "block";
                newFile.style.display = "block";
            });
        };
        // console.log(filePath)
    });
    //发布
    publicFile.addEventListener("click", e => {
        e.preventDefault();
        editor.toggle(false);
        openPractice();
        mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
        mainWindow.hide();
        const storage = require('electron-json-storage');
        storage.set('app', {
            public: 1,
            executeJavaScript: `
                                if (p5.instance) { p5.instance.remove() };
                                document.querySelector("#p5").innerHTML = "";
                                ${editor.getCode().trim()};
                                new p5(null, 'p5');`
        }, function(error) {
            if (error) throw error;
        });
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
    }

})();


ipcRenderer.on("executeJavaScript-result", (event, arg) => {
    // console.log(arg)
    executeJavaScriptResult(arg);
});

function executeJavaScriptResult(text) {
    //console.log('executeJavaScriptResult----1', typeof(text), text.toString())
    if (typeof(text) === 'object') {
        text = text.toString()
    };
    console.log('executeJavaScriptResult----2', text)
    if (text !== 'success') {
        createLog(text);
    } else {
        clearLog();
    };
}

function createLog(text) {
    let className = "log_" + md5(text);
    let findLog = document.querySelector("#log").querySelector("." + className);
    if (findLog) {
        if (findLog.getAttribute("data-count") != "99+" && parseInt(findLog.getAttribute("data-count")) + 1 >= 99) {
            findLog.setAttribute("data-count", "99+");
        } else if (findLog.getAttribute("data-count") != "99+") {
            findLog.setAttribute("data-count", parseInt(findLog.getAttribute("data-count")) + 1);
        }

    } else {
        let div = document.createElement("div");
        div.innerText = text;
        div.className = className;
        div.setAttribute("data-count", 1);
        div.setAttribute("data-time", (new Date()).getTime());
        document.querySelector("#log").appendChild(div);
    }
}

function clearLog() {
    document.querySelector("#log").innerHTML = "";
}


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