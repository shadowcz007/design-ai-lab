// // basic.html
// const fs = require('fs');
// const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

// const ffmpeg = createFFmpeg({ log: true });

// // var testData = new Uint8Array(fs.readFileSync("/Users/shadow/Documents/0002-coding/205-design-ai-lab/test/test.mp4"));
// // // Encode test video to VP8.
// // var result = ffmpeg({
// //     MEMFS: [{ name: "test.mp4", data: testData }],
// //     arguments: ["-i", "test.mp4", "-c:v", "libvpx", "-an", "out.webm"],
// // });
// // // Write out.webm to disk.
// // var out = result.MEMFS[0];
// // console.log(out);
// // // fs.writeFileSync(out.name, Buffer(out.data));


// process.once('loaded', () => {
//     global.fs = fs;
//     global.fetchFile = fetchFile;
//     global.ffmpeg = ffmpeg;
//     global.require = require;

// })

// const { contextBridge } = require('electron')
// const { execSync } = require('child_process')

// contextBridge.exposeInMainWorld('electron', {
//     exec: (command) => {
//         const validCommand = /^start https?:\/\/[^\s]+$/
//         if (validCommand.test(command)) {
//             execSync(command)
//         }
//     },
// })