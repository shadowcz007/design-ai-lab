const internalIp = require('internal-ip');
const host = internalIp.v4.sync();
// const utils = require('./utils');

const _IMG_SIZE = 320;

//  
class Face {

    //单例
    static getInstance() {
        if (!Face.instance) {
            Face.instance = new Face();
        }
        return Face.instance;
    }

    constructor(progressFn) {
        let t1 = (new Date()).getTime();
        this.url = `http://${host}/face-api-weights/face_expression_model-weights_manifest.json`;

        setTimeout(() => {
            faceapi.nets.faceExpressionNet.loadFromUri(this.url).then(res => {
                console.log('--face-api--sucess')
                if (progressFn) progressFn();
            })
        }, 2000);


    }

    // async load(url) {
    //     url = url || this.url;
    //     this.model = await tf.loadGraphModel(this.url);
    //     this.ready = true;
    // }

    // predict(originalImageElement) {

    // }


}

module.exports = Face;