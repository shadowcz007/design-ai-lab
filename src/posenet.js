const tf = require('@tensorflow/tfjs');
const posenet = require('@tensorflow-models/posenet');
require('@tensorflow/tfjs-backend-webgl');
// require('@tensorflow/tfjs-backend-wasm');

const internalIp = require('internal-ip');
const host = internalIp.v4.sync();

const utils = require('./utils');

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

        utils.checkURLIsOk(this.url).then(status => {
            let opts = {
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: { width: 640, height: 480 },
                multiplier: 0.75
            };

            if (status) opts.modelUrl = this.url;

            let model = posenet.load(opts);

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
        });



    }

    async estimatePoseOnImage(imageElement, flipHorizontal = false, isDev = true) {
        // console.log(this.ready)
        if (this.ready !== true) return;
        // load the posenet model from a checkpoint
        const pose = await this.model.estimateSinglePose(imageElement, {
            flipHorizontal: flipHorizontal
        });

        //特征向量
        pose.feature = this.getFeature(pose.keypoints);

        // dev
        if (isDev) {
            let canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            let ctx = canvas.getContext('2d');
            this.drawSkeleton(pose.keypoints, 0, ctx);
            this.drawKeypoints(pose.keypoints, 0, ctx);
            pose.dev = canvas.toDataURL();
        }

        return pose;
    };
    async estimateMultiplePosesOnImage(imageElement,
        flipHorizontal = false,
        maxDetections = 5,
        scoreThreshold = 0.5,
        nmsRadius = 20,
        isDev = true) {
        let poses = await this.model.estimateMultiplePoses(imageElement, {
            flipHorizontal: flipHorizontal,
            maxDetections: maxDetections,
            scoreThreshold: scoreThreshold,
            nmsRadius: nmsRadius
        });

        let res = {};
        res.poses = Array.from(poses, pose => {
            //特征向量
            pose.feature = this.getFeature(pose.keypoints);
            return pose
        });

        // dev
        if (isDev) {
            let canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            let ctx = canvas.getContext('2d');

            Array.from(poses, pose => {

                this.drawSkeleton(pose.keypoints, 0, ctx);
                this.drawKeypoints(pose.keypoints, 0, ctx);
            });

            res.dev = canvas.toDataURL();
        };

        return res
    }

    //特征向量
    getFeature(keypoints) {
        let feature = [];
        // 裁切
        let xs = Array.from(keypoints, p => {
            return p.position.x
        }), ys = Array.from(keypoints, p => {
            return p.position.y
        });
        let xMin = Math.min(...xs),
            yMin = Math.min(...ys);

        Array.from(keypoints, p => {
            let index = _KEYPOINTS[p.part];
            // 增加权重
            feature[index] = (p.position.x - xMin) * p.score;
            feature[index + 1] = (p.position.y - yMin) * p.score;
        });

        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        // 归一
        let sum = feature.reduce(reducer) || 1;
        return Array.from(feature, f => f / sum);
    }


    drawPoint(ctx, y, x, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
    drawSegment([ay, ax], [by, bx], color, scale, ctx) {
        ctx.beginPath();
        ctx.moveTo(ax * scale, ay * scale);
        ctx.lineTo(bx * scale, by * scale);
        ctx.lineWidth = 12;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
        const adjacentKeyPoints =
            posenet.getAdjacentKeyPoints(keypoints, minConfidence);

        const toTuple = function ({ y, x }) {
            return [y, x];
        };


        adjacentKeyPoints.forEach((keypoints) => {
            this.drawSegment(
                toTuple(keypoints[0].position), toTuple(keypoints[1].position), `rgba(255,0,0,${(keypoints[0].score + keypoints[1].score)})`,
                scale, ctx);
        });
    }
    drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
        for (let i = 0; i < keypoints.length; i++) {
            const keypoint = keypoints[i];

            if (keypoint.score < minConfidence) {
                continue;
            }

            const { y, x } = keypoint.position;
            this.drawPoint(ctx, y * scale, x * scale, 3, `rgba(255,0,0,${keypoint.score})`);
        }
    }
}


module.exports = Posenet;