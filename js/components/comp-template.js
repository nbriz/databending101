/* global Vue */
Vue.component('COMP-NAME', {
  data: function () {
    return {
      css: `
        .comp-name div {
          color: red;
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
  methods: {

  },
  template: `<section class="comp-name">
    <div>hello</div>
  </section>`
})
