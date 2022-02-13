/* global requestAnimationFrame, THREE, innerWidth, innerHeight */
function draw () {
  requestAnimationFrame(draw)
  plane.material.uniforms.time.value += 0.01
  renderer.render(scene, camera)
}

window.addEventListener('resize', (e) => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

const scene = new THREE.Scene()
const ar = innerWidth / innerHeight
const camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000)
camera.position.z = 10

const renderer = new THREE.WebGLRenderer()
renderer.setSize(innerWidth, innerHeight)
renderer.domElement.className = 'threejs'
document.body.appendChild(renderer.domElement)

const pic = new THREE.TextureLoader().load('images/bg.jpg')
const plane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(2, 2, 1),
  new THREE.ShaderMaterial({
    uniforms: {
      time: { type: 'f', value: 50000.0 },
      texture: { type: 't', value: pic }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          // gl_PointSize = 8.0;
          // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform sampler2D texture;

      float wave(float x, float amount) {
        return (sin(x * amount) + 1.) * .5;
      }

      void main() {
        // gl_FragColor = texture2D(texture, vUv);
        vec2 p = vUv;
        p.x = p.x + sin(p.y*40.+time*6.)*0.03;
        vec2 toScale = vUv * vec2(0.5,0.5) + vec2(0.5,0.5);
        vec4 color = texture2D(texture, toScale);
        gl_FragColor.r = wave(color.r, 10.);
        gl_FragColor.g = wave(color.g * time, 20.);
        gl_FragColor.b = wave(color.b, 40.);
        gl_FragColor.a = 1.;
      }`
  })
)
scene.add(plane)
draw()
