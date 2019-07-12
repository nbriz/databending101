/* global Vue, CU */
// NOTE: depends on shared functions in the components-utils.js file, ie. CU

Vue.component('byte-editor', {
  props: [ 'file', 'default', 'minimal' ],
  data: function () {
    return {
      loading: false,
      data: null, // base64 data, ie. file.data
      ascii: '', // ascii version of data (ie. what u'd see in TextEdit)
      bytes: null, // Uint8Array from data (base64 string)
      bIn: 0,
      bOut: 1,
      content: null, // array of currently displayed bytes
      typeOptions: ['ASCII/UTF-8', 'hex', 'decimal', 'binary'],
      selectedType: 'ASCII/UTF-8',
      css: `
        .byte-editor img {
          max-width: 870px;
        }
        .byte-editor .be-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #fff;
          margin-bottom: 10px;
        }
        .byte-editor .be-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid #fff;
          margin-top: 10px;
        }
        .byte-editor .be-btn {
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
        .byte-editor .be-byte {
          color: #000;
          background-color: #fff;
          padding: 2px 6px;
          border: none;
          margin: 4px;
          width: 64px;
          text-align: center;
        }
        .byte-editor .be-noedit {
          font-size: 14px;
          color: #fff;
          background-color: #333;
          padding: 2px 6px;
          margin: 4px;
          width: 64px;
          text-align: center;
          display: inline-block;
        }
        .byte-editor .be-byte-in {
          color: #fff;
          background-color: #000;
          padding: 2px 6px;
          border: none;
          border-bottom: 1px solid #fff;
          margin: 4px;
          width: 64px;
          text-align: center;
        }
        .byte-editor .be-ascii {
          width: 830px;
          padding: 20px;
          height: 320px;
          background-color: #fff;
          color: #000;
          line-height: 26px;
          letter-spacing: 3px;
          border: none;
          overflow-y: scroll;
        }
      `
    }
  },
  mounted: function () {
    if (this.default) this.selectedType = this.default

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
  methods: {
    displayTxt () {
      if (this.loading) return '...LOADING...'
      else if (this.data && this.data.indexOf('data:image') === 0) {
        return 'loaded raw image data'
      } else if (this.data && this.data.indexOf('data:audio') === 0) {
        return 'loaded raw audio data'
      } else if (this.data && this.data.indexOf('data:text') === 0) {
        return 'loaded raw text data'
      } else {
        return 'no data has been uploaded to display'
      }
    },
    formatByte (byte) {
      if (this.selectedType === 'ASCII/UTF-8') {
        return String.fromCharCode(byte)
      } else if (this.selectedType === 'binary') {
        let bin = byte.toString(2)
        let mis = 8 - bin.length
        for (let i = 0; i < mis; i++) { bin = '0' + bin }
        return bin
      } else if (this.selectedType === 'hex') {
        let hex = byte.toString(16).toUpperCase()
        if (hex.length < 2) hex = '0' + hex
        return hex
      } else return byte
    },
    displayFileSize () {
      // this function by Aliceljm && Aliceljm
      // via: https://stackoverflow.com/a/18650828/1104148
      let n = this.bytes.length
      let s = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      if (n === 1) return '1 Byte'
      else if (n < 1024) return n + ' Bytes'
      let i = parseInt(Math.floor(Math.log(n) / Math.log(1024)))
      return Math.round((n / Math.pow(1024, i)) * 10) / 10 + ' ' + s[i]
    },
    handleData () {
      this.loading = true
      this.bytes = CU.base64ToArrayBuffer(this.data) // init bytes
      this.bIn = 0
      this.updateASCII()
      this.updateBytes()
    },
    asciiEdited () {
      // get caret/cursor position info
      let range = document.createRange()
      let sel = window.getSelection()
      let selRange = sel.getRangeAt(0)
      let node = selRange.startContainer
      let offset = selRange.startOffset
      // update ascii
      this.ascii = this.$refs.ta.textContent
      // set caret/cursor back to position after ascii updates
      Vue.nextTick().then(() => {
        range.setStart(node, offset)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        this.$refs.ta.focus()
      })
      // other updates
      let b64 = window.btoa(this.ascii)
      let head = CU.getb64header(this.data)
      let data = head + b64
      this.bytes = CU.base64ToArrayBuffer(data)
      this.updateBytes()
      this.updateASCII()
      this.emitUpdate()
    },
    updateASCII () {
      let arr = []
      for (var i = 0; i < this.bytes.length; i++) {
        arr.push(String.fromCharCode(this.bytes[i]))
      }
      this.ascii = arr.join('')
    },
    updateBytes () {
      this.bOut = (this.bytes.length >= 120) ? this.bIn + 120 : this.bytes.length
      this.content = this.bytes.slice(this.bIn, this.bOut)
      this.loading = false
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
    byteUpdated (index, e) {
      let sel = e.originalTarget.selectionStart
      let val = e.originalTarget.value
      let idx = this.bIn + index
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
      this.bytes[idx] = byte
      this.updateASCII()
      this.emitUpdate()
    },
    changePage (dir) {
      let total = this.bytes.length
      let start = this.bIn
      if (dir === 'next') start += 120
      else if (dir === 'prev') start -= 120
      if (start > total - 120) start = total - 120
      if (start < 0) start = 0
      this.bIn = start
      this.updateBytes()
    },
    emitUpdate () {
      let b64 = window.btoa(CU.Uint8ToString(this.bytes))
      let head = CU.getb64header(this.data)
      let file = {
        name: this.file.name,
        type: this.file.type,
        data: head + b64
      }
      this.$emit('bytes-updated', file)
    }
  },
  template: `<section class="byte-editor">
    <div class="be-header">
      <div> {{(selectedType === 'ASCII/UTF-8') ? 'TEXT' : 'BYTE'}} EDITOR </div>
      <div> <span v-if="!minimal"> {{ displayTxt() }} </span> </div>
      <div>
        <select v-model="selectedType" v-if="data && !minimal">
          <option v-for="type in typeOptions" :value="type">{{type}}</option>
        </select>
      </div>
    </div>
    <div v-if="data">
      <div v-if="selectedType === 'hex'">
        <input v-for="(b,i) in content"
          :value="formatByte(b)" class="be-byte" @input="byteUpdated(i,$event)"/>
      </div>
      <div v-else-if="selectedType === 'ASCII/UTF-8'">
        <div ref="ta" class="be-ascii" @input="asciiEdited($event)"
          contenteditable="true">{{ ascii }}</div>
      </div>
      <div v-else>
        <span v-for="(b,i) in content" class="be-noedit">{{formatByte(b)}}</span>
      </div>
    </div>
    <div class="be-footer" v-if="bytes && selectedType !== 'ASCII/UTF-8' && !minimal">
      <div>
        <span class="be-btn" @click="changePage('prev')"> ◀◀ </span>
      </div>
      <div style="font-size:14px">
        viewing bytes
        <input v-model:value="bIn" class="be-byte-in" :style="{ width: String(bIn).length * 8 + 'px'}">
        to {{ bOut - 1 }} (of total {{ displayFileSize() }})
      </div>
      <div>
        <span class="be-btn" @click="changePage('next')"> ▶▶ </span>
      </div>
    </div>
  </section>`
})
