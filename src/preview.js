//用于捕捉erro的情况，回传
// const { ipcRenderer } = require("electron");
// var mainWindow = (remote.getGlobal("_WINS")).mainWindow;

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
    ZKYYT.W05 = loadFont(path.join(__dirname, '../lib/zkyyt/W05.ttf'));

    // console.log(ZKYYT)
}

const peer = new Peer("pc", {
    host: "wss://192.168.1.3",
    port: 9000,
    path: "/myapp",
});
const conn = peer.connect('mobile');
conn.on('open', () => {
    console.log("open")
    conn.send('hi!');
});
peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        // Will print 'hi!'
        console.log(data);
    });
    conn.on('open', () => {
        conn.send('hello!');
    });
});