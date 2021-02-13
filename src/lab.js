//lab提供封装好的功能
const tf = require('@tensorflow/tfjs');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const cv = require('opencvjs-dist/build/opencv');
const ColorThief = require('colorthief/dist/color-thief.umd');
const colorThief = new ColorThief();

const ffmpeg = require('./ffmpeg');


//主要完成html的一些基本的操作
class Base {
    constructor() {
        this.isDisplay();
        //随机获取，累计
        this.randomPicNum = 0;
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
            let children = document.querySelector("#gui-main").children;
            document.querySelector("#gui-main").style.display = (children.length == 0 ? "none" : "flex");
        }
        //手动隐藏,显示p5.js
    p5Show(isShow = true) {
        if (document.querySelector("#p5")) document.querySelector("#p5").style.display = (isShow === true) ? "flex" : "none";
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


    // 封装的控件
    createIcon(key, eventListener) {
        let icons = {
            'refresh': `<i class="fas fa-sync-alt"></i>`,
            'download': `<i class="far fa-download"></i>`,
            'play': `<i class="far fa-play-circle"></i>`
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

    //TODO 多文件的支持 当文件过大的时候，opencv需要提示
    //,isMultiple=false
    createInput(type, text = "", eventListener = null) {
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

        div.addEventListener('click', () => input.click());

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
                //文本输入
                res = input.value;
            };
            //eventListener,处理input的结果
            if (eventListener) {
                res = eventListener(res);
            };
            input.setAttribute('data', res);
        }
        input.addEventListener('change', eventFn);

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
        return canvas
    }

    //创建由文本图片，返回base64
    createTextImage(txt, fontSize = 24, color = "black", width = 300) {
            let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            let x = 2;
            // canvas.width = 480;
            // canvas.height = 32;
            ctx.font = `${fontSize*x}px Arial`;
            let font = ctx.measureText(txt);
            canvas.height = (font.fontBoundingBoxAscent + font.fontBoundingBoxDescent) + 12;
            canvas.width = (font.width) + 10;

            ctx.fillStyle = color;
            ctx.textAlign = "start";
            ctx.textBaseline = "top";
            ctx.font = `${fontSize*x}px Arial`;
            ctx.fillText(txt, 5, 10);

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

            this.add(canvas);

            return base64
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
        this.topk = 20;
    }

    count() {
        return this.knn.getClassExampleCount();
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

    async predict(tensor) {
        if (!(tensor instanceof tf.Tensor)) tensor = tf.tensor(tensor);
        return await this.knn.predictClass(tensor, this.topk);
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
    loadface(_img) {
        //转为p5的元素类型
        _img = this.p5Image(_img);

        let _im = _img.elt;
        var faceDetector = new FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
        _img.faces = [];
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
        }).catch(function(err) {
            console.log("err", err)
        });
        return _img
    };
    // 文本检测
    loadtext(_img) {
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



module.exports = {
    Lab: {
        base: new Base(),
        ai: new AI(),
        video: ffmpeg
    },
    cv: cv
};