const fs = require('fs');
const md5 = require('md5');

const { clipboard, remote, nativeImage } = require('electron');
const dialog = remote.dialog;
const base = require('./base');
const image = new(require('./image'));

// 连接到peerjs服务
const PeerPC = require('./peerPC');

class Layout {
    constructor(element, isDev = false) {
        this.element = element;
        // console.log(isDev)
        if (isDev === true) {
            this.element.style.outline = `1px solid red`;
            this.element.style.backgroud = 'rgba(255,0,0,0.1)'
        }
    }
    start(type = 'container', isDev = false) {

        if (isDev === true) {
            this.element.style.outline = `1px solid red`;
            this.element.style.backgroud = 'rgba(255,0,0,0.1)'
        }

        let typeDict = {
            'container': 'ui container',
            'grid': 'ui grid',
            'two': 'ui two column centered grid',
            'three': 'ui three column divided grid',
            'equalwidth': 'ui equal width grid',
            'cards': 'ui cards',
            'card': 'card',
            'row': 'row',
            'column': 'column'
        }

        if (typeof type === 'string') type = typeDict[type.toLowerCase()];

        this.element.className = type;

    }
}

class UI {

    constructor() {
            // this.isDisplay();
        }
        // 取id
    md5(str = "") {
            return md5(str)
        }
        //手动隐藏,显示p5.js
        // p5Show(isShow = true) {
        //     if (document.querySelector("#p5")) {
        //         document.querySelector("#p5").style.display = (isShow === true) ? "flex" : "none";
        //         // if (isShow == false && p5.instance) p5.instance.remove();
        //     };
        //     if (document.querySelector('#gui-main')) {
        //         document.querySelector('#gui-main').style.top = '0';
        //         document.querySelector('#gui-main').style.height = '100vh';
        //     }
        // }
        // GUI布局
    layout(type = 'default', isDev = false) {
        let ly = new Layout(document.querySelector('#gui-main'), isDev);
        ly.start(type);
    }

    clear() {
        document.querySelector("#gui-main").innerHTML = "";
    }

    //当没有子元素的时候，隐藏，有则开启
    // isDisplay() {
    //     if (document.querySelector("#gui-main")) {
    //         let children = document.querySelector("#gui-main").children;
    //         if (children.length == 0) {
    //             document.querySelector("#gui-main").style.display = "none";
    //             document.querySelector("#p5").style.height = '100vh';
    //         } else {
    //             document.querySelector("#gui-main").style.display = "flex";
    //             document.querySelector("#p5").style.height = '40vh';
    //         }
    //     }
    // }

    // 创建createDivider
    createDivider() {
        let div = document.createElement('div');
        div.className = 'ui hidden divider';
        //div.innerHTML = Array.from(list, t => `<div class="item">${t}</div>`).join('');
        return div
    }

    createFeed(items = []) {
            let div = document.createElement('div');
            div.className = 'ui feed';
            div.innerHTML = Array.from(items, item => `<div class="event" data-item='${JSON.stringify(item)}'>
            <div class="label">
            ${item.imgurl ? `<img src="${item.imgurl}">` : ''}
            </div>
            <div class="content">
            <div class="summary">
                <a class="user">
                ${item.name ? item.name : ""}
                </a> ${item.text ? item.text : ""}
                ${item.date ? `<div class="date">${item.date}</div>` : ''}
            </div>
            <div class="meta">
            ${item.like ? `<a class="like"><i class="like icon"></i>${item.like}</a>` : ""}
            </div>
            </div>
        </div>`).join("");
        return div
    }

    // 创建list
    createList(list = []) {
        let div = document.createElement('div');
        div.className = 'ui relaxed divided list';
        div.innerHTML = Array.from(list, t => `<div class="item">${t}</div>`).join('');
        return div;
    };
    // 模态框
    createModel(header = '', content = '') {
        let div = document.createElement('div');
        div.className = 'ui modal';
        div.innerHTML = `
            <div class="header">${header}</div>
            <div class="content">${content}
            </div>`;
        div.add = function (child, type = 'content') {
            if (div.querySelector(`.${type}`)) div.querySelector(`.${type}`).appendChild(child);
        };
        div.clear = function (type = 'content') {
            if (div.querySelector(`.${type}`)) div.querySelector(`.${type}`).innerHTML = "";
        };
        div.show = function () {
            $(div).modal('show');
        };
        div.hide = function () {
            $(div).modal('hide');
        };
        return div
    }
    // 标签
    createTag(text, color = 'red') {
        let div = document.createElement('a');
        div.className = `ui ${color} tag label`;
        div.innerHTML = text;
        return div
    }
    // 标签集
    createTags(tags = []) {
        let div = document.createElement('div');
        div.className = 'ui divided selection list';

        div.innerHTML = Array.from(tags, t => `<a class="item">
            <div class="ui red horizontal label" data-id='${t.id || ''}'>${t.label ? t.label : t}</div>
        </a>`).join('');

        // div.items=Array.from(div.querySelectorAll('.item'),i=>i);

        return div
    }

    // 创建折叠菜单
    createAccordion(items = []) {
        let div = document.createElement('div');
        div.className = 'ui vertical accordion menu';
        div.innerHTML = Array.from(items, i => {
            return `<div class="item">
                        <a class="${i.active ? 'active' : ''} title"><i class="dropdown icon"></i>${i.title}</a>
                        <div class="${i.active ? 'active' : ''} content">
                            <div class="ui form">
                                <div class="grouped fields">
                                ${Array.from(i.data, t => `<div class="field">${t}</div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>`
        }).join('');
        $(div).accordion();
        return div
    }

    // 创建开关
    createToggle(item) {
        let div = document.createElement('div');
        div.className = 'ui toggle checkbox';
        div.innerHTML = `<input type="checkbox" name="${item.name}" ${!!item.checked?'checked':''}>
                        <label>${item.label}</label>`;
        if (item.changeFn) {
            div.querySelector('input').addEventListener('change', e => {
                item.changeFn(e.target.checked);
            });
        };
        div.getValue = () => div.querySelector('input').checked;
        div.setValue = checked => div.querySelector('input').checked = checked;
        return div
    }


    // 带按钮的输入框
    createActionInput(placeholder = 'Search...', buttonText = 'Search') {
        let div = document.createElement('div');
        div.className = 'ui action input';
        div.innerHTML = `
        <input type="text" placeholder="${placeholder}">
        <button class="ui button">${buttonText}</button>
            `;
        return div;
    }

    createTextareaInput(text, changeFn) {
        let div = document.createElement('div');
        div.className = 'ui form';
        div.innerHTML = `<div class="ui icon input">
            <textarea>${text}</textarea>
            <i class="search icon"></i>
        </div>`;

        if (changeFn) {
            div.querySelector('textarea').addEventListener('change', e => {
                changeFn(e);
            });
        };

        div.getValue = function () {
            return div.querySelector('textarea').value
        }
        div.setValue = function (val) {
            div.querySelector('textarea').value = val;
        }

        return div;
    }

    createInputForPosition(eventListener = null) {
        let div = document.createElement('div');
        div.className = 'ui horizontal list';
        div.style = 'padding-left: 12px;';
        div.innerHTML = `
        <div class="ui item mini right labeled input">
            <input type="number" placeholder="0" class='x' step='1'>
            <div class="ui basic label" style="min-width:3em;text-align: center;color: #9E9E9E;font-weight: 500;">X</div>
        </div>
        <div class="ui item mini right labeled input">
            <input type="number" placeholder="0" class='y' step='1'>
            <div class="ui basic label" style="min-width:3em;text-align: center;color: #9E9E9E;font-weight: 500;">Y</div>
        </div>
        
        <div class="ui item mini right labeled input">
            <input type="number" placeholder="0" class='w' step='1' min="0">
            <div class="ui basic label" style="min-width:3em;text-align: center;color: #9E9E9E;font-weight: 500;">W</div>
        </div>
        <div class="ui item mini right labeled input">
            <input type="number" placeholder="0" class='h' step='1' min="0">
            <div class="ui basic label" style="min-width:3em;text-align: center;color: #9E9E9E;font-weight: 500;">H</div>
        </div>`;
        let inx = div.querySelector('.x'),
            iny = div.querySelector('.y'),
            // inz = div.querySelector('.z'),
            inw = div.querySelector('.w'),
            inh = div.querySelector('.h');
        div.setValue = function (arr = []) {
            let [x, y, w, h] = arr;
            inx.value = parseInt(x);
            iny.value = parseInt(y);
            // inz.value = parseInt(z);
            inw.value = parseInt(w);
            inh.value = parseInt(h);
        };
        div.getValue = function () {
            return Array.from([inx, iny, inw, inh], s => parseInt(s.value.trim()));
        };

        Array.from([inx, iny, inw, inh], s => {
            s.oninput = e => {
                if (eventListener) eventListener(div.getValue())
            };
        });

        return div
    }

    createEmojiPicker() {
        const picker = document.createElement("emoji-picker");
        picker.className = 'light';
        picker.init = (callback) => {
            picker.addEventListener('emoji-click', callback);
        }
        return picker
    }

    // webview
    createWebview(src, isMobile = false, isDev = false) {
        let webview = document.createElement('webview');
        webview.style = `width:100%;height:100vh`;
        if (isMobile) webview.setAttribute('useragent',
            `Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36`);

        webview.src = src;
        if (isDev) {
            webview.addEventListener('page-title-updated', console.log);
            webview.addEventListener('dom-ready', console.log);
            webview.addEventListener('load-commit', console.log);
            webview.addEventListener('did-finish-load', console.log);
            webview.addEventListener('did-frame-finish-load', console.log);
            webview.addEventListener('console-message', console.log);
            // 鼠标移动到a标签上，会触发
            webview.addEventListener('update-target-url', console.log);
        }
        // 不一定会更新标题

        // webview.executeJavaScript
        return webview
    }

    // 创建组
    createGroup(type = 'container') {
        let isDev = false;
        let div = document.createElement('div');
        div.className = 'group';
        Array.from(arguments, g => g instanceof HTMLElement ? div.appendChild(g) : (typeof g === 'boolean' ? isDev = g : null));
        let ly = new Layout(div, isDev);
        div.layout = (type, isDev) => ly.start(type, isDev);
        if (type) div.layout(type);
        div.add = div.appendChild;
        div.clear = () => {
            div.innerHTML = '';
        };
        return div;
    }

    //默认直接添加到gui里，类似于p5的逻辑，创建即添加
    add(dom) {
        if (document.querySelector("#gui-main")) {
            document.querySelector("#gui-main").appendChild(dom);
            // this.isDisplay();
        }
    }
    // toast
    // toast(text) {
    //     // Swal.fire(text);
    // }
    toast(text) {
        $('body').toast({ message: text });
    }
    // 
    // loading
    loading(n = 0) {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'ui active slow black double inverted loader';
            this.add(this.loadingElement);
        };
        if (n < 100) {
            this.loadingElement.classList.remove('disabled');
            // this.loadingElement.style.top = 0;
            // this.loadingElement.style.left = 0;
            // this.loadingElement.style.backgroundColor = `rgb(0 0 0 / 70%)`;
            // this.loadingElement.style.display = 'block';
            // this.loadingElement.style.width = '100%';
            // this.loadingElement.style.height = '100vh';
            // this.loadingElement.style.position = 'fixed';
            // this.loadingElement.style.zIndex = 999999;
        } else {
            this.loadingElement.classList.add('disabled');
            // this.loadingElement.style.display = 'none';
        }
    }

    //基础的HTMLElement
    createBaseCanvas(width, height) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas
    }

    createSvg(width, height) {
        let d = document.createElement('div');
        d.innerHTML = `<svg width="${width}" height="${height}"></svg>`;
        // let svg = document.createElement('svg');
        // svg.setAttribute('width',width);
        // svg.setAttribute('height',height);
        return d
    }

    // 文本
    createBaseText(text = "") {
        let p = document.createElement('p');
        p.innerText = text;
        return p;
    }

    createHeader(type,text=""){
        let p = document.createElement('h'+type);
        p.innerText = text;
        return p;
    }

    // 封装的控件
    createIcon(key, eventListener, isAdd = true) {
        let icons = {
            'refresh': `<i class="icon sync alternate"></i>`,
            'download': `<i class="icon download"></i>`,
            'play': `<i class="icon caret right"></i>`,
            'fan': '<i class="icon fan"></i>',
            'clear': '<i class="icon trash alt"></i>',
            'paste': '<i class="icon plus"></i>',
            'plus': '<i class="icon plus"></i>',
            'minus': '<i class="icon minus"></i>',
            'light': '<i class="icon lightbulb"></i>',
            'square': '<i class="icon vector square"></i>',
            'link': '<i class="icon link"></i>',
            'comment': '<i class="icon comment dots"></i>',
            'music': '<i class="icon music"></i>',
            'save': '<i class="icon save"></i>',
            'copy': '<i class="icon copy"></i>',
            'setup': '<i class="icon cog"></i>',
            'settings': '<i class="icon settings"></i>',
            'thumbtack': '<i class="icon thumbtack"></i>'
        };
        let html = icons[key];
        if (!html) html = `<i class="${key}"></i>`;
        let btn = this.createButton(key, eventListener, isAdd);
        btn.innerHTML = html;
        btn.className = 'circular ui icon button';
        return btn
    }

    createButton(text, eventListener, isAdd = true) {
        let btn = document.createElement('button');
        btn.className = 'ui button';
        btn.innerText = text;
        if (isAdd) this.add(btn);
        if (eventListener) btn.addEventListener('click', eventListener);
        return btn
    }

    // 粘贴组件，开启后旋转，监听页面的粘贴事件
    createPasteIcon(eventListener, isAdd = true) {

        const pasteFn = function (e) {
            // console.log(e)
            let img = clipboard.readImage();
            // console.log(e,img)
            if (!img.isEmpty() && eventListener) {
                eventListener(img.toDataURL());
            } else {
                let text = clipboard.readText();
                // console.log(text)
                if (text && eventListener) eventListener(text)
            }
        }

        let btn = this.createIcon('fan', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!btn.classList.contains('fan')) {
                document.body.addEventListener("paste", pasteFn);
                focusEvents['pasteFn'] = pasteFn;
                btn.classList.add('fan');
                (btn.querySelector('svg') || btn.querySelector('i')).classList.add('fa-spin');
            } else {
                document.body.removeEventListener("paste", pasteFn);
                delete focusEvents['pasteFn'];
                btn.classList.remove('fan');
                btn.querySelector('svg').classList.remove('fa-spin');
            }
        }, isAdd);

        return btn
    }


    createBaseInput(type = 'text', text, isMultiple = false, key, eventListener, setPlaceholder) {
        let p = document.createElement('p');
        p.innerText = text;

        let input = document.createElement('input');
        input.setAttribute('type', type);

        // 容器
        let div = document.createElement('div');
        // 设置placeholder
        div.setPlaceholder = setPlaceholder;

        //多文件
        if (isMultiple === true) {
            input.setAttribute('multiple', 'multiple');
            div.classList.add('input-more-files');
            div.setAttribute('data-count', 0);
        };

        // 事件绑定
        div.addEventListener('click', e => {
            // e.preventDefault();
            input.click();
        });

        div.setDefaultValue = value => {
            div.setPlaceholder(value);
            div.setAttribute('data-count', value.length);
            // 缓存
            localStorage.setItem(key, JSON.stringify(value));
            // if (eventListener && value) {
            //     setTimeout(() => {
            //         eventListener(value);
            //     }, 1200);
            // };

        };


        let isInput = false;
        // 监听事件
        function eventFn(e) {
            // console.log('e', e)
            if (isInput === true) return;
            isInput = true;
            let res = [];

            if (e.target.files) {
                res = Array.from(e.target.files, f => f.path);
            };

            if (typeof e === 'string') {
                res = [e];
            } else if (type !== 'file' && type !== 'checkbox' && e.target.value) {
                res = [e.target.value];
            } else if (type === 'checkbox') {
                res = [e.target.checked];
            };

            div.setDefaultValue(res);
            if (eventListener) eventListener(res);
            isInput = false;

        };
        input.addEventListener('change', eventFn);


        div.getValue = () => {
            return input.value;
        };
        div.setValue = div.setDefaultValue;

        div.p = p;
        div.input = input;
        div.appendChild(p);
        div.appendChild(input);

        //TODO 更新数量
        div.add = (obj) => {
            // 缓存
            let defaultValue = localStorage.getItem(key) || '[]';
            if (!defaultValue.match(/\[/)) defaultValue = '[]';
            // console.log(defaultValue, !defaultValue.match(/\[/))
            defaultValue = JSON.parse(defaultValue);
            defaultValue.push(obj);
            localStorage.setItem(key, JSON.stringify(defaultValue));
            // div.setAttribute('data-count', defaultValue.length);
            div.setDefaultValue(defaultValue);

            if (eventListener && defaultValue) {
                setTimeout(() => {
                    eventListener(defaultValue);
                }, 200);
            };
        };

        div.reset = () => {
            // 缓存
            let defaultValue = [];
            localStorage.setItem(key, JSON.stringify(defaultValue));
            div.setDefaultValue(defaultValue);
            div.classList.remove('input-image');
            div.style.backgroundImage = null;
        }

        return div
    }

    // 图片上传
    createImgInput(text, isMultiple = false, key, eventListener = null) {
        let setPlaceholder = function (value) {
            if (!value || !(value && value[0])) return
            this.classList.add('input-image');
            this.style.backgroundImage = `url(${encodeURI(value[0])})`;
        };

        let div = this.createBaseInput("file", text, isMultiple, key, eventListener, setPlaceholder);

        div.p.style.display = "none";
        div.input.style.display = "none";
        div.input.setAttribute('accept', "image/*");

        //如果是图片，则多一个图片预览
        div.classList.add('input-image-default');

        return div
    }
    // 文本输入
    createTextInput(text, key, eventListener = null) {
        let setPlaceholder = function (value) {
            // console.log(isMultiple, value)
            if (!value || !(value && value[0])) return
            this.input.value = value[0];
        };
        let div = this.createBaseInput('text', text, false, key, eventListener, setPlaceholder);
        div.className = 'ui form inline field';
        div.querySelector('p').outerHTML = `<label>${div.querySelector('p').innerText}</label>`;

        let form = document.createElement('div');
        form.className = "ui form";
        form.appendChild(div);
        form.setDefaultValue = div.setDefaultValue;
        form.setValue = div.setValue;
        form.getValue = div.getValue;
        return form
    }
    // 文件上传
    createFileInput(text, isMultiple = false, key, eventListener = null) {
        let setPlaceholder = function (value) {
            // console.log(isMultiple, value)
            if (!value || !(value && value[0])) return
            this.p.innerText = path.basename(value[0]);
        };

        let div = this.createBaseInput('file', text, isMultiple, key, eventListener, setPlaceholder);
        div.input.style.display = "none";
        //div.classList.add('input-image-default');
        div.classList.add('input-file');

        return div
    }
    // 颜色输入
    createColorInput(text, key, eventListener = null) {
        let setPlaceholder = function (value) {
            if (!value || !(value && value[0])) return
            this.input.value = value[0];
        };
        let div = this.createBaseInput('color', text, false, key, eventListener, setPlaceholder);
        div.classList.add('input-color');
        div.p.style.display = 'none';
        return div
    }

    // 滑块输入
    createRangeInput(text, key, eventListener = null) {
        let setPlaceholder = function (value) {
            if (!value || !(value && value.length > 0)) return
            this.input.value = value[0];
        };
        let div = this.createBaseInput('range', text, false, key, eventListener, setPlaceholder);
        div.input.setAttribute('step', 1);
        // div.classList.add('input-color');
        // div.p.style.display = 'none';
        return div
    }


    // check输入控件
    createCheckInput(text, key, eventListener = null) {
        let setPlaceholder = function (value) {
            if (!value || !(value && value.length > 0)) return
            this.input.value = value[0];
            div.style.background = value[0] ? 'red' : 'none';
        };
        let div = this.createBaseInput('checkbox', text, false, key, eventListener, setPlaceholder);
        div.input.setAttribute('checked', 'checked');
        // div.classList.add('input-color');

        div.input.style.display = 'none';
        return div
    }

    createSelect(text = '', key, options = [], eventListener = null) {

        let select = document.createElement('select');
        let div = document.createElement('div');

        div.appendChild(select);
        select.className = 'ui compact selection dropdown';
        options = Array.from(options, o => `<option value ="${o.value}">${o.text}</option>`)
        select.innerHTML = options.join('');
        select.addEventListener('change', e => {
            eventListener(e.target.value)
        })
        div.appendOptions = (opts) => {
            Array.from(opts, o => {
                let oe = document.createElement('option');
                oe.value = o.value;
                oe.innerText = o.text;
                select.appendChild(oe);
            });
        }
        div.init = () => {
            $('.ui.dropdown')
                .dropdown();
        }
        return div
    }

    createMobileCameraInput() {
        var video = this.createGroup('card');
        video.style = `outline:1px solid black;width:300px;height:300px`;
        var qrcode = this.createGroup('card');
        qrcode.style = `width: 220px;height: 220px;`;
        var g = this.createGroup('column');
        g.add(video);
        g.add(qrcode);

        new PeerPC(async (id, stream) => {
            let v = await this.createVideo(stream, false);
            v.style = `outline: none;
            width: 100%;
            height: 100%;`;
            video.innerHTML = '';
            video.add(v);
        }, url => {
            let { img } = createQRCode(url);
            qrcode.innerHTML = '';
            qrcode.add(img);
        });
        return g;
    }

    createDesktopCameraInput(eventListener = null) {

        var video = this.createGroup();
        video.style = `outline:1px solid black;width:300px;height:300px`;

        let btn = this.createButton('摄像头', () => {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        width: 400,
                        height: 400,
                        facingMode: "environment"
                    },
                    audio: false,
                })
                .then(async (stream) => {
                    let v = await this.createVideo(stream, false);
                    v.style = `outline: none;
                width: 100%;
                height: 100%;`;
                    v.width = 400;
                    v.height = 400;
                    video.innerHTML = '';
                    video.appendChild(v);
                    if (eventListener) eventListener(v);
                    return;
                });
        }, false);

        var g = this.createGroup(btn, video);

        navigator.mediaDevices.enumerateDevices().then(gotDevices);

        function gotDevices(mediaDevices) {
            let count = 1;
            mediaDevices.forEach((mediaDevice) => {
                if (mediaDevice.kind === "videoinput") {
                    console.log(mediaDevice)
                }
            });
        };

        g.stop = function () {
            video.querySelector('video').srcObject.stop();
        }

        return g;
    }

    createVideoRange(min = 0, max = 100) {
        var select = document.createElement('input');
        select.setAttribute('type', 'number');

        var html5Slider = document.createElement('div');

        noUiSlider.create(html5Slider, {
            start: [min, max],
            connect: true,
            range: {
                'min': min,
                'max': max
            }
        });

        var inputNumber = document.createElement('input');
        inputNumber.setAttribute('type', 'number');
        // console.log(html5Slider.noUiSlider)
        html5Slider.noUiSlider.on('update', function (values, handle) {

            var value = values[handle];

            if (handle) {
                inputNumber.value = value;
            } else {
                select.value = value;
            }
        });

        select.addEventListener('change', function () {
            html5Slider.noUiSlider.set([this.value, null]);
        });

        inputNumber.addEventListener('change', function () {
            html5Slider.noUiSlider.set([null, this.value]);
        });

        let div = document.createElement('div');
        div.appendChild(select)
        div.appendChild(inputNumber)
        div.appendChild(html5Slider);

        return div
    }

    //TODO 多文件的支持 当文件过大的时候，opencv需要提示
    //isMultiple=false
    // 支持缓存 cache
    createInput(type, text = "", eventListener = null, cache = true, isAdd = false) {
        // 用于缓存
        let key = md5(`_${type}_${text}`);
        let defaultValue = localStorage.getItem(key) || '[]';
        if (!defaultValue.match(/\[/)) defaultValue = '[]';
        // console.log(defaultValue, !defaultValue.match(/\[/))
        defaultValue = JSON.parse(defaultValue);

        let div;
        if (type === 'img') {
            div = this.createImgInput(text, false, key, eventListener);
        } else if (type === 'imgs') {
            div = this.createImgInput(text, true, key, eventListener);
        } else if (type === 'file') {
            div = this.createFileInput(text, false, key, eventListener);
        } else if (type === 'files') {
            div = this.createFileInput(text, true, key, eventListener);
        } else if (type === 'text') {
            div = this.createTextInput(text, key, eventListener);
        } else if (type === 'color') {
            div = this.createColorInput(text, key, eventListener);
        } else if (type === 'range') {
            div = this.createRangeInput(text, key, eventListener);
        } else if (type == 'check') {
            div = this.createCheckInput(text, key, eventListener);
        } else if (type === 'select') {
            div = this.createSelect(text, key, [], eventListener);
        };


        // console.log(type,text,key,defaultValue)
        cache && div && div.setDefaultValue ? div.setDefaultValue(defaultValue) : null;

        if (isAdd) this.add(div);
        return div
    }



    //创建canvas，返回canvas
    createCanvas(width, height, className, id, show = false, isAdd = false) {
        let canvas = this.createBaseCanvas(width, height);
        if (className) canvas.className = className;
        if (id) canvas.id = id;
        canvas.style.width = width + 'px';
        canvas.style.height = 'auto';
        if (isAdd) this.add(canvas);
        if (show === false) canvas.style.display = "none";
        // 为了更为简单的调用
        // canvas.drawImage=function(){
        //     let ctx=canvas.getContext('2d');
        //     ctx.drawImage(...arguments);
        // };
        return canvas
    }

    //创建画布，并绘制文本，toDataURL可按照宽度导出文本图片
    /**
     * 
     * @param {*} txt 
     * @param {*} style 
     * @param {*} isAdd 
     */
    createTextCanvas(txt, style, isAdd = false) {
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        canvas.className = 'text_canvas';

        let { fontSize, color, fontFamily } = style || {
            fontSize: 12,
            color: 'black',
            fontFamily: 'monospace'
        };
        fontSize = fontSize || 12;
        color = color || 'black';
        fontFamily = fontFamily || 'monospace';

        // 导出图片
        canvas._toDataURL = canvas.toDataURL;
        canvas.toDataURL = function (width = 300) {
            let base64, height;
            if (canvas.width > width) {
                let nc = document.createElement('canvas'),
                    nctx = nc.getContext('2d');
                nc.width = width;
                nc.height = parseInt(canvas.height * width / canvas.width) + 1;
                nctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, nc.height);
                base64 = nc.toDataURL('image/png');
                height = nc.height;
            } else {
                base64 = canvas._toDataURL('image/png');
                height = canvas.height;
            };
            return base64
        }
        canvas.update = function (textNew) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let x = 2;
            ctx.font = `${fontSize * x}px ${fontFamily}`;
            let font = ctx.measureText(textNew);
            canvas.height = (font.fontBoundingBoxAscent + font.fontBoundingBoxDescent) + 12;
            canvas.width = (font.width) + 10;

            ctx.fillStyle = color;
            ctx.textAlign = "start";
            ctx.textBaseline = "top";
            ctx.font = `${fontSize * x}px ${fontFamily}`;
            ctx.fillText(textNew, 5, 10);
        };

        canvas.update(txt);

        if (isAdd) this.add(canvas);

        return canvas
    }
    //创建图片，根据url返回图片dom
    createImage(url) {
        return image.createImage(url);
    }

    // 创建图片预览，并且提供下载按钮
    createImageAndPreview() {
        let div = document.createElement('div');
        //如果是图片，则多一个图片预览
        div.classList.add('input-image-default');
        div.setValue = value => {
            if (!value || !(value && value[0])) return
            div.classList.add('input-image');
            div.style.backgroundImage = `url(${encodeURI(value[0])})`;
            div.setAttribute('data-src', value[0]);
        };
        div.getValue = () => {
            return div.getAttribute('data-src')
        };
        return div
    }

    // 创建图片预览，并且提供下载按钮
    createImageAndDownload(url) {
        let u = encodeURI(url);
        let div = document.createElement('div');
        div.className = "ui special cards";
        div.innerHTML = `<div class="card" style='height: fit-content;'>
                <div class="blurring dimmable image">
                    <div class="ui dimmer">
                    <div class="content">
                        <div class="center">
                            <a class="ui inverted button" href='${u}' name='design-ai' download='design-ai'>下载</a>
                        </div>
                    </div>
                    </div>
                    <img src="${url}">
                </div>
            </div>`;
        div.init = () => $('.special.cards .image').dimmer({
            on: 'hover'
        });
        return div
        // return new Promise((resolve, reject) => {
        //     let a = document.createElement('a');
        //     a.href = encodeURI(url);
        //     a.setAttribute('name', 'design-ai');
        //     a.setAttribute('download', encodeURI(url));
        //     this.createImage(url, false).then((im) => {
        //         if (im) {
        //             a.appendChild(im);
        //             if (isAdd) this.add(a);
        //             resolve(a);
        //         } else {
        //             resolve(null);
        //         }
        //     });
        // })
    }

    /**
     * 创建视频
     * @param {*} url string
     * url instanceof MediaStream
     */
    createVideo(url, isAdd = true, autoPlay = true) {
        let v = document.createElement('video');
        if (url instanceof MediaStream) {
            v.srcObject = url;
        } else if (typeof url === 'string') {
            v.src = url;
        }
        v.setAttribute('controls', 'controls');
        v.className = 'video';
        if (isAdd) this.add(v);
        return new Promise((resolve, reject) => {
            v.oncanplay = () => {
                v.height = v.videoHeight;
                v.width = v.videoWidth;
                v.oncanplay = null;
                if (autoPlay) v.play();
                resolve(v);
            }
            v.onerror = () => {
                resolve(v)
            }
        });
    }
    createaAudio(url, isAdd = true) {
        let v = document.createElement('audio');
        v.src = url;
        v.setAttribute('controls', 'controls');
        v.className = 'audio';
        if (isAdd) this.add(v);

        return new Promise((resolve, reject) => {
            v.oncanplay = () => {
                // console.log(v)
                v.oncanplay = null;
                resolve(v);
            }
        });
    }
    getFilePath(type = 0, title = "设置……") {
        let properties = ['openFile', 'openDirectory'];
        if (type == 1) properties = ['openFile'];
        if (type == 2) properties = ['openDirectory'];
        let filePaths = dialog.showOpenDialogSync({
            title: title,
            properties: properties
        });
        return filePaths
    }

    //原生的视频、音频、图片本地打开
    // video
    // audio
    // img
    // gif
    createShortVideoInput() {
        // console.log(this)
        let filePaths = dialog.showOpenDialogSync({
            title: "打开……",
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: '视频、音频', extensions: ['mov', 'mkv', 'm4v', 'avi', 'webm', 'mp4', 'mp3', 'jpeg', 'jpg', 'webp', 'png', 'gif'] }
            ]
        });

        let res = [];

        if (filePaths && filePaths.length > 0) {

            for (const url of filePaths) {
                // console.log(url)
                let type = null;
                let urlNew = url.toLowerCase();
                var count = Array.from(['mov', 'm4v', 'avi', 'mkv', 'mp4', 'webm'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "video";
                count = Array.from(['mp3'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "audio";
                count = Array.from(['jpeg', 'jpg', 'png', 'webp'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "img";
                count = Array.from(['gif'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "gif";
                if (type) res.push({
                    type,
                    url
                })
            }

        }
        return res.length > 0 ? res : null;
    }

    // // 直接保存base64 为本地文件
    // saveBase64(base64, filepath = null) {
    //     if (filepath) {
    //         let img = nativeImage.createFromDataURL(base64);
    //         let extname = path.extname(filepath);
    //         // console.log(filepath, extname)
    //         if (extname.toLowerCase() === '.jpg' || extname.toLowerCase() === '.jpeg') {
    //             fs.writeFileSync(filepath, img.toJPEG(80));
    //         } else {
    //             fs.writeFileSync(filepath, img.toPNG());
    //         };
    //     }
    // }
    // // 直接保存json 为本地文件
    // saveJson(json, filepath = null) {
    //     if (filepath) {
    //         json = JSON.stringify(json);
    //         try {
    //             fs.writeFile(filepath, json, e => console.log(e));
    //         } catch (error) {
    //             console.log(error)
    //         }
    //     };
    // }

    // 保存base64为本地的图片文件
    saveBase64Dialog(base64, title = "保存", fileName = "图片") {
        // let img = nativeImage.createFromDataURL(base64);
        let filepath = dialog.showSaveDialogSync({
            title: title,
            defaultPath: fileName,
            filters: [
                { name: 'Image', extensions: ['png', 'jpg'] },
            ]
        });
        if (filepath) {
            base.saveBase64(base64, filepath);
        }
        // this.saveNativeImageDialog(img, title, fileName);
    };

    // 
    saveNativeImageDialog(img, title = "保存", fileName = "图片") {
        // const fs = require('fs');
        let filepath = dialog.showSaveDialogSync({
            title: title,
            defaultPath: fileName,
            filters: [
                { name: 'Image', extensions: ['png', 'jpg'] },
            ]
        });
        if (filepath) {
            let extname = path.extname(filepath);
            console.log(filepath, extname)
            if (extname.toLowerCase() === '.jpg' || extname.toLowerCase() === '.jpeg') {
                fs.writeFileSync(filepath, img.toJPEG(80));
            } else {
                fs.writeFileSync(filepath, img.toPNG());
            };
            // fs.copyFile(file, filepath, e => e ? console.log(e) : null)
        };
    }
    // save
    saveDialog(file, title = "保存") {
        file = file.replace("file://", "");
        // const fs = require('fs');
        let filepath = dialog.showSaveDialogSync({
            title: title,
            filters: [
                { name: 'Movies', extensions: ['mp4'] },
            ]
        });
        if (filepath) {
            fs.copyFile(file, filepath, e => e ? console.log(e) : null)
        };
    }
    // save
    saveJsonDialog(json, title = "保存") {
        let filepath = dialog.showSaveDialogSync({
            title: title,
            filters: [
                { name: 'json', extensions: ['json'] },
            ]
        });
        if (filepath) {
            base.saveJson(json, filepath);
        };
    }
    // 读取
    openJsonDialog() {
        let filepath = this.getFilePath(1, '读取');
        if (filepath) {
            // const fs = require('fs');
            filepath = filepath[0];
            let json = fs.readFileSync(filepath, 'utf8');
            json = JSON.parse(json);
            return json
        }
    }


}

module.exports = UI;