//TODO 错误捕捉
//esprima 把源码转化为抽象语法树
const esprima = require('esprima');
//estraverse 遍历并更新抽象语法树
const estraverse = require('estraverse');
//抽象语法树还原成源码
const escodegen = require('escodegen');

const hash = require('object-hash');

class Runtime {
    constructor() {
        this.p5Fn = ['preload', 'setup', 'draw'];
    }
    parse(code) {
            let ast;
            // console.trace()
            // obj={...obj} 不支持
            try {
                ast = esprima.parse(code);
                // console.log(ast)
            } catch (error) {
                console.log(error, code)
            }

            return ast
        }
        //计算代码量
    countCodeLines(code) {
        //去掉 EmptyStatement 
        let ast = this.parse(code.trim()) || {};
        if (ast && ast.body) ast.body = ast.body.filter(b => b.type != 'EmptyStatement');
        ast = this.countType(ast);
        return ast
    }

    countType(ast) {
        let ts = [];
        // console.log(ast)
        if (ast.type !== "Program") ts.push(ast);
        if (ast.body) {
            let body = ast.body;
            if (!(body instanceof Array)) body = body.body;
            let children = Array.from(body, b => this.countType(b));
            children = children.flat();
            ts = [...ts, ...children].flat();
        };
        return ts
    }

    hash(code) {
        //去掉 EmptyStatement 
        let ast = this.parse(code.trim()) || "";
        if (ast && ast.body) ast.body = ast.body.filter(b => b.type != 'EmptyStatement');
        // console.log(hash(ast))
        return hash(ast);
    }

    isP5Function(code) {
        let ast = this.parse(code);
        ast.body.forEach(b => {
            if (b.type === "FunctionDeclaration" && this.p5Fn.includes(b.id.name)) {
                return true;
            }
        });
        return false;
    }
    tryCatch(code) {
        code = code.trim();
        let isError = false,
            error = null;
        try {
            new Function(code)();
        } catch (err) {
            // console.log(err)
            //Lab是内部库
            if (err != 'ReferenceError: Lab is not defined') {
                isError = true;
                error = err;
            }

        };
        return { isError, error }
    }
}


//TODO 错误捕捉
// const rewrite = new Runtime(["setup", "draw"]);
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

module.exports = new Runtime();