const path = require('path');
const runtime = require('./runtime');

class Editor {
    init(container, executeJavaScript) {
        this.code = localStorage.getItem("code") || `//Hello AI world!`;
        localStorage.setItem("code", this.code);

        this.readOnly = true;
        this.container = container;
        this.executeJavaScript = executeJavaScript;
        this.editor = null;
        this.container ? this.initMonaco() : null;

        this.onMouseUp = null;
        this.onMouseDown = null;
        this.onDidChangeModelContent = null;

        //上次一次代码的记录
        this.codeId = runtime.hash(this.code);
        this.now = window.performance.now();
    }

    initMonaco() {

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
            //自定义主题
            monaco.editor.defineTheme('BlackTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [{ background: '#1d1e22' }],
                colors: {
                    // 相关颜色属性配置
                    // 'editor.foreground': '#000000',
                    'editor.background': '#1d1e22', //背景色
                    // 'editorCursor.foreground': '#8B0000',
                    // 'editor.lineHighlightBackground': '#0000FF20',
                    // 'editorLineNumber.foreground': '#008800',
                    // 'editor.selectionBackground': '#88000030',
                    // 'editor.inactiveSelectionBackground': '#88000015'
                }
            });
            //设置自定义主题
            monaco.editor.setTheme('BlackTheme');


            // console.log("----")
            this.editor = monaco.editor.create(this.container, {
                value: this.code,
                language: 'javascript',
                theme: 'BlackTheme',
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


            this.editor.onMouseDown(() => {
                this.onMouseDown();
                // this.isDrag=1;
            });
            this.editor.onMouseUp(() => {
                this.onMouseUp();
                // this.isDrag=0;
            });

            // this.editor.onMouseMove(()=>{
            //     if(this.isDrag===1){
            //         this.onDrag();
            //     }
            // });

            this.editor.onDidChangeModelContent(() => {
                let id = runtime.hash(this.getCode());
                let now = window.performance.now();
                if (id !== this.codeId) {
                    this.execute();
                    // if(now-this.now>500){
                    // this.onDidChangeModelContent?this.onDidChangeModelContent():this.execute();
                    this.codeId = id;
                    this.now = now;
                    // }

                };
            });
            // this.editor.getAction(['editor.action.formatDocument']).run();

            monaco.languages.registerCompletionItemProvider('javascript', {
                provideCompletionItems: () => {
                    return { suggestions: createSuggestions() };
                }
            });


            function createSuggestions() {
                //js 基础常用
                let vs = [{
                    label: 'JSON.stringify(object,null,2)',
                    kind: 1,
                    insertText: 'JSON.stringify(${1:object},null,2)',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: '-'
                }];

                //lab扩展的功能
                let ss = [
                    {
                        label: 'cv.COLOR_RGBA2GRAY',
                        kind: 1,
                        insertText: 'cv.COLOR_RGBA2GRAY',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '色彩模式'
                    
                 },
                    {
                    label: 'cv.cvtColor',
                    kind: 1,
                    insertText: 'cv.cvtColor(${1:src}, ${1:dst}, cv.COLOR_RGBA2GRAY, 0)',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: '调整色彩模式'
                },{
                        label: 'Lab.base.createTextImage',
                        kind: 1,
                        insertText: 'Lab.base.createTextImage(${1:txt},${2:fontSize},${3:color})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '创建文本图片'
                    },
                    {
                        label: 'Lab.ai.getColor',
                        kind: 1,
                        insertText: 'Lab.ai.getColor(${1:img})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '主色提取'
                    },
                    {
                        label: 'Lab.ai.getPalette',
                        kind: 1,
                        insertText: 'Lab.ai.getPalette(${1:img})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '色板提取'
                    },
                    {
                        label: 'Lab.ai.loadface',
                        kind: 1,
                        insertText: 'Lab.ai.loadface(${1:img})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '人脸检测'
                    }, {
                        label: 'Lab.ai.loadtext',
                        kind: 1,
                        insertText: 'Lab.ai.loadtext(${1:img})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '文本检测'
                    }, {
                        label: 'Lab.video.createShortVideoInput()',
                        kind: 1,
                        insertText: 'Lab.video.createShortVideoInput()',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '从本地打开视频'
                    }, {
                        label: 'Lab.video.createShortVideoFromLocal()',
                        kind: 1,
                        insertText: 'Lab.video.createShortVideoFromLocal()',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '短视频合成从本地'
                    }
                ];

                //p5内部常用
                let ts = [{
                        label: 'windowWidth',
                        kind: 0,
                        insertText: 'windowWidth',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '窗口内部宽度'
                    }, {
                        label:'noise(x, [y], [z])',
                        kind: 0,
                        insertText: 'noise(${1:x});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '柏林噪声'
                    },{
                        label:'clear()',
                        kind: 0,
                        insertText: 'clear();',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '柏林噪声'
                    },{
                        label:'push()',
                        kind: 0,
                        insertText: 'push();',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '储存当时的绘画样式设置及变形'
                    },{
                        label:'pop()',
                        kind: 0,
                        insertText: 'pop();',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '恢复储存的绘画样式设置及变形'
                    },{
                        label:'translate(x, y, [z])',
                        kind: 0,
                        insertText: 'translate(x, y, [z]);',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '物件平移'
                    },
                    {
                        label:'sin(angle)',
                        kind: 0,
                        insertText: 'sin(angle);',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '计算一个角度的正弦值'
                    },
                    {
                        label: 'function setup(){}',
                        kind: 1,
                        insertText: 'function setup(){\n${1:}\n};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'setup'
                    }, {
                        label: 'function draw(){}',
                        kind: 1,
                        insertText: 'function draw(){\n\n};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'draw'
                    }, {
                        label: 'createCanvas(width:number,height:number)',
                        kind: 1,
                        insertText: 'createCanvas(${1:windowWidth},${2:windowHeight});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '创建画布'
                    },
                    {
                        label: 'createButton(displayText:string)',
                        kind: 1,
                        insertText: 'button = createButton(${1:displayText});' + `
button.position(0, 50);
button.mousePressed(buttonEvent);
function buttonEvent() {
    //
}`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '创建按钮'
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
                        label: "🌟 " + label
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
                        label: "🚀 " + label
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
        localStorage.setItem("code",code);
        // console.log(code)
        code = code || "";
        this.editor.setValue(code);
        // setTimeout(()=>{
        //     this.editor.getAction(['editor.action.formatDocument']).run();
        // },500)
    }
    execute() {
        // console.log(this)
        const code = this.getCode();
        localStorage.setItem("code", code);
        this.executeJavaScript(code);
    }
    format() {
        this.editor.getAction(['editor.action.formatDocument']).run();
        localStorage.setItem("code", this.getCode());
    }
    toggle(readOnly=null) {
        if(readOnly===null) {this.readOnly = !this.readOnly}else{
            this.readOnly=readOnly;
        };
        this.editor.updateOptions({ readOnly: this.readOnly });
        return this.readOnly
    }
}


module.exports =new Editor();