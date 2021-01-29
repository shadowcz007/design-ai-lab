const path = require('path');

class Editor {
    constructor(container, code, executeJavaScript) {
        this.code = code || `//Hello AI world!`;

        this.readOnly = true;
        this.container = container;
        this.executeJavaScript = executeJavaScript;
        this.editor = null;
        this.init();

    }

    init() {

        const amdLoader = require('monaco-editor/min/vs/loader.js');
        const amdRequire = amdLoader.require;

        function uriFromPath(_path) {
            var pathName = path.resolve(_path).replace(/\\/g, '/');
            if (pathName.length > 0 && pathName.charAt(0) !== '/') {
                pathName = '/' + pathName;
            }
            return encodeURI('file://' + pathName);
        }

        // console.log(uriFromPath(path.join(__dirname, 'node_modules/monaco-editor/min')))
        amdRequire.config({
            baseUrl: uriFromPath(path.join(__dirname, '../node_modules/monaco-editor/min'))
        });

        // workaround monaco-css not understanding the environment
        self.module = undefined;

        amdRequire(['vs/editor/editor.main'], () => {
            // console.log("----")
            this.editor = monaco.editor.create(this.container, {
                value: this.code,
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                foldingStrategy: 'indentation',
                overviewRulerBorder: false, // 不要滚动条的边框
                tabSize: 4, // tab 缩进长度
                minimap: {
                    enabled: false, // 不要小地图
                },
                readOnly: this.readOnly
            });
            // window.editor=this.editor;
            // this.editor.onDidBlurEditorText(()=>{
            //     this.execute()
            // });
            // this.editor.onDidFocusEditorText(()=>{
            //     this.execute()
            // });
            this.editor.onDidChangeModelContent(() => {
                this.execute()
            });
            // this.editor.getAction(['editor.action.formatDocument']).run();
        });
    }
    getCode() {
        return this.editor.getValue();
    }
    setCode(code) {
        // console.log(code)
        code = code || "";
        this.editor.setValue(code);
        // setTimeout(()=>{
        //     this.editor.getAction(['editor.action.formatDocument']).run();
        // },500)
    }
    execute() {
        // console.log(this)
        const code = this.editor.getValue();
        this.executeJavaScript(code);
    }
    toggle() {
        this.readOnly = !this.readOnly;
        this.editor.updateOptions({ readOnly: this.readOnly });
        this.editor.getAction(['editor.action.formatDocument']).run();
        return this.readOnly
    }
}


module.exports = Editor;