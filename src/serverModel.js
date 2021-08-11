// 为了减少u2net在实验过程中的重复加载，耗时

const yolo = require('./server/yolov5');
const u2net = require('./server/u2net');
const mobilenet = require('./server/mobilenet');
const posenet = require('./server/posenet');
const bodypix = require('./server/bodypix');
// const face = require('./server/face');


async function u2netDrawSegment(base64) {
    let im = await createImage(base64);
    let canvas = await u2net.drawSegment(im);
    return canvas.toDataURL();
}

async function yoloDetectAndBox(base64) {
    let im = await createImage(base64);
    let res = await yolo.detectAndBox(im);
    return res;
}

async function mobilenetClassify(base64) {
    let im = await createImage(base64);
    return mobilenet.classify(im);
}
async function mobilenetInfer(base64, embedding = true) {
    let im = await createImage(base64);
    return mobilenet.infer(im, embedding);
}

async function estimatePose(base64) {
    let im = await createImage(base64);
    let res = await posenet.estimatePoseOnImage(im);
    return res
}
async function estimateMultiplePoses(base64) {
    let im = await createImage(base64);
    let res = await posenet.estimateMultiplePosesOnImage(im);
    return res
}

async function segmentPerson(base64) {
    let im = await createImage(base64);
    let canvas = await bodypix.segmentPerson(im);
    return canvas.toDataURL();
}

function createImage(url) {
    return new Promise((resolve, reject) => {
        let _img = new Image();
        _img.src = url;
        _img.onload = function() {
            resolve(_img);
        }
    })
};