const fs = require("fs"),
    path = require('path');

const Jimp = require('jimp');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const { remote } = require("electron");
const dialog = remote.dialog;
// const fontPath=path.join(__dirname,'../lib/zkyyt/W02.ttf');
// // console.log(fontPath)
// Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
//     console.log(font)
// });

function createOutputName(input, type) {
    let dirname = path.dirname(input),
        basename = path.basename(input),
        extname = path.extname(input);
    return {
        output: path.join(dirname, basename.replace(extname, "") + `_${type}` + extname),
        dirname,
        basename,
        extname
    }
}

//video转frame
function resize(input, size = '480x?', aspect = "9:16", background = "#35A5FF") {
    return new Promise((resolve, reject) => {
        let { output } = createOutputName(input, 'resize');
        ffmpeg(input)
            .videoCodec('libx264')
            .format('mp4')
            .size(size)
            .aspect(aspect)
            .autoPad(background)
            .outputFps(24)
            .output(output)
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', function() {
                console.log('Finished processing');
                resolve(output);
            })
            .run();
    });
}



//video转frame
function extract(input, fadeIn = 10, fadeOut = 10) {
    return new Promise((resolve, reject) => {
        let { dirname, basename, extname } = createOutputName(input, 'extract');

        let outputDir = path.join(dirname, basename.replace(extname, ""));
        let outputfile = path.join(outputDir, '/%02d.jpg');

        try {
            fs.mkdirSync(outputDir);
        } catch (error) {

        }

        ffmpeg(input)
            .videoFilters(`fade=in:0:${fadeIn}`)
            .videoFilters(`fade=in:0:${fadeOut}`)
            .outputFps(24)
            .output(outputfile)
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', function() {
                console.log('Finished processing');
                let outputFrames = sortFiles(path.dirname(outputfile));
                resolve({
                    filePath: outputDir,
                    frames: outputFrames
                });
            })
            .run();
    });
}

//frames 是路径
//TODO 文本合成需要换个思路，在前端制作好文本png，合并
// function text(frames,text='试试合成字幕'){
//     return new Promise((resolve,reject)=>{
//         Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
//             Promise.all(
//                 Array.from(frames,frame=>{
//                     return drawText(frame,font,text)
//                 })
//             ).then(()=>resolve(frames));

//           });
//     });

// }

// function drawTextForFramesAndReadTextImage(inp, textImage) {
//     return new Promise((resolve, reject) => {
//         //合成字幕
//         // let textImage=textInputs[index];
//         // console.log(textImage.base64.split(";base64,"))
//         let base64 = textImage.base64.replace(/^data:image\/\w+;base64,/, "");
//         // data:image/png
//         var dataBuffer = Buffer.from(base64, 'base64');

//         Jimp.read(dataBuffer)
//             .then(image => {
//                 extract(inp).then(out => {

//                     drawTextForFrames(out.frames, image, parseInt((480 - textImage.width) / 2), 100).then(frames => {
//                         out.frames = frames;
//                         resolve(out)
//                     });
//                 })
//             });
//     });


// }

// function drawTextForFrames(frames, fontImage, x, y) {
//     return Promise.all(Array.from(
//         frames, frame => drawText(frame, fontImage, x, y)
//     ));
// }

//为视频添加水印
function drawText(videoFilePath, waterMarkFilePath, x = 100, y = 100) {

    let { output } = createOutputName(videoFilePath, 'watermark');

    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            .input(waterMarkFilePath)
            .videoCodec('libx264')
            .format('mp4')
            .inputOptions('-filter_complex', `overlay=${x}:${y}`)
            .on('error', function(err) {
                console.log('水印添加错误: ' + err.message);
            })
            .on('end', function() {
                console.log('水印添加成功');
                resolve(output);
            })
            .save(output);
    });

}

// get the video duration
function getMediaDuration(file) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file, (_err, metadata) => {
            if (_err === null) {
                // console.log(metadata.format.duration)
                resolve(metadata.format.duration);
            } else {
                reject(_err);
            }
        });
    });
};

//裁音频
function cutMusic(audio, time = 5) {
    let dirname = path.dirname(audio),
        basename = path.basename(audio),
        extname = path.extname(audio);
    // console.log(basename.replace(extname,""))
    let outputMp3 = path.join(dirname, basename.replace(extname, "") + `_${time}s.mp3`);

    return new Promise((resolve, reject) => {
        getMediaDuration(audio).then(duration => {
            ffmpeg()
                .input(audio)
                .output(outputMp3)
                .setStartTime(0)
                .seek(duration - time)
                .format('mp3')
                .on('end', () => {
                    resolve(outputMp3);
                })
                .on('error', (_err) => {
                    reject(_err);
                })
                .run();
        })

    });
}

//合成音频
function addMusicToVideo(video, music) {

    let dirname = path.dirname(video),
        basename = path.basename(video),
        extname = path.extname(video);
    // console.log(basename.replace(extname,""))
    let outputfile = path.join(dirname, basename.replace(extname, "") + "_music" + extname);
    return new Promise((resolve, reject) => {
        getMediaDuration(video).then(duration => {
            cutMusic(music, duration).then(music_output => {
                ffmpeg()
                    .videoCodec('libx264')
                    .format('mp4')
                    .outputFormat('mp4')
                    .input(music_output)
                    .input(video)
                    .output(outputfile)
                    .on('end', () => {
                        //删除临时的音乐文件
                        fs.unlinkSync(music_output);
                        resolve(outputfile);
                    }).on('error', (_err) => {
                        reject(_err);
                    })
                    .run();
            });
        });

    });

}

function saveImage(imgData, filename) {
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    // console.log(filename,base64Data)
    var dataBuffer = Buffer.from(base64Data, 'base64');
    // console.log('加水印',filename)
    fs.writeFileSync(filename, dataBuffer);
}

//管道
function pipe(inputs, textInputs) {
    return new Promise((resolve, reject) => {
        let frames = [];

        let watermarks = [];

        textInputs.forEach((t, i) => {
            let {
                dirname,
                basename,
                extname
            } = createOutputName(inputs[i], 'watermark');
            let filename = path.join(dirname, basename.replace(extname, "") + `_watermark_${i}.png`);
            saveImage(t.base64, filename);
            watermarks.push(filename);
        });

        setTimeout(() => {

            Promise.all(
                Array.from(inputs, (inp, index) => resize(inp))
            ).then(inn => {
                //新尺寸的视频，加水印
                Promise.all(
                    Array.from(inn, (inp, index) => drawText(inp, watermarks[index]))
                ).then(innn => {
                    console.log(inn)
                        //加水印后提取视频帧
                    Promise.all(
                        Array.from(innn, inp => extract(inp))
                    ).then(values => {
                        console.log(innn)

                        console.log(watermarks)

                        // [{
                        //     filePath: outputDir,
                        //     frames: outputFrames
                        // }]
                        values.forEach(vs => vs.frames.forEach(frame => {
                            frames.push({
                                frame: frame,
                                filePath: vs.filePath
                            });
                        }));

                        resolve(frames);
                    });

                })

            });


        }, 500);


    });

}

//批量合成视频
//视频地址，文本地址
function mergeVideos(inputs, textInputs) {
    return new Promise((resolve, reject) => {
        let dirname = path.dirname(inputs[0]);
        dirnameTemp = path.join(dirname, `/output`);
        // console.log(dirnameTemp)
        //创建临时的合成目录
        try {
            fs.mkdirSync(dirnameTemp);
        } catch (error) {
            console.log(error);
        };

        // let frames=[];
        pipe(inputs, textInputs).then(frames => {
            // console.log(frames)
            let c = ("" + frames.length).length;
            let dirTemps = {};
            for (let index = 0; index < frames.length; index++) {
                const frame = frames[index].frame;
                let filename = index + 1;
                if (("" + filename).length < c) filename = (new Array((c - ("" + filename).length))).fill(0).join("") + "" + filename;
                fs.renameSync(frame, path.join(dirnameTemp, `${filename}.jpg`));
                dirTemps[frames[index].filePath] = 1;
            };

            for (const temp in dirTemps) {
                deleteDir(temp);
            };

            frames2video(dirnameTemp).then(outputfile => {
                deleteDir(dirnameTemp);

                resolve(outputfile);
            });

        });
    });


}

//把帧图片转为视频文件
function frames2video(filePath) {
    return new Promise((resolve, reject) => {
        let files = fs.readdirSync(filePath);
        let outputfile = path.join(filePath, `../output.mp4`);
        ffmpeg(path.join(filePath, `%0${("" + files.length).length}d.jpg`))
            .videoCodec('libx264')
            .output(outputfile)
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', function() {
                console.log('Finished processing');
                resolve(outputfile);
            })
            .run();
    });

}


//有bug
// function merge(dialog){
//     let filePaths = dialog.showOpenDialogSync({
//         title: "打开……",
//         properties: ['openFile', 'multiSelections'],
//         filters: [
//             { name: 'Videos', extensions: ['mov', 'avi', 'mp4','mp3', 'jpg', 'png', 'gif'] }
//         ]
//     });
//     if (filePaths) {
//         let dirname = path.dirname(filePaths[0]),
//             basename = path.basename(filePaths[0]),
//             extname = path.extname(filePaths[0]);
//         // console.log(basename.replace(extname,""))
//         let outputfile = path.join(dirname, basename.replace(extname, "")+"_test"+extname);


//         ffmpeg(filePaths[0])
//         .input(filePaths[1])
//         .on('end', function() {
//             console.log('files have been merged succesfully');
//         })
//         .on('error', function(err) {
//             console.log('an error happened: ' + err.message);
//         })
//         .mergeToFile(outputfile);
//     }

// }

//完成视频及音频合成
//files=[
//     {
//         url,text,type,textImage:{width,height,base64}
//     }
// ]
function createShortVideoFromLocal(files = []) {
    // console.log(this)
    // let filePaths = dialog.showOpenDialogSync({
    //     title: "打开……",
    //     properties: ['openFile', 'multiSelections'],
    //     filters: [
    //         { name: '合并多个视频+1个音频', extensions: ['mov', 'avi', 'mp4','mp3', 'jpg', 'png', 'gif'] }
    //     ]
    // });
    if (files && files.length > 0) {

        let extnames = Array.from(files, f => f.type);
        let audio = files[extnames.indexOf('audio')].url;
        files[extnames.indexOf('audio')] = null;
        // console.log(filePaths)
        let videos = files.filter(f => f);
        // console.log(extnames.indexOf('.mp3'))
        return new Promise((resolve, reject) => {
            mergeVideos(
                Array.from(videos, v => v.url),
                Array.from(videos, v => v.textImage)
            ).then(outputVideo => {
                addMusicToVideo(outputVideo, audio).then(output => {
                    fs.unlinkSync(outputVideo);
                    resolve(output);
                })
            });
        });

    }
}

//完成视频及音频合成
function createShortVideoInput() {
    // console.log(this)
    let filePaths = dialog.showOpenDialogSync({
        title: "打开……",
        properties: ['openFile'],
        filters: [
            { name: '视频、音频', extensions: ['mov', 'avi', 'mp4', 'mp3', 'jpg', 'png', 'gif'] }
        ]
    });

    let type = null;
    if (filePaths[0]) {
        var count = Array.from(['mov', 'avi', 'mp4'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
        if (count.length > 0) type = "video";
        count = Array.from(['mp3'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
        if (count.length > 0) type = "audio";
        count = Array.from(['jpg', 'png', 'gif'], t => filePaths[0].match(t) ? 1 : null).filter(f => f);
        if (count.length > 0) type = "img";
    }

    return filePaths[0] ? {
        type: type,
        url: filePaths[0]
    } : null;
}

//需要把_imgs保存为文本文件，再使用
function createShortVideo(_imgs) {
    console.log(_imgs)
        // let filePaths = dialog.showOpenDialogSync({
        //     title: "打开……",
        //     properties: ['openFile', 'multiSelections'],
        //     filters: [
        //         { name: '合并多个视频+1个音频', extensions: ['mov', 'avi', 'mp4','mp3', 'jpg', 'png', 'gif'] }
        //     ]
        // });
        // if (filePaths) {
        //     let extnames=Array.from(filePaths,f=>path.extname(f));
        //     let mp3=filePaths[extnames.indexOf('.mp3')];
        //     filePaths[extnames.indexOf('.mp3')]=null;
        //     // console.log(filePaths)
        //     let videos=filePaths.filter(f=>f);
        //     // console.log(extnames.indexOf('.mp3'))
        //     return new Promise((resolve, reject) => {
        //         mergeVideos(videos).then(outputVideo=>{
        //             addMusicToVideo(outputVideo,mp3).then(output=>{
        //                 fs.unlinkSync(outputVideo);
        //                 resolve(output);
        //             })
        //         });
        //     });

    // }
}

//合成视频
function mergeVideosUI() {
    let filePaths = dialog.showOpenDialogSync({
        title: "打开……",
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: '合并多个视频', extensions: ['mov', 'avi', 'mp4', 'jpg', 'png', 'gif'] }
        ]
    });
    if (filePaths) {
        mergeVideos(filePaths);
    }
}

//合成视频
function mergeOneVideoAndMusicUI() {
    let filePaths = dialog.showOpenDialogSync({
        title: "打开……",
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: '选择一个视频+一段音频', extensions: ['mov', 'avi', 'mp4', 'mp3', 'gif'] }
        ]
    });
    if (filePaths) {
        // console.log(filePaths)
        addMusicToVideo(...filePaths);
    }
}

function cutMusicUI() {
    let filePath = dialog.showOpenDialogSync({
        title: "打开……",
        properties: ['openFile'],
        filters: [
            { name: 'Audio', extensions: ['mp3'] }
        ]
    });
    if (filePath && filePath.length == 1) {
        // console.log(filePath)
        cutMusic(filePath[0]);
    }
}

//删除目录
function deleteDir(filePath) {
    let files = fs.readdirSync(filePath);
    files.forEach(f => fs.unlinkSync(path.join(filePath, f)));
    fs.rmdirSync(filePath);
    console.log('删除:', filePath)
}


//按照编号从小到大排序
function sortFiles(filePath) {
    let files = fs.readdirSync(filePath);
    files = Array.from(files, f => {
        return {
            index: parseInt(f.replace(/\.*/, "")),
            filename: path.join(filePath, f)
        }
    }).sort((b, a) => b.index - a.index);

    return Array.from(files, f => f.filename)
}



module.exports = {
    createShortVideoInput,
    createShortVideoFromLocal,
    mergeVideosUI,
    mergeOneVideoAndMusicUI,
    cutMusicUI,
    drawText,
    resize
    // extract,
    // frames2video
}