//主要完成html的一些基本的操作
// 文件存储


const hash = require('object-hash'), md5 = require('md5');
const fs = require('fs'),
    path = require('path');
const nativeImage = require('electron').nativeImage;


class Base {
    constructor() { }
    md5(str) {
        return md5(str)
    }

    hash(obj = {}) {
        return hash(obj);
    }
    // 
    sleep = m => new Promise(r => setTimeout(r, m));

    shuffle(arr) {
        let arrNew = [...arr];
        //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
        const randomsort = function (a, b) {
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


    /**
     * 异步加载一个js文件或css文件，并执行回调函数
     * @param  {String}    fileType   文件类型
     * @param  {String}    src        链接地址
     * @return {Boolean}    true / false 成功与否
     * loadFromUrl('js','http://cdn.bootcss.com/jquery/2.1.1/jquery.min.js');
     */
    loadFromUrl(fileType='js',src) {
        // 获取head节点
        let head = document.head || document.getElementsByTagName('head')[0];

        return new Promise((resolve, reject) => {
            // 需要加载js文件
            if (fileType === 'js') {
                // 创建script节点
                let script = document.createElement('script');
                script.type = 'text/javascript';
                // 设置script的src属性
                script.src = src;
                // 将script元素插入head元素中
                head.appendChild(script);

                // 监听script元素的onload和onreadystatechange事件
                script.onload = script.onreadystatechange = () => {
                    // 判断脚本是否加载完成
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        resolve(true);
                    }
                }

                // 监听onerror事件
                script.onerror = () => resolve(false);

                // 需要加载css文件
            } else if (fileType === 'css') {
                // 创建link节点
                let link = document.createElement('link');
                // 设置rel属性
                link.rel = 'stylesheet';
                // 设置type属性
                link.type = 'text/css';
                // 设置href属性
                link.href = src;
                // 将link节点插入head
                head.appendChild(link);

                // 监听link元素的onload事件
                link.onload = () => resolve(true);
                // 监听onerror事件
                link.onerror = () => resolve(false);

            }
        })


    }
}






module.exports = new Base();