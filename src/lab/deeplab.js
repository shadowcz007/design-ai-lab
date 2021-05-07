const tf = require('@tensorflow/tfjs');
const deeplab = require('@tensorflow-models/deeplab');

class Deeplab {
    async init() {

        const loadModel = async() => {
            const modelName = 'pascal'; // set to your preferred model, either `pascal`, `cityscapes` or `ade20k`
            const quantizationBytes = 2; // either 1, 2 or 4
            this.model = await deeplab.load({ base: modelName, quantizationBytes });
            const input = tf.zeros([227, 500, 3]);
            let { legend } = await this.model.segment(input);
            console.log(`The predicted classes are ${JSON.stringify(legend)}`);
        };
        await loadModel();
    }
}


module.exports = Deeplab;