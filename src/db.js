/**
 * 用来保存未保存的文件的
 * TODO 待改造 
 */
const { remote } = require('electron');
const hash = require('object-hash');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(remote.getGlobal('_DBPATH'));
const db = low(adapter);
db.defaults({ posts: [] })
    .write();

const key = "posts";

function id(id) {
    return hash(id);
}

function removeById(id) {
    return db.get(key)
        .remove({ id })
        .write()
}

function add(data) {
    delete data.create_time;
    let poster = data.poster;
    delete data.poster;
    delete data.id;
    // console.log(data)
    data = Object.assign(data, {
        id: hash(data),
        poster: poster,
        create_time: (new Date()).getTime()
    });

    // console.log(db.get(key).find({id:data.id}).value())
    if (!db.get(key).find({ id: data.id }).value()) {
        db.get(key)
            .push(data)
            .write()
    } else {
        db.get(key)
            .find({ id: data.id })
            .assign({ create_time: data.create_time })
            .write()
    };

}

function getAll() {
    return db.get(key)
        .sortBy('create_time')
        .reverse()
        .take(10)
        .value()
}


function removeAll() {
    Array.from(db.get(key)
        .value(), v => {
            db.get(key)
                .remove(v)
                .write()
        });
}

module.exports = {
    id,
    add,
    getAll,
    removeById,
    removeAll
}