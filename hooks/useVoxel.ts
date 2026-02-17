import * as THREE from "three"

export function createVoxelScene(container: HTMLDivElement) {
  const scene = new THREE.Scene()

  // Use window dimensions if container is not ready
  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 0, 20)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(window.devicePixelRatio)

  container.appendChild(renderer.domElement)

  // SIMPLEST POSSIBLE LIGHTING
  scene.add(new THREE.AmbientLight(0xffffff, 1))
  const sun = new THREE.DirectionalLight(0xffffff, 1)
  sun.position.set(5, 5, 5)
  scene.add(sun)


  const cursorGeo = new THREE.BoxGeometry(1, 1, 1)
  const cursorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  })
  const cursor = new THREE.Mesh(cursorGeo, cursorMat)
  scene.add(cursor)

  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate()

  function addVoxel(x: number, y: number, z: number, color: number = 0x00ffcc) {
    const isDuplicate = scene.children.some(
      (child) =>
        child instanceof THREE.Mesh &&
        child.userData.isVoxel &&
        Math.round(child.position.x) === Math.round(x) &&
        Math.round(child.position.y) === Math.round(y) &&
        Math.round(child.position.z) === Math.round(z)
    )

    if (isDuplicate) return

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color })
    )
    cube.position.set(Math.round(x), Math.round(y), Math.round(z))
    cube.userData.isVoxel = true
    scene.add(cube)
  }

  function removeVoxel(x: number, y: number, z: number) {
    const voxel = scene.children.find(
      (child) =>
        child instanceof THREE.Mesh &&
        child.userData.isVoxel &&
        Math.round(child.position.x) === Math.round(x) &&
        Math.round(child.position.y) === Math.round(y) &&
        Math.round(child.position.z) === Math.round(z)
    )
    if (voxel) scene.remove(voxel)
  }

  function setCursor(x: number, y: number, z: number) {
    cursor.position.set(x, y, z)
  }

  // Handle Resize
  window.addEventListener("resize", () => {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })

  return { addVoxel, removeVoxel, setCursor }
}
