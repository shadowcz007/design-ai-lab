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
const humanseg = require('./humanseg');
const bodyPix = require('@tensorflow-models/body-pix');

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

const UI = require('./ui');



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
        let res = this.getRectangles(contours)[0];
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
        let c = this.contourSave(contours.get(0));
        // let res = this.getRectangles(contours);
        dst.delete();
        src.delete();
        contours.delete();
        hierarchy.delete();
        return c
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

    // Sort rectangles 从大到小
    compareRect(b, a) {
        return a.width * a.height - b.width * b.height
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

    contourSave(contour) {

        let cnt = contour;
        // 近似轮廓
        let tmp = new cv.Mat();
        cv.approxPolyDP(cnt, tmp, 12, true);
        // console.log(cnt)
        let res = {
            rows: tmp.rows,
            cols: tmp.cols,
            type: tmp.type(),
            // 长度不等
            array: tmp.data32S
        };
        tmp.delete();

        return res;
    };

    // 保存
    contoursSave(contours) {
        let res = [];
        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            res.push(this.contourSave(cnt));
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








//主要完成html的一些基本的操作
class Base {
    constructor() {


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


    hash(obj = {}) {
            return hash(obj);
        }
        // 
    sleep = m => new Promise(r => setTimeout(r, m));

    shuffle(arr) {
        //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
        const randomsort = function(a, b) {
                return Math.random() > .5 ? -1 : 1;
            }
            // var arr = [1, 2, 3, 4, 5];
        return arr.sort(randomsort);
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

        this.bodypix = {
            segmentPerson: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                segmentPerson('${base64}');
                    `, true);
                return await this.createImage(res)
            },
        };


        this.posenet = {
            estimatePose: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                estimatePose('${base64}');
                    `, true);
                return res
            },
            estimateMultiplePoses: async(im) => {
                let base64 = this.im2base64(im);
                let res = await remote.getGlobal('_WINS').serverWindow.webContents.executeJavaScript(`
                estimateMultiplePoses('${base64}');
                    `, true);
                return res
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
        ui: new UI(),
        ai: new AI(),
        video: ffmpeg,
        FlexLayout: FlexLayout
    },
    cv: cv,
    Store: Store,
    Deeplab: Deeplab
};