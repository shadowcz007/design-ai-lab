const jieba = require('@node-rs/jieba');
class Nlp {
    //单例
    // static getInstance() {
    //     if (!Jieba.instance) {
    //         Jieba.instance = new Jieba();
    //     }
    //     return Jieba.instance;
    // }
    constructor() {
        try {
            jieba.load();
        } catch (error) {
            console.log(error);
        };
        // Object.keys(jieba).forEach(k => {
        //     if (k != 'load') this[k] = jieba[k];
        // });
        this.jieba=jieba;
    };


    //随机来一句话
    randomText() {}
}

module.exports = new Nlp();