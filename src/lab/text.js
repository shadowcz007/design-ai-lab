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
}

module.exports = Text;