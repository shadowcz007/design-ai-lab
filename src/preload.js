class AI {
    constructor() {}

    loadImage(url) {
        return new Promise((resolve, reject) => {
            var image = new Image();
            image.src = url;
            image.onload = function() {
                resolve(image)
            }
        })
    }

    loadface(ctx) {
        var faceDetector = new FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
        faceDetector.detect(ctx.canvas).then(function(faces) {
            console.log(`人脸检测`, faces)
            faces.forEach(function(item) {
                createCanvas(
                    item.boundingBox.x,
                    item.boundingBox.y,
                    item.boundingBox.width,
                    item.boundingBox.height,
                    ctx.canvas);
            })
        }).catch(function(err) {
            console.log("err", err)
        });
    };

    loadtext(ctx) {
        let textDetector = new TextDetector();
        textDetector.detect(ctx.canvas)
            .then(detectedTextBlocks => {
                console.log(`文本检测`, detectedTextBlocks)
                for (const textBlock of detectedTextBlocks) {
                    createCanvas(
                        textBlock.boundingBox.x,
                        textBlock.boundingBox.y,
                        textBlock.boundingBox.width,
                        textBlock.boundingBox.height,
                        ctx.canvas);
                }
            }).catch(() => {
                console.error("Text Detection failed, boo.");
            })
    }


    createCanvas(x, y, width, height, imageCanvas) {
        let iCtx = imageCanvas.getContext('2d');
        iCtx.strokeStyle = "red";
        iCtx.lineWidth = 10;
        iCtx.strokeRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
        // ctx.clearRect(0,0,width,height);
        return imageCanvas
    }


}

// window.loadImage=loadImage;
window.AI = new AI();