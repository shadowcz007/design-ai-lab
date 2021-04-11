// preload.js
const { Lab, cv, Store, Deeplab } = require('./lab');

const DataGenerator = require('./dataGenerator');
const Canvas = require('./canvas');
// 连接到peerjs服务
const PeerPC = require('./peerPC');

const screenpoint = require('./screenpoint')

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
    // global.humanseg = humanseg;
    global.DataGenerator = DataGenerator;

    global.screenpoint = screenpoint;
})

// ipcRenderer.send('preview-ready', true);

// window.addEventListener('load', init);