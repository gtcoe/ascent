import * as THREE from 'three'
import type { QualityPreset, ZoneState } from '../types'
import { smoothstep } from '../utils/math'

export class StarfieldSystem {
  private readonly group = new THREE.Group()
  private readonly material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 1.65,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  })
  private points?: THREE.Points
  private quality: QualityPreset

  constructor(scene: THREE.Scene, quality: QualityPreset) {
    this.quality = quality
    this.group.renderOrder = 4
    scene.add(this.group)
    this.rebuild()
  }

  applyQuality(quality: QualityPreset): void {
    if (quality.starCount === this.quality.starCount) {
      this.quality = quality
      return
    }

    this.quality = quality
    this.rebuild()
  }

  update(state: ZoneState, elapsed: number): void {
    const spaceFade = smoothstep(0.6, 0.86, state.progress)
    const orbitFade = smoothstep(0.84, 1, state.progress)
    this.material.opacity = spaceFade * (0.44 + orbitFade * 0.38)
    this.material.size = 1.4 + orbitFade * 0.8
    this.group.position.copy(state.visual.cameraLookAt)
    this.group.rotation.y = elapsed * 0.003
    this.group.rotation.x = -0.08 + elapsed * 0.001
  }

  private rebuild(): void {
    this.group.clear()
    this.points?.geometry.dispose()

    const positions = new Float32Array(this.quality.starCount * 3)
    for (let i = 0; i < this.quality.starCount; i += 1) {
      const radius = 360 + Math.random() * 150
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.cos(phi) * radius
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.points = new THREE.Points(geometry, this.material)
    this.points.renderOrder = 4
    this.group.add(this.points)
  }
}
