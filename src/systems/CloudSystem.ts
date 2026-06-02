import * as THREE from 'three'
import type { QualityPreset, ZoneState } from '../types'
import { lerp } from '../utils/math'

interface CloudNode {
  sprite: THREE.Sprite
  baseX: number
  baseY: number
  baseZ: number
  phase: number
  scale: number
}

export class CloudSystem {
  private readonly group = new THREE.Group()
  private readonly texture = this.createCloudTexture()
  private nodes: CloudNode[] = []
  private quality: QualityPreset

  constructor(scene: THREE.Scene, quality: QualityPreset) {
    this.quality = quality
    scene.add(this.group)
    this.rebuild(quality)
  }

  applyQuality(quality: QualityPreset): void {
    if (quality.cloudCount === this.quality.cloudCount) {
      this.quality = quality
      return
    }

    this.quality = quality
    this.rebuild(quality)
  }

  update(state: ZoneState, elapsed: number): void {
    const density = state.visual.cloudDensity
    const bandMin = state.visual.cloudBand[0]
    const bandMax = state.visual.cloudBand[1]

    this.nodes.forEach((node, index) => {
      const bandT = (index % this.nodes.length) / Math.max(1, this.nodes.length - 1)
      const y = lerp(bandMin, bandMax, bandT)
      const drift = Math.sin(elapsed * 0.08 + node.phase) * 8
      node.sprite.position.set(node.baseX + drift, y + node.baseY * 0.08, node.baseZ)
      node.sprite.scale.set(node.scale, node.scale * 0.42, 1)
      node.sprite.material.opacity =
        density * (0.36 + 0.42 * Math.sin(index * 1.7 + elapsed * 0.16))
      node.sprite.material.color.set(
        new THREE.Color('#ffffff').lerp(new THREE.Color('#b8c6d0'), state.progress * 0.5),
      )
    })
  }

  private rebuild(quality: QualityPreset): void {
    this.group.clear()
    this.nodes = []

    for (let i = 0; i < quality.cloudCount; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(material)
      const scale = 28 + Math.random() * 44
      const node: CloudNode = {
        sprite,
        baseX: (Math.random() - 0.5) * 210,
        baseY: (Math.random() - 0.5) * 18,
        baseZ: -84 - Math.random() * 92,
        phase: Math.random() * Math.PI * 2,
        scale,
      }
      this.group.add(sprite)
      this.nodes.push(node)
    }
  }

  private createCloudTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to create cloud texture.')
    }

    const gradient = ctx.createRadialGradient(120, 66, 12, 128, 64, 118)
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    gradient.addColorStop(0.42, 'rgba(255,255,255,0.52)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(128, 64, 112, 44, 0, 0, Math.PI * 2)
    ctx.fill()

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }
}
