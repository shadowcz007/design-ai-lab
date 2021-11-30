const _GIF = require('gif.js/dist/gif');
// const fs = require('fs');
const base = require('./base');
const image = new (require('./image'));
const Anime=require('./anime');
const { parseGIF, decompressFrames } = require('gifuct-js');

class GIF {
    // TODO 合成透明底的 有bug
    constructor(transparent = null, background = 0xFFFFFF) {
        // transparent hex color, 0x00FF00 = green
        // background 当背景是透明色时，默认填充的背景色，不支持透明度
        let opts = {
            workers: 6,
            quality: 10,
            // dither:'FloydSteinberg',
            workerScript: path.join(__dirname, '../../node_modules/gif.js/dist/gif.worker.js')
        };
        if (transparent) opts.transparent = 0x00FF00;
        if (background) opts.background = background;
        this.gif = new _GIF(opts);
    }
   
    // canvasElement imageElement
    add(elt, fps = 10, copy = true) {
        this.gif.addFrame(elt, {
            delay: 1000 / fps,
            copy: copy
        });
    }

    count(){
        return this.gif.frames.length
    }

    async createGifFromUrls(urls = [], fps = 12, copy = true) {
        // let ctx;
        for (const url of urls) {
            let im = await image.createImage(url);
            this.add(im, fps, copy);
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

    // 是否以base64返回
    render(isBase64 = true) {
        return new Promise((resolve, reject) => {
            this.gif.on('finished', async blob => {
                let url = URL.createObjectURL(blob);
                if (isBase64) {
                    url = await image.getNativeImageFromWebview2(url);
                };
                this.gif.abort();
                resolve(url);
            });
            this.gif.render();
        });
    }

    download(url, name = 'design-ai-lab.gif') {
        let a = document.createElement('a');
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
                    // console.log(frames)
                    let delays = 0;
                    frames = Array.from(frames, f => {
                        delays += f.delay;
                        let c = document.createElement('canvas');
                        c.width = f.dims.width;
                        c.height = f.dims.height;
                        let imgData = new ImageData(f.patch, c.width, c.height);
                        tempCtx.putImageData(imgData, 0, 0);
                        gifCtx.drawImage(tempCanvas, f.dims.left, f.dims.top);

                        c.getContext('2d').drawImage(gifCanvas, 0, 0);

                        return c
                    });
                    resolve({
                        frames,
                        fps: parseInt(frames.length * 1000 / delays)
                    });
                })
        })

    }

    createFromCtx(width = 300, height = 300, parameters, from = {}, to = {}, ctxFn, previewCanvas=null) {

        let { duration, delay, endDelay, round, easing } = parameters;
        duration = duration || 1000;
        delay = delay || 0;
        endDelay = endDelay || 0;
        round = round || 0;
        easing = easing || 'linear';

        let data = {...from };

        (new Anime()).init();

        if(previewCanvas){
            previewCanvas.width=width;
            previewCanvas.height=height;
            let ctx =previewCanvas.getContext('2d');
            let res = [];
            return new Promise((resolve, reject) => {
                anime({
                    targets: data,
                    ...to,
                    duration: duration,
                    delay: delay,
                    endDelay: endDelay,
                    round: round,
                    easing: easing,
                    update: () => {
                        if (ctxFn) ctxFn(ctx, {...data});
                        // console.log(data)
                        res.push({...data });
                    },
                    complete: anim => {
                        resolve(res);
                    }
                });
            });
        }else{
            const animeRes = () => {
                        let res = [];
                        return new Promise((resolve, reject) => {
                            anime({
                                targets: data,
                                ...to,
                                duration: duration,
                                delay: delay,
                                endDelay: endDelay,
                                round: round,
                                easing: easing,
                                begin: anim => {
                                    res = [];
                                },
                                update: () => {
                                    res.push({...data });
                                },
                                complete: anim => {
                                    resolve(res);
                                }
                            });
                        });

                    };

        return new Promise((resolve, reject) => {

            animeRes().then(async res => {
                
                    let canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    let ctx =canvas.getContext('2d');

                    let frames = [];
                    for (const data of res) {
                        if (ctxFn) ctxFn(ctx, data);
                        frames.push(canvas.toDataURL());
                    };
                    
                    let base64 = await this.createGifFromUrls(frames, frames.length / (0.001 * duration), false);
                    resolve(base64);
                
            })
        });
        }
    }
    createFromAnimeData(width = 300, height = 300,duration=1000, data=[], ctxFn){
        return new Promise(async (resolve, reject) => {
                let canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                let ctx =canvas.getContext('2d');
                let frames = [];
                for (const d of data) {
                    if (ctxFn) ctxFn(ctx, d);
                    frames.push(canvas.toDataURL());
                };
                let base64 = await this.createGifFromUrls(frames, frames.length / (0.001 * duration), false);
                resolve(base64);
        });
    }
}

module.exports = GIF;