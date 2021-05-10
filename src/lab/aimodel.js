/**
 * 经过处理后返回的是p5的元素类型
 * 所有输出格式参考p5的数据类型 
 * TODO p5 的数据类型 和 原生的 剥离开
 */

// const Knn = require('./knn');
const { remote } = require('electron');

const humanseg = require('./humanseg');


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



}

module.exports = AI;