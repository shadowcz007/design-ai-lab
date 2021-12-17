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

const base = require('./base');
const UI = require('./ui');
const AI = require('./aimodel');
const Anime=require('./anime');
const Knn = require('./knn');
const video = require('./video');
const DataGenerator = require('./datagenerator');
const FlexLayout = require('./flexlayout');
const Canvas = require('./canvas');
const Image = require('./image');
const Text = require('./text');
const Color = require('./Color');
const Clipboard = require('./clipboard');
const GIF = require('./gif');
const Shape = require('./shape');
const screenpoint = require('./screenpoint')
const DimensionsDb = require('./dimensionsdb');
const Store = require('./store');
const AppStore = require('./appStore');
const nlp = require('./nlp');
const cv = require('opencvjs-dist/build/opencv');
const excel = require('./excel');

// const aframe=require('aframe');
// Lab.base.loadFromLocal('kalidokit/dist/kalidokit.umd.js')

module.exports = {
    base: base,
    ui: new UI(),
    ai: new AI(),
    Anime:Anime,
    knn: new Knn(),
    video: video,
    DataGenerator: DataGenerator,
    FlexLayout: FlexLayout,
    Canvas: Canvas,
    Image: new Image(),
    Text: new Text(),
    Color: Color,
    Wordcloud: require('wordcloud'),
    DimensionsDb: DimensionsDb,
    clipboard: new Clipboard(),
    // gif功能
    GIF: GIF,
    screenpoint: screenpoint,
    // 轮廓
    shape: new Shape(),
    cv: cv,
    Store: Store,
    AppStore:AppStore,
    nlp: nlp,
    excel: excel,
    ML:require('ml/lib'),
    // aframe:aframe,
    Zdog:require('zdog'),
    tf:require('@tensorflow/tfjs')
};