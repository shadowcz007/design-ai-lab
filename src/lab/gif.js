const _GIF = require('gif.js/dist/gif');
// const fs = require('fs');
const base = require('./base');
const image = new (require('./image'));

const { parseGIF, decompressFrames } = require('gifuct-js');

class GIF {
    constructor(transparent=null) {
        // transparent hex color, 0x00FF00 = green
        this.gif = new _GIF({
            workers: 4,
            quality: 10,
            background: 'rgba(0,0,0,0)',
            transparent: transparent,
            // dither:'FloydSteinberg',
            workerScript: path.join(__dirname, '../../node_modules/gif.js/dist/gif.worker.js')
        });
    }
    // canvasElement imageElement
    add(elt, fps = 10) {
        this.gif.addFrame(elt, {
            delay: 1000 / fps,
            copy: true
        });
    }

    async createGifFromUrls(urls = [], fps = 12) {
        // let ctx;
        for (const url of urls) {
            let im = await image.createImage(url);
            this.add(im,fps);
        };
        let res = await this.render();
        return res;
    }

    // 从文件夹创建 gif
    async addFromDir(fileDir, scaleSeed = 1, fps = 10) {
        let files = base.readdirSync(fileDir);
        let tempCanvas, tempCtx;

        for (const f of files) {
            let im = await image.scaleImage(f, scaleSeed);

            if (im && im.complete) {
                if (!tempCanvas) {
                    tempCanvas = image.createCanvasFromImage(im);
                    tempCtx = tempCanvas.getContext('2d');
                };
                tempCtx.drawImage(im, 0, 0);
                let newIm = await image.createImage(tempCanvas.toDataURL());
                // gif.addFrame(tempCtx, {copy: true});
                this.add(newIm, fps);
            };
        };
        return
    }
    render() {
        return new Promise((resolve, reject) => {
            this.gif.on('finished', function (blob) {
                resolve(URL.createObjectURL(blob));
            });
            this.gif.render();
        });
    }

    download(url,name='design-ai-lab.gif'){
        let a=document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
    }

    parseGIF = (url) => {
        return new Promise((resolve, reject) => {
            let tempCanvas = document.createElement('canvas');
            var tempCtx = tempCanvas.getContext('2d');
            // full gif canvas
            var gifCanvas = document.createElement('canvas')
            var gifCtx = gifCanvas.getContext('2d')

            fetch(url)
                .then(resp => resp.arrayBuffer())
                .then(buff => parseGIF(buff))
                .then(gif => decompressFrames(gif, true))
                .then(frames => {
                    tempCanvas.width = frames[0].dims.width;
                    tempCanvas.height = frames[0].dims.height;
                    gifCanvas.width = frames[0].dims.width;
                    gifCanvas.height = frames[0].dims.height;

                    frames = Array.from(frames, f => {
                        console.log(f)
                        let c = document.createElement('canvas');
                        c.width = f.dims.width;
                        c.height = f.dims.height;
                        let imgData = new ImageData(f.patch, c.width, c.height);
                        tempCtx.putImageData(imgData, 0, 0);
                        gifCtx.drawImage(tempCanvas, f.dims.left, f.dims.top);

                        c.getContext('2d').drawImage(gifCanvas, 0, 0);

                        return c
                    });
                    resolve(frames);
                })
        })

    };
}

module.exports = GIF;