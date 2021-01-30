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

//esprima 把源码转化为抽象语法树
const esprima = require('esprima');
//estraverse 遍历并更新抽象语法树
const estraverse = require('estraverse');
//抽象语法树还原成源码
const escodegen = require('escodegen');

class Rewrite {
    constructor(targetFunNames) {
        this.targetFunNames = targetFunNames || ["setup", "draw"];
        this.tryAST = null;
        this.codeHereIndex = null;
        this.init();
    }
    init() {
        const jsSuccessCode = `
        try{
            CODE_HERE();
            ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result','success');
        } catch (error) {
            ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',error);
        };
        `;
        let sAST = esprima.parse(jsSuccessCode);

        for (let index = 0; index < sAST.body.length; index++) {

            if (sAST.body[index].type === "TryStatement") {
                // console.log(sAST.body[index])
                for (let i = 0; i < sAST.body[index].block.body.length; i++) {
                    // console.log(sAST.body[index].block.body[i].expression.callee.name)
                    if (sAST.body[index].block.body[i].expression.callee.name === "CODE_HERE") {
                        sAST.body[index].block.body[i] = null;
                        this.codeHereIndex = i;
                        //替换此代码
                    }
                }
                this.tryAST = sAST.body[index];
            };
        }
    }

    create(code) {
        let that = this;
        let AST = esprima.parse(code);
        // console.log(that.tryAST)
        estraverse.traverse(AST, {
            enter(node) {

                if (node.type === "FunctionDeclaration" && (that.targetFunNames.includes(node.id.name))) {
                    // console.log(node.body.body)

                    //改写
                    let nTryAST = JSON.parse(JSON.stringify(that.tryAST));

                    nTryAST.block.body = [...nTryAST.block.body.slice(0, that.codeHereIndex),
                        ...node.body.body,
                        ...nTryAST.block.body.slice(that.codeHereIndex + 1, nTryAST.block.body.length)
                    ];
                    // console.log(nTryAST)
                    // console.log(node.body)
                    node.body.body = [nTryAST];

                };

            },
            leave(node) {
                // console.log('leave', node.type)
                // if (node.type === 'Identifier') {
                //     node.name += '_leave'
                // }
            }
        });

        return escodegen.generate(AST);
    }
};

module.exports = Rewrite;