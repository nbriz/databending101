/* global Vue */
Vue.component('ascii-table', {
  data: function () {
    return {
      numbers: [],
      css: `
        .ascii-table section.bn-column {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          margin-bottom: 10px;
        }

        .ascii-table section.main div {
          border: 1px solid #fff;
          padding: 10px 0px;
        }

        .ascii-table section.nums {
          max-height: 300px;
          overflow-y: scroll;
        }
      `
    }
  },
  mounted: function () {
    // init 127 numbers
    for (let i = 0; i < 127; i++) this.numbers.push(i)
    // register internal scroll event
    this.$refs.nums.addEventListener('scroll', this.scroll)

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
    scroll (e) {
      if (e.target.scrollTop >= e.target.scrollTopMax) {
        let start = this.numbers.length
        for (let i = start; i < start + 100; i++) this.numbers.push(i)
      }
    },
    isSpecialChar (n) {
      if (n <= 32 || n === 127) return true
      else return false
    },
    specialChar (n) {
      switch (n) {
        case 0: n = 'NUL'; break
        case 1: n = 'SOH'; break
        case 2: n = 'STX'; break
        case 3: n = 'ETX'; break
        case 4: n = 'EOT'; break
        case 5: n = 'ENQ'; break
        case 6: n = 'ACK'; break
        case 7: n = 'BEL'; break
        case 8: n = 'BS'; break
        case 9: n = 'TAB'; break
        case 10: n = 'LF'; break
        case 11: n = 'VT'; break
        case 12: n = 'FF'; break
        case 13: n = 'CR'; break
        case 14: n = 'SO'; break
        case 15: n = 'SI'; break
        case 16: n = 'DLE'; break
        case 17: n = 'DC1'; break
        case 18: n = 'DC2'; break
        case 19: n = 'DC3'; break
        case 20: n = 'DC4'; break
        case 21: n = 'NAK'; break
        case 22: n = 'SYN'; break
        case 23: n = 'ETB'; break
        case 24: n = 'CAN'; break
        case 25: n = 'EM'; break
        case 26: n = 'SUB'; break
        case 27: n = 'ESC'; break
        case 28: n = 'FS'; break
        case 29: n = 'GS'; break
        case 30: n = 'RS'; break
        case 31: n = 'US'; break
        case 32: n = 'Space'; break
        case 127: n = 'DEL'; break
      }
      return n
    }
  },
  template: `<section class="ascii-table">

    <section class="bn-column main">
      <div>NUMBERICAL VALUE<br> (in base10 / decimal)</div>
      <div>ASCII</div>
      <div>UNICODE</div>
    </section>

    <section class="nums" ref="nums">
      <section class="bn-column" v-for="n in numbers">
        <div>{{n}}</div>

        <div v-if="isSpecialChar(n)">
          <i>{{specialChar(n)}}</i>
        </div>
        <div v-else-if="n > 127">
          <i> </i>
        </div>
        <div v-else>{{String.fromCharCode(n)}}</div>

        <div v-if="isSpecialChar(n)">
          <i>{{specialChar(n)}}</i>
        </div>

        <div v-else>{{String.fromCharCode(n)}}</div>
      </section>
    </section>

  </section>`
})
