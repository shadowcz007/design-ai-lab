const tf = require('@tensorflow/tfjs');

const mobilenet = require('@tensorflow-models/mobilenet');
const hash = require('object-hash');
const internalIp = require('internal-ip');
const host = internalIp.v4.sync();

class Mobilenet {
    constructor(opts) {
        this.IMAGE_SIZE = 224;
        this.savePathHead = 'indexeddb://Mobilenet_';
        this.opts = opts || {
            version: 2,
            alpha: 1.0,
            modelUrl: `http://${host}/mobilenet_v2/model.json`
        };
        this.initSavePath(this.opts);
    }
    initSavePath(opts) {
        this.savePath = this.savePathHead + hash(opts);
        return this.savePath;
    }
    async init() {
        if (!this.mobilenetModel) {
            try {
                this.mobilenetModel = await mobilenet.load(
                    Object.assign({ ...this.opts }, {
                        modelUrl: this.savePath
                    }));
                console.log('Prediction from loaded model:');
            } catch (error) {
                this.mobilenetModel = await mobilenet.load(this.opts);
                this.mobilenetModel.model.save(this.savePath).then(console.log);
                console.log(error);
            };
        }

        // Warmup the model.
        const result = tf.tidy(
            () => this.mobilenetModel.infer(tf.zeros(
                [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), true));
        // result.print();
        await result.data();
        result.dispose();
    }
    /**
     * 
     * @param {tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} img 
     * @param {number} topk 
     */
    classify(img = tf.zeros(
        [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), topk = 5) {
        return this.mobilenetModel.classify(img, topk);
    }
    /**
     * 
     * @param {*} img 
     * @param {*} embedding 
     */
    infer(img = tf.zeros(
        [1, this.IMAGE_SIZE, this.IMAGE_SIZE, 3]), embedding = true) {
        if (this.mobilenetModel) return this.mobilenetModel.infer(
            img,
            embedding
        )
    }

}
module.exports = Mobilenet;