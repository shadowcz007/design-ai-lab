const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-webgl');

const internalIp = require('internal-ip');
const host = internalIp.v4.sync();



const coco_classes = [
    'person',
    'bicycle',
    'car',
    'motorbike',
    'aeroplane',
    'bus',
    'train',
    'truck',
    'boat',
    'traffic light',
    'fire hydrant',
    'stop sign',
    'parking meter',
    'bench',
    'bird',
    'cat',
    'dog',
    'horse',
    'sheep',
    'cow',
    'elephant',
    'bear',
    'zebra',
    'giraffe',
    'backpack',
    'umbrella',
    'handbag',
    'tie',
    'suitcase',
    'frisbee',
    'skis',
    'snowboard',
    'sports ball',
    'kite',
    'baseball bat',
    'baseball glove',
    'skateboard',
    'surfboard',
    'tennis racket',
    'bottle',
    'wine glass',
    'cup',
    'fork',
    'knife',
    'spoon',
    'bowl',
    'banana',
    'apple',
    'sandwich',
    'orange',
    'broccoli',
    'carrot',
    'hot dog',
    'pizza',
    'donut',
    'cake',
    'chair',
    'sofa',
    'pottedplant',
    'bed',
    'diningtable',
    'toilet',
    'tvmonitor',
    'laptop',
    'mouse',
    'remote',
    'keyboard',
    'cell phone',
    'microwave',
    'oven',
    'toaster',
    'sink',
    'refrigerator',
    'book',
    'clock',
    'vase',
    'scissors',
    'teddy bear',
    'hair drier',
    'toothbrush'
];

class YoloV3 {

     //单例
     static getInstance() {
        if (!YoloV3.instance) {
            YoloV3.instance = new YoloV3();
        }
        return YoloV3.instance;
    }

    /**
    * @param {nObject} number of maximum object to recognize in one detection
    * @param {scoreTh} score threshold
    * @param {iouTh}   Intersect Over Union threshold
    */
    constructor(isTiny = true, nObject = 20, scoreTh = 0.2, iouTh = 0.3) {
        this.nObject = nObject;
        this.scoreTh = scoreTh;
        this.iouTh = iouTh;
        this.anchor = [10, 14, 23, 27, 37, 58, 81, 82, 135, 169, 344, 319];
        this.mask = { "3": [[6, 7, 8], [3, 4, 5], [0, 1, 2]], "2": [[3, 4, 5], [1, 2, 3]] };
        this.labels = coco_classes;
        this.nClass = coco_classes.length;
        this.url = `http://${host}/yolov3${isTiny === true ? '-tiny' : ''}/model.json`;
        this.load();
    }

    /**
    * Load the weights model from the specified url
    * @param {url} link path to model.json weights
    */
    async load(url) {
        let t1 = (new Date()).getTime();
        url = url || this.url;
        this.model = await tf.loadLayersModel(url);
        // console.log(this.model)
        const features = await this.predict(new Image());
        let info = {
            type: "load_yolo_model_done", backend: tf.getBackend(),
            time: (new Date()).getTime() - t1
        };
        this.ready = true;
        console.log(info, features)
        return 
        // if (progressFn) progressFn(info)
    }

    /**
    * Forward Pass the input and returns the output feature volume
    * @param {input} image, canvas, or video element
    * @param {flipHorizontal} flip the input image tensor for webcam input
    */
    async predict(input, flipHorizontal = true) {
        if (this.ready !== true) return [];
        if (input.constructor.name === 'HTMLImageElement') {
            input.width = input.naturalWidth;
            input.height = input.naturalHeight;
        };

        this.imgSize = input.constructor.name === 'HTMLVideoElement' ? [input.videoHeight, input.videoWidth] : [input.height, input.width]

        let features = tf.tidy(() => {
            const canvas = document.createElement('canvas')
            canvas.width = 416
            canvas.height = 416
            const ctx = canvas.getContext('2d')
            ctx.drawImage(input, 0, 0, 416, 416)

            let imageTensor = tf.browser.fromPixels(canvas, 3)
            imageTensor = imageTensor.expandDims(0).toFloat().div(tf.scalar(255))
            if (flipHorizontal) {
                imageTensor = imageTensor.reverse(2)
            }

            const features = this.model.predict(imageTensor)
            return features
        })

        return features
    }


    /**
    * Forward Pass the input and returns the box of detected objects
    * @param {input} image, canvas, or video element
    * @param {flipHorizontal} flip the input image tensor for webcam input
    */
    async detectAndBox(input, flipHorizontal = false) {
        if (this.ready !== true) return [];
        const features = await this.predict(input, flipHorizontal)

        let [boxes, boxScores] = tf.tidy(() => {
            let nFeature = features.length
            let anchorMask = this.mask[nFeature]
            let inputShape = features[0].shape.slice(1, 3).map(num => num * 32)

            const anchors_tf = tf.tensor1d(this.anchor).reshape([-1, 2])
            let fBoxes = []
            let fScores = []

            for (let i = 0; i < nFeature; i++) {
                const anchorFeature = anchors_tf.gather(tf.tensor1d(anchorMask[i], 'int32'))
                const [boxes, boxScores] = this.getFeatureBox(features[i], anchorFeature, inputShape)

                fBoxes.push(boxes)
                fScores.push(boxScores)
            }

            fBoxes = tf.concat(fBoxes)
            fScores = tf.concat(fScores)

            return [fBoxes, fScores]
        })

        let boxCoord = []
        let scores = []
        let labelIdx = []

        const yPred = tf.argMax(boxScores, -1)
        const boxPred = tf.max(boxScores, -1)

        const nmsIndex = await tf.image.nonMaxSuppressionAsync(boxes, boxPred, this.nObject, this.iouTh, this.scoreTh)

        if (nmsIndex.size) {
            tf.tidy(() => {
                const classBoxes = tf.gather(boxes, nmsIndex)
                const classBoxScores = tf.gather(boxPred, nmsIndex)

                classBoxes.split(nmsIndex.size).map(box => {
                    boxCoord.push(box.dataSync())
                })
                classBoxScores.dataSync().map(score => {
                    scores.push(score)
                })
                labelIdx = yPred.gather(nmsIndex).dataSync()
            })
        }
        boxPred.dispose()
        yPred.dispose()
        nmsIndex.dispose()

        boxes.dispose()
        boxScores.dispose()

        return boxCoord.map((box, i) => {
            const top = Math.max(0, box[0])
            const left = Math.max(0, box[1])
            const bottom = Math.min(this.imgSize[0], box[2])
            const right = Math.min(this.imgSize[1], box[3])
            const height = bottom - top
            const width = right - left
            return { top, left, bottom, right, height, width, score: scores[i], label: this.labels[labelIdx[i]] }
        })
    }

    getFeatureBox(feature, featAnchor, inputShape) {
        const nAnchors = featAnchor.shape[0]
        const anchors_tf = tf.reshape(featAnchor, [1, 1, nAnchors, 2])

        const gridShape = feature.shape.slice(1, 3)

        const gridY = tf.tile(tf.reshape(tf.range(0, gridShape[0]), [-1, 1, 1, 1]), [1, gridShape[1], 1, 1])
        const gridX = tf.tile(tf.reshape(tf.range(0, gridShape[1]), [1, -1, 1, 1]), [gridShape[0], 1, 1, 1])
        const grid = tf.concat([gridX, gridY], 3).cast(feature.dtype)

        feature = feature.reshape([gridShape[0], gridShape[1], nAnchors, this.nClass + 5])

        const [xy, wh, con, probs] = tf.split(feature, [2, 2, 1, this.nClass], 3)
        const boxXy = tf.div(tf.add(tf.sigmoid(xy), grid), gridShape.reverse())
        const boxWh = tf.div(tf.mul(tf.exp(wh), anchors_tf), inputShape.reverse())
        const boxConfidence = tf.sigmoid(con)

        let boxClassProbs = tf.sigmoid(probs)

        let boxYx = tf.concat(tf.split(boxXy, 2, 3).reverse(), 3)
        let boxHw = tf.concat(tf.split(boxWh, 2, 3).reverse(), 3)

        const boxMins = tf.mul(tf.sub(boxYx, tf.div(boxHw, 2)), this.imgSize)
        const boxMaxes = tf.mul(tf.add(boxYx, tf.div(boxHw, 2)), this.imgSize)

        let boxes = tf.concat([
            ...tf.split(boxMins, 2, 3),
            ...tf.split(boxMaxes, 2, 3)
        ], 3)

        boxes = boxes.reshape([-1, 4])

        let boxScores = tf.mul(boxConfidence, boxClassProbs)
        boxScores = tf.reshape(boxScores, [-1, this.nClass])

        return [boxes, boxScores]
    }
}


module.exports = YoloV3.getInstance();