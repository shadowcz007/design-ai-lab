//主要完成html的一些基本的操作
// 文件存储
const { spawn } = require('child_process')
const hash = require('object-hash'),
  md5 = require('md5')
const fs = require('fs'),
  path = require('path')
const debounce = require('debounce')
const { nativeImage, remote } = require('electron')
const QRCode = require('qrcode')
const _DBPATH = remote.getGlobal('_DBPATH')

let https = require('https')
const mkcert = require('./mkcert')
const mime = require('mime-types')
const serverUrl = require('../server/serverUrl')

class Base {
  constructor () {
    this.path = path
    this.fs = fs
  }
  getRootPath () {
    return path.join(__dirname, '../..')
  }
  getDirName (filepath) {
    return path.dirname(filepath)
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

  // The charCodeAt() method returns an integer between 0 and 65535 representing the UTF-16 code unit at the given index.
  hashStringToInt (s) {
    return s.split('').reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
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

  medianArray (arr = []) {
    const middle = (arr.length + 1) / 2
    // 避免在排序时发生变异
    const sorted = [...arr].sort((a, b) => a - b)
    const isEven = sorted.length % 2 === 0
    return isEven
      ? (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2
      : sorted[middle - 1]
  }

  averageArray (nums) {
    return nums.reduce((a, b) => a + b) / nums.length
  }
  sumArray (nums) {
    return nums.reduce((a, b) => a + b)
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
      try {
        json = JSON.stringify(json)
        fs.writeFile(filepath, json, e => console.log(e))
      } catch (error) {
        console.log(error)
      }
    }
  }

  renameSync (oldPath, newPath) {
    return fs.renameSync(oldPath, newPath)
  }
  readdirSync (fileDir) {
    let files = fs.readdirSync(fileDir)
    return Array.from(files, f => path.join(fileDir, f))
  }

  readFileSync (filepath) {
    return fs.readFileSync(filepath, 'utf8')
  }
  writeFileSync (filepath, data) {
    return fs.writeFileSync(filepath, data)
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

  createQRCode (text = '') {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(text, function (err, base64) {
        resolve(base64)
      })
    })
  }

  // 检测端口是否被占用
  portIsOccupied (port) {
    const net = require('net')
    // 创建服务并监听该端口
    let server = net.createServer().listen(port)

    return new Promise((resolve, reject) => {
      server.on('listening', function () {
        // 执行这块代码说明端口未被占用
        server.close() // 关闭服务
        console.log('The port【' + port + '】 is available.') // 控制台输出信息
        resolve(true)
      })

      server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
          // 端口已经被使用
          console.log(
            'The port【' + port + '】 is occupied, please change other port.'
          )
          resolve(false)
        }
      })
    })
  }

  createContentType (filepath) {
    return { 'Content-type': mime.contentType(this.getExtName(filepath)) }
  }

  async startHttps (dirname) {
    if (!(await this.portIsOccupied(443))) {
      if (this.httpsServer) this.httpsServer.close()
      // return console.log(`https server fail`)
    }

    const doReq = (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Request-Method', '*')
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, DELETE'
      )
      res.setHeader('Access-Control-Allow-Headers', '*')
      // let reqUrlBase = req.url.replace(/\?.*/gi, '')
      console.log(req.url, this._filesUrl)

      let file = this._filesUrl[this.getBaseName(req.url)]
      if (file) {
        const html = fs.readFileSync(file)
        res.writeHead(200, this.createContentType(file))
        // res.write(`<h1>~</h1>`);
        res.end(html)
      }

      // if (reqUrlBase === '/') {
      //   const html = fs.readFileSync(dirname, 'utf8')
      //   res.writeHead(200, { 'Content-type': 'text/html' })
      //   // res.write(`<h1>~</h1>`);
      //   res.end(html)
      // }
    }
    return new Promise((resolve, reject) => {
      let files = this.readdirSync(dirname)
      this._filesUrl = {
        '/': 'index.html'
      }
      for (const file of files) {
        let basename = this.getBaseName(file)
        this._filesUrl[basename] = file
      }

      mkcert.create().then(opts => {
        this.httpsServer = https.createServer(opts, doReq)
        this.httpsServer.listen(443, async () => {
          console.log(` 🎉 https server running at `, serverUrl.get())
          let base64 = await this.createQRCode(serverUrl.get().url)
          resolve(base64)
        })
      })
    })
  }

  getCodeLanguage () {
    return [
      'C++',
      'HTML',
      'JavaScript',
      'Jupyter Notebook',
      'Python',
      'Rust',
      'TypeScript',
      'Unknown languages',
      '1C Enterprise',
      '4D',
      'ABAP',
      'ABAP CDS',
      'ABNF',
      'ActionScript',
      'Ada',
      'Adobe Font Metrics',
      'Agda',
      'AGS Script',
      'AIDL',
      'AL',
      'AL',
      'Alloy',
      'Alpine Abuild',
      'Altium Designer',
      'AMPL',
      'AngelScript',
      'Ant Build System',
      'ANTLR',
      'ApacheConf',
      'Apex',
      'API Blueprint',
      'APL',
      'Apollo Guidance Computer',
      'AppleScript',
      'Arc',
      'AsciiDoc',
      'ASL',
      'ASN.1',
      'Classic ASP',
      'ASP.NET',
      'AspectJ',
      'Assembly',
      'Astro',
      'Asymptote',
      'ATS',
      'Augeas',
      'AutoHotkey',
      'AutoIt',
      'Avro IDL',
      'Awk',
      'Ballerina',
      'BASIC',
      'Batchfile',
      'Beef',
      'Befunge',
      'BibTeX',
      'Bicep',
      'Bison',
      'BitBake',
      'Blade',
      'BlitzBasic',
      'BlitzMax',
      'Bluespec',
      'Boo',
      'Boogie',
      'Brainfuck',
      'Brightscript',
      'Zeek',
      'Browserslist',
      'C',
      'C#',
      'C-ObjDump',
      'C2hs Haskell',
      'Cabal Config',
      "Cap'n Proto",
      'CartoCSS',
      'Ceylon',
      'Chapel',
      'Charity',
      'ChucK',
      'CIL',
      'Cirru',
      'Clarion',
      'Classic ASP',
      'Clean',
      'Click',
      'CLIPS',
      'Clojure',
      'Closure Templates',
      'Cloud Firestore Security Rules',
      'CMake',
      'COBOL',
      'CODEOWNERS',
      'CodeQL',
      'CoffeeScript',
      'ColdFusion',
      'ColdFusion CFC',
      'COLLADA',
      'Common Lisp',
      'Common Workflow Language',
      'Component Pascal',
      'CoNLL-U',
      'Cool',
      'Coq',
      'Cpp-ObjDump',
      'Creole',
      'Crystal',
      'CSON',
      'Csound',
      'Csound Document',
      'Csound Score',
      'CSS',
      'CSV',
      'Cuda',
      'CUE',
      'cURL Config',
      'CWeb',
      'Cycript',
      'Cython',
      'D',
      'D-ObjDump',
      'Dafny',
      'Darcs Patch',
      'Dart',
      'DataWeave',
      'desktop',
      'Dhall',
      'Diff',
      'DIGITAL Command Language',
      'dircolors',
      'DirectX 3D File',
      'DM',
      'DNS Zone',
      'Dockerfile',
      'Dogescript',
      'DTrace',
      'Dylan',
      'E',
      'E-mail',
      'Eagle',
      'Earthly',
      'Easybuild',
      'EBNF',
      'eC',
      'Ecere Projects',
      'ECL',
      'ECLiPSe',
      'EditorConfig',
      'Edje Data Collection',
      'edn',
      'Eiffel',
      'EJS',
      'Elixir',
      'Elm',
      'Emacs Lisp',
      'EmberScript',
      'E-mail',
      'EQ',
      'Erlang',
      'F#',
      'F*',
      'Factor',
      'Fancy',
      'Fantom',
      'Faust',
      'Fennel',
      'FIGlet Font',
      'Filebench WML',
      'Filterscript',
      'fish',
      'Fluent',
      'FLUX',
      'Formatted',
      'Forth',
      'Fortran',
      'Fortran Free Form',
      'FreeBasic',
      'FreeMarker',
      'Frege',
      'Futhark',
      'G-code',
      'Game Maker Language',
      'GAML',
      'GAMS',
      'GAP',
      'GCC Machine Description',
      'GDB',
      'GDScript',
      'GEDCOM',
      'Gemfile.lock',
      'Genie',
      'Genshi',
      'Gentoo Ebuild',
      'Gentoo Eclass',
      'Gerber Image',
      'Gettext Catalog',
      'Gherkin',
      'Git Attributes',
      'Git Config',
      'GLSL',
      'Glyph',
      'Glyph Bitmap Distribution Format',
      'GN',
      'Gnuplot',
      'Go',
      'Go Checksums',
      'Go Module',
      'Golo',
      'Gosu',
      'Grace',
      'Gradle',
      'Grammatical Framework',
      'Graph Modeling Language',
      'GraphQL',
      'Graphviz (DOT)',
      'Groovy',
      'Groovy Server Pages',
      'Hack',
      'Haml',
      'Handlebars',
      'HAProxy',
      'Harbour',
      'Haskell',
      'Haxe',
      'HCL',
      'HiveQL',
      'HLSL',
      'HolyC',
      'Jinja',
      'HTML+ECR',
      'HTML+EEX',
      'HTML+ERB',
      'HTML+PHP',
      'HTML+Razor',
      'HTTP',
      'HXML',
      'Hy',
      'HyPhy',
      'IDL',
      'Idris',
      'Ignore List',
      'IGOR Pro',
      'ImageJ Macro',
      'Inform 7',
      'INI',
      'Inno Setup',
      'Io',
      'Ioke',
      'IRC log',
      'Isabelle',
      'Isabelle ROOT',
      'J',
      'Jasmin',
      'Java',
      'Java Properties',
      'Java Server Pages',
      'JavaScript+ERB',
      'JFlex',
      'Jinja',
      'Jison',
      'Jison Lex',
      'Jolie',
      'jq',
      'JSON',
      'JSON with Comments',
      'JSON5',
      'JSONiq',
      'JSONLD',
      'Jsonnet',
      'Julia',
      'Kaitai Struct',
      'KakouneScript',
      'KiCad Layout',
      'KiCad Legacy Layout',
      'KiCad Schematic',
      'Kit',
      'Kotlin',
      'KRL',
      'Kusto',
      'LabVIEW',
      'Lark',
      'Lasso',
      'Latte',
      'Lean',
      'Less',
      'Lex',
      'LFE',
      'LilyPond',
      'Limbo',
      'Linker Script',
      'Linux Kernel Module',
      'Liquid',
      'Literate Agda',
      'Literate CoffeeScript',
      'Literate Haskell',
      'LiveScript',
      'LLVM',
      'Logos',
      'Logtalk',
      'LOLCODE',
      'LookML',
      'LoomScript',
      'LSL',
      'LTspice Symbol',
      'Lua',
      'M',
      'M4',
      'M4Sugar',
      'Macaulay2',
      'Makefile',
      'Mako',
      'Markdown',
      'Marko',
      'Mask',
      'Mathematica',
      'MATLAB',
      'Maven POM',
      'Max',
      'MAXScript',
      'mcfunction',
      'Wikitext',
      'Mercury',
      'Meson',
      'Metal',
      'Microsoft Developer Studio Project',
      'Microsoft Visual Studio Solution',
      'MiniD',
      'Mirah',
      'mIRC Script',
      'MLIR',
      'Modelica',
      'Modula-2',
      'Modula-3',
      'Module Management System',
      'Monkey',
      'Moocode',
      'MoonScript',
      'Motoko',
      'Motorola 68K Assembly',
      'MQL4',
      'MQL5',
      'MTML',
      'MUF',
      'mupad',
      'Muse',
      'Mustache',
      'Myghty',
      'nanorc',
      'NASL',
      'NCL',
      'Nearley',
      'Nemerle',
      'NEON',
      'nesC',
      'NetLinx',
      'NetLinx+ERB',
      'NetLogo',
      'NewLisp',
      'Nextflow',
      'Nginx',
      'Nim',
      'Ninja',
      'Nit',
      'Nix',
      'NL',
      'NPM Config',
      'NSIS',
      'Nu',
      'NumPy',
      'Nunjucks',
      'NWScript',
      'ObjDump',
      'Object Data Instance Notation',
      'Objective-C',
      'Objective-C++',
      'Objective-J',
      'ObjectScript',
      'OCaml',
      'Odin',
      'Omgrofl',
      'ooc',
      'Opa',
      'Opal',
      'Open Policy Agent',
      'OpenCL',
      'OpenEdge ABL',
      'OpenQASM',
      'OpenRC runscript',
      'OpenSCAD',
      'OpenStep Property List',
      'OpenType Feature File',
      'Org',
      'Ox',
      'Oxygene',
      'Oz',
      'P4',
      'Pan',
      'Papyrus',
      'Parrot',
      'Parrot Assembly',
      'Parrot Internal Representation',
      'Pascal',
      'Pawn',
      'PEG.js',
      'Pep8',
      'Perl',
      'PHP',
      'Pic',
      'Pickle',
      'PicoLisp',
      'PigLatin',
      'Pike',
      'PlantUML',
      'PLpgSQL',
      'PLSQL',
      'Pod',
      'Pod 6',
      'PogoScript',
      'Pony',
      'PostCSS',
      'PostScript',
      'POV-Ray SDL',
      'PowerBuilder',
      'PowerShell',
      'Prisma',
      'Processing',
      'Proguard',
      'Prolog',
      'Promela',
      'Propeller Spin',
      'Protocol Buffer',
      'Public Key',
      'Pug',
      'Puppet',
      'Pure Data',
      'PureBasic',
      'PureScript',
      'Python console',
      'Python traceback',
      'q',
      'Q#',
      'QMake',
      'QML',
      'Qt Script',
      'Quake',
      'R',
      'Racket',
      'Ragel',
      'Raku',
      'RAML',
      'Rascal',
      'Raw token data',
      'RDoc',
      'Readline Config',
      'REALbasic',
      'Reason',
      'Rebol',
      'Red',
      'Redcode',
      'Regular Expression',
      "Ren'Py",
      'RenderScript',
      'ReScript',
      'reStructuredText',
      'REXX',
      'Rich Text Format',
      'Ring',
      'Riot',
      'RMarkdown',
      'RobotFramework',
      'robots.txt',
      'Roff',
      'Roff Manpage',
      'Rouge',
      'RPC',
      'RPM Spec',
      'Ruby',
      'RUNOFF',
      'Sage',
      'SaltStack',
      'SAS',
      'Sass',
      'Scala',
      'Scaml',
      'Scheme',
      'Scilab',
      'SCSS',
      'sed',
      'Self',
      'ShaderLab',
      'Shell',
      'ShellSession',
      'Shen',
      'Sieve',
      'Singularity',
      'Slash',
      'Slice',
      'Slim',
      'Smali',
      'Smalltalk',
      'Smarty',
      'SmPL',
      'SMT',
      'Solidity',
      'SourcePawn',
      'SPARQL',
      'Spline Font Database',
      'SQF',
      'SQL',
      'SQLPL',
      'Squirrel',
      'SRecode Template',
      'SSH Config',
      'Stan',
      'Standard ML',
      'Starlark',
      'Stata',
      'STON',
      'StringTemplate',
      'Stylus',
      'SubRip Text',
      'SugarSS',
      'SuperCollider',
      'Svelte',
      'SVG',
      'Swift',
      'SWIG',
      'SystemVerilog',
      'Tcl',
      'Tcsh',
      'Tea',
      'Terra',
      'TeX',
      'Texinfo',
      'Text',
      'Textile',
      'Thrift',
      'TI Program',
      'TLA',
      'TOML',
      'TSQL',
      'TSV',
      'TSX',
      'Turing',
      'Turtle',
      'Twig',
      'TXL',
      'Type Language',
      'Unified Parallel C',
      'Unity3D Asset',
      'Unix Assembly',
      'Uno',
      'UnrealScript',
      'UrWeb',
      'V',
      'Vala',
      'Valve Data Format',
      'VBA',
      'VBScript',
      'VCL',
      'Verilog',
      'VHDL',
      'Vim Help File',
      'Vim Script',
      'Vim Snippet',
      'Visual Basic .NET',
      'Visual Basic .NET',
      'Volt',
      'Vue',
      'Wavefront Material',
      'Wavefront Object',
      'wdl',
      'Web Ontology Language',
      'WebAssembly',
      'WebIDL',
      'WebVTT',
      'Wget Config',
      'Wikitext',
      'Windows Registry Entries',
      'wisp',
      'Wollok',
      'World of Warcraft Addon Data',
      'X BitMap',
      'X Font Directory Index',
      'X PixMap',
      'X10',
      'xBase',
      'XC',
      'XCompose',
      'XML',
      'XML Property List',
      'Xojo',
      'Xonsh',
      'XPages',
      'XProc',
      'XQuery',
      'XS',
      'XSLT',
      'Xtend',
      'Yacc',
      'YAML',
      'YANG',
      'YARA',
      'YASnippet',
      'ZAP',
      'Zeek',
      'ZenScript',
      'Zephir',
      'Zig',
      'ZIL',
      'Zimpl'
    ]
  }

  // // 当前窗口
  // getCurrentWindow () {
  //   return remote.getCurrentWindow()
  // }
  // //
  // openDevTools () {
  //   if (remote.getCurrentWindow()) remote.getCurrentWindow().openDevTools()
  // }
  // closeDevTools () {
  //   if (remote.getCurrentWindow()) remote.getCurrentWindow().closeDevTools()
  // }
  // toggleDevTools(){
  //   if (remote.getCurrentWindow()) {
  //     remote.getCurrentWindow().isDevToolsOpened()?this.closeDevTools():this.openDevTools()
  //   }
  // }
}

module.exports = new Base()
