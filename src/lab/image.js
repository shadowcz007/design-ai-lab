const smartcrop = require('smartcrop');
const base = require('./base');
const { createApi } = require('unsplash-js');

class ImageTool {
    constructor() {
        //随机获取，累计
        this.randomPicNum = 0;
        this.nativeImage = require('electron').nativeImage;
    }

    createCanvas(width, height) {
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas
    }

    createCanvasFromImage(im) {
        // im.width = im.naturalWidth;
        // im.height = im.naturalHeight;
        let canvas = this.createCanvas(im.naturalWidth || im.width, im.naturalHeight || im.height);
        let ctx = canvas.getContext('2d');
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        return canvas
    }

    base642URL(base64){
        return new Promise((resolve, reject) => {
            fetch(base64)
            .then(res => res.blob())
            .then(blob => {
                resolve(URL.createObjectURL(blob));
            })
        });
    }

    im2base64(im) {
        let canvas = this.createCanvasFromImage(im);
        return canvas.toDataURL();
    }

    createImage(url) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = encodeURI(url);
            // console.log(_img)
            _img.className = 'opacity-background';
            _img.onload = function () {
                resolve(_img);
            }
            _img.onerror = function () {
                resolve(null);
            }
        })
    }

    scaleImage(url, scaleSeed = 1) {
        return new Promise(async (resolve, reject) => {
            let im = await this.createImage(url);

            if (im) {
                let canvas = this.createCanvasFromImage(im);
                let newCanvas = this.createCanvas(im.naturalWidth * scaleSeed, im.naturalHeight * scaleSeed);
                newCanvas.getContext('2d').drawImage(canvas, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, im.naturalWidth * scaleSeed, im.naturalHeight * scaleSeed);
                let newIm = await this.createImage(newCanvas.toDataURL());
                resolve(newIm);
            } else {
                resolve(null);
            }

        });

    }
    //随机来张图片
    randomPic(w = 200, h = 200) {
        this.randomPicNum++;
        let url = `https://picsum.photos/seed/${this.randomPicNum}/${w}/${h}`;
        return url
    }
    // unsplash
    getUnsplash(accessKey, count = 30) {
        let unsplash = createApi({
            accessKey: accessKey,
        });
        return new Promise((resolve, reject) => {
            unsplash.photos.getRandom({
                count: count,
            }).then(result => {

                switch (result.type) {
                    case 'error':
                        // console.log('error occurred: ', result.errors[0]);
                        reject(result.errors[0]);
                    case 'success':
                        const photo = result.response;
                        // console.log(photo);
                        resolve(photo);
                }

            });
        });

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
    // 返回canvas
    smartCrop(image, width, height) {
        let canvas = this.createCanvasFromImage(image);

        return new Promise((resolve, reject) => {
            smartcrop.crop(canvas, { width: width, height: height }).then(result => {
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


    getNativeImageFromWebview(url) {
        if (!url) return
        return new Promise((resolve, reject) => {
            let webview = document.createElement('webview');
            webview.src = url;
            webview.style.display = 'none';
            document.body.appendChild(webview);
            webview.addEventListener('did-finish-load', async () => {
                await base.sleep(500);
                let res = await webview.executeJavaScript(`
                    function downloadImage(img){
                        var c=document.createElement('canvas');
                        c.width=img.naturalWidth;
                        c.height=img.naturalHeight;
                        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
                        return c.toDataURL();
                    };
                    downloadImage(document.images[0]);
            `);
                webview.remove();
                resolve(res);
            });
        });
    }

    getNativeImageFromWebview2(url) {
        const arrayBuffer2Base64 = function (buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        };

        return new Promise((resolve, reject) => {
            fetch(url).then(async r => {
                return {
                    type: r.headers.get('content-type'),
                    data: await r.arrayBuffer()
                }
            }).then(r => {
                // console.log(r)
                if(r.type.match('image')){
                    let res = arrayBuffer2Base64(r.data);
                    res = `data:${r.type};base64,${res}`;
                    resolve(res);
                }else{
                    resolve(null);
                }
               
            });
        });
    }

    // 申请的class 竟然不在window对象下 
    initPixelit(){
        return new Promise((resolve, reject) => {
            // console.log(pixelit)
            try {
                this.Pixelit=pixelit;
            } catch (error) {
                let isHas=false;
                Array.from(document.head.querySelectorAll('script'),s=>{
                    if(s.src.match('pixelit.js')) isHas=true;
                });
                if(!isHas) {
                    base.loadFromLocal('pixelit/dist/pixelit.js').then(res=>{
                        
                        if(res){
                            setTimeout(()=>{
                                this.Pixelit=pixelit;
                                resolve(res);
                                // console.log(this.pixelit,pixelit)
                            },1000);
                        }else{
                            resolve(res);
                        }
                        
                    })
                };
            }
             
            resolve(true);
        });
        
    }

}

module.exports = ImageTool;