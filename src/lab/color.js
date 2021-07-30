const colorThief = new (require('colorthief/dist/color-thief.umd'))();
let _Color = require('color');

class Color extends _Color {
    // constructor(arg) {
    //     super(arg);
    //     this.Color = this;
    // }

    // rgb转字符串
    colorStr(c = [0, 0, 0]) {
        // console.log(c)
        return `rgb(${c.join(',')})`;
    }
    // 计算主色
    // mainColor
    getColor(_im, quality = 10) {
        return new Promise((resolve, reject) => {
            let color;
            try {
                if (_im.complete === true) {
                    color = colorThief.getColor(_im, quality);
                    resolve(color);
                } else {
                    _im.addEventListener('load', () => {
                        color = colorThief.getColor(_im, quality);
                        resolve(color);
                    });
                };
            } catch (error) {
                resolve(null);
            }

        });
    };

    // 计算色板
    // colorPalette
    getPalette(_im, num = 3) {
        let color;
        return new Promise((resolve, reject) => {
            try {
                if (_im.complete) {
                    color = colorThief.getPalette(_im, num);
                    resolve(color);
                } else {
                    _im.addEventListener('load', function () {
                        color = colorThief.getPalette(_im, num);
                        resolve(color);
                    });
                };
            } catch (error) {
                // console.log(error)
                resolve(null);
            }

        });
    }


}



module.exports = Color;