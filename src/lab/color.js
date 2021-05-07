const colorThief = new(require('colorthief/dist/color-thief.umd'))();
const _Color = require('color');


class Color {
    constructor() {
        this.Color = _Color;
    }

    // rgb转字符串
    colorStr(c = [0, 0, 0]) {
            // console.log(c)
            return `rgb(${c.join(',')})`;
        }
        // 计算主色
        // mainColor
    getColor(_im) {
        return new Promise((resolve, reject) => {
            let color;
            try {
                if (_im.complete) {
                    color = colorThief.getColor(_im);
                    resolve(color);
                } else {
                    _im.addEventListener('load', () => {
                        color = colorThief.getColor(_im);
                        resolve(color);
                    });
                };
            } catch (error) {
                resolve(null);
            }

        });
    };
    getColorForP5(_img) {
        return new Promise((resolve, reject) => {
            //转为p5的元素类型
            _img = this.p5Image(_img);

            let _im = _img.elt;

            this.getColor(_im).then(color => {
                _img.mainColor = p5.instance.color(
                    this.colorStr(color)
                );
                resolve(_img);
            });
        })
    };


    // 计算色板
    // colorPalette
    getPalette(_img) {
        return new Promise((resolve, reject) => {
            //转为p5的元素类型
            _img = this.p5Image(_img);

            let _im = _img.elt;
            if (_im.complete) {
                _img.colorPalette = Array.from(
                    colorThief.getPalette(_im),
                    c => p5.instance.color(this.colorStr(c)));
                resolve(_img);
            } else {
                _im.addEventListener('load', function() {
                    _img.colorPalette = Array.from(
                        colorThief.getPalette(_im),
                        c => p5.instance.color(this.colorStr(c)));
                });
                resolve(_img);
            }
        });
    }
}

module.exports = Color;