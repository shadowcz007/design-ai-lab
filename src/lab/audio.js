const base = require('./base')

class AudioLab {
  constructor () {
    this.audioContext = null
    this.audio = null

    this.fps = 24
    this.volume = 0
  }
  init (url) {
    // Create a new audio context
    this.audioContext = new AudioContext()

    // Create <audio> tag
    this.audio = document.createElement('audio')

    // set URL to the MP3 within your Glitch.com assets
    this.audio.src = url

    // To play audio through Glitch.com CDN
    this.audio.crossOrigin = 'Anonymous'

    // Enable looping so the audio never stops
    this.audio.loop = true


    return new Promise((resolve, reject) => {
      // Upon loading the audio, let's play it
      this.audio.addEventListener(
        'canplay',
        () => {
          // First, ensure the context is in a resumed state
          this.audioContext.resume()
          // Now, play the audio
          this.audio.play();
          resolve(true);
        },
        { once: true }
      )

      // Create a "Media Element" source node
      const source = this.audioContext.createMediaElementSource(this.audio)

      // Create a master gain node that will handle volume control
      this.gainNode = this.audioContext.createGain()

      // Connect the source to the master gain
      source.connect(this.gainNode)

      // Create an Analyser Node
      let analyserNode = this.audioContext.createAnalyser()
      analyserNode.smoothingTimeConstant = 1

      // You can increase the detail to some power-of-two value
      // This will give you more samples of data per second
      const detail = 1
      analyserNode.fftSize = 2048 * detail

      // Create a Float32 array to hold the data
      this.analyserData = new Float32Array(analyserNode.fftSize)

      // Connect the GainNode to the analyser
      this.gainNode.connect(analyserNode)

      // Connect GainNode to destination as well
      this.gainNode.connect(this.audioContext.destination)

      // window.requestAnimationFrame(draw)
      analyserNode.getFloatTimeDomainData(this.analyserData);
      // Only update the data every N fps
      this.interval = setInterval(() => {
        analyserNode.getFloatTimeDomainData(this.analyserData)
      }, (1 / this.fps) * 1000)
    })
  }

  stop () {
    if (this.audio && this.audioContext) {
      this.audio.pause()
      this.audioContext.close()
      this.audioContext = this.audio = null
    }
  }

  // Get a new volume based on mouse position
  changeVolume () {
    // Schedule a gradual shift in value with a small time constant
    this.gainNode.gain.setTargetAtTime(
      this.volume,
      this.audioContext.currentTime,
      0.01
    )
  }

  output (minX, maxX, minY, maxY) {
    let points = []

    // Loop through each 'bin' and figure out the signal
    for (let i = 0; i < this.analyserData.length; i++) {
      // The signal (-1..1 range) at this time slice
      const signal = this.analyserData[i]

      // X screen position to draw this rectangle
      // const x = (i / analyserData.length) * window.innerWidth

      // Map sample to screen X position
      const x = base.map(i, 0, this.analyserData.length, minX, maxX)

      // Boost the signal a little so it shows better
      //   const size = window.amplitude / 2
      // Determine Y position of sample, away from centre
      // const size = window.innerHeight / 2

      const y = Lab.base.map(signal, -1, 1, minY, maxY)

      // ctx.arc(x - 0.5, y - 0.5, 1, 0, Math.PI)
      points.push({
        x,
        y
      })
    }

    // 均方根值是什么意思？ RMS(root mean square)

    //  答：均方根值也称作为效值，它的计算方法是先平方、再平均、然后开方。

    // 比如幅度为100V而占空比为0.5的方波信号，如果按平均值计算，它的电压只有50V，而按均方根值计算则有70.71V。这是为什么呢？

    // 举一个例子，有一组100伏的电池组，每次供电10分钟之后停10分钟，也就是说占空比为一半。如果这组电池带动的是10Ω电阻，供电的10分钟产生10A的电流和1000W的功率，停电时电流和功率为零。那么在20分钟的一个周期内其平均功率为500W，这相当于70.71V的直流电向10Ω电阻供电所产生的功率。而50V直流电压向10Ω电阻供电只能产生的250W的功率。对于电机与变压器而言，只要均方根电流不超过额定电流，既使在一定时间内过载，也不会烧坏。

    let mean = base.rootMeanSquaredArray(this.analyserData)
    mean = base.map(mean, 0, 1, Math.max(minX, minY), Math.min(maxX, maxY))
    return {
      points,
      mean
    }
  }
}

module.exports = AudioLab
