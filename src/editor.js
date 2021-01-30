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
                this.execute();
                // console.log("----")
            });
            // this.editor.getAction(['editor.action.formatDocument']).run();

            monaco.languages.registerCompletionItemProvider('javascript', {
                provideCompletionItems: () => {
                    return { suggestions: createSuggestions() };
                }
            });


            function createSuggestions() {
                let vs = [{
                    label: 'windowWidth',
                    kind: 0,
                    insertText: 'windowWidth',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: '窗口内部宽度'
                }];
                let ss = [{
                    label: 'JSON.stringify(object,null,2)',
                    kind: 1,
                    insertText: 'JSON.stringify(${1:object},null,2)',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: '-'
                }];
                let ts = [{
                        label: 'createCanvas(width:number,height:number)',
                        kind: 1,
                        insertText: 'createCanvas(${1:windowWidth},${2:windowHeight});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '创建画布'
                    },
                    {
                        label: 'createFileInput(handleFile:function)',
                        kind: 1,
                        insertText: 'input = createFileInput(${1:handleFile});' + `\n
input.position(20, 100);
function handleFile(file) {
    if (file.type === 'image') {
        img = createImg(file.data, '');
        img.hide();
    } else {
        img = null;
    }
}`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '选择文件'
                    },
                    {
                        label: 'image(img:p5.Image,x:number,y:number,width:number,height:number)',
                        kind: 1,
                        insertText: 'image(${1:img},${2:x},${3:y},${4:width},${5:height});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '图片'
                    },
                    {
                        label: 'loadFont(url:string)',
                        kind: 1,
                        insertText: 'loadFont(${1:url});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '字体'
                    },
                    {
                        label: 'text(text:string,x:number,y:number)',
                        kind: 1,
                        insertText: 'text(${1:text},${2:x},${3:y});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '字体'
                    },
                ];

                return [...Array.from(ts, t => {
                    const {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label
                    } = t;
                    return {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label: "🚀 " + label
                    }
                }), ...Array.from(vs, t => {
                    const {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label
                    } = t;
                    return {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label: "💡 " + label
                    }
                }), ...Array.from(ss, t => {
                    const {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label
                    } = t;
                    return {
                        kind,
                        insertText,
                        insertTextRules,
                        detail,
                        label: "💡 " + label
                    }
                })]
            };
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
    format() {
        this.editor.getAction(['editor.action.formatDocument']).run();
    }
    toggle() {
        this.readOnly = !this.readOnly;
        this.editor.updateOptions({ readOnly: this.readOnly });
        return this.readOnly
    }
}


module.exports = Editor;