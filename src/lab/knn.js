const tf = require('@tensorflow/tfjs');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const Store = require('./store');

class Knn {
    constructor() {
        this.knn = knnClassifier.create();
        this.topk = 3;
    }

    // 得到id
    getKey(key) {
        return `knn_${key}`;
    }

    // 统计各标签的样本数
    count() {
            return this.knn.getClassExampleCount();
        }
        // 其他标签的样本数控制为最小的样本数
    async minDataset() {
        let c = this.count();
        let min = null;
        for (const label in c) {
            if (min == null || (min && min >= c[label])) min = c[label];
        };

        let dataset = this.knn.getClassifierDataset();
        var datasetObj = {};
        for (const key in dataset) {
            let data = dataset[key].arraySync();
            data = tf.data.array(data).shuffle(data.length);
            datasetObj[key] = tf.tensor(await data.take(min).toArray());
        }
        // console.log(datasetObj)
        this.knn.clearAllClasses();
        this.knn.setClassifierDataset(datasetObj);
    }

    add(tensor, className) {
        if (!(tensor instanceof tf.Tensor)) tensor = tf.tensor(tensor);
        // console.log('+===', tensor instanceof tf.Tensor)
        this.knn.addExample(tensor, className);
    }

    train(tensors = [], classNames = []) {
            for (let index = 0; index < tensors.length; index++) {
                const t = tensors[index];
                this.add(t, classNames[index]);
            }
        }
        // 图片转tensor
        // img2tensor(img){
        //     if (!(img instanceof tf.Tensor)) {
        //         img = tf.browser.fromPixels(img);
        //     }
        //     return img
        // }
    async predict(tensor, topk = null) {
        if (Object.keys(this.count()).length === 0) return;
        if (!(tensor instanceof tf.Tensor)) tensor = tf.tensor(tensor);
        return await this.knn.predictClass(tensor, topk || this.topk);
    }

    load(dataset = "") {
        try {
            var tensorObj = JSON.parse(dataset);
            Object.keys(tensorObj).forEach((key) => {
                tensorObj[key] = tf.tensor(tensorObj[key].tensor, tensorObj[key].shape, tensorObj[key].tensor.dtype);
            });
            //需要清空knn
            this.knn.clearAllClasses();
            this.knn.setClassifierDataset(tensorObj);

            return true
        } catch (error) {
            return false
        }
    }
    export () {
        let dataset = this.knn.getClassifierDataset();
        var datasetObj = {};
        Object.keys(dataset).forEach((key) => {
            let data = dataset[key].dataSync();
            var shape = dataset[key].shape,
                dtype = dataset[key].dtype;
            datasetObj[key] = {
                tensor: Array.from(data),
                shape: shape,
                dtype: dtype
            };
        });

        let jsonModel = JSON.stringify(datasetObj)
            //localStorage.setItem("easyteach_model",jsonModel);
        return jsonModel;
    }
    // 缓存模型
    save(key) {
            key = this.getKey(key);
            let store = new Store(key);
            store.set(key, this.export());
        }
        // 从缓存加载模型 
    async loadFromStore(key) {
        key = this.getKey(key);
        let store = new Store(key);
        return new Promise((resolve, reject) => {
            store.getJson().then(res => {
                // console.log(res[key])
                this.load(res[key]);
                resolve(res[key]);
            })
        })
    }
    clearStore(key) {
        key = this.getKey(key);
        let store = new Store(key);
        store.clear();
    }
}

module.exports = Knn;