const internalIp = require('internal-ip');
const host = internalIp.v4.sync();
// const utils = require('./utils');
const faceapi=require('face-api.js');
const _IMG_SIZE = 320;
console.log(faceapi)
//  
class FaceModel {

    //单例
    static getInstance() {
        if (!FaceModel.instance) {
            FaceModel.instance = new FaceModel();
        }
        return FaceModel.instance;
    }

    constructor(progressFn) {
        let t1 = (new Date()).getTime();
        this.url = `http://${host}/face-api-weights/face_expression_model-weights_manifest.json`;

        setTimeout(() => {
            // faceapi.nets.faceExpressionNet.loadFromUri(this.url).then(res => {
            //     console.log('--face-api--sucess')
            //     if (progressFn) progressFn();
            // })
        }, 2000);

        // console.log(faceapi,this.url)
    }

    // async load(url) {
    //     url = url || this.url;
    //     this.model = await tf.loadGraphModel(this.url);
    //     this.ready = true;
    // }

    // predict(originalImageElement) {

    // }


}

module.exports = FaceModel.getInstance();