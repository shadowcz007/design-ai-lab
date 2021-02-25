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

const path = require('path');
const tf = require('@tensorflow/tfjs');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const cv = require('opencvjs-dist/build/opencv');
const md5 = require('md5');
const hash = require('object-hash');
const IdbKvStore = require('idb-kv-store');
const colorThief = new (require('colorthief/dist/color-thief.umd'))();
const Color = require('color');
const _GIF = require('gif.js/dist/gif');

const ffmpeg = require('./ffmpeg');
const { fstat } = require('fs');


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
        id = id || (new Date()).getTime().toString();
        this.db.set(id, data, (err) => {
            if (err) throw err
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



class GIF {
    constructor() {
        this.gif = new _GIF({
            workers: 2,
            quality: 10,
            workerScript: path.join(__dirname, '../node_modules/gif.js/dist/gif.worker.js')
        });
    }
    // canvasElement imageElement
    add(elt) {
        this.gif.addFrame(elt);
    }
    init() {
        // or a canvas element
        gif.addFrame(canvasElement, { delay: 200 });

        // or copy the pixels from a canvas context
        gif.addFrame(ctx, { copy: true });


    }
    render() {
        this.gif.on('finished', function (blob) {
            window.open(URL.createObjectURL(blob));
        });
        this.gif.render();
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
            let img = nativeImage.createFromDataURL(data)
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
            }
            // else{
            //     res=res.toDataURL();
            // }
        };
        return res
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
            if (fn) fn(type == 'img' && data ? data.toDataURL() : data);
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


// match shape
class Shape {
    constructor() {
        this.store = new Store('my_shape');
    }

    // 初始化
    initProcess(img) {
        //创建画布
        let canvas = Lab.base.createCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height, 'myCanvas', '', false);
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
    matchShape(img1, img2) {
        // 初始化
        let { src: src1 } = initProcess(img1);
        // 灰度
        src1 = rgb2gray(src1);
        // 轮廓
        let { contours: c1 } = findContours(src1);

        // 使用凸包来匹配计算
        // 凸包
        // let tmp1 = new cv.Mat();
        // cv.convexHull(c1.get(0), tmp1, false, true);
        // console.log(contoursSave(c1))

        // 初始化
        let { src: src2 } = initProcess(img2);
        // 灰度
        src2 = rgb2gray(src2);
        // 轮廓
        let { contours: c2 } = findContours(src2);
        // 使用凸包来匹配计算
        // 凸包
        // let tmp2 = new cv.Mat();
        // cv.convexHull(c2.get(0), tmp2, false, true);

        let result = cv.matchShapes(c1.get(0), c2.get(0), 1, 0);

        src1.delete();
        src2.delete();
        c1.delete();
        c2.delete();
        // tmp1.delete();
        // tmp2.delete();

        return result;
    }
    // 保存
    contoursSave(contours) {
        let res = [];
        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            // 近似轮廓
            let tmp = new cv.Mat();
            cv.approxPolyDP(cnt, tmp, 12, true);

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


class Canvas {
    constructor(width, height, isStatic = false, isZoom = false) {
        if (!global.fabric) {
            const { fabric } = require('fabric');
            global.fabric = fabric;
        }

        this.width = width;
        this.height = height;
        this.x = width / 2;
        this.y = height / 2;
        this.zoom = 0.8;
        this.isStatic = isStatic;
        this.isZoom = isZoom;

        this.canvas = new fabric.Canvas(document.createElement('canvas'), {
            width: width,
            height: height,
            backgroundColor: isStatic ? 'transparent' : '#eee',
        });

        if (isZoom == true) this.canvas.on('mouse:wheel', (opt) => {
            let delta = opt.e.deltaY;
            this.zoom = this.canvas.getZoom();
            this.zoom *= 0.999 ** delta;
            if (this.zoom > 20) this.zoom = 20;
            if (this.zoom < 0.01) this.zoom = 0.01;
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, this.zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        if (isStatic === false) {
            this.initStyle(width / 2, height / 2, this.zoom);
            this.canvas.on('text:changed', (opt) => {
                if (this.onTextChange) this.onTextChange(opt);
            });

            this.canvas.on('object:modified', opt => {
                if (this.onModified) this.onModified(opt, this.exportJSON());
            })

            this.canvas.on('mouse:dblclick', opt => {
                if (this.dblclick) this.dblclick(opt);
                // console.log(opt)
            })
        };

    }
    initStyle(x, y, zoom) {

        this.canvas.selectionColor = 'rgba(255,0,0,0.1)';
        this.canvas.selectionBorderColor = 'rgba(255,0,0,0.7)';
        this.canvas.selectionLineWidth = 1;
        this.canvas.hoverCursor = 'pointer';
        this.canvas.zoomToPoint({ x: x, y: y }, zoom);

        fabric.Object.prototype.hasControls = false;
        fabric.Object.prototype.controls.mtr.visible = false;
        fabric.Object.prototype.controls.deleteControl = new fabric.Control({
            x: 0.5,
            y: -0.5,
            offsetY: -16,
            offsetX: 16,
            cursorStyle: 'pointer',
            mouseUpHandler: deleteObject,
            render: renderIcon,
            cornerSize: 24
        });
        fabric.Textbox.prototype.controls.deleteControl = fabric.Object.prototype.controls.deleteControl;


        var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

        var img = document.createElement('img');
        img.src = deleteIcon;

        function deleteObject(eventData, transform) {
            let target = transform.target;
            let canvas = target.canvas;
            canvas.remove(target);
            canvas.requestRenderAll();
        }

        function renderIcon(ctx, left, top, styleOverride, fabricObject) {
            let size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }

    }
    addRect(style, selectable = true, hasControls = false, isCanDelete = true) {
        style = Object.assign({
            lockMovementX: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
        }, style || {});
        let rect = new fabric.Rect(style);
        this.canvas.add(rect);
        rect.hoverCursor = 'default';
        rect.hasControls = hasControls;
        rect.selectable = selectable;
        rect.controls.deleteControl.visible = isCanDelete;
        return rect
    }
    addText(text, style, selectable = true, hasControls = true) {
        style = Object.assign(style || {}, {
            splitByGrapheme: true,
            // lockScalingX:true,
            // lockScalingY: true,
        });
        let t = new fabric.Textbox(text, style);
        this.canvas.add(t);
        t.selectable = selectable;
        t.hasControls = hasControls;
        // t.charSpacing = 4;
        // t.centeredScaling=true;
        // console.log(t.controls)
        // t.hasRotatingPoint=false;
        return t
    }
    addImg(imageElement, style, selectable = true) {
        style = Object.assign({
            lockMovementX: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
        },
            style || {}
        );
        let imgInstance = new fabric.Image(imageElement, style);
        this.canvas.add(imgInstance);
        imgInstance.selectable = selectable;
        return imgInstance
    }
    addVideo(videoEl, style, selectable = true) {
        style = Object.assign(style || {}, {
            lockMovementX: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
        });
        // console.log(videoEl)
        let video = new fabric.Image(videoEl, style);
        this.canvas.add(video);
        video.selectable = selectable;
        // console.log(video.getElement())
        video.getElement().play();
        video.getElement().setAttribute('loop', 'loop');
        this.render();
        return video
    }
    resizeImage(imageElement, left, top, width, height, type = 0) {
        // type 类型
        // 宽度缩放对齐
        // 0 垂直居中
        // 1 顶对齐
        // 2 底对齐
        // 3 高度
        // 高度缩放对齐
        // 4 水平居中
        // 5 左对齐
        // 6 右对齐

        let nw = imageElement.naturalWidth,
            nh = imageElement.naturalHeight;

        let tw=width,th=height;

        // 宽度优先
        if (type < 4) {
            height = nh * width / nw;
        } else {
            // 高度优先
            width = nw * height / nh;
        }

        if (type === 0) {
            th>height?0:0
        }
    }
    render(animate = true) {
        this.canvas.renderAll();
        fabric.util.requestAnimFrame(() => {
            if (animate === true) this.render();
        });
    }

    moveToTop(target) {
        if (target) {
            let objects = this.canvas.getObjects();
            target.moveTo(objects.length + 99);
            this.render(false);
        }
    }

    getElement() {
        return this.canvas.wrapperEl
    }

    getObjects() {
        return this.canvas.getObjects();
    }

    exportJSON() {
        this.canvas.includeDefaultValues = false;
        return this.canvas.toJSON();
    }

    toDataURL(multiplier = 2, format = 'png') {
        this.canvas.zoomToPoint({ x: this.x, y: this.y }, 1);
        this.canvas.renderAll();
        let res = this.canvas.toDataURL({
            format: format,
            multiplier: multiplier
        });
        this.canvas.zoomToPoint({ x: this.x, y: this.y }, this.zoom);
        this.canvas.renderAll();
        return res
    }

    reset() {
        let objects = this.canvas.getObjects();
        objects.forEach(o => {
            this.canvas.remove(o);
        })
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
            'g37': 5
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
        this.gif = new GIF();
    }

    // 取id
    md5(str = "") {
        return md5(str)
    }
    hash(obj = {}) {
        return hash(obj);
    }

    //默认直接添加到gui里，类似于p5的逻辑，创建即添加
    add(dom) {
        if (document.querySelector("#gui-main")) {
            document.querySelector("#gui-main").appendChild(dom);
            this.isDisplay();
        }
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
    createBaseInput(type = 'text') {
        let input = document.createElement('input');
        input.setAttribute('type', type);
        return input
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
            'download': `<i class="far fa-download"></i>`,
            'play': `<i class="fas fa-caret-right"></i>`,
            'fan': '<i class="fas fa-fan"></i>',
            'clear': '<i class="far fa-trash-alt"></i>',
            'plus': '<i class="fas fa-plus"></i>',
            'minus': '<i class="fas fa-minus"></i>',
            'light': '<i class="far fa-lightbulb"></i>',
            'square': '<i class="fas fa-vector-square"></i>',
            'link': '<i class="fas fa-link"></i>',
            'music': '<i class="fas fa-music"></i>',
            'save': '<i class="fas fa-save"></i>'
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

        const pasteFn = function (e) {
            // console.log(e)
            let img = clipboard.readImage();
            if (!img.isEmpty() && eventListener) eventListener(clipboard.readImage().toDataURL());
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

    //TODO 多文件的支持 当文件过大的时候，opencv需要提示
    //,isMultiple=false
    // 支持缓存 cache
    createInput(type, text = "", eventListener = null, cache = true, isAdd = true) {

        let isMultiple = false;
        let fileExt = null,
            data = null;
        if (type === "img") {
            type = "file";
            fileExt = "image";
        } else if (type === "text") {
            type = "text";
            //fileExt="text";
        } else if (type == "file") {
            type = "file";
            fileExt = "other";
        };
        let div = document.createElement('div');

        //如果是图片，则多一个图片预览
        div.className = type !== 'text' ? 'input-image-default' : 'input-text';
        if (fileExt === 'other') div.classList.add('input-file');

        let p = document.createElement('p');
        p.innerText = text;

        let input = document.createElement('input');
        input.type = type;
        //多文件
        if (isMultiple === true) input.setAttribute('multiple', 'multiple');
        if (fileExt === "image") {
            p.style.display = "none";
            input.style.display = "none";
        } else if (fileExt == "other") {
            input.style.display = "none";
        };

        // 事件绑定
        div.addEventListener('click', () => input.click());

        // 设置placeholder
        div.setPlaceholder = function (value) {

            if (fileExt === 'image' && value) {
                div.className = 'input-image';
                div.style.backgroundImage = `url(${encodeURI(value)})`;
            };
            //其他文件
            if (fileExt == "other" && value) {
                p.innerText = `-`;
            };
        }

        // 用于缓存
        let key = this.md5(`_${type}_${text}`);
        let defaultValue = localStorage.getItem(key);
        // 
        cache ? setDefaultValue(defaultValue) : null;


        // 监听事件
        function eventFn(e) {
            let res;
            if (type == 'file') {

                if (isMultiple === true) {
                    //多个文件

                } else {

                    //单个文件
                    let file = e.target.files[0];

                    //图片
                    if (fileExt === 'image' && file.type.match(fileExt)) {
                        //转成base64存data
                        res = file.path;
                    };
                    //其他文件
                    if (fileExt == "other") {
                        res = file.path;
                    }

                    div.setPlaceholder(res);

                }

            } else if (type === 'text') {
                // console.log(e)
                //文本输入
                res = input.value;
            };

            //存储
            if (cache) localStorage.setItem(key, res);

            //eventListener,处理input的结果
            if (eventListener) res = eventListener(res);

            input.setAttribute('data', res);
        };
        input.addEventListener('change', eventFn);

        function setDefaultValue(value) {
            let res = value;
            if (type == 'file') {
                if (isMultiple === true) {
                    //多个文件
                } else {
                    //单个文件
                    div.setPlaceholder(value);
                }

            } else if (type === 'text' && value) {
                //文本输入
                input.value = value;
            };
            //eventListener,处理input的结果
            if (eventListener && value) {
                setTimeout(() => {
                    // console.log(value)
                    res = eventListener(value);
                    if (value) input.setAttribute('data', res);
                }, 1200);
            };

        };

        div.appendChild(p);
        div.appendChild(input);

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

        let { fontSize, color, fontFamily } = style;
        fontSize = fontSize || 12;
        color = color || 'black';
        fontFamily = fontFamily || 'monospace';

        // 导出图片
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
                base64 = canvas.toDataURL('image/png');
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
    createImage(url, isAdd = false) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = url;
            _img.onload = function () {
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
    createVideo(url, isAdd = true) {
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

    //原生的视频、音频、图片本地打开
    createShortVideoInput() {
        // console.log(this)
        let filePaths = dialog.showOpenDialogSync({
            title: "打开……",
            properties: ['openFile'],
            filters: [
                { name: '视频、音频', extensions: ['mov', 'avi', 'mp4', 'mp3', 'jpeg', 'jpg', 'png', 'gif'] }
            ]
        });

        let type = null;
        if (filePaths && filePaths[0]) {
            var count = Array.from(['mov', 'avi', 'mp4'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
            if (count.length > 0) type = "video";
            count = Array.from(['mp3'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
            if (count.length > 0) type = "audio";
            count = Array.from(['jpeg', 'jpg', 'png', 'gif'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
            if (count.length > 0) type = "img";
        }
        return filePaths && filePaths[0] ? {
            type: type,
            url: filePaths[0]
        } : null;
    }
    // 
    // canvasToURL() {
    //     let canvas = this.createBaseCanvas(im.naturalWidth, im.naturalHeight);
    //     let ctx = canvas.getContext('2d');
    //     ctx.drawImage(im, 0, 0);
    //     canvas.toBlob(blob => {
    //         let nurl = URL.createObjectURL(blob);
    //         this.createImage(nurl).then(nim => {
    //             //URL.revokeObjectURL(nurl);
    //             resolve(nim)
    //         });
    //     });
    // }
    // save
    saveDialog(file) {
        file = file.replace("file://", "");
        const fs = require('fs');
        let filepath = dialog.showSaveDialogSync({
            title: "",
            filters: [
                { name: 'Movies', extensions: ['mp4'] },
            ]
        });
        if (filepath) fs.copyFile(file, filepath, e => e ? console.log(e) : null);
    }
    //随机来张图片
    randomPic(w = 200, h = 200, isAdd = false) {
        this.randomPicNum++;
        let url = `https://picsum.photos/seed/${this.randomPicNum}/${w}/${h}`;
        return this.createImage(url, isAdd);
    }
    //随机来一句话
    randomText() { }

    // toast

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
    export() {
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
 */
class AI {
    constructor() {
        // 预训练模型
        this.Mobilenet = Mobilenet;

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
    getColor(_img) {
        return new Promise((resolve, reject) => {
            //转为p5的元素类型
            _img = this.p5Image(_img);

            let _im = _img.elt;

            if (_im.complete) {
                _img.mainColor = p5.instance.color(
                    this.colorStr(colorThief.getColor(_im))
                );
                resolve(_img);
            } else {
                _im.addEventListener('load', () => {
                    _img.mainColor = p5.instance.color(
                        this.colorStr(colorThief.getColor(_im))
                    );
                    resolve(_img);
                });
            };

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
                _im.addEventListener('load', function () {
                    _img.colorPalette = Array.from(
                        colorThief.getPalette(_im),
                        c => p5.instance.color(this.colorStr(c)));
                });
                resolve(_img);
            }

        });

    }

    // 人脸
    getFace(_img, fastMode = false, maxDetectedFaces = 10) {
        //转为p5的元素类型
        _img = this.p5Image(_img);
        let _im = _img.elt;
        var faceDetector = new FaceDetector({ fastMode: fastMode, maxDetectedFaces: maxDetectedFaces });
        _img.faces = [];

        return new Promise((resolve, reject) => {
            faceDetector.detect(_im).then(function (faces) {
                console.log(`人脸检测`, faces)
                faces.forEach(function (item) {
                    _img.faces.push({
                        x: parseInt(item.boundingBox.x),
                        y: parseInt(item.boundingBox.y),
                        width: parseInt(item.boundingBox.width),
                        height: parseInt(item.boundingBox.height)
                    });
                });
                resolve(_img)
            }).catch(function (err) {
                console.log("err", err);
                reject(err);
            });
        });

    };
    // 文本检测
    getText(_img) {
        //转为p5的元素类型
        _img = this.p5Image(_img);

        let _im = _img.elt;
        let textDetector = new TextDetector();
        _img.textBlocks = [];
        textDetector.detect(_im)
            .then(detectedTextBlocks => {
                console.log(`文本检测`, detectedTextBlocks)
                for (const textBlock of detectedTextBlocks) {
                    _img.textBlocks.push({
                        x: textBlock.boundingBox.x,
                        y: textBlock.boundingBox.y,
                        width: textBlock.boundingBox.width,
                        height: textBlock.boundingBox.height
                    });
                }
            }).catch(() => {
                console.error("Text Detection failed, boo.");
            });
        return _img
    }


}

class Mobilenet {
    constructor(opts) {
        this.IMAGE_SIZE = 224;
        this.savePathHead = 'indexeddb://Mobilenet_';
        this.opts = opts || {
            version: 1,
            alpha: 1.0,
            // modelUrl
        };
        this.initSavePath(this.opts);
    }
    initSavePath(opts) {
        this.savePath = this.savePathHead + hash(opts);
        return this.savePath;
    }
    async init() {
        if (!this.mobilenetModel) {
            try {
                this.mobilenetModel = await mobilenet.load(Object.assign(this.opts, {
                    modelUrl: this.savePath
                }));
                console.log('Prediction from loaded model:');
            } catch (error) {
                this.mobilenetModel = await mobilenet.load(this.opts);
                this.mobilenetModel.model.save(this.savePath).then(console.log);
            };
        }

        // Warmup the model.
        const result = tf.tidy(
            () => this.mobilenetModel.infer(tf.zeros(
                [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), true));
        // result.print();
        await result.data();
        result.dispose();
    }
    /**
     * 
     * @param {tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} img 
     * @param {number} topk 
     */
    classify(img = tf.zeros(
        [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), topk = 5) {
        return this.mobilenetModel.classify(img, topk);
    }
    /**
     * 
     * @param {*} img 
     * @param {*} embedding 
     */
    infer(img = tf.zeros(
        [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), embedding = true) {
        return this.mobilenetModel.infer(
            img,
            embedding
        )
    }

}



module.exports = {
    Lab: {
        base: new Base(),
        ai: new AI(),
        video: ffmpeg
    },
    cv: cv,
    Store: Store,
    Canvas: Canvas
};