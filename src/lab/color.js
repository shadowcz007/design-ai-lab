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
    getColor(_im,quality=10) {
        return new Promise((resolve, reject) => {
            let color;
            try {
                if (_im.complete) {
                    color = colorThief.getColor(_im,quality);
                    resolve(color);
                } else {
                    _im.addEventListener('load', () => {
                        color = colorThief.getColor(_im,quality);
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
    getPalette(_im,num=3) {
        let color;
        return new Promise((resolve, reject) => {
            try {
                if (_im.complete) {
                    color = colorThief.getPalette(_im,num);
                    resolve(color);
                } else {
                    _im.addEventListener('load', function () {
                        color = colorThief.getPalette(_im,num);
                        resolve(color);
                    });
                };
            } catch (error) {
                resolve(null);
            }

        });
    }

    getPaletteForP5(_img) {
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
                _im.addEventListener('load', function () {
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