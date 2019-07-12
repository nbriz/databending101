// a list of helper utility functions for various components in this project
class CU {
  static norm (value, min, max) {
    return (value - min) / (max - min)
  }

  static lerp (norm, min, max) {
    return (max - min) * norm + min
  }

  static map (value, sourceMin, sourceMax, destMin, destMax) {
    return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax)
  }

  static stripb64header (b64str) {
    let spot = 'base64,'
    let index = b64str.indexOf(spot) + spot.length
    return b64str.substr(index)
  }

  static getb64header (b64str) {
    let spot = 'base64,'
    let index = b64str.indexOf(spot) + spot.length
    return b64str.slice(0, index)
  }

  static base64ToArrayBuffer (b64) {
    let base64 = (b64.includes('base64,')) ? this.stripb64header(b64) : b64
    // this base64ToArrayBuffer function by Goran.it && Luke Madhanga
    // via: https://stackoverflow.com/a/21797381/1104148
    let binaryString = window.atob(base64)
    let len = binaryString.length
    let bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  static Uint8ToString (u8a) {
    // via: https://stackoverflow.com/a/12713326/1104148
    let CHUNK_SZ = 0x8000
    let c = []
    for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
      c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)))
    }
    return c.join('')
  }
}

if (typeof module !== 'undefined') module.exports = CU
