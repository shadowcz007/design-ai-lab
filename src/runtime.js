//TODO 错误捕捉

const espree = require("espree");
const hash = require('object-hash');

class Runtime {
    constructor() {
        this.p5Fn = ['preload', 'setup', 'draw'];
    }
    parse(code) {
            let ast = null;
            // console.trace()
            // obj={...obj} 不支持
            try {
                ast = espree.parse(code, { ecmaVersion: 11 });
                // console.log(ast)
            } catch (error) {
                console.log(error, code)
            }

            return ast
        }
        //计算代码量
    countCodeLines(code) {
        //去掉 EmptyStatement 
        let ast = this.parse(code.trim());
        if (ast && ast.body) ast.body = ast.body.filter(b => b.type != 'EmptyStatement');
        ast = this.countType(ast);
        return ast
    }

    countType(ast) {
        let ts = [];
        // console.log(ast)
        if (ast && ast.type !== "Program") ts.push(ast);
        if (ast && ast.body) {
            let body = ast.body;
            if (!(body instanceof Array)) body = body.body;
            // console.log(body)
            if(body){
                let children = Array.from(body, b => this.countType(b));
                children = children.flat();
                ts = [...ts, ...children].flat();
            }
        };
        return ts
    }

    hash(code) {
        //去掉 EmptyStatement 
        let ast = this.parse(code.trim());
        if (ast && ast.body) ast.body = ast.body.filter(b => b.type != 'EmptyStatement');
        let id;
        if (ast) id = hash(ast);
        return id
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



module.exports = new Runtime();