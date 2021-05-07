const _GIF = require('gif.js/dist/gif');
const { parseGIF, decompressFrames } = require('gifuct-js');

class GIF {
    constructor() {
            this.gif = new _GIF({
                workers: 4,
                quality: 10,
                background: 'rgba(0,0,0,0)',
                transparent: 'rgba(0,0,0,0)',
                workerScript: path.join(__dirname, '../node_modules/gif.js/dist/gif.worker.js')
            });
        }
        // canvasElement imageElement
    add(elt, fps = 10) {
        this.gif.addFrame(elt, {
            delay: 1000 / fps
        });
    }

    createImage(url) {
        return new Promise((resolve, reject) => {
            let _img = new Image();
            _img.src = url;
            _img.className = 'opacity-background';
            _img.onload = function() {
                resolve(_img);
            }
            _img.onerror = function() {
                resolve(null);
            }
        })
    }

    // 从文件夹创建 gif
    async addFromDir(fileDir, fps = 10) {
        let files = fs.readdirSync(fileDir);

        for (const f of files) {
            let im = await this.createImage(path.join(fileDir, f));
            if (im && im.complete) this.add(im, fps);
        };

        return
    }
    render() {
        return new Promise((resolve, reject) => {
            this.gif.on('finished', function(blob) {
                resolve(URL.createObjectURL(blob));
            });
            this.gif.render();
        });
    }


    parseGIF = (url) => {
        return new Promise((resolve, reject) => {
            let tempCanvas = document.createElement('canvas');
            var tempCtx = tempCanvas.getContext('2d')
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