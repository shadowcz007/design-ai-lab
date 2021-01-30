// 渲染进程
const { ipcRenderer, remote } = require("electron");
const fs = require("fs");
const Knowledge = require("./knowledge");
const Editor = require("./editor");


//esprima 把源码转化为抽象语法树
const esprima = require('esprima');
//estraverse 遍历并更新抽象语法树
const estraverse = require('estraverse');
//抽象语法树还原成源码
const escodegen = require('escodegen');

let jsCode = `
function setup() {
    createCanvas(window.innerWidth, 400);
   
}

function draw() {
    background("#232dff");
    
    ellipse(150, 155, 40, 80);
}`;

let jsSuccessCode = `
try{
    CODE_HERE();
    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
} catch (error) {
    ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
};
`;


let targetFunNames = ["setup", "draw"];

let sAST = esprima.parse(jsSuccessCode);
let tryAST = null;
let codeHereIndex = null;
for (let index = 0; index < sAST.body.length; index++) {

    if (sAST.body[index].type === "TryStatement") {
        // console.log(sAST.body[index])
        for (let i = 0; i < sAST.body[index].block.body.length; i++) {
            // console.log(sAST.body[index].block.body[i].expression.callee.name)
            if (sAST.body[index].block.body[i].expression.callee.name === "CODE_HERE") {
                sAST.body[index].block.body[i] = null;
                codeHereIndex = i;
                //替换此代码
            }
        }
        tryAST = sAST.body[index];
    };
}


// tryAST.block.body = [...tryAST.block.body.slice(0, codeHereIndex),
//     1,
//     ...tryAST.block.body.slice(codeHereIndex + 1, tryAST.block.body.length)
// ];
// console.log(JSON.stringify([...tryAST.block.body.slice(0, codeHereIndex),
//     1,
//     ...tryAST.block.body.slice(codeHereIndex + 1, tryAST.block.body.length)
// ], null, 2));

let AST = esprima.parse(jsCode);

estraverse.traverse(AST, {
    enter(node) {

        if (node.type === "FunctionDeclaration" && (targetFunNames.includes(node.id.name))) {
            console.log(node.body.body)

            //改写
            let nTryAST = JSON.parse(JSON.stringify(tryAST));

            nTryAST.block.body = [...nTryAST.block.body.slice(0, codeHereIndex),
                ...node.body.body,
                ...nTryAST.block.body.slice(codeHereIndex + 1, nTryAST.block.body.length)
            ];
            // console.log(JSON.stringify(nTryAST.block.body, null, 2))
            node.body = nTryAST;

        }
        // if (node.type === 'Identifier') {
        //     node.name += '_enter'
        // }
    },
    leave(node) {
        // console.log('leave', node.type)
        // if (node.type === 'Identifier') {
        //     node.name += '_leave'
        // }
    }
});

let jsCodeNew = escodegen.generate(AST);
console.log(jsCodeNew);


(() => {
    //

    //编辑器
    let previewWindow = null,
        mainWindow = null;

    const editor = new Editor(
        document.querySelector("#editor"),
        localStorage.getItem("code"),
        (code) => {
            previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
            //const code=this.editor.getValue();

            //TODO 错误捕捉
            // function draw() {
            //     try{
            //       background("#232dff");
            //       ellipse(150, 155, 40, 80);
            //       ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
            //     } catch (error) {
            //         console.log(error);
            //         ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
            //     };

            //   }

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
                    console.log("成功", result)
                        // editorElement.classList.remove("ui-error");
                        // editorElement.classList.add("ui-success");
                }).catch(err => {
                    console.log(err)
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
        saveFile = document.querySelector("#save-file");

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
        };
    });
    //编辑/预览 切换
    editFile.addEventListener("click", e => {
        e.preventDefault();
        let isReadOnly = knowledge.toggle();
        console.log(isReadOnly)
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
        editor.setCode('//Hello AI world!');
        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
        localStorage.setItem("code", editor.getCode());
    });
    saveFile.addEventListener("click", e => {
        e.preventDefault();

        localStorage.setItem("knowledge", JSON.stringify(knowledge.get()));
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
        editor.execute();
        localStorage.setItem("code", editor.getCode());
        if (t === true) {
            practiceBtn.innerHTML = `<i class="fas fa-sync"></i>`;
        } else {
            practiceBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i>`;
            previewWindow = previewWindow || (remote.getGlobal("_WINS")).previewWindow;
            mainWindow = mainWindow || (remote.getGlobal("_WINS")).mainWindow;
            if (previewWindow && mainWindow) {
                previewWindow.show();
                previewWindow.webContents.reload();
                mainWindow.focus();
            };
        }
    })

})();


ipcRenderer.on("executeJavaScript-result", (event, arg) => {
    console.log(arg)
    document.querySelector("#log").innerHTML = arg;
})


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