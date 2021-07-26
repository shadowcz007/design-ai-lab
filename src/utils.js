const fs = require('fs'),
    path = require('path');
const mineType = require('mime-types');


// 读取文件夹下的所有文件路径 及 文件后缀
function loadDirFiles(dirname) {
    // let dirname = data.data || path.join(__dirname, '../examples');
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, 'utf-8', (err, files) => {
            files = Array.from(files, f => {
                return {
                    dirname: dirname,
                    filepath: path.join(dirname, f),
                    filename: f,
                    extname: path.extname(f)
                }
            });
            resolve(files);
        });
    });
}

function readJsonSync(filepath) {
    let res = fs.readFileSync(filepath, 'utf-8');
    try {
        res = JSON.parse(res);
    } catch (error) {
        res = {};
    };
    return res
}

function readFileSync(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
}

function writeFileSync(filepath, data) {
    return fs.writeFileSync(filepath, data, 'utf-8');
}

function mkdirSync(filepath) {
    return fs.mkdirSync(filepath)
}

function readImageToBase64(filePath) {
    if (!fs.existsSync(filePath)) return;
    let data = fs.readFileSync(filePath);
    data = Buffer.from(data).toString('base64');
    return 'data:' + mineType.lookup(filePath) + ';base64,' + data;
}

function writeImageFromBase64(filePath, base64) {
    let base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFileSync(filePath, dataBuffer);
    return
}

function timeoutPromise(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(false);
        }, timeout);
    });
}

function checkURLIsOk(url) {

    let requestPromise = (url) => {
        return fetch(url);
    };

    return new Promise((resolve, reject) => {
        Promise.race([timeoutPromise(1000), requestPromise(url)])
            .then(res => {
                if (res) res = res.ok;
                resolve(res);
            })
            .catch(err => {
                resolve(false);
            });
    });
}



module.exports = {
    checkURLIsOk,
    loadDirFiles,
    readJsonSync,
    readFileSync,
    readImageToBase64,
    writeImageFromBase64,
    mkdirSync,
    writeFileSync,
    timeoutPromise
};