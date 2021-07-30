// const P5 = require('./p5');

class Face {
    constructor() {}

    // 人脸
    getFace(_im, fastMode = false, maxDetectedFaces = 10) {
        var faceDetector = new FaceDetector({ fastMode: fastMode, maxDetectedFaces: maxDetectedFaces });
        let facesRes = [];
        return new Promise((resolve, reject) => {
            faceDetector.detect(_im).then(function(faces) {
                console.log(`人脸检测`, faces)
                faces.forEach(function(item) {
                    facesRes.push({
                        x: parseInt(item.boundingBox.x),
                        y: parseInt(item.boundingBox.y),
                        width: parseInt(item.boundingBox.width),
                        height: parseInt(item.boundingBox.height)
                    });
                });
                resolve(facesRes)
            }).catch(function(err) {
                console.log("err", err);
                reject(err);
            });
        });
    };
}

module.exports = Face;