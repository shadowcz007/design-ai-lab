const fs = require("fs"),
    path = require('path');

const Jimp = require('jimp');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


// const fontPath=path.join(__dirname,'../lib/zkyyt/W02.ttf');
// // console.log(fontPath)
// Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
//     console.log(font)
// });

//video转frame
function extract(input, fadeIn = 10, fadeOut = 10, size = '480x?', aspect = "9:16", background = "#35A5FF") {
    return new Promise((resolve, reject) => {
        let dirname = path.dirname(input),
            basename = path.basename(input),
            extname = path.extname(input);
        // console.log(basename.replace(extname,""))
        let outputDir = path.join(dirname, basename.replace(extname, ""));
        let outputfile = path.join(outputDir, '/%02d.jpg');
        // var stream  = fs.createWriteStream(path.join(dirname,basename.replace(extname,"")+'/r.mp4'));
        try {
            fs.mkdirSync(outputDir);
        } catch (error) {

        }

        ffmpeg(input)
            .videoFilters(`fade=in:0:${fadeIn}`)
            .videoFilters(`fade=in:0:${fadeOut}`)
            .size('480x?')
            .aspect('9:16')
            .autoPad(background)
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
            // .pipe(stream, { end: true });
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

function drawText(filePath, fontImage, x, y) {
    return new Promise((resolve, reject) => {
        Jimp.read(filePath).then(image => {
            image.composite(fontImage, x, y)
                .write(filePath).then(() => resolve(filePath));
        });
    });
}

//管道
function pipe(inputs) {

    let frames = [];

    return new Promise((resolve, reject) => {
        Promise.all(
            Array.from(inputs, i => extract(i))
        ).then(values => {
            values.forEach(vs => vs.frames.forEach(frame => {
                frames.push({
                    frame: frame,
                    filePath: vs.filePath
                });
            }));
            resolve(frames);
        });
    });

}

//批量合成视频
function run(inputs) {
    return new Promise((resolve, reject) => {
        let dirname = path.dirname(inputs[0]);
        let outputfileTemp = path.join(dirname, `output/output.mp4`);
        dirnameTemp = path.join(dirname, `/output`);
        // console.log(dirnameTemp)
        //创建临时的合成目录
        try {
            fs.mkdirSync(dirnameTemp);
        } catch (error) {
            console.log(error);
        };

        // let frames=[];
        pipe(inputs).then(frames => {
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
        ffmpeg(path.join(filePath, `%0${(""+files.length).length}d.jpg`))
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

//合成视频
function mergeVideos(dialog) {
    let filePaths = dialog.showOpenDialogSync({
        title: "打开……",
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Videos', extensions: ['mov', 'avi', 'mp4', 'jpg', 'png', 'gif'] }
        ]
    });
    if (filePaths) {
        // console.log(filePaths)
        run(filePaths);
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
    mergeVideos,
    extract,
    frames2video
}