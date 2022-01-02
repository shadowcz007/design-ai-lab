//主要完成html的一些基本的操作
// 文件存储

const { spawn } = require('child_process')
const hash = require('object-hash'),
  md5 = require('md5')
const fs = require('fs'),
  path = require('path')
const debounce = require('debounce')
const { nativeImage, remote } = require('electron')
const _DBPATH = remote.getGlobal('_DBPATH')

class Base {
  constructor () {
    this.path = path
    this.fs = fs
  }
  getRootPath () {
    return path.join(__dirname, '../..')
  }
  getBaseName (filepath) {
    return path.basename(filepath)
  }
  getExtName (filepath) {
    return path.extname(filepath)
  }
  getNodeModulesPath () {
    return this.getRootPath() + '/node_modules'
  }
  getAppId () {
    return remote.getGlobal('_APPID')
  }
  md5 (str) {
    return md5(str)
  }

  hash (obj = {}) {
    return hash(obj)
  }
  //
  sleep = m => new Promise(r => setTimeout(r, m))

  // 打乱
  shuffle (arr) {
    let arrNew = [...arr]
    //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
    const randomsort = function (a, b) {
      return Math.random() > 0.5 ? -1 : 1
    }
    // var arr = [1, 2, 3, 4, 5];
    return [...arrNew.sort(randomsort)]
  }

  // 唯一
  unique (arr) {
    //Set数据结构，它类似于数组，其成员的值都是唯一的
    return Array.from(new Set(arr)) // 利用Array.from将Set结构转换成数组
  }

  // toast

  //笛卡尔积
  cartesian (arr) {
    if (arr.length < 2) return arr[0] || []
    return [].reduce.call(arr, (col, set) => {
      let res = []
      col.forEach(c => {
        set.forEach(s => {
          let t = [].concat(Array.isArray(c) ? c : [c])
          t.push(s)
          res.push(t)
        })
      })
      return res
    })
  }

  // 按固定大小分成若干组
  chunk (arr, size) {
    var newArr = []
    var i = 0
    while (i < arr.length) {
      newArr.push(arr.slice(i, i + size))
      i = i + size
    }
    return newArr
  }

  debounce (fn, time) {
    return debounce(fn, time)
  }

  // arraybuffer转buffer
  arrayBuffer2Buffer (ab) {
    var buf = Buffer.from(ab.byteLength)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buf.length; ++i) {
      buf[i] = view[i]
    }
    return buf
  }

  // 把字符串数据转为url
  str2URL (data, type) {
    // svg "image/svg+xml;charset=utf-8"
    var blob = new Blob([data], { type: type })
    return URL.createObjectURL(blob)
  }

  mkdir (filepath) {
    fs.mkdirSync(filepath)
  }

  saveData (filepath, data) {
    fs.writeFileSync(filepath, data)
  }

  // 直接保存base64 为本地文件
  saveBase64 (base64, filepath = null) {
    if (filepath) {
      let img = nativeImage.createFromDataURL(base64)
      let extname = path.extname(filepath)
      // console.log(filepath, extname)
      if (
        extname.toLowerCase() === '.jpg' ||
        extname.toLowerCase() === '.jpeg'
      ) {
        fs.writeFileSync(filepath, img.toJPEG(80))
      } else {
        fs.writeFileSync(filepath, img.toPNG())
      }
    }
  }
  // 直接保存json 为本地文件
  saveJson (json, filepath = null) {
    if (filepath) {
      json = JSON.stringify(json)
      try {
        fs.writeFile(filepath, json, e => console.log(e))
      } catch (error) {
        console.log(error)
      }
    }
  }

  readdirSync (fileDir) {
    let files = fs.readdirSync(fileDir)
    return Array.from(files, f => path.join(fileDir, f))
  }

  readFileSync (filepath) {
    return fs.readFileSync(filepath, 'utf8')
  }
  writeFileSync(filepath,data){
    return fs.writeFileSync(filepath,data);
  }

  // 通过appendChild script加载js
  loadFromLocal (filePath, type = 'js') {
    filePath = path.join(__dirname, '../../node_modules/' + filePath)
    return new Promise(async (resolve, reject) => {
      let res = await this.loadFromUrl(type, filePath)
      resolve(res)
    })
  }

  /**
   * 异步加载一个js文件或css文件，并执行回调函数
   * @param  {String}    fileType   文件类型
   * @param  {String}    src        链接地址
   * @return {Boolean}    true / false 成功与否
   * loadFromUrl('js','http://cdn.bootcss.com/jquery/2.1.1/jquery.min.js');
   */
  loadFromUrl (fileType = 'js', src) {
    // 获取head节点
    let head = document.head || document.getElementsByTagName('head')[0]

    return new Promise((resolve, reject) => {
      // 需要加载js文件
      if (fileType === 'js') {
        if (
          Array.from(
            head.querySelectorAll('script'),
            s => s.src.replace(/.*\:\/\//gi, '') === src
          ).filter(f => f).length === 0
        ) {
          // 创建script节点
          let script = document.createElement('script')
          script.type = 'text/javascript'
          // 设置script的src属性
          script.src = src
          // 将script元素插入head元素中
          head.appendChild(script)

          // 监听script元素的onload和onreadystatechange事件
          script.onload = script.onreadystatechange = () => {
            // 判断脚本是否加载完成
            if (
              !this.readyState ||
              this.readyState === 'loaded' ||
              this.readyState === 'complete'
            ) {
              resolve(true)
            }
          }

          // 监听onerror事件
          script.onerror = () => resolve(false)
        } else {
          // 已经有了
          resolve(true)
        }

        // 需要加载css文件
      } else if (fileType === 'css') {
        // 创建link节点
        let link = document.createElement('link')
        // 设置rel属性
        link.rel = 'stylesheet'
        // 设置type属性
        link.type = 'text/css'
        // 设置href属性
        link.href = src
        // 将link节点插入head
        head.appendChild(link)

        // 监听link元素的onload事件
        link.onload = () => resolve(true)
        // 监听onerror事件
        link.onerror = () => resolve(false)
      }
    })
  }

  // 暂时不推荐使用
  npmRun (cmd) {
    let dependencies = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
    ).dependencies
    console.log(dependencies)

    return new Promise((resolve, reject) => {
      if (cmd) {
        cmd = cmd.trim()
        cmd = cmd.split(' ')
        if (cmd[0] == 'npm') {
          //打印脚本的输出
          const subprocess = spawn('npm', cmd.slice(1, cmd.length))
          subprocess.stdout.on('data', data => {
            console.log(`data:${data}`)
          })
          subprocess.stderr.on('data', data => {
            console.log(`error:${data}`)
          })
          subprocess.stderr.on('close', () => {
            console.log('Closed')
            let dependenciesNew = JSON.parse(
              fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
            ).dependencies
            console.log(dependenciesNew)
            resolve()
          })
        }
      }
    })
  }

  // npm install probe-image-size
  getSize (url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          // console.log()
          resolve(blob.size / 1000 / 1000)
        })
    })
  }

  deg2rad (deg) {
    return (deg * Math.PI) / 180
  }
  // 当前窗口
  getCurrentWindow () {
    return remote.getCurrentWindow()
  }
  //
  openDevTools () {
    if (remote.getCurrentWindow()) remote.getCurrentWindow().openDevTools()
  }
  closeDevTools () {
    if (remote.getCurrentWindow()) remote.getCurrentWindow().closeDevTools()
  }
  toggleDevTools(){
    if (remote.getCurrentWindow()) {
      remote.getCurrentWindow().isDevToolsOpened()?this.closeDevTools():this.openDevTools()
    }
  }
}

module.exports = new Base()
