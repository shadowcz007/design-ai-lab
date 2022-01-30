const RecordRTC = require('recordrtc/RecordRTC')

class Record {
  async fromCanvas (canvas, time = 3000, frameRate = 24, type = 'gif') {
    let recorder = new RecordRTC.RecordRTCPromisesHandler(
      canvas.captureStream(frameRate),
      {
        type: type,
        frameRate: frameRate,
        quality: 8,
        width: canvas.width,
        height: canvas.height
      }
    )
    recorder.startRecording()
    const sleep = m => new Promise(r => setTimeout(r, m))
    await sleep(time)
    await recorder.stopRecording()
    let url = await recorder.getDataURL()
    return url
  }
  async fromMediaStream (stream, time = 3000) {
    let {frameRate,width,height} = stream.getVideoTracks()[0].getSettings();
    let recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/mp4',
      frameRate,
      quality: 8,
      width,
      height
    })
    recorder.startRecording()
    const sleep = m => new Promise(r => setTimeout(r, m))
    await sleep(time)
    await recorder.stopRecording()
    let url = await recorder.getDataURL()
    return url
  }
}

module.exports = Record
