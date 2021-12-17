const internalIp = require('internal-ip');
const host = internalIp.v4.sync();
// const utils = require('../utils');

const tf = require('@tensorflow/tfjs');
const deeplab = require('@tensorflow-models/deeplab');
require('@tensorflow/tfjs-backend-webgl');

class DL {
     //单例
     static getInstance() {
        if (!DL.instance) {
            DL.instance = new DL();
        }
        return DL.instance;
    }

    constructor(modelName, modelUrl) {
        this.modelUrl = modelUrl || `http://${host}/ade20k_2/model.json`;;
        this.modelName = modelName || 'ade20k';
        this.loadModel(this.modelName, this.modelUrl).then(async () => {
            await this.initModel();
        });
    }
    async loadModel(modelName = 'ade20k', modelUrl, quantizationBytes = 2) {
        this.model = await deeplab.load({ base: modelName, quantizationBytes, modelUrl: modelUrl });
    };

    async initModel() {
        const input = tf.zeros([227, 500, 3]);
        let { legend } = await this.model.segment(input);
        console.log(`The predicted classes are ${JSON.stringify(legend)}`);
    }

    getRawSegmentationMap(image){
        return this.model.predict(image)
    }

   async displaySegmentationMap(image,canvas){
        let {legend, height, width, segmentationMap} =await this.predict(image);
        const segmentationMapData = new ImageData(segmentationMap, width, height);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = width;
        canvas.height = height;
        let ctx=canvas.getContext('2d');
        ctx.putImageData(segmentationMapData, 0, 0);
        return canvas
    }

    async translateSegmentationMap (rawSegmentationMap){
        let base=this.modelName;
        const [height, width] = rawSegmentationMap.shape;
        const {legend, segmentationMap} =
            await deeplab.toSegmentationImage(deeplab.getColormap(base), deeplab.getLabels(base), rawSegmentationMap);

        tf.dispose(rawSegmentationMap);

        return {legend, height, width, segmentationMap};

    }
   async predict(image){
    let segmentationMap =this.getRawSegmentationMap(image);
       return  await this.translateSegmentationMap(segmentationMap)
    }
   
}

module.exports = DL.getInstance();