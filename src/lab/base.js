//主要完成html的一些基本的操作
// 文件存储


const hash = require('object-hash'),md5=require('md5');
const fs = require('fs'),
    path = require('path');
const nativeImage = require('electron').nativeImage;


class Base {
    constructor() {}
    md5(str){
        return md5(str)
    }

    hash(obj = {}) {
            return hash(obj);
        }
        // 
    sleep = m => new Promise(r => setTimeout(r, m));

    shuffle(arr) {
        let arrNew=[...arr];
        //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
        const randomsort = function(a, b) {
                return Math.random() > .5 ? -1 : 1;
            }
            // var arr = [1, 2, 3, 4, 5];
        return arrNew.sort(randomsort);
    }



    // toast

    //笛卡尔积 
    cartesian(arr) {
        if (arr.length < 2) return arr[0] || [];
        return [].reduce.call(arr, (col, set) => {
            let res = [];
            col.forEach(c => {
                set.forEach(s => {
                    let t = [].concat(Array.isArray(c) ? c : [c]);
                    t.push(s);
                    res.push(t);
                })
            });
            return res;
        });
    }

    // arraybuffer转buffer
    arrayBuffer2Buffer(ab) {
        var buf = new Buffer(ab.byteLength);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            buf[i] = view[i];
        }
        return buf;
    };


    // 直接保存base64 为本地文件
    saveBase64(base64, filepath = null) {
            if (filepath) {
                let img = nativeImage.createFromDataURL(base64);
                let extname = path.extname(filepath);
                // console.log(filepath, extname)
                if (extname.toLowerCase() === '.jpg' || extname.toLowerCase() === '.jpeg') {
                    fs.writeFileSync(filepath, img.toJPEG(80));
                } else {
                    fs.writeFileSync(filepath, img.toPNG());
                };
            }
        }
        // 直接保存json 为本地文件
    saveJson(json, filepath = null) {
        if (filepath) {
            json = JSON.stringify(json);
            try {
                fs.writeFile(filepath, json, e => console.log(e));
            } catch (error) {
                console.log(error)
            }
        };
    }

    readdirSync(fileDir) {
        let files = fs.readdirSync(fileDir);
        return Array.from(files, f => path.join(fileDir, f));
    }
}

module.exports = new Base();