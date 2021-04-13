const tf = require('@tensorflow/tfjs');
const bodyPix = require('@tensorflow-models/body-pix');
require('@tensorflow/tfjs-backend-webgl');
// require('@tensorflow/tfjs-backend-wasm');

const internalIp = require('internal-ip');
const host = internalIp.v4.sync();
const utils=require('./utils');
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
            
            let opts={};
            if(status) opts.modelUrl=this.url;

            let model = bodyPix.load(opts);
            
            model.then(net => {
                this.model = net;
            });
    
            model.then(async (net) => {
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
        // console.log(segmentation);
        // The mask image is an binary mask image with a 1 where there is a person and
        // a 0 where there is not.
        const coloredPartImage = bodyPix.toMask(segmentation);
        const opacity = 0;
        const flipHorizontal = false;
        const maskBlurAmount = 4;
        const canvas = document.createElement('canvas');
        bodyPix.drawMask(
            canvas, img, coloredPartImage, opacity, maskBlurAmount,
            flipHorizontal);
        return canvas
    }


}


module.exports = Bodypix;