/* global Vue, Audio, AudioContext, Image, CU */
// NOTE: depends on shared functions in the components-utils.js file, ie. CU
Vue.component('play-audio', {
  props: [ 'file' ],
  data: function () {
    return {
      loading: false,
      data: null, // base64 data, ie. file.data
      raw: false, // interpreting as raw data or decoded image pixel data
      saved: {}, // store decoded data to avoid having to repeat
      actx: null,
      sound: null,
      playing: false,
      time: null,
      displayTime: null,
      css: `
        .play-audio img {
          max-width: 870px;
        }
        .play-audio .pa-header {
          display: flex;
          justify-content: space-between;
        }
        .play-audio .pa-btn {
          padding: 0px 5px;
          color: #000;
          background-color: #fff;
          cursor: pointer;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `
    }
  },
  mounted: function () {
    setInterval(() => this.updateTime(), 1000 / 60)

    // apply scoped CSS
    let name = this.$vnode.tag
    let styles = document.querySelectorAll('style')
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].id === name) {
        this.loadedCSS = true
        break
      }
    }
    if (!this.loadedCSS) {
      let style = document.createElement('style')
      style.type = 'text/css'
      style.id = name
      style.innerHTML = this.css
      document.querySelector('head').appendChild(style)
    }
  },
  watch: {
    file: function (newFile, oldFile) {
      if (newFile) {
        Vue.nextTick().then(() => {
          this.data = this.file.data
          this.saved = {}
        })
      }
    },
    data: function (newData, oldData) {
      if (newData) Vue.nextTick().then(() => this.handleData())
    },
    raw: function (newStatus, oldStatus) {
      if (this.playing) this.stop()
      this.handleData()
    }
  },
  methods: {
    displayTxt () {
      if (this.loading) return '...LOADING...'
      else if (this.data && this.data.indexOf('data:image') === 0) {
        if (this.raw) return 'loaded raw image data'
        else return 'loaded decoded image data'
      } else if (this.data && this.data.indexOf('data:audio') === 0) {
        return 'loaded audio file'
      } else if (this.data && this.data.indexOf('data:text') === 0) {
        return 'loaded raw text data'
      } else {
        return 'no data has been uploaded to play'
      }
    },
    s2m (s) {
      let f = (s - (s %= 60)) / 60 + (s > 9 ? ':' : ':0') + s
      return f.split('.')[0]
    },
    updateTime () {
      if (this.sound && this.playing) {
        if (this.sound.currentTime) {
          let now = this.s2m(this.sound.currentTime)
          let total = this.s2m(this.sound.duration)
          now = (now.split(':')[1].length < 2) ? now + '0' : now
          this.displayTime = `${now} / ${total}`
        } else if (this.sound.buffer) {
          let now = this.s2m(this.actx.currentTime - this.time)
          let total = this.s2m(this.sound.buffer.duration)
          now = (now.split(':')[1].length < 2) ? now + '0' : now
          this.displayTime = `${now} / ${total}`
        } else {
          this.displayTime = '00:00'
        }
      }
    },
    reset () {
      this.displayTime = '00:00'
      this.time = null
      this.playing = false
    },
    play () {
      if (this.sound instanceof Audio) this.sound.play()
      else {
        if (!this.time) this.time = this.actx.currentTime
        this.sound = this.actx.createBufferSource()
        if (this.data.includes('data:text') || this.raw) {
          this.sound.buffer = this.saved.rawDataBuffer
        } else this.sound.buffer = this.saved.decodedImageBuffer
        this.sound.connect(this.actx.destination)
        this.sound.onended = () => { this.reset() }
        this.sound.start()
      }
      this.playing = true
    },
    stop () {
      if (this.sound instanceof Audio) {
        this.sound.pause()
        this.sound.currentTime = 0
      } else this.sound.stop()
      this.reset()
    },
    handleData () {
      this.loading = true
      if (this.playing) this.stop()
      if (this.data.includes('data:audio')) this.playAudioData()
      else if (!this.raw && this.data.includes('data:image')) this.playDecodedImage()
      else this.playRawData()
    },
    playAudioData () {
      this.sound = new Audio(this.data)
      this.sound.onended = () => { this.reset() }
      this.sound.oncanplaythrough = () => { this.loading = false }
    },
    playDecodedImage () {
      if (this.saved.decodedImageBuffer) {
        this.loading = false
        return
      }
      if (!this.actx) this.actx = new AudioContext()
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      let img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        let d = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let chnls = 2
        let sr = this.actx.sampleRate
        this.saved.decodedImageBuffer = this.actx.createBuffer(chnls, d.data.length / chnls, sr)
        for (let ch = 0; ch < chnls; ch++) {
          let nowBuffer = this.saved.decodedImageBuffer.getChannelData(ch)
          this.actx.createBuffer(chnls, d.data.length / chnls, sr)
          for (let i = 0; i < d.data.length; i++) {
            nowBuffer[i] = CU.map(d.data[i], 0, 255, -1, 1)
          }
        }
        this.sound = this.actx.createBufferSource()
        this.loading = false
      }
      img.src = this.data
    },
    playRawData () {
      if (this.saved.rawDataBuffer) {
        this.loading = false
        return
      }
      if (!this.actx) this.actx = new AudioContext()
      let chnls = 2
      let sr = this.actx.sampleRate
      let data = CU.base64ToArrayBuffer(this.data)
      this.saved.rawDataBuffer = this.actx.createBuffer(chnls, data.length / 2, sr)
      for (let ch = 0; ch < chnls; ch++) {
        let nowBuffer = this.saved.rawDataBuffer.getChannelData(ch)
        for (let i = 0; i < data.length / 2; i++) {
          nowBuffer[i] = CU.map(data[i], 32, 127, -1, 1)
        }
      }
      this.sound = this.actx.createBufferSource()
      this.loading = false
    }
  },
  template: `<section class="play-audio">
    <div class="pa-header">
      <div> AUDIO PLAYER </div>
      <div>
        {{ displayTxt() }}
        <span v-if="displayTxt().includes('image')">
          <span v-if="raw" class="pa-btn" @click="raw=!raw">switch to decoded</span>
          <span v-else class="pa-btn" @click="raw=!raw">switch to raw</span>
        </span>
      </div>
      <div>
        <div v-if="data">
          <span>{{ displayTime }}</span>
          <span v-if="playing" @click="stop()" class="pa-btn">◼ stop</span>
          <span v-else @click="play()" class="pa-btn">▶ play</span>
        </div>
      </div>
    </div>
  </section>`
})
