//lab提供封装好的功能
const { clipboard, remote, nativeImage } = require('electron');
const _APPICON = remote.getGlobal('_APPICON');
//当窗口focus的时候，需要运行的函数
let focusEvents = {};
remote.getCurrentWindow().on('focus', e => {
    // console.log(e)
    for (const key in focusEvents) {
        focusEvents[key]();
    };

});

const tf = require('@tensorflow/tfjs');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const cv = require('opencvjs-dist/build/opencv');
const md5 = require('md5');
const hash = require('object-hash');
const IdbKvStore = require('idb-kv-store');
const ColorThief = require('colorthief/dist/color-thief.umd');
const colorThief = new ColorThief();
const Color = require('color');


const ffmpeg = require('./ffmpeg');


//主要完成html的一些基本的操作
class Base {
    constructor() {
        this.isDisplay();
        //随机获取，累计
        this.randomPicNum = 0;
        this.Color = Color;
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


    /**写入剪切板
     * 
     * @param {*} data 
     * @param {String} type 
     */
    write2Clipboard(data, type = 'text') {
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
    getFromClipboard(type = 'text') {
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
    createClipboardStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = new IdbKvStore(`clipboardListener_${type}_${cacheKey}`);
            return this.clipboardStore
        }
        // 得到缓存的结果
    async getAllClipboardStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = new IdbKvStore(`clipboardListener_${type}_${cacheKey}`);
            return new Promise((resolve, reject) => {
                this.clipboardStore.json().then(res => resolve(res));
            });
        }
        // 清空缓存
    clearAllClipboardStore(type = 'text', cacheKey = "default") {
            if (!this.clipboardStore) this.clipboardStore = new IdbKvStore(`clipboardListener_${type}_${cacheKey}`);
            this.clipboardStore.clear();
        }
        //剪切板监听
    clipboardListener(type = 'text', fn = null, cacheKey = "default", interval = 2000) {
        if (this.clipboardListenerStop == true) return;
        this.createClipboardStore(type, cacheKey);
        // console.log(this.clipboardStore)
        let data = this.getFromClipboard(type);
        let id = md5(
            type == 'img' && data ?
            data.toDataURL() :
            (data || '')
        );

        if (data && this.clipboardListenerData != id) {
            if (fn) fn(data);
            this.clipboardListenerData = id;
            if (type == 'img' && data) {
                let resizeImg = data.resize({ height: 18 });
                _APPICON.setImage(resizeImg);
            };

            // 缓存
            // Store the value 'data' at key 'id'
            if (type == 'img') data = data.toDataURL();
            this.clipboardStore.set(id, data, (err) => {
                if (err) throw err
                    // this.clipboardStore.get(id, (err, value) => {
                    //     if (err) throw err
                    //     console.log('key=id  value=' + value)
                    // })
            });
        };
        // 
        setTimeout(() => {
            this.clipboardListener(type, fn);
        }, interval);
    }

    //当没有子元素的时候，隐藏，有则开启
    isDisplay() {
            let children = document.querySelector("#gui-main").children;
            if (children.length == 0) {
                document.querySelector("#gui-main").style.display = "none";
                document.querySelector("#p5").style.height = '100vh';
            } else {
                document.querySelector("#gui-main").style.display = "flex";
                document.querySelector("#p5").style.height = '40vh';
            }
        }
        //手动隐藏,显示p5.js
    p5Show(isShow = true) {
            if (document.querySelector("#p5")) {
                document.querySelector("#p5").style.display = (isShow === true) ? "flex" : "none";
            };
            if (document.querySelector('#gui-main')) {
                document.querySelector('#gui-main').style.top = '0';
                document.querySelector('#gui-main').style.height = '100vh';
            }
        }
        // GUI布局
    layout(type = 'default') {
        type = type.toLowerCase();
        let g = document.querySelector('#gui-main');
        if (type === 'onecolumn') {
            g.style.flexWrap = 'nowrap';
            g.style.flexDirection = 'column';
            g.style.justifyContent = 'flex-start';
            g.style.alignItems = 'flex-start';
        } else if (type === 'default') {
            g.style.flexWrap = 'wrap';
            g.style.flexDirection = 'row';
            g.style.justifyContent = 'space-around';
            g.style.alignItems = 'center';
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

    // 创建组
    createGroup() {
        let div = document.createElement('div');
        Array.from(arguments, g => g instanceof HTMLElement ? div.appendChild(g) : null);
        return div;
    };

    // 封装的控件
    createIcon(key, eventListener) {
        let icons = {
            'refresh': `<i class="fas fa-sync-alt"></i>`,
            'download': `<i class="far fa-download"></i>`,
            'play': `<i class="far fa-play-circle"></i>`,
            'fan': '<i class="fas fa-fan"></i>',
            'clear': '<i class="far fa-trash-alt"></i>'
        };
        let html = icons[key];
        if (!html) html = `<i class="${key}"></i>`;
        let btn = this.createButton(key, eventListener);
        btn.innerHTML = html;
        return btn
    }

    createButton(text, eventListener) {
        let div = document.createElement('div');
        div.className = 'button';
        let btn = document.createElement('button');
        btn.innerText = text;
        div.appendChild(btn);
        this.add(div);
        if (eventListener) btn.addEventListener('click', eventListener);
        return btn
    }

    // 粘贴组件，开启后旋转，监听页面的粘贴事件
    createPasteIcon(eventListener) {

        const pasteFn = function(e) {
            // console.log(e)
            let img = clipboard.readImage();
            if (!img.isEmpty() && eventListener) eventListener(clipboard.readImage().toDataURL());
        }

        let btn = this.createIcon('fan');
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!btn.classList.contains('fan')) {
                document.body.addEventListener("paste", pasteFn);
                focusEvents['pasteFn'] = pasteFn;
                btn.classList.add('fan');
                btn.querySelector('svg').classList.add('fa-spin');
            } else {
                document.body.removeEventListener("paste", pasteFn);
                delete focusEvents['pasteFn'];
                btn.classList.remove('fan');
                btn.querySelector('svg').classList.remove('fa-spin');
            }
        });
        return btn
    }

    //TODO 多文件的支持 当文件过大的时候，opencv需要提示
    //,isMultiple=false
    // 支持缓存 cache
    createInput(type, text = "", eventListener = null, cache = true) {

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


        // 用于缓存
        let key = this.md5(`_${type}_${text}`);
        let defaultValue = localStorage.getItem(key);
        // 
        cache ? setDefaultValue(defaultValue) : null;

        // 事件绑定
        div.addEventListener('click', () => input.click());

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
                        div.className = 'input-image';
                        // console.log(res)
                        div.style.backgroundImage = `url(${encodeURI(res)})`;
                    };

                    //其他文件
                    if (fileExt == "other") {
                        res = file.path;
                        p.innerText = file.name;
                        // console.log(file)
                    }
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
                    //图片
                    if (fileExt === 'image' && value) {
                        div.className = 'input-image';
                        div.style.backgroundImage = `url(${encodeURI(value)})`;
                    };
                    //其他文件
                    if (fileExt == "other" && value) {
                        p.innerText = `-`;
                    }
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

        this.add(div);
        return div
    }


    //创建canvas，返回canvas
    createCanvas(width, height, className, id, show = false) {
        let canvas = this.createBaseCanvas(width, height);
        if (className) canvas.className = className;
        if (id) canvas.id = id;
        canvas.style.width = width + 'px';
        canvas.style.height = 'auto';
        this.add(canvas);
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
     * @param {*} fontSize 
     * @param {*} color 
     * @param {*} width 
     */
    createTextCanvas(txt, fontSize = 24, color = "black", width = 300) {
            let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            let x = 2;
            // canvas.width = 480;
            // canvas.height = 32;
            ctx.font = `${fontSize * x}px Arial`;
            let font = ctx.measureText(txt);
            canvas.height = (font.fontBoundingBoxAscent + font.fontBoundingBoxDescent) + 12;
            canvas.width = (font.width) + 10;

            ctx.fillStyle = color;
            ctx.textAlign = "start";
            ctx.textBaseline = "top";
            ctx.font = `${fontSize * x}px Arial`;
            ctx.fillText(txt, 5, 10);

            // 导出图片
            canvas.toDataURL = function() {
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


            this.add(canvas);

            return canvas
        }
        //创建图片，根据url返回图片dom
    createImage(url) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = url;
            _img.onload = function() {
                //this.add(_img);
                resolve(_img);
            }
        })
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

    //随机来张图片
    randomPic(w = 200, h = 200) {
            this.randomPicNum++;
            let url = `https://picsum.photos/seed/${this.randomPicNum}/${w}/${h}`;
            return this.createImage(url);
        }
        //随机来一句话
    randomText() {}
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
}


/**
 * 经过处理后返回的是p5的元素类型
 * 所有输出格式参考p5的数据类型 
 */
class AI {
    constructor() {}
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
    getFace(_img, fastMode = false, maxDetectedFaces = 10) {
        //转为p5的元素类型
        _img = this.p5Image(_img);
        let _im = _img.elt;
        var faceDetector = new FaceDetector({ fastMode: fastMode, maxDetectedFaces: maxDetectedFaces });
        _img.faces = [];

        return new Promise((resolve, reject) => {
            faceDetector.detect(_im).then(function(faces) {
                console.log(`人脸检测`, faces)
                faces.forEach(function(item) {
                    _img.faces.push({
                        x: parseInt(item.boundingBox.x),
                        y: parseInt(item.boundingBox.y),
                        width: parseInt(item.boundingBox.width),
                        height: parseInt(item.boundingBox.height)
                    });
                });
                resolve(_img)
            }).catch(function(err) {
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
        // 预训练模型
    mobilenet() {
        const model = await mobilenet.load();
        console.log(model)
    }

}



module.exports = {
    Lab: {
        base: new Base(),
        ai: new AI(),
        video: ffmpeg
    },
    cv: cv
};