//lab提供封装好的功能
const { clipboard, remote, nativeImage } = require('electron');
const dialog = remote.dialog;


const _APPICON = remote.getGlobal('_APPICON');
//当窗口focus的时候，需要运行的函数
let focusEvents = {};
remote.getCurrentWindow().on('focus', e => {
    // console.log(e)
    for (const key in focusEvents) {
        focusEvents[key]();
    };

});

const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const humanseg = require('./humanseg');
const bodyPix = require('@tensorflow-models/body-pix');
// const Mobilenet = require('./mobilenet');
// const U2net = require('./u2net');
// const Yolov5 = require('./yolov5');
const deeplab = require('@tensorflow-models/deeplab');
const cv = require('opencvjs-dist/build/opencv');
const md5 = require('md5');
const hash = require('object-hash');
const IdbKvStore = require('idb-kv-store');
const colorThief = new(require('colorthief/dist/color-thief.umd'))();
const Color = require('color');
const _GIF = require('gif.js/dist/gif');
const RecordRTC = require('recordrtc/RecordRTC');
const smartcrop = require('smartcrop');
const Yoga = require('yoga-layout-wasm');
const wasmFilePath = path.join(__dirname, '../node_modules/yoga-layout-wasm/dist/yoga.wasm')




const { parseGIF, decompressFrames } = require('gifuct-js');
// console.log(parseGIF, decompressFrames)

const ffmpeg = require('./ffmpeg');

ffmpeg.recordCanvas = async function(canvas, time = 3000, frameRate = 24) {
    let recorder = new RecordRTC.RecordRTCPromisesHandler(canvas.captureStream(frameRate), {
        type: 'gif',
        frameRate: frameRate,
        quality: 8,
        width: canvas.width,
        height: canvas.height,
    });
    recorder.startRecording();
    const sleep = m => new Promise(r => setTimeout(r, m));
    await sleep(time);
    await recorder.stopRecording();
    let url = await recorder.getDataURL();
    return url;
}

/**
 * 存储到idb
 */
class Store {
    constructor(key) {
        this.init(key);
    }
    init(key = 'default') {
        this.db = new IdbKvStore(key);
        this.key = key;
    }
    set(id, data) {
        return new Promise((resolve, reject) => {
            id = id || (new Date()).getTime().toString();
            this.db.set(id, data, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });

    }
    getJson() {
        return new Promise((resolve, reject) => {
            this.db.json().then(res => resolve(res));
        });
    }
    getValues() {
        return new Promise((resolve, reject) => {
            this.db.values().then(res => resolve(res));
        });
    }
    async clear() {
        await this.db.clear();
    }
    count() {
        return new Promise((resolve, reject) => {
            this.db.count().then(res => resolve(res));
        });
    }
}

// flex布局计算
class FlexLayout {
    constructor() {
        this._ = Yoga;

    }
    init() {
        return new Promise((resolve, reject) => {
            Yoga.init(wasmFilePath).then(() => {
                const Node = Yoga.Node;
                this.Node = Node;
                const root = Node.create();
                root.setWidth(500);
                root.setHeight(300);
                root.setJustifyContent(Yoga.JUSTIFY_CENTER);

                const node1 = Node.create();
                node1.setWidth(100);
                node1.setHeight(100);

                const node2 = Node.create();
                node2.setWidth(100);
                node2.setHeight(100);

                root.insertChild(node1, 0);
                root.insertChild(node2, 1);

                root.calculateLayout(500, 300, Yoga.DIRECTION_LTR);
                console.log(root.getComputedLayout());
                // {left: 0, top: 0, width: 500, height: 300}
                console.log(node1.getComputedLayout());
                // {left: 150, top: 0, width: 100, height: 100}
                console.log(node2.getComputedLayout());
                // {left: 250, top: 0, width: 100, height: 100}
                resolve();
            });
        });

    }

    // 自动拼图
    masonry(width = 500, height = 300, list = []) {

        // let padding=12;
        const root = this.Node.create();
        root.setWidth(width);
        root.setHeight(height);
        root.setFlexWrap(Yoga.WRAP_WRAP);
        root.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        // root.setPadding(padding,padding);
        // var list = [{
        //     width: 100,
        //     height: 100
        // }, {
        //     width: 10, height: 50
        // }];

        list.forEach((li, i) => {
            const node = this.Node.create();
            node.setWidth(li.width);
            node.setHeight(li.height);
            node.setFlexGrow(1);
            // node.setMargin(padding, padding);
            root.insertChild(node, i);
            list[i].node = node;
            li.node.calculateLayout();
        });

        root.calculateLayout(width, height);

        let styles = [];
        let mainStyle = {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };
        let add = 0,
            preTop = 0;
        list.forEach((li, i) => {
            let style = li.node.getComputedLayout();
            // console.log(style)
            // if(preTop!=style.top) add++ && (preTop=style.top);
            // style.top += padding*(add+1);
            mainStyle.height = Math.max(mainStyle.height, style.top + style.height);
            mainStyle.width = Math.max(mainStyle.width, style.left + style.width);
            styles.push(style);
        });
        return {
            mainStyle,
            styles
        }
    }
}

class GIF {
    constructor() {
            this.gif = new _GIF({
                workers: 2,
                quality: 10,
                background: 'rgba(0,0,0,0)',
                transparent: 'rgba(0,0,0,0)',
                workerScript: path.join(__dirname, '../node_modules/gif.js/dist/gif.worker.js')
            });
        }
        // canvasElement imageElement
    add(elt, fps) {
        this.gif.addFrame(elt, {
            delay: 1000 / fps
        });
    }
    init() {
        // // or a canvas element
        // gif.addFrame(canvasElement, { delay: 200 });

        // // or copy the pixels from a canvas context
        // gif.addFrame(ctx, { copy: true });

    }
    render() {
        return new Promise((resolve, reject) => {
            this.gif.on('finished', function(blob) {
                resolve(URL.createObjectURL(blob));
            });
            this.gif.render();
        });
    }
}


/**
 * 剪切板
 */
class Clipboard {

    /**写入剪切板
     * 
     * @param {*} data 
     * @param {String} type 
     */
    write(data, type = 'text') {
            type = type.toLowerCase();
            if (type === 'text') {
                clipboard.writeText(data);
            } else if (type === 'html') {
                clipboard.writeHTML(data);
            } else if (type === 'base64') {
                let img = nativeImage.createFromDataURL(data);
                clipboard.writeImage(img);
            }
        }
        //读取剪切板
        /**
         * 
         * @param {*} type 
         */
    read(type = 'text') {
        type = type.toLowerCase();
        let res;
        if (type === 'text') {
            res = clipboard.readText();
        } else if (type == 'html') {
            res = clipboard.readHTML();
        } else if (type == 'img') {
            res = clipboard.readImage();
            if (res.isEmpty()) {
                res = null;
            };
            // else{
            //     res=res.toDataURL();
            // }
        };
        return res
    }
    clear() {
            clipboard.clear();
        }
        // 创建缓存对象
    store(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = new Store(`clipboardListener_${type}_${cacheKey}`);;
            return this.clipboardStore
        }
        // 得到缓存的结果
    async getAllStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = this.store(type, cacheKey);
            return new Promise((resolve, reject) => {
                this.clipboardStore.getJson().then(res => resolve(res));
            });
        }
        // 清空缓存
    clearStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = this.store(type, cacheKey);
            this.clipboardStore.clear();
        }
        //剪切板监听
    listener(type = 'text', fn = null, cacheKey = "default", interval = 2000) {
        if (this.clipboardListenerStop == true) return;
        this.store(type, cacheKey);
        // console.log(this.clipboardStore)
        let data = this.read(type);
        let id = md5(
            type == 'img' && data ?
            data.toDataURL() :
            (data || '')
        );

        if (data && this.clipboardListenerData != id) {
            if (fn) fn((type == 'img' && data ? data.toDataURL() : data), id);
            this.clipboardListenerData = id;
            if (type == 'img' && data) {
                let resizeImg = data.resize({ height: 18 });
                _APPICON.setImage(resizeImg);
            };

            // 缓存
            // Store the value 'data' at key 'id'
            if (type == 'img') data = data.toDataURL();

            this.clipboardStore.set(id, data);

        };
        // 
        setTimeout(() => {
            this.listener(type, fn);
        }, interval);
    }
}

// 形态分类
// 三角形、方形、圆形、倒三角、

// match shape
class Shape {
    constructor() {
        this.store = new Store('my_shape');
    }

    // 
    findContoursForImgsBatch(imgs = []) {
        let res = [];
        for (const im of imgs) {
            let cs = this.findContoursForImg(im);
            res.push(cs);
        };
        return res
    };

    // 透明图的边缘识别
    getBoundingRect(im) {
        let {
            src,
            dst
        } = this.initProcess(im);
        // 灰度
        cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
        let { contours, hierarchy } = this.findContours(dst);
        let res = this.getRectangles(contours);
        dst.delete();
        src.delete();
        contours.delete();
        hierarchy.delete();
        return res
    }

    // 
    findContoursForImg(im) {
        let {
            src,
            dst
        } = this.initProcess(im);
        // 灰度
        cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
        let { contours, hierarchy } = this.findContours(dst);
        let cs = this.contoursSave(contours);
        // let res = this.getRectangles(contours);
        dst.delete();
        src.delete();
        contours.delete();
        hierarchy.delete();
        return cs
    }

    // 初始化
    initProcess(img) {
        //创建画布

        let canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        let src = cv.imread(img);
        // 空的
        // let dst = new cv.Mat();
        // 黑图
        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        // let dst=cv.imread(img);
        return {
            src,
            dst,
            canvas
        }
    }

    // 寻找轮廓
    findContours(src) {
            // 轮廓
            let contours = new cv.MatVector();

            // 层级 [Next, Previous, First_Child, Parent]
            let hierarchy = new cv.Mat();

            // 模式
            let mode = cv.RETR_EXTERNAL;
            // cv.RETR_TREE 取回所有的轮廓并且创建完整的家族层级列表
            // cv.RETR_CCOMP 获取所有轮廓并且把他们组织到一个2层结构里
            // cv.RETR_EXTERNAL 返回最外层的,所有孩子轮廓都不要
            // cv.RETR_LIST 获取所有轮廓，但是不建立父子关系

            let method = cv.CHAIN_APPROX_SIMPLE;
            // CHAIN_APPROX_NONE：获取每个轮廓的每个像素，相邻的两个点的像素位置差不超过1
            // CHAIN_APPROX_SIMPLE：压缩水平方向，垂直方向，对角线方向的元素，值保留该方向的重点坐标，如果一个矩形轮廓只需4个点来保存轮廓信息
            // CHAIN_APPROX_TC89_L1和CHAIN_APPROX_TC89_KCOS使用Teh-Chinl链逼近算法中的一种
            /**
             * 如果传递cv.CHAIN_APPROX_NONE，则将存储所有边界点。但是实际上我们需要所有这些要点吗？
             * 例如，您找到了一条直线的轮廓。您是否需要线上的所有点代表该线？
             * 不，我们只需要该线的两个端点即可。
             * 这就是cv.CHAIN_APPROX_SIMPLE所做的。
             * 它删除所有冗余点并压缩轮廓，从而节省内存。
             */
            cv.findContours(src, contours, hierarchy, mode, method);

            return { contours, hierarchy };
        }
        //  比较两个轮廓
    matchShape(contours1, contours2) {
        let result = cv.matchShapes(contours1.get(0), contours2.get(0), 1, 0);
        // contours1.delete();
        // contours2.delete();
        return result;
    }

    // Sort rectangles according to x coordinate.
    compareRect(a, b) {
        if (a.width * a.height > b.x * b.height) return -1;
        if (a.width * a.height < b.x * b.height) return 1;
        return 0;
    }

    // 从轮廓计算矩形
    getRectangles(contours) {
        let rectangles = [];
        // Extract rectangle from each contour.
        for (let i = 0; i < contours.size(); ++i) {
            rectangles.push(cv.boundingRect(contours.get(i)));
        }
        return rectangles.sort(this.compareRect);
    }

    // 保存
    contoursSave(contours) {
        let res = [];
        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            // 近似轮廓
            let tmp = new cv.Mat();
            cv.approxPolyDP(cnt, tmp, 12, true);
            console.log(cnt)
            res.push({
                rows: tmp.rows,
                cols: tmp.cols,
                type: tmp.type(),
                // 长度不等
                array: tmp.data32S
            });
            tmp.delete();
        };
        return res;
    };
    // 读取
    contoursLoad(array = []) {
        let matVec = new cv.MatVector();
        for (let i = 0; i < array.length; i++) {
            let a = array[i]
            let mat = cv.matFromArray(a.rows, a.cols, a.type, a.array);
            matVec.push_back(mat);
        };
        return matVec
    }
}





class Layout {
    constructor(element, isDev = false) {
        this.element = element;
        // console.log(isDev)
        if (isDev === true) {
            this.element.style.outline = `1px solid red`;
            this.element.style.backgroud = 'rgba(255,0,0,0.1)'
        }
    }
    start(type = 'default', isDev = false) {

        if (isDev === true) {
            this.element.style.outline = `1px solid red`;
            this.element.style.backgroud = 'rgba(255,0,0,0.1)'
        }

        let typeDict = {
            // 行-自动换行-居中
            'default': 0,
            'h': 0,
            // 列-左对齐
            'lv': 1,
            // 列-居中
            'cv': 2,
            // 列-右对齐
            'rv': 3,
            // 9宫格
            'g9': 4,
            // 网格布局 3:7
            'g37': 5,
            // 行  - 居左
            'lh': 6,
            // 行 - 居右
            'rh': 7
        }

        if (typeof type === 'string') type = typeDict[type.toLowerCase()];

        let g = this.element;
        g.style.display = 'flex';

        if (type === 0) {
            g.style.flexWrap = 'wrap';
            g.style.flexDirection = 'row';
            g.style.justifyContent = 'space-around';
            g.style.alignItems = 'center';
            g.style.width = '100%';
            g.style.padding = '1em';
        } else if (type === 1) {
            g.style.width = '100%';
            g.style.flexDirection = 'column';
            g.style.justifyContent = 'flex-start';
            g.style.alignItems = 'flex-start';
        } else if (type === 2) {
            g.style.width = '100%';
            g.style.justifyContent = 'space-around';
            g.style.alignItems = 'center';
            g.style.flexDirection = 'column';
        } else if (type === 3) {
            g.style.width = '100%';
            g.style.flexDirection = 'column';
            g.style.justifyContent = 'flex-end';
            g.style.alignItems = 'flex-end';
        } else if (type === 4) {
            g.style.display = 'grid';
            g.style.gridTemplate = '33% 33% 33% / 33% 33% 33%';
            g.style.gap = '1%';
            g.style.width = '90vw';
            g.style.height = '90vw';
        } else if (type === 5) {
            g.style.display = 'grid';
            g.style.gridTemplateColumns = '70% 30%';
            g.style.gap = '1em';
        } else if (type === 6) {
            g.style.flexWrap = 'wrap';
            g.style.flexDirection = 'row';
            g.style.justifyContent = 'flex-start';
            g.style.alignItems = 'center';
            g.style.width = '100%';
            g.style.padding = '1em';
        } else if (type === 7) {
            g.style.flexWrap = 'wrap';
            g.style.flexDirection = 'row';
            g.style.justifyContent = 'flex-end';
            g.style.alignItems = 'center';
            g.style.width = '100%';
            g.style.padding = '1em';

        }
    }

}


//主要完成html的一些基本的操作
class Base {
    constructor() {
        this.isDisplay();
        //随机获取，累计
        this.randomPicNum = 0;
        this.Color = Color;

        // 剪切板
        this.clipboard = new Clipboard();

        // gif功能
        this.GIF = GIF;

        this.parseGIF = (url) => {
            return new Promise((resolve, reject) => {
                let tempCanvas = document.createElement('canvas');
                var tempCtx = tempCanvas.getContext('2d')
                    // full gif canvas
                var gifCanvas = document.createElement('canvas')
                var gifCtx = gifCanvas.getContext('2d')

                fetch(url)
                    .then(resp => resp.arrayBuffer())
                    .then(buff => parseGIF(buff))
                    .then(gif => decompressFrames(gif, true))
                    .then(frames => {
                        tempCanvas.width = frames[0].dims.width;
                        tempCanvas.height = frames[0].dims.height;
                        gifCanvas.width = frames[0].dims.width;
                        gifCanvas.height = frames[0].dims.height;

                        frames = Array.from(frames, f => {
                            console.log(f)
                            let c = document.createElement('canvas');
                            c.width = f.dims.width;
                            c.height = f.dims.height;
                            let imgData = new ImageData(f.patch, c.width, c.height);
                            tempCtx.putImageData(imgData, 0, 0);
                            gifCtx.drawImage(tempCanvas, f.dims.left, f.dims.top);

                            c.getContext('2d').drawImage(gifCanvas, 0, 0);

                            return c
                        });
                        resolve(frames);
                    })
            })

        };


    }

    // 取id
    md5(str = "") {
        return md5(str)
    }
    hash(obj = {}) {
            return hash(obj);
        }
        // 
    sleep = m => new Promise(r => setTimeout(r, m));

    //默认直接添加到gui里，类似于p5的逻辑，创建即添加
    add(dom) {
        if (document.querySelector("#gui-main")) {
            document.querySelector("#gui-main").appendChild(dom);
            this.isDisplay();
        }
    }

    clear() {
            document.querySelector("#gui-main").innerHTML = "";
        }
        //当没有子元素的时候，隐藏，有则开启
    isDisplay() {
            if (document.querySelector("#gui-main")) {
                let children = document.querySelector("#gui-main").children;
                if (children.length == 0) {
                    document.querySelector("#gui-main").style.display = "none";
                    document.querySelector("#p5").style.height = '100vh';
                } else {
                    document.querySelector("#gui-main").style.display = "flex";
                    document.querySelector("#p5").style.height = '40vh';
                }
            }
        }
        //手动隐藏,显示p5.js
    p5Show(isShow = true) {
            if (document.querySelector("#p5")) {
                document.querySelector("#p5").style.display = (isShow === true) ? "flex" : "none";
                // if (isShow == false && p5.instance) p5.instance.remove();
            };
            if (document.querySelector('#gui-main')) {
                document.querySelector('#gui-main').style.top = '0';
                document.querySelector('#gui-main').style.height = '100vh';
            }
        }
        // GUI布局
    layout(type = 'default', isDev = false) {
        let ly = new Layout(document.querySelector('#gui-main'), isDev);
        ly.start(type);
    }

    // toast
    toast(text) {
        Swal.fire(text);
    }

    // loading
    loading(n = 0) {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.add(this.loadingElement);
        };
        if (n < 100) {
            this.loadingElement.style.top = 0;
            this.loadingElement.style.left = 0;
            this.loadingElement.style.backgroundColor = `rgb(0 0 0 / 70%)`;
            this.loadingElement.style.display = 'block';
            this.loadingElement.style.width = '100%';
            this.loadingElement.style.height = '100vh';
            this.loadingElement.style.position = 'fixed';
            this.loadingElement.style.zIndex = 999999;
        } else {
            this.loadingElement.style.display = 'none';
        }
    }

    //基础的HTMLElement
    createBaseCanvas(width, height) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas
    }

    // 文本
    createBaseText(text) {
        let p = document.createElement('p');
        p.innerText = text;
        return p;
    }

    // 创建组
    createGroup() {
        let isDev = false;
        let div = document.createElement('div');
        div.className = 'group';
        Array.from(arguments, g => g instanceof HTMLElement ? div.appendChild(g) : (typeof g === 'boolean' ? isDev = g : null));
        let ly = new Layout(div, isDev);
        div.layout = (type, isDev) => ly.start(type, isDev);
        return div;
    };


    // 封装的控件
    createIcon(key, eventListener, isAdd = true) {
        let icons = {
            'refresh': `<i class="fas fa-sync-alt"></i>`,
            'download': `<i class="fas fa-download"></i>`,
            'play': `<i class="fas fa-caret-right"></i>`,
            'fan': '<i class="fas fa-fan"></i>',
            'clear': '<i class="far fa-trash-alt"></i>',
            'plus': '<i class="fas fa-plus"></i>',
            'minus': '<i class="fas fa-minus"></i>',
            'light': '<i class="far fa-lightbulb"></i>',
            'square': '<i class="fas fa-vector-square"></i>',
            'link': '<i class="fas fa-link"></i>',
            'comment': '<i class="far fa-comment-dots"></i>',
            'music': '<i class="fas fa-music"></i>',
            'save': '<i class="fas fa-save"></i>',
            'copy': '<i class="fas fa-copy"></i>',
            'setup': '<i class="fas fa-cog"></i>',
            'thumbtack': '<i class="fas fa-thumbtack"></i>'
        };
        let html = icons[key];
        if (!html) html = `<i class="${key}"></i>`;
        let btn = this.createButton(key, eventListener, isAdd);
        btn.innerHTML = html;
        return btn
    }

    createButton(text, eventListener, isAdd = true) {
        let div = document.createElement('div');
        div.className = 'button';
        let btn = document.createElement('button');
        btn.innerText = text;
        div.appendChild(btn);
        if (isAdd) this.add(div);
        if (eventListener) btn.addEventListener('click', eventListener);
        return btn
    }

    // 粘贴组件，开启后旋转，监听页面的粘贴事件
    createPasteIcon(eventListener, isAdd = true) {

        const pasteFn = function(e) {
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

            let isInput = false;
            // 监听事件
            function eventFn(e) {
                console.log('e', e)
                if (isInput === true) return;
                isInput = true;
                let res;

                if (e.target.files) {
                    res = Array.from(e.target.files, f => f.path);
                };

                if (typeof e === 'string') {
                    res = [e];
                } else if (type !== 'file' && type !== 'checkbox' && e.target.value) {
                    res = [e.target.value];
                } else if (type === 'checkbox') {
                    res = [e.target.checked];
                }

                // 缓存
                localStorage.setItem(key, JSON.stringify(res));

                div.setAttribute('data-count', res.length);
                div.setPlaceholder(res);
                if (eventListener) eventListener(res);
                isInput = false;


            };
            input.addEventListener('change', eventFn);

            div.setDefaultValue = value => {
                div.setPlaceholder(value);
                div.setAttribute('data-count', value.length);
                if (eventListener && value) {
                    setTimeout(() => {
                        eventListener(value);
                    }, 1200);
                };

            };

            div.p = p;
            div.input = input;
            div.appendChild(p);
            div.appendChild(input);
            return div
        }
        // 图片上传
    createImgInput(text, isMultiple = false, key, eventListener = null) {
            let setPlaceholder = function(value) {
                // console.log(isMultiple, value)
                if (!value || !(value && value[0])) return
                this.classList.add('input-image');
                // console.log(isMultiple, value[0])
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
            let setPlaceholder = function(value) {
                // console.log(isMultiple, value)
                if (!value || !(value && value[0])) return
                this.input.value = value[0];
            };
            let div = this.createBaseInput('text', text, false, key, eventListener, setPlaceholder);
            div.classList.add('input-text');

            return div
        }
        // 文件上传
    createFileInput(text, isMultiple = false, key, eventListener = null) {
            let setPlaceholder = function(value) {
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
        let setPlaceholder = function(value) {
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
        let setPlaceholder = function(value) {
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
        let setPlaceholder = function(value) {
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
        return div
    }

    //TODO 多文件的支持 当文件过大的时候，opencv需要提示
    //isMultiple=false
    // 支持缓存 cache
    createInput(type, text = "", eventListener = null, cache = true, isAdd = true) {
        // 用于缓存
        let key = md5(`_${type}_${text}`);
        let defaultValue = localStorage.getItem(key) || '[]';
        if (!defaultValue.match(/\[/)) defaultValue = '[]';
        console.log(defaultValue, !defaultValue.match(/\[/))
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
        }


        // console.log(type,text,key,defaultValue)
        cache && div && div.setDefaultValue ? div.setDefaultValue(defaultValue) : null;

        if (isAdd) this.add(div);
        return div
    }



    //创建canvas，返回canvas
    createCanvas(width, height, className, id, show = false, isAdd = true) {
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
    createTextCanvas(txt, style, isAdd = true) {
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
            canvas.toDataURL = function(width = 300) {
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
                    base64 = canvas.toDataURL('image/png');
                    height = canvas.height;
                };
                return base64
            }
            canvas.update = function(textNew) {
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
    createImage(url, isAdd = false) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = encodeURI(url);
            _img.onload = function() {
                if (isAdd) this.add(_img);
                resolve(_img);
            }
        })
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
                { name: '视频、音频', extensions: ['mov', 'mkv', 'm4v', 'avi', 'mp4', 'mp3', 'jpeg', 'jpg', 'png', 'gif'] }
            ]
        });

        let res = [];

        if (filePaths && filePaths.length > 0) {

            for (const url of filePaths) {
                // console.log(url)
                let type = null;
                let urlNew = url.toLowerCase();
                var count = Array.from(['mov', 'm4v', 'avi', 'mkv', 'mp4'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "video";
                count = Array.from(['mp3'], t => urlNew.match(t) ? 1 : null).filter(f => f);
                if (count.length > 0) type = "audio";
                count = Array.from(['jpeg', 'jpg', 'png', 'gif'], t => urlNew.match(t) ? 1 : null).filter(f => f);
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

    // 保存base64为本地的图片文件
    saveBase64Dialog(base64, title = "保存", fileName = "图片") {
        let img = nativeImage.createFromDataURL(base64);
        this.saveNativeImageDialog(img, title, fileName);
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
                json = JSON.stringify(json);
                try {
                    fs.writeFile(filepath, json, e => console.log(e));
                } catch (error) {
                    console.log(error)
                }

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

    //随机来张图片
    randomPic(w = 200, h = 200, isAdd = false) {
            this.randomPicNum++;
            let url = `https://picsum.photos/seed/${this.randomPicNum}/${w}/${h}`;
            return this.createImage(url, isAdd);
        }
        //随机来一句话
    randomText() {}

    // toast

    //笛卡尔积 
    cartesian(arr) {
        if (arr.length < 2) return arr[0] || [];
        return [].reduce.call(arr, (col, set) => {
            let res = [];
            col.forEach(c => {
                set.forEach(s => {
                    let t = [].concat(Array.isArray(c) ? c : [c]);
                    t.push(s);
                    res.push(t);
                })
            });
            return res;
        });
    }


}

class Knn {
    constructor() {
        this.knn = knnClassifier.create();
        this.topk = 3;
    }

    // 统计各标签的样本数
    count() {
            return this.knn.getClassExampleCount();
        }
        // 其他标签的样本数控制为最小的样本数
    async minDataset() {
        let c = this.count();
        let min = null;
        for (const label in c) {
            if (min == null || (min && min >= c[label])) min = c[label];
        };

        let dataset = this.knn.getClassifierDataset();
        var datasetObj = {};
        for (const key in dataset) {
            let data = dataset[key].arraySync();
            data = tf.data.array(data).shuffle(data.length);
            datasetObj[key] = tf.tensor(await data.take(min).toArray());
        }
        // console.log(datasetObj)
        this.knn.clearAllClasses();
        this.knn.setClassifierDataset(datasetObj);
    }

    add(tensor, className) {
        if (!(tensor instanceof tf.Tensor)) tensor = tf.tensor(tensor);
        // console.log('+===', tensor instanceof tf.Tensor)
        this.knn.addExample(tensor, className);
    }

    train(tensors = [], classNames = []) {
            for (let index = 0; index < tensors.length; index++) {
                const t = tensors[index];
                this.add(t, classNames[index]);
            }
        }
        // 图片转tensor
        // img2tensor(img){
        //     if (!(img instanceof tf.Tensor)) {
        //         img = tf.browser.fromPixels(img);
        //     }
        //     return img
        // }
    async predict(tensor, topk = null) {
        if (Object.keys(this.count()).length === 0) return;
        if (!(tensor instanceof tf.Tensor)) tensor = tf.tensor(tensor);
        return await this.knn.predictClass(tensor, topk || this.topk);
    }

    load(dataset = "") {
        try {
            var tensorObj = JSON.parse(dataset);
            Object.keys(tensorObj).forEach((key) => {
                tensorObj[key] = tf.tensor(tensorObj[key].tensor, tensorObj[key].shape, tensorObj[key].tensor.dtype);
            });
            //需要清空knn
            this.knn.clearAllClasses();
            this.knn.setClassifierDataset(tensorObj);

            return true
        } catch (error) {
            return false
        }
    }
    export () {
        let dataset = this.knn.getClassifierDataset();
        var datasetObj = {};
        Object.keys(dataset).forEach((key) => {
            let data = dataset[key].dataSync();
            var shape = dataset[key].shape,
                dtype = dataset[key].dtype;
            datasetObj[key] = {
                tensor: Array.from(data),
                shape: shape,
                dtype: dtype
            };
        });

        let jsonModel = JSON.stringify(datasetObj)
            //localStorage.setItem("easyteach_model",jsonModel);
        return jsonModel;
    }
    // 缓存模型
    save(key) {
            let store = new Store(`knn_${key}`);
            store.set((new Date()).getTime().toString(), this.export());
        }
        // 从缓存加载模型 
    async loadFromStore(key) {
        let store = new Store(`knn_${key}`);
        let ms = await store.getValues();
        if (ms.length > 0) this.load(ms[0]);
        return ms.length > 0
    }
    clearStore(key) {
        let store = new Store(`knn_${key}`);
        store.clear();
    }
}


/**
 * 经过处理后返回的是p5的元素类型
 * 所有输出格式参考p5的数据类型 
 * TODO p5 的数据类型 和 原生的 剥离开
 */
class AI {
    constructor() {
        // 预训练模型
        this.Mobilenet = {
            classify: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                mobilenetClassify('${base64}');
                    `, true);
                return res
            },
            infer: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                mobilenetInfer('${base64}');
                    `, true);
                return res
            }
        };

        // 轮廓
        this.shape = new Shape();

        // 
        this.u2net = {
            segment: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                    u2netDrawSegment('${base64}');
                    `, true);
                return await this.createImage(res)
            }
        };

        // 
        this.yolo = {
            detect: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                yoloDetectAndBox('${base64}');
                    `, true);
                return res
            }
        };

        this.humanseg = humanseg;

        async function loadAndPredict() {
            const net = await bodyPix.load( /** optional arguments, see below **/ );

            /**
             * One of (see documentation below):
             *   - net.segmentPerson
             *   - net.segmentPersonParts
             *   - net.segmentMultiPerson
             *   - net.segmentMultiPersonParts
             * See documentation below for details on each method.
             */
            return net
        }
        loadAndPredict().then(net => {
            this.bodypixModel = net;
        });

        this.bodypix = {
            segmentPerson: async(img) => {
                const segmentation = await this.bodypixModel.segmentPerson(img);
                // console.log(segmentation);
                // The mask image is an binary mask image with a 1 where there is a person and
                // a 0 where there is not.
                const coloredPartImage = bodyPix.toMask(segmentation);
                const opacity = 0.1;
                const flipHorizontal = false;
                const maskBlurAmount = 4;
                const canvas = document.createElement('canvas');


                function toImg(canvas) {
                    return new Promise((resolve, reject) => {
                        let base64 = canvas.toDataURL();
                        let img = new Image();
                        img.onload = () => {
                            resolve(img);
                        }
                        img.src = base64;
                    })
                };

                bodyPix.drawMask(
                    canvas, img, coloredPartImage, opacity, maskBlurAmount,
                    flipHorizontal);

                return await toImg(canvas)
            }
        };

    }

    createCanvas(width, height) {
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas
    }

    createCanvasFromImage(im) {
        let canvas = this.createCanvas(im.width, im.height);
        let ctx = canvas.getContext('2d');
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        return canvas
    }

    im2base64(im) {
        let canvas = this.createCanvasFromImage(im);
        return canvas.toDataURL();
    }

    createImage(url) {
            return new Promise((resolve, reject) => {
                let _img = new Image();
                _img.src = url;
                _img.className = 'opacity-background';
                _img.onload = function() {
                    resolve(_img);
                }
            })
        }
        // 裁切p5的画布，用于下载
    cropCanvas(_canvas, x, y, w, h) {
        let scale = _canvas.canvas.width / _canvas.width;
        let canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(_canvas.canvas, x * scale, y * scale, w * scale, h * scale, 0, 0, w * scale, h * scale);
        return canvas
    }

    // knn紧邻算法
    knnClassifier() {
        return new Knn();
    }

    //转为p5的图片类型
    p5Image(_img) {
        if (!(_img instanceof p5.Image) && (_img instanceof Image)) _img = p5.instance.createImg(_img.src, '');
        _img.hide();
        return _img
    }


    // rgb转字符串
    colorStr(c = [0, 0, 0]) {
            // console.log(c)
            return `rgb(${c.join(',')})`;
        }
        // 计算主色
        // mainColor
    getColor(_im) {
        return new Promise((resolve, reject) => {
            let color;
            try {
                if (_im.complete) {
                    color = colorThief.getColor(_im);
                    resolve(color);
                } else {
                    _im.addEventListener('load', () => {
                        color = colorThief.getColor(_im);
                        resolve(color);
                    });
                };
            } catch (error) {
                resolve(null);
            }

        });
    };
    getColorForP5(_img) {
        return new Promise((resolve, reject) => {
            //转为p5的元素类型
            _img = this.p5Image(_img);

            let _im = _img.elt;

            this.getColor(_im).then(color => {
                _img.mainColor = p5.instance.color(
                    this.colorStr(color)
                );
                resolve(_img);
            });
        })
    };


    // 计算色板
    // colorPalette
    getPalette(_img) {
        return new Promise((resolve, reject) => {
            //转为p5的元素类型
            _img = this.p5Image(_img);

            let _im = _img.elt;
            if (_im.complete) {
                _img.colorPalette = Array.from(
                    colorThief.getPalette(_im),
                    c => p5.instance.color(this.colorStr(c)));
                resolve(_img);
            } else {
                _im.addEventListener('load', function() {
                    _img.colorPalette = Array.from(
                        colorThief.getPalette(_im),
                        c => p5.instance.color(this.colorStr(c)));
                });
                resolve(_img);
            }
        });
    }

    // 人脸
    getFace(_im, fastMode = false, maxDetectedFaces = 10) {
        var faceDetector = new FaceDetector({ fastMode: fastMode, maxDetectedFaces: maxDetectedFaces });
        let facesRes = [];
        return new Promise((resolve, reject) => {
            faceDetector.detect(_im).then(function(faces) {
                console.log(`人脸检测`, faces)
                faces.forEach(function(item) {
                    facesResfaces.push({
                        x: parseInt(item.boundingBox.x),
                        y: parseInt(item.boundingBox.y),
                        width: parseInt(item.boundingBox.width),
                        height: parseInt(item.boundingBox.height)
                    });
                });
                resolve(facesRes)
            }).catch(function(err) {
                console.log("err", err);
                reject(err);
            });
        });
    };
    getFaceForP5(_img, fastMode = false, maxDetectedFaces = 10) {
        //转为p5的元素类型
        _img = this.p5Image(_img);
        let _im = _img.elt;
        _img.faces = [];

        return new Promise((resolve, reject) => {
            this.getFace(_im, fastMode, maxDetectedFaces).then(faces => {
                _img.faces = faces;
                resolve(_img)
            })
        });
    };
    // 文本检测
    getText(_im) {
        let textDetector = new TextDetector();
        let textBlocksRes = [];

        return new Promise((resolve, reject) => {
            textDetector.detect(_im)
                .then(detectedTextBlocks => {
                    // console.log(`文本检测`, detectedTextBlocks)
                    for (const textBlock of detectedTextBlocks) {
                        textBlocksRes.push({
                            x: textBlock.boundingBox.x,
                            y: textBlock.boundingBox.y,
                            width: textBlock.boundingBox.width,
                            height: textBlock.boundingBox.height
                        });
                    };
                    resolve(textBlocksRes)
                }).catch(e => {
                    console.error("Text Detection failed, boo.");
                    reject(e);
                });
        });
    }
    getTextForP5(_img) {
            //转为p5的元素类型
            _img = this.p5Image(_img);
            let _im = _img.elt;
            return new Promise((resolve, reject) => {
                this.getText(_im).then(res => {
                    _img.textBlocks = res;
                    resolve(_img);
                });
            });
        }
        // 返回canvas
    smartCrop(image, width, height) {
        let canvas = this.createCanvasFromImage(image);

        return new Promise((resolve, reject) => {
            smartcrop.crop(image, { width: width, height: height }).then(result => {
                let res = this.createCanvas(width, height);
                let ctx = res.getContext('2d');
                ctx.drawImage(canvas,
                    result.topCrop.x,
                    result.topCrop.y,
                    result.topCrop.width,
                    result.topCrop.height,
                    0,
                    0,
                    width,
                    height)
                resolve(res);
            });
        });

    }

    // Image Background Example
    removeBg(canvasInput, canvasOutput) {
        let src = cv.imread(canvasInput);
        let dst = new cv.Mat();
        let gray = new cv.Mat();
        let opening = new cv.Mat();
        let coinsBg = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(gray, gray, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

        // get background
        let M = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.erode(gray, gray, M);
        cv.dilate(gray, opening, M);
        cv.dilate(opening, coinsBg, M, new cv.Point(-1, -1), 3);

        cv.imshow(canvasOutput, coinsBg);
        src.delete();
        dst.delete();
        gray.delete();
        opening.delete();
        coinsBg.delete();
        M.delete();

    }
}


class Deeplab {
    async init() {

        const loadModel = async() => {
            const modelName = 'pascal'; // set to your preferred model, either `pascal`, `cityscapes` or `ade20k`
            const quantizationBytes = 2; // either 1, 2 or 4
            this.model = await deeplab.load({ base: modelName, quantizationBytes });
            const input = tf.zeros([227, 500, 3]);
            let { legend } = await this.model.segment(input);
            console.log(`The predicted classes are ${JSON.stringify(legend)}`);
        };
        await loadModel();
    }
}



module.exports = {
    Lab: {
        base: new Base(),
        ai: new AI(),
        video: ffmpeg,
        FlexLayout: FlexLayout
    },
    cv: cv,
    Store: Store,
    Deeplab: Deeplab
};