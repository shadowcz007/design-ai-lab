const tf = require('@tensorflow/tfjs');
const posenet = require('@tensorflow-models/posenet');
require('@tensorflow/tfjs-backend-webgl');
// require('@tensorflow/tfjs-backend-wasm');

const internalIp = require('internal-ip');
const host = internalIp.v4.sync();

const _KEYPOINTS = { "nose": 0, "leftEye": 2, "rightEye": 4, "leftEar": 6, "rightEar": 8, "leftShoulder": 10, "rightShoulder": 12, "leftElbow": 14, "rightElbow": 16, "leftWrist": 18, "rightWrist": 20, "leftHip": 22, "rightHip": 24, "leftKnee": 26, "rightKnee": 28, "leftAnkle": 30, "rightAnkle": 32 };


//
class Posenet {

    //单例
    static getInstance() {
        if (!Posenet.instance) {
            Posenet.instance = new Posenet();
        }
        return Posenet.instance;
    }

    constructor(progressFn) {
        let t1 = (new Date()).getTime();
        this.url = `http://${host}/posenet/model.json`;

        let model = posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75,
            modelUrl: this.url
        });

        model.then(async (net) => {
            this.model = net;
            let c = document.createElement('canvas');
            c.width = 1;
            c.height = 1;
            const pose = await net.estimateSinglePose(c, {
                flipHorizontal: false
            });
            let info = {
                type: `load_model_done`,
                backend: tf.getBackend(),
                time: (new Date()).getTime() - t1
            };
            console.log(info, pose);
            this.ready = true;
            if (progressFn) progressFn(info)
        });

    }

    async estimatePoseOnImage(imageElement, flipHorizontal = false) {
        // console.log(this.ready)
        if (this.ready !== true) return;
        // load the posenet model from a checkpoint
        const pose = await this.model.estimateSinglePose(imageElement, {
            flipHorizontal: flipHorizontal
        });


        //特征向量
        let feature = [];

        // 裁切
        let xs = Array.from(pose.keypoints, p => {
            return p.position.x
        }), ys = Array.from(pose.keypoints, p => {
            return p.position.y
        });
        let xMin = Math.min(...xs),
            yMin = Math.min(...ys);

        Array.from(pose.keypoints, p => {
            let index = _KEYPOINTS[p.part];
            // 增加权重
            feature[index] = (p.position.x - xMin)*p.score;
            feature[index + 1] = (p.position.y - yMin)*p.score;
        });

        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        // 归一
        let sum = feature.reduce(reducer) || 1;
        pose.feature = Array.from(feature, f => f / sum);

        return pose;
    };
    async estimateMultiplePosesOnImage(imageElement, flipHorizontal = false, maxDetections = 5, scoreThreshold = 0.5, nmsRadius = 20) {
        const poses = await this.model.estimateMultiplePoses(imageElement, {
            flipHorizontal: flipHorizontal,
            maxDetections: maxDetections,
            scoreThreshold: scoreThreshold,
            nmsRadius: nmsRadius
        });
        return poses
    }


}


module.exports = Posenet;