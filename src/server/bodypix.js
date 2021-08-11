const tf = require('@tensorflow/tfjs');
const bodyPix = require('@tensorflow-models/body-pix');
require('@tensorflow/tfjs-backend-webgl');
// require('@tensorflow/tfjs-backend-wasm');

const internalIp = require('internal-ip');
const host = internalIp.v4.sync();
const utils = require('../utils');
//
class Bodypix {

    //单例
    static getInstance() {
        if (!Bodypix.instance) {
            Bodypix.instance = new Bodypix();
        }
        return Bodypix.instance;
    }

    constructor(progressFn) {
        let t1 = (new Date()).getTime();
        this.url = `http://${host}/bodypix/model.json`;

        utils.checkURLIsOk(this.url).then(status => {

            let opts = {};
            if (status) opts.modelUrl = this.url;

            let model = bodyPix.load(opts);

            model.then(net => {
                this.model = net;
            });

            model.then(async(net) => {
                this.model = net;
                let c = document.createElement('canvas');
                c.width = 1;
                c.height = 1;
                const res = await this.model.segmentPerson(c);;
                let info = {
                    type: `load_model_done`,
                    backend: tf.getBackend(),
                    time: (new Date()).getTime() - t1
                };
                console.log(info, res);
                this.ready = true;
                if (progressFn) progressFn(info)
            });
        });



    }


    async segmentPerson(img) {
        const segmentation = await this.model.segmentPerson(img);
        // Convert the segmentation into a mask to darken the background.
        const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const backgroundColor = { r: 0, g: 255, b: 0, a: 255 };
        const coloredPartImage = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
        const opacity = 1;
        const flipHorizontal = false;
        const maskBlurAmount = 0;
        const canvasMask = document.createElement('canvas');
        bodyPix.drawMask(
            canvasMask, img, coloredPartImage, opacity, maskBlurAmount,
            flipHorizontal);

        const canvas = document.createElement('canvas');
        canvas.width = canvasMask.width;
        canvas.height = canvasMask.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvasMask.width, canvasMask.height);
        let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let imgMaskData = canvasMask.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

        for (let index = 0; index < (imgData.width * imgData.height * 4); index += 4) {
            imgData.data[index + 3] = (imgMaskData.data[index + 1] == 255 && imgMaskData.data[index + 0] == 0) ? 0 : 255;
        };

        ctx.putImageData(imgData, 0, 0);

        return canvas
    }


}


module.exports = Bodypix.getInstance();