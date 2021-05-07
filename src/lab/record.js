const RecordRTC = require('recordrtc/RecordRTC');


class Record {

    async fromCanvas(canvas, time = 3000, frameRate = 24) {
        let recorder = new RecordRTC.RecordRTCPromisesHandler(canvas.captureStream(frameRate), {
            type: 'gif',
            frameRate: frameRate,
            quality: 8,
            width: canvas.width,
            height: canvas.height,
        });
        recorder.startRecording();
        const sleep = m => new Promise(r => setTimeout(r, m));
        await sleep(time);
        await recorder.stopRecording();
        let url = await recorder.getDataURL();
        return url;
    }

}


module.exports = Record;