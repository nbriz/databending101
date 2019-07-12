/* global Vue, CU, HuffmanExtractor */
// NOTE: depends on shared functions in the components-utils.js file, ie. CU

Vue.component('huffman-hacker', {
  props: [ 'file' ],
  data: function () {
    return {
      loading: false,
      data: null, // base64 data, ie. file.data
      bytes: null, // array with labeled huffman byte objects
      huff: null, // huffman tables
      size: null, // object contianing huff tables size
      hasAC: false,
      hasDC: false,
      typeOptions: ['hex', 'decimal', 'binary'],
      selectedType: 'hex',
      colors: {
        red: '#ff6188',
        green: '#a9dc76',
        yellow: '#ffd866',
        orange: '#fc9867',
        purple: '#ab9df2',
        blue: '#78dce8'
      },
      css: `
        .huffman-hacker img {
          max-width: 870px;
        }
        .huffman-hacker p {
          text-align: left;
        }
        .huffman-hacker a {
          color: #fff;
          text-decoration: none;
          border-bottom: 1px solid #fff;
        }
        .huffman-hacker .hh-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #fff;
          margin-bottom: 10px;
        }
        .huffman-hacker .hh-label {
          text-transform: uppercase;
          font-weight: bold;
        }
        .huffman-hacker .hh-num {
          color: #000;
          padding: 0px 10px;
        }
        .huffman-hacker .hh-byte {
          color: #000;
          background-color: #fff;
          padding: 2px 6px;
          border: none;
          margin: 4px;
          width: 64px;
          text-align: center;
        }
        .huffman-hacker .hh-noedit {
          font-size: 14px;
          color: #fff;
          background-color: #333;
          padding: 2px 6px;
          margin: 4px;
          width: 64px;
          text-align: center;
          display: inline-block;
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
        return this.file.name
      } else {
        return 'no data has been uploaded to display'
      }
    },
    formatByte (byte) {
      if (this.selectedType === 'binary') {
        let dec = parseInt(byte, 16)
        let bin = dec.toString(2)
        let mis = 8 - bin.length
        for (let i = 0; i < mis; i++) { bin = '0' + bin }
        return bin
      } else if (this.selectedType === 'decimal') {
        return parseInt(byte, 16)
      }
    },
    handleData () {
      this.loading = true
      this.bytes = []
      this.huff = new HuffmanExtractor(this.data)
      let h = this.huff.dataToHexArray()
      // create huffman marker spans
      this.bytes.push({ hex: h[this.huff.index], color: this.colors.red })
      this.bytes.push({ hex: h[this.huff.index + 1], color: this.colors.red })
      // create length bytes spans
      let sb1 = h[this.huff.index + 2]
      let sb2 = h[this.huff.index + 3]
      this.bytes.push({ hex: sb1, color: this.colors.purple })
      this.bytes.push({ hex: sb2, color: this.colors.purple })
      this.size = {
        hex: `${sb1} ${sb2}`,
        dec: `${parseInt(sb1, 16)} ${parseInt(sb2, 16)}`
      }
      // create huffman DC tables spans
      if (this.huff.DC_tables.length > 0) this.hasDC = true
      else this.hasDC = false
      for (let i = 0; i < this.huff.DC_tables.length; i++) {
        let idx = this.huff.DC_tables[i].index
        let len = this.huff.DC_tables[i].length
        for (let j = 0; j < len; j++) {
          if (j === 0) this.bytes.push({ hex: h[idx], color: this.colors.blue })
          else if (j <= 16) this.bytes.push({ hex: h[j + idx], color: this.colors.orange })
          else this.bytes.push({ hex: h[j + idx], color: this.colors.green })
        }
      }
      // create huffman AC tables spans
      if (this.huff.AC_tables.length > 0) this.hasAC = true
      else this.hasAC = false
      for (let i = 0; i < this.huff.AC_tables.length; i++) {
        let idx = this.huff.AC_tables[i].index
        let len = this.huff.AC_tables[i].length
        for (let j = 0; j < len; j++) {
          if (j === 0) this.bytes.push({ hex: h[idx], color: this.colors.blue })
          else if (j <= 16) this.bytes.push({ hex: h[j + idx], color: this.colors.orange })
          else this.bytes.push({ hex: h[j + idx], color: this.colors.green })
        }
      }
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
    byteUpdated (idx, e) {
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
      // update
      this.bytes[idx].hex = e.originalTarget.value
      this.updateImage()
    },
    updateImage () {
      let bytes = this.bytes.map(b => b.hex)
      let data = this.huff.data.slice()
      // get new huffman data
      for (let i = 0; i < bytes.length; i++) {
        let di = this.huff.index + i
        data[di] = parseInt(bytes[i], 16)
      }
      let b64 = window.btoa(CU.Uint8ToString(data))
      this.data = `data:image/jpeg;base64,${b64}`
    }
  },
  template: `<section class="huffman-hacker">
    <div class="hh-header">
      <div> HUFFMAN TABLES </div>
      <div> {{ displayTxt() }} </div>
      <div>
        <select v-model="selectedType" v-if="data">
          <option v-for="type in typeOptions" :value="type">{{type}}</option>
        </select>
      </div>
    </div>
    <div v-if="data">

      <div>
        <p>
          <span :style="{backgroundColor: colors.red}" class="hh-num">1</span> the <span :style="{color: colors.red}" class="hh-label">Huffman tables marker</span>
          are always <i>FF C4</i>, you can search for these when viewing an image file using your own hex editor. They may appear more than once throughout the file, but their first appearance marks the beginning of the Huffman tables. Editing these bytes will break the image as well as this tool (because it won't know where to find the tables)
        </p>
        <p v-if="size">
          <span :style="{backgroundColor: colors.purple}" class="hh-num">2</span> the next two bytes specify the <span :style="{color: colors.purple}" class="hh-label">Huffman tables size</span>. In the case of this image that's <i>{{size.hex}}</i> or {{size.dec}} in decimal. This is how we know how many of the bytes which follow the marker are part of the tables. Editing these will also break the image (and this tool) because we end up including bytes which don't belong to the tables or excluding those that do.
        </p>
        <p v-if="size">
          <span :style="{backgroundColor: colors.blue}" class="hh-num">3</span> the byte is the <span :style="{color: colors.blue}" class="hh-label">table identifier</span> (ID) for the table that follows it. There can be many tables, so there can be more than one table ID. The first character in the hex byte of the ID is always either a <i>0</i>, if the table is a DC table, or a <i>1</i> if it's an AC table. The second character of the hex byte of the ID is the identifier, so the first DC table would be <i>00</i> and the second would be <i>01</i>, where as the first AC table would be <i>10</i> and the second would be <i>11</i> and so on.
        </p>
        <p v-if="size">
          <span :style="{backgroundColor: colors.orange}" class="hh-num">4</span> the first 16 bytes which follow a new table ID are the <span :style="{color: colors.orange}" class="hh-label">code lengths or list bits</span>. These describe the <a href="https://www.youtube.com/watch?v=JsTptu56GM8" target="_blank">structure of the Huffman tree</a> for this particular table, changing these will also result in a broken image as it will screw up how to properly read the bytes that follow.
        </p>
        <p v-if="size">
          <span :style="{backgroundColor: colors.green}" class="hh-num">5</span> the bytes that follow the code lengths (before the start of the next table, if there's another) are the <span :style="{color: colors.green}" class="hh-label">huffman codes</span>. <span  class="hh-label">These are the bytes you want to edit down below!</span> It's important to note, however, that if the table you are editing is a DC table (table ID which starts with <i>0</i>) than you can only change the byte to a value between <i>00</i> and <i>0F</i> (or 0 - 16 in decimal). If you are hacking an AC table (table ID which starts with <i>1</i>) then you can use the full byte range from <i>00</i> to <i>FF</i> (or 0 - 255 in decimal).
        </p>
      </div>
      <br><br>

      <div style="text-align:left">
        <div v-if="selectedType === 'hex'">
          <input v-for="(b,i) in bytes"
            class="hh-byte" :style="{backgroundColor: b.color}"
            :value="b.hex" @input="byteUpdated(i,$event)"/>
        </div>
        <div v-else>
          <span v-for="(b,i) in bytes" class="hh-noedit">{{formatByte(b.hex)}}</span>
        </div>
      </div>
      <br><br>

      <div>
        <img :src="data" />
      </div>

    </div>
  </section>`
})
