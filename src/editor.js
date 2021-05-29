const path = require('path');
const runtime = require('./runtime');

class Editor {
    init(container, executeJavaScript) {
        this.code = localStorage.getItem("code") || `//Hello AI world!`;
        localStorage.setItem("code", this.code);

        this.executeJavaScript = executeJavaScript;

        //上次一次代码的记录
        this.codeId = runtime.hash(this.code);
        this.now = window.performance.now();

        this.container = container;

    }

    initCard(card) {
        card.id = 'editor_card';
        this.card = card;
        this.container.appendChild(this.card);
    }
    updateCard(card) {
        // console.log(!this.card)
        if (!this.card) { this.initCard(card) } else {
            this.card.remove();
            this.initCard(card)
        };
    }

    runCode() {
        let id = runtime.hash(this.getCode());
        // console.log('runCode', id)
        let now = window.performance.now();
        if (id && id !== this.codeId) {
            this.execute(id);
            this.codeId = id;
            this.now = now;
        };

    }
    //获取编辑器里的代码字符串
    getCode() {
        return this.code
    }
    //设置编辑器里的代码
    setCode(code) {
        localStorage.setItem("code", code);
        this.code = code;
    }
    //往预览窗口注入代码
    execute(id) {
        // console.log(this)
        const code = this.getCode();
        localStorage.setItem("code", code);
        this.executeJavaScript(code, id);
    }
    //计算代码量
    count() {
        let code = this.getCode();
        let lines = runtime.countCodeLines(code);
        return Array.from(lines, l => l.type)
    }
}


module.exports = new Editor();