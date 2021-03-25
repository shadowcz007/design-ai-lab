const { remote } = require('electron');
const path = require('path');
const hash = require('object-hash');
const SpatialDb = require('spatial-db');

const dataPath = remote.getGlobal('_DBPATH');



// 多维数据库
class DimensionsData {
    constructor(name = 'dimensions-db', n = 5) {
        //create new spatial-db with 5 dimensions
        this.db = new SpatialDb(path.join(dataPath, name), n);
    }

}

module.exports = DimensionsData;