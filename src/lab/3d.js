const base = require('./base')
const fontData = `<font>
    <info face="OpenSans-SemiBold" size="42" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="1" aa="1" padding="0,0,0,0" spacing="0,0" />
    <common lineHeight="45" base="34" scaleW="2048" scaleH="2048" pages="1" packed="0" alphaChnl="0" redChnl="0" greenChnl="0" blueChnl="0" />
    <pages>
      <page id="0" file="OpenSans-SemiBold.png" />
    </pages>
    <distanceField fieldType="msdf" distanceRange="4" />
    <chars count="95">
      <char id="87" index="58" char="W" width="43" height="34" xoffset="-2" yoffset="4" xadvance="40" chnl="15" x="0" y="0" page="0" />
      <char id="64" index="35" char="@" width="37" height="38" xoffset="0" yoffset="4" xadvance="38" chnl="15" x="44" y="0" page="0" />
      <char id="81" index="52" char="Q" width="32" height="42" xoffset="0" yoffset="4" xadvance="33" chnl="15" x="0" y="35" page="0" />
      <char id="37" index="8" char="%" width="37" height="35" xoffset="0" yoffset="4" xadvance="36" chnl="15" x="82" y="0" page="0" />
      <char id="77" index="48" char="M" width="35" height="34" xoffset="2" yoffset="4" xadvance="39" chnl="15" x="120" y="0" page="0" />
      <char id="38" index="9" char="&amp;" width="33" height="35" xoffset="0" yoffset="4" xadvance="31" chnl="15" x="156" y="0" page="0" />
      <char id="79" index="50" char="O" width="32" height="35" xoffset="0" yoffset="4" xadvance="33" chnl="15" x="120" y="35" page="0" />
      <char id="65" index="36" char="A" width="32" height="34" xoffset="-2" yoffset="4" xadvance="28" chnl="15" x="82" y="36" page="0" />
      <char id="88" index="59" char="X" width="30" height="34" xoffset="-2" yoffset="4" xadvance="26" chnl="15" x="33" y="39" page="0" />
      <char id="86" index="57" char="V" width="30" height="34" xoffset="-2" yoffset="4" xadvance="26" chnl="15" x="190" y="0" page="0" />
      <char id="71" index="42" char="G" width="29" height="35" xoffset="0" yoffset="4" xadvance="30" chnl="15" x="221" y="0" page="0" />
      <char id="109" index="80" char="m" width="37" height="27" xoffset="1" yoffset="11" xadvance="40" chnl="15" x="251" y="0" page="0" />
      <char id="121" index="92" char="y" width="27" height="37" xoffset="-2" yoffset="11" xadvance="23" chnl="15" x="190" y="35" page="0" />
      <char id="119" index="90" char="w" width="37" height="27" xoffset="-2" yoffset="11" xadvance="34" chnl="15" x="64" y="71" page="0" />
      <char id="35" index="6" char="#" width="29" height="34" xoffset="-1" yoffset="4" xadvance="27" chnl="15" x="33" y="74" page="0" />
      <char id="89" index="60" char="Y" width="29" height="34" xoffset="-2" yoffset="4" xadvance="25" chnl="15" x="0" y="78" page="0" />
      <char id="78" index="49" char="N" width="29" height="34" xoffset="2" yoffset="4" xadvance="33" chnl="15" x="153" y="36" page="0" />
      <char id="103" index="74" char="g" width="26" height="37" xoffset="-2" yoffset="11" xadvance="23" chnl="15" x="102" y="71" page="0" />
      <char id="68" index="39" char="D" width="28" height="34" xoffset="2" yoffset="4" xadvance="31" chnl="15" x="63" y="99" page="0" />
      <char id="85" index="56" char="U" width="28" height="34" xoffset="2" yoffset="4" xadvance="31" chnl="15" x="30" y="109" page="0" />
      <char id="72" index="43" char="H" width="28" height="34" xoffset="2" yoffset="4" xadvance="32" chnl="15" x="0" y="113" page="0" />
      <char id="67" index="38" char="C" width="27" height="35" xoffset="0" yoffset="4" xadvance="27" chnl="15" x="129" y="71" page="0" />
      <char id="112" index="83" char="p" width="25" height="37" xoffset="1" yoffset="11" xadvance="26" chnl="15" x="157" y="71" page="0" />
      <char id="113" index="84" char="q" width="25" height="37" xoffset="0" yoffset="11" xadvance="26" chnl="15" x="129" y="107" page="0" />
      <char id="84" index="55" char="T" width="27" height="34" xoffset="-1" yoffset="4" xadvance="24" chnl="15" x="92" y="109" page="0" />
      <char id="75" index="46" char="K" width="27" height="34" xoffset="2" yoffset="4" xadvance="27" chnl="15" x="59" y="134" page="0" />
      <char id="36" index="7" char="$" width="24" height="38" xoffset="0" yoffset="2" xadvance="24" chnl="15" x="29" y="144" page="0" />
      <char id="98" index="69" char="b" width="25" height="36" xoffset="1" yoffset="2" xadvance="26" chnl="15" x="0" y="148" page="0" />
      <char id="100" index="71" char="d" width="25" height="36" xoffset="0" yoffset="2" xadvance="26" chnl="15" x="87" y="144" page="0" />
      <char id="82" index="53" char="R" width="26" height="34" xoffset="2" yoffset="4" xadvance="27" chnl="15" x="54" y="169" page="0" />
      <char id="52" index="23" char="4" width="26" height="34" xoffset="-1" yoffset="4" xadvance="24" chnl="15" x="26" y="183" page="0" />
      <char id="104" index="75" char="h" width="24" height="36" xoffset="1" yoffset="2" xadvance="27" chnl="15" x="0" y="185" page="0" />
      <char id="107" index="78" char="k" width="24" height="36" xoffset="1" yoffset="2" xadvance="24" chnl="15" x="289" y="0" page="0" />
      <char id="66" index="37" char="B" width="25" height="34" xoffset="2" yoffset="4" xadvance="28" chnl="15" x="251" y="28" page="0" />
      <char id="90" index="61" char="Z" width="25" height="34" xoffset="-1" yoffset="4" xadvance="24" chnl="15" x="218" y="36" page="0" />
      <char id="55" index="26" char="7" width="25" height="34" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="314" y="0" page="0" />
      <char id="51" index="22" char="3" width="24" height="35" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="340" y="0" page="0" />
      <char id="57" index="28" char="9" width="24" height="35" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="314" y="35" page="0" />
      <char id="56" index="27" char="8" width="24" height="35" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="277" y="37" page="0" />
      <char id="54" index="25" char="6" width="24" height="35" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="244" y="63" page="0" />
      <char id="48" index="19" char="0" width="24" height="35" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="218" y="71" page="0" />
      <char id="80" index="51" char="P" width="24" height="34" xoffset="2" yoffset="4" xadvance="26" chnl="15" x="183" y="73" page="0" />
      <char id="50" index="21" char="2" width="24" height="34" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="365" y="0" page="0" />
      <char id="83" index="54" char="S" width="23" height="35" xoffset="0" yoffset="4" xadvance="23" chnl="15" x="390" y="0" page="0" />
      <char id="53" index="24" char="5" width="23" height="34" xoffset="0" yoffset="4" xadvance="24" chnl="15" x="365" y="35" page="0" />
      <char id="63" index="34" char="?" width="22" height="35" xoffset="-2" yoffset="4" xadvance="19" chnl="15" x="339" y="36" page="0" />
      <char id="76" index="47" char="L" width="22" height="34" xoffset="2" yoffset="4" xadvance="23" chnl="15" x="302" y="71" page="0" />
      <char id="123" index="94" char="{" width="18" height="41" xoffset="-1" yoffset="4" xadvance="16" chnl="15" x="269" y="73" page="0" />
      <char id="125" index="96" char="}" width="18" height="41" xoffset="-1" yoffset="4" xadvance="16" chnl="15" x="243" y="99" page="0" />
      <char id="102" index="73" char="f" width="20" height="36" xoffset="-1" yoffset="2" xadvance="15" chnl="15" x="208" y="107" page="0" />
      <char id="69" index="40" char="E" width="21" height="34" xoffset="2" yoffset="4" xadvance="23" chnl="15" x="183" y="108" page="0" />
      <char id="70" index="41" char="F" width="21" height="34" xoffset="2" yoffset="4" xadvance="22" chnl="15" x="155" y="109" page="0" />
      <char id="118" index="89" char="v" width="26" height="27" xoffset="-2" yoffset="11" xadvance="22" chnl="15" x="177" y="143" page="0" />
      <char id="120" index="91" char="x" width="26" height="27" xoffset="-1" yoffset="11" xadvance="23" chnl="15" x="113" y="145" page="0" />
      <char id="111" index="82" char="o" width="25" height="28" xoffset="0" yoffset="11" xadvance="26" chnl="15" x="140" y="145" page="0" />
      <char id="92" index="63" char="\\" width="20" height="34" xoffset="-2" yoffset="4" xadvance="16" chnl="15" x="113" y="173" page="0" />
      <char id="47" index="18" char="/" width="20" height="34" xoffset="-2" yoffset="4" xadvance="16" chnl="15" x="81" y="181" page="0" />
      <char id="106" index="77" char="j" width="15" height="45" xoffset="-4" yoffset="3" xadvance="12" chnl="15" x="53" y="204" page="0" />
      <char id="74" index="45" char="J" width="16" height="42" xoffset="-5" yoffset="4" xadvance="13" chnl="15" x="25" y="218" page="0" />
      <char id="101" index="72" char="e" width="24" height="28" xoffset="0" yoffset="11" xadvance="24" chnl="15" x="0" y="222" page="0" />
      <char id="110" index="81" char="n" width="24" height="27" xoffset="1" yoffset="11" xadvance="27" chnl="15" x="0" y="251" page="0" />
      <char id="117" index="88" char="u" width="24" height="27" xoffset="1" yoffset="11" xadvance="27" chnl="15" x="414" y="0" page="0" />
      <char id="97" index="68" char="a" width="23" height="28" xoffset="0" yoffset="11" xadvance="24" chnl="15" x="439" y="0" page="0" />
      <char id="116" index="87" char="t" width="19" height="32" xoffset="-1" yoffset="6" xadvance="17" chnl="15" x="414" y="28" page="0" />
      <char id="60" index="31" char="&lt;" width="24" height="25" xoffset="0" yoffset="8" xadvance="24" chnl="15" x="389" y="36" page="0" />
      <char id="62" index="33" char=">" width="24" height="25" xoffset="0" yoffset="8" xadvance="24" chnl="15" x="463" y="0" page="0" />
      <char id="115" index="86" char="s" width="21" height="28" xoffset="0" yoffset="11" xadvance="20" chnl="15" x="488" y="0" page="0" />
      <char id="99" index="70" char="c" width="21" height="28" xoffset="0" yoffset="11" xadvance="21" chnl="15" x="463" y="26" page="0" />
      <char id="49" index="20" char="1" width="17" height="34" xoffset="1" yoffset="4" xadvance="24" chnl="15" x="434" y="29" page="0" />
      <char id="43" index="14" char="+" width="24" height="24" xoffset="0" yoffset="9" xadvance="24" chnl="15" x="389" y="62" page="0" />
      <char id="94" index="65" char="^" width="25" height="23" xoffset="-1" yoffset="4" xadvance="23" chnl="15" x="362" y="70" page="0" />
      <char id="41" index="12" char=")" width="14" height="41" xoffset="-1" yoffset="4" xadvance="13" chnl="15" x="414" y="61" page="0" />
      <char id="40" index="11" char="(" width="14" height="41" xoffset="0" yoffset="4" xadvance="13" chnl="15" x="388" y="87" page="0" />
      <char id="93" index="64" char="]" width="14" height="41" xoffset="-1" yoffset="4" xadvance="14" chnl="15" x="325" y="72" page="0" />
      <char id="91" index="62" char="[" width="14" height="41" xoffset="1" yoffset="4" xadvance="14" chnl="15" x="340" y="72" page="0" />
      <char id="122" index="93" char="z" width="21" height="27" xoffset="-1" yoffset="11" xadvance="20" chnl="15" x="355" y="94" page="0" />
      <char id="42" index="13" char="*" width="24" height="23" xoffset="0" yoffset="2" xadvance="23" chnl="15" x="288" y="106" page="0" />
      <char id="114" index="85" char="r" width="18" height="27" xoffset="1" yoffset="11" xadvance="18" chnl="15" x="262" y="115" page="0" />
      <char id="61" index="32" char="=" width="24" height="16" xoffset="0" yoffset="13" xadvance="24" chnl="15" x="229" y="141" page="0" />
      <char id="124" index="95" char="|" width="8" height="46" xoffset="8" yoffset="2" xadvance="23" chnl="15" x="166" y="144" page="0" />
      <char id="59" index="30" char=";" width="11" height="33" xoffset="-1" yoffset="11" xadvance="12" chnl="15" x="302" y="37" page="0" />
      <char id="33" index="4" char="!" width="10" height="35" xoffset="1" yoffset="4" xadvance="12" chnl="15" x="102" y="181" page="0" />
      <char id="108" index="79" char="l" width="9" height="36" xoffset="1" yoffset="2" xadvance="12" chnl="15" x="42" y="218" page="0" />
      <char id="105" index="76" char="i" width="9" height="35" xoffset="1" yoffset="3" xadvance="12" chnl="15" x="452" y="29" page="0" />
      <char id="73" index="918" char="I" width="9" height="34" xoffset="2" yoffset="4" xadvance="13" chnl="15" x="403" y="87" page="0" />
      <char id="58" index="29" char=":" width="10" height="28" xoffset="1" yoffset="11" xadvance="12" chnl="15" x="377" y="94" page="0" />
      <char id="34" index="5" char="&quot;" width="17" height="15" xoffset="1" yoffset="4" xadvance="18" chnl="15" x="64" y="39" page="0" />
      <char id="126" index="97" char="~" width="24" height="10" xoffset="0" yoffset="16" xadvance="24" chnl="15" x="204" y="144" page="0" />
      <char id="96" index="67" char="\`" width="14" height="11" xoffset="5" yoffset="2" xadvance="25" chnl="15" x="64" y="55" page="0"/>
      <char id="95" index="66" char="_" width="22" height="7" xoffset="-2" yoffset="38" xadvance="18" chnl="15" x="429" y="64" page="0" />
      <char id="44" index="15" char="," width="11" height="14" xoffset="-1" yoffset="29" xadvance="11" chnl="15" x="69" y="204" page="0" />
      <char id="39" index="10" char="'" width="9" height="15" xoffset="1" yoffset="4" xadvance="10" chnl="15" x="208" y="73" page="0" />
      <char id="45" index="16" char="-" width="15" height="8" xoffset="-1" yoffset="21" xadvance="14" chnl="15" x="81" y="216" page="0" />
      <char id="46" index="17" char="." width="10" height="10" xoffset="1" yoffset="28" xadvance="12" chnl="15" x="313" y="106" page="0" />
      <char id="32" index="3" char=" " width="0" height="0" xoffset="-2" yoffset="34" xadvance="11" chnl="15" x="153" y="35" page="0" />
    </chars>
    <kernings count="0" />
  </font>`
class TD {
  constructor (components) {
    this.componentsURL = {
      three: 'three/build/three.min.js',
      OrbitControls: 'three/examples/js/controls/OrbitControls.js',
      TransformControls:'three/examples/js/controls/TransformControls.js',
      RoomEnvironment: 'three/examples/js/environments/RoomEnvironment.js',
      EffectComposer: 'three/examples/js/postprocessing/EffectComposer.js',
      stats: 'three/examples/js/libs/stats.min.js',
      TextGeometry: 'three/examples/js/geometries/TextGeometry.js',
      FontLoader: 'three/examples/js/loaders/FontLoader.js',
      OBJLoader: 'three/examples/js/loaders/OBJLoader.js',
      GLTFLoader: 'three/examples/js/loaders/GLTFLoader.js'
    }
    this.load = this.initTHREE(components)
  }

  async initTHREE (
    components = [
      'OrbitControls',
      'RoomEnvironment',
      'EffectComposer',
      'stats',
      'GLTFLoader',
      'OBJLoader'
    ]
  ) {
    return new Promise((resolve, rej) => {
      base.loadFromLocal(this.componentsURL['three']).then(() => {
        console.log('load threejs')
        Promise.all(
          Array.from(components, c => {
            return new Promise((resolve, reject) => {
              base.loadFromLocal(this.componentsURL[c]).then(() => {
                console.log(c)
                resolve(c)
              })
            })
          })
        ).then(res => resolve(res))
      })
    })
  }

  init () {
    // this.initFont();
    this.initRenderer()
    this.initCamera()
    this.initScene()
    this.createRenderTarget()
    // this.animate()
    // this.addEvents()
  }
  initFont () {
    // console.log(__dirname)
    let createGeometry = require('@kilokilo/three-bmfont-text'),
      MSDFShader = require('@kilokilo/three-bmfont-text/shaders/msdf')
    let font = require('parse-bmfont-xml')(fontData)

    let createGeometry2 = t => {
      return createGeometry({
        font,
        text
      })
    }
    let createMaterial = () => {
      let fontAtlas = '../assets/flowfont.png'
      const loader = new THREE.TextureLoader()
      return new Promise(resolve => {
        loader.load(fontAtlas, texture => {
          const fontMaterial = new THREE.RawShaderMaterial(
            MSDFShader({
              map: texture,
              side: THREE.DoubleSide,
              transparent: true,
              negate: false,
              color: 0xffffff
            })
          )
          resolve(fontMaterial)
        })
      })
    }
  }

  initScene () {
    this.scene = new THREE.Scene()

    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    )

    this.clock = new THREE.Clock()
  }

  initRenderer (
    opts = {
      webgl: true,
      opts: { alpha: true }
    }
  ) {
    if (opts.webgl) {
      this.renderer = new THREE.WebGLRenderer(opts.opts)
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 1)
    // document.body.appendChild(this.renderer.domElement)
  }
  initCamera () {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    )

    this.camera.position.z = 5
  }
  createRenderTarget () {
    // Render Target setup
    this.rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)
    this.rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    this.rtCamera.position.z = 2.5

    this.rtScene = new THREE.Scene()
    this.rtScene.background = new THREE.Color('#000000')
  }

  loadFont (fontName = 'optimer', fontWeight = 'bold') {
    // fontName = 'optimer', // helvetiker, optimer, gentilis, droid sans, droid serif
    // fontWeight = 'bold'; // normal bold
    return new Promise((resolve, reject) => {
      const loader = new THREE.FontLoader()
      loader.load(
        base.path.join(
          __dirname,
          `../../node_modules/three/examples/fonts/${fontName}_${fontWeight}.typeface.json`
        ),
        function (response) {
          resolve(response)
          // font = response
          //refreshText();
        }
      )
    })
  }

  createTextGeometry (
    text,
    font,
    size = 70,
    height = 20,
    curveSegments = 4,
    bevelThickness = 2,
    bevelSize = 1.5,
    bevelEnabled = true
  ) {
    let textGeo = new THREE.TextGeometry(text, {
      font: font,
      size: size,
      height: height,
      curveSegments: curveSegments,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled
    })

    // textGeo.computeBoundingBox()

    // const centerOffset =
    //   -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)

    // textMesh1 = new THREE.Mesh(textGeo, materials)
    return textGeo
  }

  createText (text) {
    if (!this.bmfont) this.initFont()

    return new Promise((resolve, reject) => {
      this.bmfont.loadFontText(text).then((fontGeometry, fontMaterial) => {
        // Create text mesh with font geometry and material
        let text = new THREE.Mesh(fontGeometry, fontMaterial)

        // Adjust dimensions
        text.position.set(-0.965, -0.275, 0)
        text.rotation.set(Math.PI, 0, 0)
        text.scale.set(0.008, 0.02, 1)

        // Add text mesh to buffer scene
        //this.rtScene.add(text);
        // this.scene.add(text) // We'll add the RT mesh to the main scene for now
        resolve(text)
      })
    })
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }

  render () {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this))
  }

  resize () {
    let width = window.innerWidth
    let height = window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }
}

module.exports = TD
