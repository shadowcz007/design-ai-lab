const humanseg = require('@paddlejs-models/humanseg');
humanseg.load();


async function start(video) {
    const {
        data
    } = await humanseg.getGrayValue(video);
    const canvas = document.createElement('canvas');
    humanseg.drawHumanSeg(canvas, data);
    let img = await toImg(canvas);
    return img;
}

function toImg(canvas) {
    return new Promise((resolve, reject) => {
        let base64 = canvas.toDataURL();
        let img = new Image();
        img.onload = () => {
            resolve(img);
        }
        img.src = base64;
    })
};



module.exports = {
    // humanseg,
    start
};