/* global Vue */
Vue.component('mapped-data', {
  data: function () {
    return {
      bytes: [
        84, 104, 105, 115, 32, 70, 105, 108, 101, 32, 73, 115, 32, 74,
        117, 115, 116, 32, 78, 117, 109, 98, 101, 114, 115
      ],
      ascii: null,
      canvas: null,
      ctx: null,
      css: `
        .mapped-data div.md-title {
          border: 1px solid #fff;
          padding: 10px;
        }
        .mapped-data section {
          margin: 20px auto 40px auto;
        }
        .mapped-data span.md-data input {
          border: none;
          padding: 8px;
          width: 50px;
          margin: 4px;
          background-color: #333;
          color: #fff;
        }
        .mapped-data span.md-ascii {
          font-family: sans;
          font-size: 28px;
        }
      `
    }
  },
  mounted: function () {
    this.updateAscii()
    this.updateCanvas()

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
  methods: {
    fixByte (n) {
      if (n < 0) return 0
      else if (n > 255) return 255
      else return n
    },
    onByteChange (e, i) {
      e.target.value = this.fixByte(e.target.value)
      this.byteUpdate(i, e.target.value)
    },
    onByteInput (e, i) {
      e.target.value = this.fixByte(e.target.value)
      this.byteUpdate(i, e.target.value)
    },
    byteUpdate (index, value) {
      this.bytes[index] = value
      this.updateAscii()
      this.updateCanvas()
    },
    updateAscii () {
      let str = ''
      this.bytes.forEach(n => { str += String.fromCharCode(n) })
      this.ascii = str
    },
    updateCanvas () {
      let canvas = this.$refs.canvas
      let ctx = this.$refs.canvas.getContext('2d')
      let scale = 50
      canvas.width = 5 * scale
      canvas.height = 5 * scale
      let i = 0
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          let n = this.bytes[i]
          ctx.fillStyle = `rgb(${n},${n},${n})`
          ctx.fillRect(x * scale, y * scale, scale, scale)
          // ctx.fillStyle = '#fff'
          // ctx.font = '10px Sans-Serif'
          // ctx.textBaseline = 'top'
          // ctx.textAlign = 'left'
          // ctx.fillText(n, x * scale + scale / 4, y * scale + scale / 4)
          i++
        }
      }
    }
  },
  template: `<section class="mapped-data">

    <div class="md-title">
      25 raw bytes represented in base 10 (click buttons to edit)
    </div>

    <section>
      <span v-for="(b,i) in bytes" class="md-data">
        <input type="number" :value="b" min="0" max="255" step="1"
        @input="(e)=>onByteInput(e,i)" @change="(e)=>onByteChange(e,i)">
      </span>
    </section>

    <div class="md-title">
      the bytes decoded as ASCII characters
    </div>

    <section>
      <span class="md-ascii">{{ ascii }}</span>
    </section>

    <div class="md-title">
      the bytes decoded as grey scale pixels (zoomed in)
    </div>

    <section>
      <canvas ref="canvas"></canvas>
    </section>

  </section>`
})
