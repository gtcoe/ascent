import * as THREE from 'three'
import type { QualityPreset, ZoneState } from '../types'
import { smoothstep } from '../utils/math'

interface Accent {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
  phase: number
  radius: number
}

export class OrbitalSystem {
  private readonly group = new THREE.Group()
  private readonly arcMaterial = new THREE.LineBasicMaterial({
    color: '#7bdfff',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  })
  private readonly accents: Accent[] = []
  private quality: QualityPreset

  constructor(scene: THREE.Scene, quality: QualityPreset) {
    this.quality = quality
    this.group.renderOrder = 24
    scene.add(this.group)
    this.buildArc()
    this.rebuildAccents()
  }

  applyQuality(quality: QualityPreset): void {
    if (quality.orbitalAccents === this.quality.orbitalAccents) {
      this.quality = quality
      return
    }

    this.quality = quality
    this.rebuildAccents()
  }

  update(state: ZoneState, elapsed: number): void {
    const orbitFade = smoothstep(0.86, 1, state.progress)
    this.arcMaterial.opacity = orbitFade * 0.38
    this.group.position.set(0, state.visual.cameraLookAt.y - 8, -34)

    this.accents.forEach((accent, index) => {
      const angle = accent.phase + elapsed * (0.08 + index * 0.004)
      const x = Math.cos(angle) * accent.radius
      const y = Math.sin(angle) * accent.radius * 0.18
      accent.mesh.position.set(x, y - 4, -8 + Math.sin(angle) * 1.4)
      accent.mesh.rotation.z = angle
      accent.mesh.material.opacity = orbitFade * 0.52
    })
  }

  private buildArc(): void {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 96; i += 1) {
      const t = i / 96
      const angle = Math.PI * (0.08 + t * 0.84)
      points.push(new THREE.Vector3(Math.cos(angle) * 72, Math.sin(angle) * 14 - 12, -10))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const arc = new THREE.Line(geometry, this.arcMaterial)
    arc.renderOrder = 24
    this.group.add(arc)
  }

  private rebuildAccents(): void {
    this.accents.forEach((accent) => {
      accent.mesh.geometry.dispose()
      const material = accent.mesh.material
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else {
        material.dispose()
      }
      this.group.remove(accent.mesh)
    })
    this.accents.length = 0

    for (let i = 0; i < this.quality.orbitalAccents; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? '#f8fcff' : '#8de5ff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.28), material)
      mesh.renderOrder = 25
      this.group.add(mesh)
      this.accents.push({
        mesh,
        phase: (i / Math.max(1, this.quality.orbitalAccents)) * Math.PI * 2,
        radius: 42 + Math.random() * 26,
      })
    }
  }
}
