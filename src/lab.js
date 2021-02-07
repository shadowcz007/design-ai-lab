//lab提供封装好的功能

const cv=require('opencvjs-dist/build/opencv');
const ColorThief = require('colorthief/dist/color-thief.umd');
const colorThief = new ColorThief();

const ffmpeg = require('./ffmpeg');


//主要完成html的一些基本的操作
class Base {
    constructor() {}

    //默认直接添加到gui里，类似于p5的逻辑，创建即添加
    add(dom){
        document.querySelector("#gui-main").appendChild(dom);
    }

    createButton(text,eventListener){
        let btn=document.createElement('button');
        btn.innerText=text;
        this.add(btn);
        if(eventListener) btn.addEventListener('click',eventListener);
        return {
            data:null,
            element:btn
        }
    }

    createInput(type,text="",isMultiple=false,eventListener=null){
        let fileExt=null,data=null;
        if(type==="img") {
            type="file";
            fileExt="image";
        };
        if(type==="text") type="text";
        if(type=="file"){
            type="file";
            fileExt="other";
        }
        let div=document.createElement('div');
        let p=document.createElement('p');
        p.innerText=text;

        let input=document.createElement('input');
        input.type=type;
        if(isMultiple===true) input.setAttribute('multiple','multiple');
        
        function eventFn(e){
            let res;
            if(type=='file'){

                if(isMultiple===true){
                    //多个文件

                }else{

                    //单个文件

                    let file=e.target.files[0];
                    //图片
                    if(fileExt==='image'&&file.type.match(fileExt)){
                        //转成base64存data
                        res= file.path;
                    };
                    //其他文件
                    if(fileExt=="other"){
                        res= file.path;
                    }
                }
                
            };
            //eventListener,处理input的结果
            if(eventListener) {
                res=eventListener(res);
            };
            input.setAttribute('data',res);
        }
        input.addEventListener('change',eventFn);

        div.appendChild(p);
        div.appendChild(input);

        this.add(div);
        return {
            data:()=>input.getAttribute('data'),
            element:div
        }
    }

    //创建canvas，返回ctx
    createCanvas(width,height,className,id){
        let canvas = document.createElement('canvas');
        if(className) canvas.className=className;
        if(id) canvas.id=id;
        canvas.width=width;
        canvas.height=height;
        this.add(canvas);
        return {
            element:canvas,
            data:null
        }
    }

    //创建由文本图片，返回base64
    createTextImage(txt, fontSize = 24, color = "black", width = 300) {
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        let x = 2;
        // canvas.width = 480;
        // canvas.height = 32;
        ctx.font = `${fontSize*x}px Arial`;
        let font = ctx.measureText(txt);
        canvas.height = (font.fontBoundingBoxAscent + font.fontBoundingBoxDescent) + 12;
        canvas.width = (font.width) + 10;

        ctx.fillStyle = color;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
        ctx.font = `${fontSize*x}px Arial`;
        ctx.fillText(txt, 5, 10);

        let base64, height;

        if (canvas.width > width) {
            let nc = document.createElement('canvas'),
                nctx = nc.getContext('2d');
            nc.width = width;
            nc.height = parseInt(canvas.height * width / canvas.width) + 1;
            nctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, nc.height);
            base64 = nc.toDataURL('image/png');
            height = nc.height;
        } else {
            base64 = canvas.toDataURL('image/png');
            height = canvas.height;
        };

        this.add(canvas);

        return {
            data:{ base64, width: width, height: height },
            element:canvas
        }
    }
    //创建图片，根据url返回图片dom
    createImage(url) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = url;
            _img.onload = function() {
                this.add(_img);
                resolve({
                    data:url,
                    element:_img
                });
            }
        })
    }
}

class AI {
    constructor() {}
    cropCanvas(_canvas, x, y, w, h) {
        let scale = _canvas.canvas.width / _canvas.width;
        let canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(_canvas.canvas, x * scale, y * scale, w * scale, h * scale, 0, 0, w * scale, h * scale);
        return canvas
    }
    getColor(_img) {
        let _im = _img.elt;
        if (_im.complete) {
            _img.mainColor = color(...colorThief.getColor(_im));
        } else {
            _im.addEventListener('load', function() {
                _img.mainColor = color(...colorThief.getColor(_im));
            });
        }
    };

    getPalette(_img) {
        let _im = _img.elt;
        if (_im.complete) {
            _img.colorPalette = Array.from(colorThief.getPalette(_im), c => color(...c));
        } else {
            _im.addEventListener('load', function() {
                _img.colorPalette = Array.from(colorThief.getPalette(_im), c => color(...c));
            });
        }
    }

    loadface(_img) {
        let _im = _img.elt;
        var faceDetector = new FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
        _img.faces = [];
        faceDetector.detect(_im).then(function(faces) {
            console.log(`人脸检测`, faces)
            faces.forEach(function(item) {

                _img.faces.push({
                    x: parseInt(item.boundingBox.x),
                    y: parseInt(item.boundingBox.y),
                    width: parseInt(item.boundingBox.width),
                    height: parseInt(item.boundingBox.height)
                });
            });
        }).catch(function(err) {
            console.log("err", err)
        });
    };

    loadtext(_img) {
        let _im = _img.elt;
        let textDetector = new TextDetector();
        _img.textBlocks = [];
        textDetector.detect(_im)
            .then(detectedTextBlocks => {
                console.log(`文本检测`, detectedTextBlocks)
                for (const textBlock of detectedTextBlocks) {
                    _img.textBlocks.push({
                        x: textBlock.boundingBox.x,
                        y: textBlock.boundingBox.y,
                        width: textBlock.boundingBox.width,
                        height: textBlock.boundingBox.height
                    });
                }
            }).catch(() => {
                console.error("Text Detection failed, boo.");
            })
    }
}



module.exports = {
    Lab:{
        base: new Base(),
        ai: new AI(),
        video: ffmpeg
    },
    cv:cv
};