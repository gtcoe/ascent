import * as THREE from 'three'
import type { ZoneState } from '../types'
import { smoothstep } from '../utils/math'

export class EarthCurvatureSystem {
  private readonly group = new THREE.Group()
  private readonly earthMaterial = new THREE.MeshBasicMaterial({
    color: '#0b315c',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  })
  private readonly limbMaterial = new THREE.MeshBasicMaterial({
    color: '#64d8ff',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  })

  constructor(scene: THREE.Scene) {
    const earthDisc = new THREE.Mesh(new THREE.CircleGeometry(260, 128), this.earthMaterial)
    const limb = new THREE.Mesh(new THREE.RingGeometry(247, 263, 128), this.limbMaterial)

    earthDisc.scale.set(1.7, 0.28, 1)
    limb.scale.set(1.7, 0.28, 1)
    earthDisc.position.y = -48
    limb.position.y = -47
    earthDisc.renderOrder = 5
    limb.renderOrder = 6

    this.group.add(earthDisc, limb)
    this.group.renderOrder = 5
    scene.add(this.group)
  }

  update(state: ZoneState, elapsed: number): void {
    const curvatureFade = smoothstep(0.62, 0.94, state.progress)
    const orbitFade = smoothstep(0.86, 1, state.progress)
    this.earthMaterial.opacity = curvatureFade * (0.2 + orbitFade * 0.22)
    this.limbMaterial.opacity = curvatureFade * (0.2 + orbitFade * 0.34)
    this.group.position.set(0, state.visual.cameraLookAt.y - 54 + orbitFade * 16, -205)
    this.group.rotation.z = Math.sin(elapsed * 0.025) * 0.018
  }
}
