/***
 * 仅支持 比例不变的素材合成
 */

const fs = require("fs"),
    path = require('path');

// const Jimp = require('jimp');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// const { remote } = require("electron");
// const dialog = remote.dialog;
// const fontPath=path.join(__dirname,'../lib/zkyyt/W02.ttf');
// // console.log(fontPath)
// Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
//     console.log(font)
// });



class FF {
    constructor(newDirname) {
        let args = [...arguments];
        // newDirname 新的导出路径 ，当设置的时候，将把文件导出到这个路径
        this.newDirname = newDirname || args[0] || null;
        this.ffmpeg = ffmpeg;
        this.videoCodec = 'libx264';
    }

    // 创建导出的文件路径
    /**
     * 
     * @param {*} inputPath 
     * @param {*} type 
     * @param {*} hardExtname 
     * 
     * createOutputPath('/xxxx/test/one.png','test','.mp4')
        {
            basename: "one.png"
            dirname: "/xxxx/test"
            extname: ".png"
            output: "/xxxx/test/one_test.mp4"
        }
     */
    createOutputPath(inputPath, type = 'resize', hardExtname = '.mp4') {
        if (inputPath) {
            let dirname = this.newDirname || path.dirname(inputPath),
                basename = path.basename(inputPath),
                extname = path.extname(inputPath);
            return {
                output: path.join(dirname, basename.replace(extname, "") + `_${type}` + (hardExtname || extname)),
                dirname,
                basename,
                extname
            }
        }

    }


    //按照编号从小到大排序
    sortFiles(filePath) {
        let files = fs.readdirSync(filePath);
        files = Array.from(files, f => {
            return {
                index: parseInt(f.replace(/\.*/, "")),
                filename: path.join(filePath, f)
            }
        }).sort((b, a) => b.index - a.index);

        return Array.from(files, f => f.filename)
    }


    //删除目录/文件
    deleteFile(filePath) {
        let isExist = fs.existsSync(filePath);
        if (!isExist) return;
        try {
            let files = fs.readdirSync(filePath);
            files.forEach(f => fs.unlinkSync(path.join(filePath, f)));
            fs.rmdirSync(filePath);
        } catch (error) {
            fs.unlinkSync(filePath);
        };
        // console.log('删除:', filePath)
    };

    // 映射文件格式
    getFileType(formatName = null) {
        if (formatName === null) return;
        if (formatName.match("webp")) return 'webp';
        if (formatName.match("image") || formatName.match('png')) return 'img';
        if (Array.from(['mov', 'm4v', 'avi', 'mkv', 'mp4'], t => formatName.match(t) ? 1 : null).filter(f => f).length > 0) return "video";
        if (Array.from(['mp3'], t => formatName.match(t) ? 1 : null).filter(f => f).length > 0) return "audio";
        if (Array.from(['gif'], t => formatName.match(t) ? 1 : null).filter(f => f).length > 0) return "gif";
    }

    // get the video duration
    getMediaDurationAndType(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (_err, metadata) => {
                if (_err === null) {
                    // console.log('===', metadata)
                    // img、video、audio
                    let t = this.getFileType(metadata.format.format_name);
                    let stream = Array.from(metadata.streams, s => {
                        if (s.codec_name === t || s.codec_type === t) return s;
                    }).filter(s => s)[0] || {};
                    resolve({
                        // 秒
                        duration: metadata.format.duration,
                        type: t,
                        width: stream.width,
                        height: stream.height,
                        frame_rate: eval(stream.avg_frame_rate),
                        codec_name: stream.codec_name
                    });
                } else {
                    reject(_err);
                }
            });
        });
    }

    /**
     * 图片如果是png，需要自行把背景改成其他颜色后传入； 图片的尺寸需提前计算好；
     * jpg 成功。。png不行
     * @param {*} inputPath 
     * @param {*} size 宽x高
     * @param {*} progressFn 
     * @param {*} loop 
     * @param {*} format 
     * @param {*} fps 
     */
    singleImg2video(inputPath, size = '480x480', loop = 5, progressFn, format = 'mp4', fps = 24) {

        let { output } = this.createOutputPath(inputPath, 'imvideo', '.' + format);

        let r = ffmpeg(inputPath)
            .videoCodec(this.videoCodec)
            //  libx264
            .format(format)
            .size(size)
            // .aspect(200/100)
            // .aspect(aspect)
            .autoPad(false)
            .loop(loop);

        return new Promise((resolve, reject) => {
            r.outputFps(fps)
                .output(output)
                .on('progress', function(progress) {
                    if (progressFn) {
                        progressFn(progress.frames / (fps * loop))
                    } else {
                        console.log(progress.frames / (fps * loop));
                    };
                })
                .on('end', function() {
                    resolve(output);
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }

    // imgResize(inputPath, size = '480x480',format='jpg'){
    //     let { output } = this.createOutputPath(inputPath, 'resize', '.' + format);

    //     let r = ffmpeg(inputPath)
    //         .format(format)
    //         .size(size)

    //     return new Promise((resolve, reject) => {
    //         r.output(output)
    //             .on('progress', function (progress) {
    //                 if (progressFn) {
    //                     progressFn(progress.percent / 100)
    //                 } else {
    //                     console.log(progress.percent / 100);
    //                 };
    //             })
    //             .on('end', function () {
    //                 resolve(output);
    //             })
    //             .on('error', (_err) => {
    //                 reject(_err);
    //             })
    //             .run();
    //     });
    // }

    // 按比例
    videoResize(inputPath, size = '480x480', progressFn, format = 'mp4', fps = 24) {

        let { output } = this.createOutputPath(inputPath, 'resize', '.' + format);

        let r = ffmpeg(inputPath)
            // .videoCodec('mpeg4')
            .videoCodec(this.videoCodec)
            //.videoFilters(`scale=${size}`)
            .format(format)
            .size(size)

        // .autoPad(background)

        return new Promise((resolve, reject) => {
            r.outputFps(fps)
                .output(output)
                .on('progress', function(progress) {
                    if (progressFn) {
                        progressFn(progress.percent / 100)
                    } else {
                        console.log(progress.percent / 100);
                    };
                })
                .on('end', function() {
                    resolve(output);
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }


    /**
     * 
     * @param {*} inputPath 
     * @param {*} width 缩小到多少宽度
     * @param {*} height 缩小到多少高度
     * @param {*} padding newWidth newHeight x y
     * @param {*} color 背景颜色
     * @param {*} progressFn 
     * @param {*} fps 
     */
    paddingVideo(inputPath, width, height, padding = [10, 10, 10, 10], color = 'black', progressFn, fps = 24) {
        // console.log(width, height, padding)
        let { output } = this.createOutputPath(inputPath, 'padding');
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilters([{
                        filter: 'scale',
                        options: `${width}:${height}`
                    },
                    {
                        filter: 'pad',
                        options: `${padding.join(':')}:${color}`
                    }
                ])
                .outputFps(fps)
                .output(output)
                .on('progress', function(progress) {
                    if (progressFn) {
                        progressFn(progress.percent / 100)
                    } else {
                        console.log(progress.percent / 100);
                    };
                })
                .on('end', function() {
                    resolve(output);
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }

    //video转frame
    /**
     * 按照尺寸拉伸，导出视频帧图片
     * @param {*} input 
     * @param {*} size 
     * @param {*} progressFn 
     * @param {*} fadeIn 
     * @param {*} fadeOut 
     * @param {*} fps 
     */
    videoExtract(input, size, progressFn, fadeIn = 10, fadeOut = 10, fps = 24) {
        return new Promise((resolve, reject) => {
            let { dirname, basename, extname } = this.createOutputPath(input, 'extract');

            let outputDir = path.join(dirname, basename.replace(extname, ""));
            let outputfile = path.join(outputDir, '/%02d.png');

            try {
                fs.mkdirSync(outputDir);
            } catch (error) {}

            let inp = ffmpeg(input);
            fadeIn > 0 ? inp.videoFilters(`fade=in:0:${fadeIn}`) : null;
            fadeOut > 0 ? inp.videoFilters(`fade=in:0:${fadeOut}`) : null

            inp.videoFilters(`scale=${size}`)
                .outputFps(fps)
                .output(outputfile)
                .on('progress', (progress) => {
                    if (progressFn) { progressFn(progress.percent / 100) } else {
                        console.log(progress.percent / 100);
                    }
                })
                .on('end', () => {
                    // console.log('Finished processing');
                    let outputFrames = this.sortFiles(path.dirname(outputfile));
                    resolve({
                        filePath: outputDir,
                        images: outputFrames
                    });
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }


    //裁音频
    audioCut(audio, duration = null, startTime = 0, loop = 5) {
        if (duration == null) return
        let format = 'mp3';
        let { output } = this.createOutputPath(audio, `cut_${loop}`, '.' + format);
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(audio)
                .output(output)
                // .audioCodec('libfaac')
                .setStartTime(startTime)
                .seek(duration - loop)
                .format(format)
                .on('end', () => {
                    resolve(output);
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }

    // 自动裁切，直接取头部
    audioCutAuto(audio, loop = 5) {
        return new Promise((resolve, reject) => {
            this.getMediaDurationAndType(audio).then(({ duration }) => {
                this.audioCut(audio, duration, 0, loop).then(output => {
                    resolve(output)
                }).catch(error => {
                    reject(error);
                });
            });
        });
    }

    // 合成音频进视频里
    /**
     * 
     * @param {*} video 
     * @param {*} audio 
     * @param {*} outputfile 
     */
    videoAddAudio(video, audio, outputfile) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .videoCodec(this.videoCodec)
                // .audioCodec('libfaac')
                .format('mp4')
                .outputFormat('mp4')
                .input(audio)
                .input(video)
                .output(outputfile)
                .on('end', () => {
                    //删除临时的音乐文件
                    // fs.unlinkSync(music_output);
                    resolve(outputfile);
                }).on('error', (_err) => {
                    reject(_err);
                })
                .run();
        });
    }

    //把帧图片转为视频文件
    // TODO 个位数图片合成有bug
    frames2video(filePath, size, fps = 24) {
        return new Promise((resolve, reject) => {

            let { output } = this.createOutputPath(filePath, 'output', '.mp4');

            let input = this.framesRename(filePath);
            // console.log(input)
            ffmpeg(input)
                .videoCodec(this.videoCodec)
                .size(size)
                // .aspect(aspect)
                .outputFps(fps)
                .output(output)
                .on('progress', function(progress) {
                    console.log('Processing: ' + progress.percent + '% done');
                })
                .on('end', function() {
                    console.log('Finished processing');
                    resolve(output);
                })
                .on('error', (_err) => {
                    console.log(_err)
                    reject(_err);
                })
                .run();
        });

    }

    //图片文件合成视频
    files2video(files, output, size, aspect, progressFn) {
        return new Promise((resolve, reject) => {
            ffmpeg(files)
                .videoCodec(this.videoCodec)
                // .audioCodec('libfaac')
                // .format('mp4')
                .size(size)
                .aspect(aspect)
                .output(output)
                .on('progress', function(progress) {
                    if (progressFn) { progressFn(progress.percent / 100) } else {
                        console.log('Processing: ', progress.percent);
                    }
                })
                .on('end', function() {
                    // console.log('Finished processing');
                    resolve(output);
                })
                .run();
        });
    }

    // startTime 起点
    // loop 终点
    video2gif(filePath, width = 320, fps = 15, startTime = 0, loop = 5) {
        let { output } = this.createOutputPath(filePath, 'output', '.gif');
        return new Promise((resolve, reject) => {
            this.getMediaDurationAndType(filePath).then(info => {
                let duration = info.duration;
                ffmpeg(filePath)
                    .outputOption("-vf", `scale=${width}:-1:flags=lanczos,fps=${fps}`)
                    .setStartTime(startTime)
                    .seek(duration - loop)
                    .save(output)
                    .on('end', function() {
                        // console.log('Finished processing');
                        resolve(output);
                    })
            });
        });
    }
    video2mp4(filePath) {
        let { output } = this.createOutputPath(filePath, 'output', '.mp4');
        return new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .videoCodec(this.videoCodec)
                //.outputOption("-vf", `scale=${width}:-1:flags=lanczos,fps=${fps}`)
                .save(output)
                .on('end', function() {
                    // console.log('Finished processing');
                    resolve(output);
                })
        });
    }
    gif2video(filePath) {
        let { output } = this.createOutputPath(filePath, 'output', '.mp4');
        // this.getMediaDurationAndType(filePath).then((data) => {
        //     console.log(data)
        // });
        return new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .videoCodec(this.videoCodec)
                .save(output)
                .on('end', function() {
                    setTimeout(() => {
                        resolve(output);
                    }, 500);
                    // console.log('Finished processing');

                })
        });
    }



    // 
    framesRename(fileDir) {
        let files = this.sortFiles(fileDir);
        return this.filesRename(files, fileDir)
    }

    // 
    filesRename(files, fileDir) {
        if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir);
        // let d = path.join(dirname, basename);
        let c = ((files.length).toString()).length;
        for (let index = 0; index < files.length; index++) {
            let filename = index + 1;
            let t = ("" + filename).length;
            if (t < c) {
                filename = (new Array(c - t)).fill(0).join("") + "" + filename
            };
            filename = path.join(fileDir, `${filename}.png`);
            fs.renameSync(files[index], filename);
        }
        return path.join(fileDir, c > 1 ? `%0${c}d.png` : `%1d.png`);
    }


    drawText(videoFilePath, waterMarkBase64, x = 0, y = 0) {

        let { output, extname } = this.createOutputPath(videoFilePath, 'watermark');
        let waterMarkFilePath = output.replace(extname, "") + `_watermark.png`;
        this.saveImage(waterMarkBase64, waterMarkFilePath);
        // console.log(waterMarkFilePath)

        return new Promise((resolve, reject) => {
            ffmpeg(videoFilePath)
                .input(waterMarkFilePath)
                .videoCodec(this.videoCodec)
                .format('mp4')
                .inputOptions('-filter_complex', `overlay=${x}:${y}`)
                .on('error', function(err) {
                    reject(err);
                })
                .on('end', () => {
                    console.log('水印添加成功');
                    // 删除
                    this.deleteFile(waterMarkFilePath);

                    resolve(output);
                })
                .save(output);
        });
    }


    saveImage(imgData, filename) {
        var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        var dataBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filename, dataBuffer);
    }

    mergeFrame(frame, tw, th) {
        let { content, textImage } = frame;

        return new Promise((resolve, reject) => {
            if (content.type == 'img') {
                let width = content.layout.width,
                    height = content.layout.height,
                    url = content.url,
                    loop = (textImage ? textImage.loop : null) || 5;
                // console.log('loop', loop)
                this.singleImg2video(url, width + 'x' + height, loop).then(imvot => {
                    // imvot 图片转视频
                    this.paddingVideo(imvot,
                        parseInt(width),
                        parseInt(height), [tw, th, parseInt(content.layout.left), parseInt(content.layout.top)]).then(pot => {
                        // 删除
                        this.deleteFile(imvot);
                        if (textImage && textImage.base64) {
                            // pot视频
                            this.drawText(pot, textImage.base64).then(textVideo => {
                                // 删除
                                this.deleteFile(pot);
                                resolve(textVideo);
                            });
                        } else {
                            resolve(pot)
                        }

                    })

                });
            } else if (content.type == 'video') {
                let width = content.layout.width,
                    height = content.layout.height,
                    url = content.url;

                this.paddingVideo(url,
                    parseInt(width),
                    parseInt(height), [tw, th, 0, parseInt(content.layout.top)]).then(pot => {

                    // pot视频
                    if (textImage && textImage.base64) {
                        this.drawText(pot, textImage.base64).then(textVideo => {
                            // 删除
                            this.deleteFile(pot);
                            resolve(textVideo)
                        });
                    } else {
                        resolve(pot)
                    }

                })

            }
        });
    }

    mergeAll(data, progressFn) {
        const { width, height, frames, backgroudAudio } = data;

        return new Promise((resolve, reject) => {
            Promise.all(
                Array.from(frames, frame => this.mergeFrame(frame, width, height))
            ).then(framesFile => {
                // 合成好文字的视频地址
                // 分解视频成图片
                Promise.all(Array.from(
                    framesFile, frame => this.videoExtract(frame, width + "x" + height)
                )).then(exframes => {
                    //删除
                    Array.from(framesFile, f => this.deleteFile(f));

                    // 从图片合成视频
                    let imagesAll = [];
                    Array.from(exframes, ex => {
                        imagesAll = imagesAll.concat(ex.images);
                    });

                    // 存放图片的目录
                    let filesDir = path.join(__dirname, '../test/files');
                    let files = this.filesRename(imagesAll, filesDir);
                    let { output } = this.createOutputPath(path.join(__dirname, '../test/video'), 'v');
                    this.files2video(files, output, width + "x" + height, width / height, progressFn).then(video => {
                        // 删除图片
                        Array.from(exframes, ex => this.deleteFile(ex.filePath));
                        // 
                        this.deleteFile(filesDir);

                        let { output } = this.createOutputPath(path.join(__dirname, '../test/video'), 'result');

                        if (backgroudAudio && backgroudAudio.url) {
                            // 计算视频长度
                            this.getMediaDurationAndType(video).then(info => {
                                // 裁切音乐
                                this.audioCutAuto(backgroudAudio.url, info.duration).then(audio => {
                                    // 删除audio

                                    // 添加音乐

                                    this.videoAddAudio(video, audio, output).then((finish) => {
                                        this.deleteFile(video);
                                        this.deleteFile(audio);
                                        resolve(finish);
                                    })

                                })

                            })

                        } else {
                            fs.renameSync(video, output);
                            resolve(output);
                        }

                    })

                })

            })
        });

    }

    //有bug
    // testMerge() {
    //     let filePaths = dialog.showOpenDialogSync({
    //         title: "打开……",
    //         properties: ['openFile', 'multiSelections'],
    //         filters: [
    //             { name: 'Videos', extensions: ['mov', 'avi', 'mp4', 'mp3', 'jpg', 'png', 'gif'] }
    //         ]
    //     });
    //     if (filePaths) {

    //         let { output, dirname } = this.createOutputPath(filePaths[0], 'test');

    //         ffmpeg(filePaths[0])
    //             .input(filePaths[1])
    //             .videoCodec('mpeg4')
    //             .format('mp4')
    //             .outputFormat('mp4')
    //             .on('end', function() {
    //                 console.log('files have been merged succesfully');
    //             })
    //             .on('error', function(err) {
    //                 console.log(err);
    //             })
    //             .mergeToFile(output, dirname);
    //     }

    // }

}


module.exports = new FF()