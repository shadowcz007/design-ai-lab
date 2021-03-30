const humanseg = require('@paddlejs-models/humanseg');
humanseg.load();


async function start(video) {
    const {
        data
    } = await humanseg.getGrayValue(video);
    const canvas = document.createElement('canvas');
    humanseg.drawHumanSeg(canvas, data);
    return toImg(canvas);
}

function toImg(canvas){
    let base64=canvas.toDataURL();
    let img=new Image();
    img.onload=()=>{

    }
    img.src=base64;
    return img;
};



module.exports = {
    humanseg,
    start
};