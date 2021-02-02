//lab提供封装好的功能


const ColorThief = require('colorthief/dist/color-thief.umd');
const colorThief = new ColorThief();

const ffmpeg=require('./ffmpeg');

class Base{
    constructor(){}
    createTextImage(txt,fontSize,color){
        let canvas=document.createElement('canvas'),
            ctx=canvas.getContext('2d');
        canvas.width=480;
        canvas.height=32;
        ctx.font=`${fontSize}px Arial`;
        let font=ctx.measureText(txt);
        canvas.height=font.fontBoundingBoxAscent+font.fontBoundingBoxDescent;
        canvas.width=font.width;
        ctx.fillStyle=color||"black";
        ctx.textAlign="start";
        ctx.textBaseline="top";
        ctx.fillText(txt,0,0);
        let base64=canvas.toDataURL('image/png');
        return {base64,width:canvas.width,height:canvas.height}
    }
}

class AI {
    constructor() {}
    cropCanvas(_canvas, x, y, w, h) {
        let scale = _canvas.canvas.width / _canvas.width;
        let canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(_canvas.canvas, x * scale, y * scale, w * scale, h * scale, 0, 0, w * scale, h * scale);
        return canvas
    }
    getColor(_img) {
        let _im = _img.elt;
        if (_im.complete) {
            _img.mainColor = color(...colorThief.getColor(_im));
        } else {
            _im.addEventListener('load', function() {
                _img.mainColor = color(...colorThief.getColor(_im));
            });
        }
    };

    getPalette(_img) {
        let _im = _img.elt;
        if (_im.complete) {
            _img.colorPalette = Array.from(colorThief.getPalette(_im), c => color(...c));
        } else {
            _im.addEventListener('load', function() {
                _img.colorPalette = Array.from(colorThief.getPalette(_im), c => color(...c));
            });
        }
    }

    loadface(_img) {
        let _im = _img.elt;
        var faceDetector = new FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
        _img.faces = [];
        faceDetector.detect(_im).then(function(faces) {
            console.log(`人脸检测`, faces)
            faces.forEach(function(item) {

                _img.faces.push({
                    x: parseInt(item.boundingBox.x),
                    y: parseInt(item.boundingBox.y),
                    width: parseInt(item.boundingBox.width),
                    height: parseInt(item.boundingBox.height)
                });
            });
        }).catch(function(err) {
            console.log("err", err)
        });
    };

    loadtext(_img) {
        let _im = _img.elt;
        let textDetector = new TextDetector();
        _img.textBlocks = [];
        textDetector.detect(_im)
            .then(detectedTextBlocks => {
                console.log(`文本检测`, detectedTextBlocks)
                for (const textBlock of detectedTextBlocks) {
                    _img.textBlocks.push({
                        x: textBlock.boundingBox.x,
                        y: textBlock.boundingBox.y,
                        width: textBlock.boundingBox.width,
                        height: textBlock.boundingBox.height
                    });
                }
            }).catch(() => {
                console.error("Text Detection failed, boo.");
            })
    }
}



module.exports = {
    ai:new AI(),
    base:new Base(),
    video:ffmpeg
};