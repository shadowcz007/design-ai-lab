const P5 = require('./p5');

class Text {

    // 文本检测
    getText(_im) {
        let textDetector = new TextDetector();
        let textBlocksRes = [];

        return new Promise((resolve, reject) => {
            textDetector.detect(_im)
                .then(detectedTextBlocks => {
                    // console.log(`文本检测`, detectedTextBlocks)
                    for (const textBlock of detectedTextBlocks) {
                        textBlocksRes.push({
                            x: textBlock.boundingBox.x,
                            y: textBlock.boundingBox.y,
                            width: textBlock.boundingBox.width,
                            height: textBlock.boundingBox.height
                        });
                    };
                    resolve(textBlocksRes)
                }).catch(e => {
                    console.error("Text Detection failed, boo.");
                    reject(e);
                });
        });
    }
    getTextForP5(_img) {
        //转为p5的元素类型
        _img = P5.p5Image(_img);
        let _im = _img.elt;
        return new Promise((resolve, reject) => {
            this.getText(_im).then(res => {
                _img.textBlocks = res;
                resolve(_img);
            });
        });
    }

}

module.exports = Text;