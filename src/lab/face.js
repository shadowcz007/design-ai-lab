const P5 = require('./p5');

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
                    facesResfaces.push({
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
    getFaceForP5(_img, fastMode = false, maxDetectedFaces = 10) {
        //转为p5的元素类型
        _img = P5.p5Image(_img);
        let _im = _img.elt;
        _img.faces = [];

        return new Promise((resolve, reject) => {
            this.getFace(_im, fastMode, maxDetectedFaces).then(faces => {
                _img.faces = faces;
                resolve(_img)
            })
        });
    };
}

module.exports = Face;