/* global Vue, CU, Audio */
// NOTE: depends on shared functions in the components-utils.js file, ie. CU

Vue.component('mp3-hacker', {
  props: [ 'file' ],
  data: function () {
    return {
      loading: false,
      data: null, // base64 data, ie. file.data
      dataAlias: null,
      bytes: null, // array with labeled huffman byte objects
      header: null, // example frame header
      hidx: null, // array of indexes for frame headers
      sound: null,
      playing: false,
      time: null,
      displayTime: null,
      find: 100,
      replace: 200,
      instances: null,
      css: `
        .mp3-hacker p {
          text-align: left;
        }
        .mp3-hacker a {
          color: #fff;
          text-decoration: none;
          border-bottom: 1px solid #fff;
        }
        .mp3-hacker .mh-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #fff;
          margin-bottom: 10px;
        }
        .mp3-hacker .mh-btn {
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
        .mp3-hacker .mh-byte {
          color: #000;
          background-color: #fff;
          padding: 2px 6px;
          border: none;
          margin: 4px;
          width: 64px;
          text-align: center;
        }
        .mp3-hacker .mh-row  {
          text-align: center;
          border-right: 1px solid #fff;
          border-top: 1px solid #fff;
        }
        .mp3-hacker .mh-row:last-of-type {
          border-bottom: 1px solid #fff;
        }
        .mp3-hacker .mh-row span {
          text-align: center;
          border-left: 1px solid #fff;
        }
        .mp3-hacker .mh-row1 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
        }
        .mp3-hacker .mh-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
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
      if (newFile) Vue.nextTick().then(() => { this.data = this.file.data })
    },
    data: function (newData, oldData) {
      if (newData) Vue.nextTick().then(() => this.handleData())
    }
  },
  computed: {
    headerHex: function () {
      if (!this.header) return []
      let hex = ''
      this.header.forEach(d => { hex += this.formatByte('hex', d) })
      return hex.split('')
    },
    headerBinary: function () {
      if (!this.header) return []
      let bin = ''
      this.header.forEach(d => { bin += this.formatByte('binary', d) })
      return bin.split('')
    }
  },
  methods: {
    displayTxt () {
      if (this.loading) return '...LOADING...'
      else return 'no data has been uploaded to display'
    },
    displayReplaceTally () {
      if (!this.instances) return '(edit byte values and click "replace" to execute operation)'
      else return `(replaced ${this.instances} bytes)`
    },
    displayByte (type, val) {
      if (type === 'find' && this.find) {
        return this.find.toString(16).toUpperCase()
      } else if (type === 'replace' && this.replace) {
        return this.replace.toString(16).toUpperCase()
      } else return ''
    },
    formatByte (type, byte) {
      if (type === 'binary') {
        let bin = byte.toString(2)
        let mis = 8 - bin.length
        for (let i = 0; i < mis; i++) { bin = '0' + bin }
        return bin
      } else if (type === 'hex') {
        let hex = byte.toString(16).toUpperCase()
        if (hex.length < 2) hex = '0' + hex
        return hex
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
      this.sound.play()
      this.playing = true
    },
    stop () {
      this.sound.pause()
      this.sound.currentTime = 0
      this.reset()
    },
    handleData () {
      this.loading = true
      this.dataAlias = this.data
      this.sound = new Audio(this.dataAlias)
      this.sound.onended = () => { this.reset() }
      this.header = null
      this.hidx = []
      this.instances = null
      this.bytes = CU.base64ToArrayBuffer(this.data) // init bytes
      // index headers
      let h = this.parseAltHeaders()
      if (h.h1idx.length > h.h2idx.length) { // no error protection
        this.header = h.header1 // ex: 255, 251, #, # (FF, FB, #, #)
        this.hidx = h.h1idx
      } else { // has error protection
        this.header = h.header2 // ex: 255, 250, #, # (FF, FA, #, #)
        this.hidx = h.h2idx
      }
      console.log(this.header, this.hidx)
      this.loading = false
    },
    parseAltHeaders () {
      // asssume no error protection
      let header1 = null
      let h1idx = []
      // assume error protection
      let header2 = null
      let h2idx = []
      for (let i = 0; i < this.bytes.length; i++) {
        // assuming it does not have error protection...
        if (!header1) {
          // find first instance of frame header (FF FB)
          if (this.bytes[i] === 255 && this.bytes[i + 1] === 251) {
            // save example frame header
            header1 = this.bytes.slice(i, i + 4)
            h1idx.push(i) // record index of first frame
          }
        } else if (this.isHeader(i, header1)) h1idx.push(i) // record next frame idx
        // ------------------------------------------------
        // assuming it has error protection...
        if (!header2) {
          // find first instance of frame header (FF FA)
          if (this.bytes[i] === 255 && this.bytes[i + 1] === 250) {
            // save example frame header
            header2 = this.bytes.slice(i, i + 4)
            h2idx.push(i) // record index of first frame
          }
        } else if (this.isHeader(i, header2)) h2idx.push(i) // record next frame idx
      }
      return { header1, h1idx, header2, h2idx }
    },
    isHeader (idx, header) {
      return (this.bytes[idx] === header[0] &&
        this.bytes[idx + 1] === header[1] &&
        this.bytes[idx + 2] === header[2] &&
        this.bytes[idx + 3] === header[3])
    },
    byteIsInHeader (byte, idx) {
      if (this.header.includes(byte)) {
        let i = this.header.indexOf(byte)
        let frameIndex = idx - i
        if (this.hidx.includes(frameIndex)) return true
        else return false
      } else return false
    },
    findAndReplace () {
      this.stop()
      this.loading = true
      Vue.nextTick().then(() => {
        this.instances = 0
        // find + replace
        for (let i = 0; i < this.bytes.length; i++) {
          if (this.bytes[i] === this.find) {
            let inHead = this.byteIsInHeader(this.bytes[i], i)
            // 255 && 251 still seem to fuck things up
            // this may require more research b/c as far as i can tell
            // i'm not removing bytes in frame headers???
            // avoid them entirely for now...
            let avoid = [255, 250, 251]
            if (avoid.includes(this.find)) inHead = true
            // ...
            if (!inHead) {
              this.bytes[i] = this.replace
              this.instances++
            }
          }
        }
        // update
        let b64 = window.btoa(CU.Uint8ToString(this.bytes))
        let head = CU.getb64header(this.data)
        this.dataAlias = head + b64
        this.sound = new Audio(this.dataAlias)
        this.sound.onended = () => { this.reset() }
        this.loading = false
      })
    },
    rmvChar (str, i) {
      return str.slice(0, i) + str.slice(i + 1, str.length)
    },
    hexify (str) {
      let chars = '0123456789ABCDEF'
      str = str.toUpperCase()
      if (!chars.includes(str[0])) str = 'F' + str[1]
      if (!chars.includes(str[1])) str = str[0] + 'F'
      return str
    },
    byteUpdated (type, e) {
      let sel = e.originalTarget.selectionStart
      let val = e.originalTarget.value
      // validate
      if (val.length < 2) {
        if (sel === 0) val = '0' + val
        else val = val + '0'
      } else if (val.length > 2) {
        if (sel === 1) val = this.rmvChar(val, 1)
        else if (sel === 2) val = this.rmvChar(val, 2)
        else if (sel === 3) val = this.rmvChar(val, 1)
      }
      e.originalTarget.value = this.hexify(val)
      e.originalTarget.selectionStart = 1
      e.originalTarget.selectionEnd = 1
      // fire update
      let byte = parseInt(e.originalTarget.value, 16)
      if (type === 'find') this.find = byte
      else this.replace = byte
    }
  },
  template: `<section class="mp3-hacker">
    <div class="mh-header">
      <div> MP3 HACKING </div>
      <div v-if="!data || loading">{{ displayTxt() }}</div>
      <div v-else>{{ file.name }}</div>
      <div v-if="data">
        <span>{{ displayTime }}</span>
        <span v-if="playing" @click="stop()" class="mh-btn">◼ stop</span>
        <span v-else @click="play()" class="mh-btn">▶ play</span>
      </div>
      <div v-else></div>
    </div>
    <div v-if="data && !loading">
      <p>
        Below is the MP3 frame header pattern for this particular MP3 file. The top row is the frame header in hex, the bottom is in binary. To understand what each bit represents refer to this <a href="https://upload.wikimedia.org/wikipedia/commons/0/01/Mp3filestructure.svg" target="_blank">MP3 frame header diagram</a> on wikipedia.
      </p>
      <br>
      <div>
        <div class="mh-row1 mh-row">
          <span v-for="b in headerHex">{{ b }}</span>
        </div>
        <div class="mh-row2 mh-row">
          <span v-for="b in headerBinary">{{ b }}</span>
        </div>
      </div>
      <br><br><br>
      <div>
        <span class="mh-btn" @click="findAndReplace()">replace</span>
        byte
        <input class="mh-byte" :value="displayByte('find')" @input="byteUpdated('find',$event)"/>
        with
        <input class="mh-byte" :value="displayByte('replace')" @input="byteUpdated('replace',$event)"/>
        <br>
        {{ displayReplaceTally() }}
      </div>
    </div>
  </section>`
})
