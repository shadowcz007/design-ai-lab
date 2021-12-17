const internalIp = require('internal-ip')
const host = internalIp.v4.sync()
const utils = require('../utils')
// const utils = require('./utils');
const faceapi = require('face-api.js')
const _IMG_SIZE = 320
console.log(faceapi)
//
class FaceAPIModel {
  //单例
  static getInstance () {
    if (!FaceAPIModel.instance) {
      FaceAPIModel.instance = new FaceAPIModel()
    }
    return FaceAPIModel.instance
  }

  constructor (progressFn) {
    let t1 = new Date().getTime()
    this.url = `http://${host}/face-api-weights/face_expression_model-weights_manifest.json`
    this.faceapi = faceapi
    utils.checkURLIsOk(this.url).then(async status => {
      if (status) {
        await this.faceapi.nets.ssdMobilenetv1.loadFromUri(`http://${host}/face-api-weights/ssd_mobilenetv1_model-weights_manifest.json`)
        await this.faceapi.nets.faceLandmark68Net.loadFromUri(`http://${host}/face-api-weights/face_landmark_68_model-weights_manifest.json`)
        await this.faceapi.nets.faceRecognitionNet.loadFromUri(`http://${host}/face-api-weights/face_recognition_model-weights_manifest.json`)
        await this.faceapi.nets.faceExpressionNet.loadFromUri(`http://${host}/face-api-weights/face_expression_model-weights_manifest.json`)
        window.faceapi=this.faceapi;
        console.log('--face-api--sucess', new Date().getTime() - t1)
        if (progressFn) progressFn()
      }
    })

    // console.log(faceapi,this.url)
  }

  // async load(url) {
  //     url = url || this.url;
  //     this.model = await tf.loadGraphModel(this.url);
  //     this.ready = true;
  // }

  async faceExpressions (originalImageElement) {
    // withFaceLandmarks() 有bug
    const detectionsWithExpressions = await this.faceapi
      .detectAllFaces(originalImageElement)
      .withFaceLandmarks()
      .withFaceExpressions()

    return detectionsWithExpressions
  }
}

module.exports = FaceAPIModel.getInstance()
