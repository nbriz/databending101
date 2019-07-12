/* global Vue */
Vue.component('base-numbers', {
  data: function () {
    return {
      numbers: [],
      css: `
        .base-numbers section.bn-column {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          margin-bottom: 10px;
        }

        .base-numbers section.main div {
          border: 1px solid #fff;
          padding: 10px 0px;
        }

        .base-numbers section.nums {
          max-height: 300px;
          overflow-y: scroll;
        }
      `
    }
  },
  mounted: function () {
    // init 100 numbers
    for (let i = 0; i < 100; i++) this.numbers.push(i)
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
    toBinary (n) {
      return n.toString(2)
    },
    toHex (n) {
      return n.toString(16).toUpperCase()
    },
    toBase64 (n) {
      // return window.btoa(String.fromCharCode(n))
      if (n === 0) return 0
      let c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'
      let base = c.length
      let str = ''
      let r
      while (n) {
        r = n % base
        n -= r
        n /= base
        str = c.charAt(r) + str
      }
      return str
    }
  },
  template: `<section class="base-numbers">

    <section class="bn-column main">
      <div>BASE 2 <br>(binary)</div>
      <div>BASE 10 <br>(decimal)</div>
      <div>BASE 16 <br>(hex)</div>
      <div>BASE 64</div>
    </section>

    <section class="nums" ref="nums">
      <section class="bn-column" v-for="n in numbers">
        <div>{{toBinary(n)}}</div>
        <div>{{n}}</div>
        <div>{{toHex(n)}}</div>
        <div>{{toBase64(n)}}</div>
      </section>
    </section>

  </section>`
})
