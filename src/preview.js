//用于捕捉erro的情况，回传
const { ipcRenderer, remote } = require("electron");
var mainWindow = (remote.getGlobal("_WINS")).mainWindow;

const path = require('path');


//AI功能封装
const { Lab, cv } = require('./lab');


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
// window.onerror = function(message, source, lineno, colno, error) { 
//     console.log({message, source, lineno, colno, error})
//     ipcRenderer.sendTo(mainWindow.webContents.id, 'executeJavaScript-result',{message, source, lineno, colno});
// }