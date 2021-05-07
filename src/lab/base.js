//主要完成html的一些基本的操作


const hash = require('object-hash');

class Base {
    constructor() {



    }


    hash(obj = {}) {
            return hash(obj);
        }
        // 
    sleep = m => new Promise(r => setTimeout(r, m));

    shuffle(arr) {
        //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
        const randomsort = function(a, b) {
                return Math.random() > .5 ? -1 : 1;
            }
            // var arr = [1, 2, 3, 4, 5];
        return arr.sort(randomsort);
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

}

module.exports = Base;