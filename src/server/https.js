let http = require('http')
let fs = require('fs')
const path = require('path')
const serverUrl = require('./serverUrl')

let _IS_DEV = false

function start (isDev = false) {
  // mkcert.create().then(opts => {
  //     const httpsServer = https.createServer(opts, doReq);
  //     httpsServer.listen(443, () => {
  //         if (isDev) console.log(` 🎉 https server running at ${serverUrl.get()}`)
  //     });
  // });

  let httpServer = http.createServer(doReq)
  httpServer.listen(80, () => {
    if (isDev) console.log(` 🎉 http server running at ${serverUrl.get().host}`)
  })

  _IS_DEV = isDev
}

function doReq (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Request-Method', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, DELETE'
  )
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (_IS_DEV) console.log(req.url)
  let reqUrlBase = req.url.replace(/\?.*/gi, '')
  if (reqUrlBase === '/') {
    // const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8')
    // res.writeHead(200, { 'Content-type': 'text/html' })
    // // res.write(`<h1>~</h1>`);
    // res.end(html)
  } else if (reqUrlBase === '/socket.io.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/socket.io/client-dist/socket.io.min.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/peer.js') {
    const js = fs.readFileSync(
      path.join(__dirname, '../../node_modules/peerjs/dist/peerjs.min.js'),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/humanseg.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/@paddlejs-models/humanseg/lib/index.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/tfjs-core.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/@tensorflow/tfjs-core/dist/tf-core.min.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/tfjs-converter.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/@tensorflow/tfjs-converter/dist/tf-converter.min.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/tfjs-backend-webgl.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/@tensorflow/tfjs-backend-webgl/dist/tf-backend-webgl.min.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/face-landmarks-detection.js') {
    const js = fs.readFileSync(
      path.join(
        __dirname,
        '../../node_modules/@tensorflow-models/face-landmarks-detection/dist/face-landmarks-detection.min.js'
      ),
      'utf8'
    )
    res.writeHead(200, { 'Content-type': 'application/javascript' })
    res.end(js)
  } else if (reqUrlBase === '/ade20k_2/model.json') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(path.join(__dirname, '../../model/ade20k_2/model.json'))
    )
  } else if (reqUrlBase === '/ade20k_2/weights.bin') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(
      fs.readFileSync(path.join(__dirname, '../../model/ade20k_2/weights.bin'))
    )
  } else if (reqUrlBase === '/mobilenet_v2/model.json') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(
        path.join(__dirname, '../../model/mobilenet_v2/model.json')
      )
    )
  } else if (reqUrlBase === '/mobilenet_v2/weights.bin') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(
      fs.readFileSync(
        path.join(__dirname, '../../model/mobilenet_v2/weights.bin')
      )
    )
  } else if (reqUrlBase === '/u2net/model.json') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(path.join(__dirname, '../../model/u2net/model.json'))
    )
  } else if (reqUrlBase.match(/\/u2net\/.*\.bin/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(fs.readFileSync(path.join(__dirname, '../../model' + reqUrlBase)))
  } else if (reqUrlBase.match(/\/yolov.*\/model.json/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(fs.readFileSync(path.join(__dirname, '../../model' + reqUrlBase)))
  } else if (reqUrlBase.match(/\/yolov.*\/group.*shard.*/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(fs.readFileSync(path.join(__dirname, '../../model' + reqUrlBase)))
  } else if (reqUrlBase === '/posenet/model.json') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(
        path.join(
          __dirname,
          '../../model/posenet_mobilenet_float075_stride16/model.json'
        )
      )
    )
  } else if (reqUrlBase.match(/\/posenet\/.*\.bin/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(
      fs.readFileSync(
        path.join(
          __dirname,
          '../../model/posenet_mobilenet_float075_stride16/weights.bin'
        )
      )
    )
  } else if (reqUrlBase === '/bodypix/model.json') {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(path.join(__dirname, '../../model/bodypix/model.json'))
    )
  } else if (reqUrlBase.match(/\/bodypix\/.*\.bin/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(
      fs.readFileSync(path.join(__dirname, '../../model/bodypix/weights.bin'))
    )
  } else if (reqUrlBase.match(/\/face-api-weights\/.*shard/gi)) {
    // 模型
    // console.log(reqUrlBase)
    res.writeHead(200, { 'Content-Type': 'application/x-binary' })
    res.end(
      fs.readFileSync(
        path.join(
          __dirname,
          '../../model/face-api-weights/' + path.basename(reqUrlBase)
        )
      )
    )
  } else if (reqUrlBase.match(/\/face-api-weights\/.*\.json/gi)) {
    // 模型
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      fs.readFileSync(
        path.join(
          __dirname,
          '../../model/face-api-weights/' + path.basename(reqUrlBase)
        )
      )
    )
  }
}

module.exports = {
  start
}
