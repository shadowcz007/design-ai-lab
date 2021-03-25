//用于捕捉erro的情况，回传
const { remote } = require("electron");
var _MHOST = remote.getGlobal("_MHOST");

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
    host: _MHOST,
    port: 9000,
    // port:443,
    secure: true,
    path: "/myapp",
});
const conn = peer.connect('mobile');
conn.on('open', (d) => {
    console.log("conn open", d)
    conn.send('hi!');
});
peer.on('open', id => {

    console.log('peer open', id);

});

// disconnected from PeerJS server
peer.on('close', id => {
    console.log('peer close', id);
});
peer.on('connection', (conn) => {
    console.log('connection', conn);
    if (conn.peer === 'mobile') {
        conn.on('data', (data) => {
            // Will print 'hi!'
            console.log(data);
        });
        // conn.on('open', () => {
        //     conn.send('hello!');
        // });
    };
});

peer.on('call', incoming_call => {
    console.log("Got a call!", incoming_call);
    // incoming_call.answer(my_stream); 
    incoming_call.on('stream', remoteStream => {
        console.log("stream", remoteStream);
        let video = document.createElement('video');
        video.src = window.URL.createObjectURL(remoteStream) || remoteStream;
        video.play();
        console.log(video);
    });
});

peer.on('disconnection', (conn) => {
    console.log('disconnection', conn);
});


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