//用于捕捉erro的情况，回传
const { ipcRenderer, remote } = require("electron");
var mainWindow = (remote.getGlobal("_WINS")).mainWindow;

const path = require('path');
const ColorThief = require('colorthief/dist/color-thief.umd');
const colorThief = new ColorThief();


class AI {
    constructor() {}
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


//预加载的字体,站酷沧耳渔阳体
var ZKYYT = {};

function preload() {
    ZKYYT.W01 = loadFont(path.join(__dirname, '../lib/zkyyt/W01.ttf'));
    ZKYYT.W02 = loadFont(path.join(__dirname, '../lib/zkyyt/W02.ttf'));
    ZKYYT.W03 = loadFont(path.join(__dirname, '../lib/zkyyt/W03.ttf'));
    ZKYYT.W04 = loadFont(path.join(__dirname, '../lib/zkyyt/W04.ttf'));
    ZKYYT.W05 = loadFont(path.join(__dirname, '../lib/zkyyt/W05.ttf'));

    // console.log(ZKYYT)
}