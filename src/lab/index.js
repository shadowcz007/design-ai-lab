//lab提供封装好的功能

const { remote } = require('electron');

//当窗口focus的时候，需要运行的函数
let focusEvents = {};
remote.getCurrentWindow().on('focus', e => {
    // console.log(e)
    for (const key in focusEvents) {
        focusEvents[key]();
    };
});

const Base = require('./base');
const UI = require('./ui');
const AI = require('./aimodel');
const Knn = require('./knn');
const video = require('./video');
const DataGenerator = require('./datagenerator');
const FlexLayout = require('./flexlayout');
const Canvas = require('./canvas');
const Color = require('./Color');
const Clipboard = require('./clipboard');
const GIF = require('./gif');
const Shape = require('./shape');
const screenpoint = require('./screenpoint')
const DimensionsDb = require('./dimensionsdb');
const Store = require('./store');
const Jieba = require('./segment');
const Deeplab = require('./deeplab');
const cv = require('opencvjs-dist/build/opencv');

module.exports = {
    base: new Base(),
    ui: new UI(),
    ai: new AI(),
    knn: new Knn(),
    video: video,
    DataGenerator: DataGenerator,
    FlexLayout: FlexLayout,
    Canvas: Canvas,
    Color: Color,
    DimensionsDb: DimensionsDb,
    clipboard: new Clipboard(),
    // gif功能
    GIF: GIF,
    screenpoint: screenpoint,
    // 轮廓
    shape: new Shape(),
    cv: cv,
    Store: Store,
    Deeplab: Deeplab,
    Jieba: new Jieba()
};