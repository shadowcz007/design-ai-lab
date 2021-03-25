/**
 * 用来保存未保存的文件的
 * TODO 待改造 
 */
const { remote } = require('electron');
const path = require('path');
const hash = require('object-hash');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dataPath = remote.getGlobal('_DBPATH');


class FileDb {
    constructor() {
        const adapter = new FileSync(path.join(dataPath, "db.json"));
        this.db = low(adapter);
        this.db.defaults({ posts: [] })
            .write();
        this.key = "posts";
    }

    id(data) {
        return hash(data);
    }

    // 删除文件
    fileRemoveById(id) {
        return this.db.get(this.key)
            .remove({ id })
            .write()
    }

    // 添加文件
    fileAdd(data) {
        delete data.create_time;
        let poster = data.poster;
        delete data.poster;
        delete data.id;
        // console.log(data)
        data = Object.assign(data, {
            id: this.id(data),
            poster: poster,
            create_time: (new Date()).getTime()
        });

        // console.log(db.get(key).find({id:data.id}).value())
        if (!this.db.get(this.key).find({ id: data.id }).value()) {
            this.db.get(this.key)
                .push(data)
                .write()
        } else {
            this.db.get(this.key)
                .find({ id: data.id })
                .assign({ create_time: data.create_time })
                .write()
        };

    }

    fileGetAll() {
        return this.db.get(this.key)
            .sortBy('create_time')
            .reverse()
            .take(10)
            .value()
    }


    fileRemoveAll() {
        Array.from(this.db.get(this.key)
            .value(), v => {
                this.db.get(this.key)
                    .remove(v)
                    .write()
            });
    }
}


// console.log(dataPath)

module.exports = new FileDb();