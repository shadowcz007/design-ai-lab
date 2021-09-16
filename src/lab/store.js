/**
 * 存储到idb
 */

const IdbKvStore = require('idb-kv-store');

class Store {
    constructor(key) {
        this.init(key);
    }
    init(key = 'default') {
        this.db = new IdbKvStore(key);
        this.key = key;
    }
    set(id, data) {
        return new Promise((resolve, reject) => {
            id = id || (new Date()).getTime().toString();
            this.db.set(id, data, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }
    get(id){
        return new Promise((resolve, reject) => {
            this.db.get(id).then(res=>{
                resolve(res);
            })
        });
    }
    getJson() {
        return new Promise((resolve, reject) => {
            this.db.json().then(res => resolve(res));
        });
    }
    getValues() {
        return new Promise((resolve, reject) => {
            this.db.values().then(res => resolve(res));
        });
    }
    getKeys(){
        return new Promise((resolve, reject) => {
            this.db.keys().then(res => resolve(res));
        });
    }
    clear() {
        return new Promise((resolve, reject) => {
            this.db.clear().then(() => resolve(true));
        });
    }
    count() {
        return new Promise((resolve, reject) => {
            this.db.count().then(res => resolve(res));
        });
    }
}

module.exports = Store;