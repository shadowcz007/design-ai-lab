// console.log(__dirname)
const colorThief = new(require('../../lib/color-thief.umd.js'))();
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
                    _im.addEventListener('load', function() {
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

    getInitPaletteList(){
        return [
            [
            [13, 43, 69],
            [32, 60, 86],
            [84, 78, 104],
            [141, 105, 122],
            [208, 129, 89],
            [255, 170, 94],
            [255, 212, 163],
            [255, 236, 214],
            ],
            [
            [48, 0, 48],
            [96, 40, 120],
            [248, 144, 32],
            [248, 240, 136],
            ],
            [
            [26, 28, 44],
            [93, 39, 93],
            [177, 62, 83],
            [239, 125, 87],
            [255, 205, 117],
            [167, 240, 112],
            [56, 183, 100],
            [37, 113, 121],
            [41, 54, 111],
            [59, 93, 201],
            [65, 166, 246],
            [115, 239, 247],
            [244, 244, 244],
            [148, 176, 194],
            [86, 108, 134],
            [51, 60, 87],
            ],
            [
            [44, 33, 55],
            [118, 68, 98],
            [237, 180, 161],
            [169, 104, 104],
            ],
            [
            [7, 5, 5],
            [33, 25, 25],
            [82, 58, 42],
            [138, 107, 62],
            [193, 156, 77],
            [234, 219, 116],
            [160, 179, 53],
            [83, 124, 68],
            [66, 60, 86],
            [89, 111, 175],
            [107, 185, 182],
            [251, 250, 249],
            [184, 170, 176],
            [121, 112, 126],
            [148, 91, 40],
            ],
            [
            [140, 143, 174],
            [88, 69, 99],
            [62, 33, 55],
            [154, 99, 72],
            [215, 155, 125],
            [245, 237, 186],
            [192, 199, 65],
            [100, 125, 52],
            [228, 148, 58],
            [157, 48, 59],
            [210, 100, 113],
            [112, 55, 127],
            [126, 196, 193],
            [52, 133, 157],
            [23, 67, 75],
            [31, 14, 28],
            ],
            [
            [94, 96, 110],
            [34, 52, 209],
            [12, 126, 69],
            [68, 170, 204],
            [138, 54, 34],
            [235, 138, 96],
            [0, 0, 0],
            [92, 46, 120],
            [226, 61, 105],
            [170, 92, 61],
            [255, 217, 63],
            [181, 181, 181],
            [255, 255, 255],
            ],
            [
            [21, 25, 26],
            [138, 76, 88],
            [217, 98, 117],
            [230, 184, 193],
            [69, 107, 115],
            [75, 151, 166],
            [165, 189, 194],
            [255, 245, 247],
            ],
        ];
    }

}



module.exports = Color;