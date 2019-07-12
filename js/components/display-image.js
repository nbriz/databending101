/* global Vue, AudioContext, CU */
// NOTE: depends on shared functions in the components-utils.js file, ie. CU
Vue.component('display-image', {
  props: [ 'file', 'minimal' ],
  data: function () {
    return {
      loading: false,
      data: null, // base64 data, ie. file.data
      raw: false, // interpreting as raw data or decoded audio buffer data
      saved: {}, // store decoded data to avoid having to repeat
      canvas: null,
      ctx: null,
      actx: null,
      scale: 1,
      css: `
        .display-image img {
          max-width: 870px;
        }
        .display-image .di-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #fff;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .display-image .di-btn {
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
        .display-image canvas {
          image-rendering: optimizeSpeed;
          image-rendering: -moz-crisp-edges;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: -o-crisp-edges;
          image-rendering: pixelated;
          -ms-interpolation-mode: nearest-neighbor;
        }
      `
    }
  },
  mounted: function () {
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
      this.handleData()
    }
  },
  methods: {
    displayTxt () {
      if (this.data && this.data.indexOf('data:image') === 0) {
        return 'loaded image file'
      } else if (this.loading) return '...LOADING...'
      else if (this.data && this.data.indexOf('data:audio') === 0) {
        if (this.raw) return 'loaded raw audio data'
        else return 'loaded decoded audio data'
      } else if (this.data && this.data.indexOf('data:text') === 0) {
        return 'loaded raw text text'
      } else {
        return 'no data has been uploaded to display'
      }
    },
    scaleCanvas (val) {
      if (this.scale > 1) {
        if (val > 0) this.scale++
        else this.scale--
      } else {
        if (val > 0) this.scale *= 2
        else this.scale *= 0.5
      }
      let canvas = this.$refs.canvas
      canvas.style.width = canvas.width * this.scale + 'px'
      canvas.style.height = canvas.height * this.scale + 'px'
    },
    calcCanvasSize (canvas, length) {
      let size = Math.round(Math.sqrt(length))
      let width
      let height
      if (size > 870) {
        width = 870
        height = Math.ceil(length / width)
      } else {
        width = size
        height = size
      }
      canvas.width = width
      canvas.height = height
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      return { width, height }
    },
    handleData () {
      if (this.data.includes('data:image')) return null
      else {
        this.loading = true
        let canvas = this.$refs.canvas
        let ctx = this.$refs.canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        let data = CU.base64ToArrayBuffer(this.data)
        if (this.data.includes('data:audio') && !this.raw) {
          this.drawDecodedAudioData(canvas, ctx, data)
        } else {
          this.drawRawData(canvas, ctx, data)
        }
      }
    },
    drawRawData (canvas, ctx, data) {
      if (this.saved.rawImgData) {
        this.loading = false
        ctx.putImageData(this.saved.rawImgData, 0, 0)
        return
      }
      let size = this.calcCanvasSize(canvas, data.length / 3)
      let img = ctx.createImageData(size.width, size.height)
      let p = 0
      for (let i = 0; i < data.length; i += 3) {
        img.data[p] = data[i]
        img.data[p + 1] = data[i + 1]
        img.data[p + 2] = data[i + 2]
        img.data[p + 3] = 255
        p += 4
      }
      ctx.putImageData(img, 0, 0)
      this.rawImgData = img
      this.loading = false
    },
    drawDecodedAudioData (canvas, ctx, data) {
      if (this.saved.decodedImgData) {
        ctx.putImageData(this.saved.decodedImgData, 0, 0)
        this.loading = false
        return
      }
      if (!this.actx) this.actx = new AudioContext()
      this.actx.decodeAudioData(data.buffer, (buffer) => {
        let channelData = buffer.getChannelData(0)
        let size = this.calcCanvasSize(canvas, channelData.length)
        let tweak = 0.75
        let img = ctx.createImageData(size.width, size.height)
        channelData.forEach((v, i) => {
          // this part remix'd from Suz Hinton
          // via: https://ponyfoo.com/articles/web-audio-art
          let val = Math.ceil((v + 1) * 255 / 2) // clamp 0 - 255
          let rgba = this.hslToRgba(val / tweak, 255, 150, 255)
          let start = i * 4
          for (let c = 0; c < rgba.length; c++) img.data[start + c] = rgba[c]
        })
        ctx.putImageData(img, 0, 0)
        this.saved.decodedImgData = img
        this.loading = false
      })
    },
    hslToRgba (h, s, l, a) {
      let r, g, b

      h = h / 255
      s = s / 255
      l = l / 255

      function convert (p, q, t) {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      let q = l < 0.5 ? l * (1 + s) : l + s - l * s
      let p = 2 * l - q
      r = convert(p, q, h + 1 / 3)
      g = convert(p, q, h)
      b = convert(p, q, h - 1 / 3)

      return [r * 255, g * 255, b * 255, a]
    }
  },
  template: `<section class="display-image">
    <div class="di-header">
      <div> IMAGE VIEWER </div>
      <div v-if="!minimal">
        {{ displayTxt() }}
        <span v-if="actx && !loading">
          <span v-if="raw" class="di-btn" @click="raw=!raw">switch to decoded</span>
          <span v-else class="di-btn" @click="raw=!raw">switch to raw</span>
        </span>
      </div>
      <div>
        <div v-if="data && data.indexOf('image') < 0 && !loading">
          zoom:
          <span @click="scaleCanvas(-1)" class="di-btn">-</span>
          <span @click="scaleCanvas(1)" class="di-btn">+</span>
        </div>
      </div>
    </div>
    <img v-if="data && data.includes('data:image')" :src="data"/>
    <canvas v-else-if="data" ref="canvas"></canvas>
  </section>`
})
