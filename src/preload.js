// preload.js
const { Lab, cv, Store, Canvas, Deeplab } = require('./lab');
// const {CameraWeb}=require('./camera');
// 连接到peerjs服务
const PeerPC = require('./peerPC');

const DimensionsDb = require('./dimensionsDb');
// const _setImmediate = setImmediate;
// const _clearImmediate = clearImmediate;
process.once('loaded', () => {
    // global.setImmediate = _setImmediate;
    // global.clearImmediate = _clearImmediate;
    //AI功能封装
    global.Lab = Lab;
    global.cv = cv;
    global.Store = Store;
    global.Canvas = Canvas;
    global.Deeplab = Deeplab;
    // global.CameraWeb=CameraWeb;
    global.PeerPC = PeerPC;
    global.DimensionsDb = DimensionsDb;
})

// ipcRenderer.send('preview-ready', true);

// window.addEventListener('load', init);