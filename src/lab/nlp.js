const jieba = require('@node-rs/jieba');
const natural = require('natural');

class Nlp {
    //单例
    // static getInstance() {
    //     if (!Jieba.instance) {
    //         Jieba.instance = new Jieba();
    //     }
    //     return Jieba.instance;
    // }
    constructor() {
        
        // Object.keys(jieba).forEach(k => {
        //     if (k != 'load') this[k] = jieba[k];
        // });
        
        try {
            jieba.load();
        } catch (error) {
            console.log(error);
        };

        this.jieba=jieba;
        this.natural=natural;

    };

    //随机来一句话
    randomText() {}

    // 分类
    bayesClassifier(items=[]){
        let classifier = new natural.BayesClassifier();
        Array.from(items,i=>{
            classifier.addDocument(i.text,i.label);
        });
        classifier.train();

        classifier.events.on('trainedWithDocument', function (obj) {
            console.log(obj);
            /* {
            *   total: 23 // There are 23 total documents being trained against
            *   index: 12 // The index/number of the document that's just been trained against
            *   doc: {...} // The document that has just been indexed
            *  }
            */
         });

        return classifier;
    }

    ngrams(){
        let NGramsZH = natural.NGramsZH;
        console.log(NGramsZH.ngrams('一个中文测试', 4));
        console.log(NGramsZH.ngrams(['一', '个', '中', '文', '测',
            '试'], 4));
    }
}

module.exports = new Nlp();