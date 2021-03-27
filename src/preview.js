const path = require('path');
// const { Lab, cv } = require('./lab');
// function init() {
//     //AI功能封装
//     window.Lab = Lab;
//     window.cv = cv;
//     // ipcRenderer.send('preview-ready', true);
// }
// window.addEventListener('load', init);

//预加载的字体,站酷沧耳渔阳体
var ZKYYT = {};

function preload() {
    ZKYYT.W01 = loadFont(path.join(__dirname, '../lib/zkyyt/W01.ttf'));
    ZKYYT.W02 = loadFont(path.join(__dirname, '../lib/zkyyt/W02.ttf'));
    ZKYYT.W03 = loadFont(path.join(__dirname, '../lib/zkyyt/W03.ttf'));
    ZKYYT.W04 = loadFont(path.join(__dirname, '../lib/zkyyt/W04.ttf'));
    ZKYYT.W05 = loadFont(path.join(__dirname, '../lib/zkyyt/W05.ttf'))
        // console.log(ZKYYT)
};

function createQRCode(url) {
    let div = document.createElement('div');
    let qrcode = new QRCode(div, {
        text: url,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    return {
        img: qrcode._el.querySelector('img'),
        base64: qrcode._el.querySelector('canvas').toDataURL()
    }
}