import * as THREE from 'three'
import type { ZoneState } from '../types'
import { clamp, smoothstep } from '../utils/math'

export class GroundSystem {
  private readonly group = new THREE.Group()
  private readonly groundMaterial = new THREE.MeshStandardMaterial({
    color: '#3d7c3e',
    roughness: 0.96,
    metalness: 0,
  })

  constructor(scene: THREE.Scene) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 32, 32), this.groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.6
    this.group.add(ground)

    const hillMaterial = new THREE.MeshStandardMaterial({
      color: '#2f6338',
      roughness: 1,
      transparent: true,
    })

    for (let i = 0; i < 9; i += 1) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(7 + i * 1.4, 6 + i, 5), hillMaterial)
      hill.position.set(-62 + i * 16, 1.4, -42 - (i % 3) * 12)
      hill.scale.z = 2.8
      this.group.add(hill)
    }

    scene.add(this.group)
  }

  update(state: ZoneState): void {
    const visibility = 1 - smoothstep(0.16, 0.48, state.progress)
    this.group.visible = visibility > 0.01
    this.group.position.y = -state.progress * 22
    this.group.scale.setScalar(1 + state.progress * 3.5)

    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh
      const material = mesh.material as THREE.MeshStandardMaterial | undefined
      if (material?.transparent !== undefined) {
        material.transparent = true
        material.opacity = clamp(visibility)
      }
    })
  }
}
