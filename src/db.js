const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter);
db.defaults({ posts: [] })
    .write();

function add(data) {
    db.get('posts')
        .push(data)
        .write()
}

function getAll() {
    return db.get('posts')
        .take(5)
        .value()
}

module.exports = {
    add,
    getAll
}