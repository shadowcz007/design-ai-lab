const {remote}=require('electron');
const hash = require('object-hash');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(remote.getGlobal('_DBPATH'));
const db = low(adapter);
db.defaults({ posts: [] })
    .write();

const key="posts";

function add(data) {
    data=Object.assign({
        id:hash(data),
        createDate:(new Date()).getTime()
    },data);
    
    // console.log(db.get(key).find({id:data.id}).value())
    if(!db.get(key).find({id:data.id}).value()){
        db.get(key)
        .push(data)
        .write()
    }else{
        db.get(key)
        .find({id:data.id})
        .assign({ createDate:data.createDate})
        .write()
    };
    
}

function getAll() {
    return db.get(key)
        .sortBy('createDate')
        .take(10)
        .value()
}


function removeAll(){
    Array.from(db.get(key)
        .value(),v=>{
            db.get(key)
                .remove(v)
                .write()
        });
}

module.exports = {
    add,
    getAll,
    removeAll
}