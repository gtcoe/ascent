import * as THREE from 'three'
import type { QualityPreset, ZoneState } from '../types'
import { ZONES } from '../zones/zoneConfig'
import { clamp, lerp, smoothstep } from '../utils/math'

interface TrailParticle {
  sprite: THREE.Sprite
  phase: number
  falloff: number
}

export class RocketTrailSystem {
  private readonly group = new THREE.Group()
  private readonly texture = this.createTrailTexture()
  private readonly rocketZone = ZONES.find((zone) => zone.entity === 'soundingRocket')
  private particles: TrailParticle[] = []
  private quality: QualityPreset

  constructor(scene: THREE.Scene, quality: QualityPreset) {
    this.quality = quality
    this.group.renderOrder = 18
    scene.add(this.group)
    this.rebuild()
  }

  applyQuality(quality: QualityPreset): void {
    if (quality.trailParticles === this.quality.trailParticles) {
      this.quality = quality
      return
    }

    this.quality = quality
    this.rebuild()
  }

  update(state: ZoneState, elapsed: number, camera: THREE.PerspectiveCamera): void {
    if (!this.rocketZone) {
      return
    }

    const rawT =
      (state.progress - this.rocketZone.start) / (this.rocketZone.end - this.rocketZone.start)
    const rocketT = clamp(rawT)
    const zoneFade = smoothstep(-0.08, 0.24, rawT) * (1 - smoothstep(0.72, 1.08, rawT))
    const motion = this.rocketZone.entityMotion
    const passT = smoothstep(0, 1, rocketT)
    const phase = motion.driftPhase ?? 0
    const x = motion.x + Math.sin(elapsed * (motion.driftSpeed ?? 0) + phase) * (motion.driftX ?? 0)
    const y =
      lerp(motion.startY, motion.endY, passT) +
      Math.sin(elapsed * (motion.bobSpeed ?? 0) + phase) * (motion.bobY ?? 0) -
      0.14
    this.group.position.copy(this.screenToWorld(camera, x, y, motion.distance))
    this.group.quaternion.copy(camera.quaternion)

    this.particles.forEach((particle, index) => {
      const t = index / Math.max(1, this.particles.length - 1)
      const spread = 1 + t * 9
      const phase = elapsed * 0.7 + particle.phase
      particle.sprite.position.set(
        Math.sin(phase) * spread * 0.28,
        -8 - t * 52 + Math.cos(phase * 0.8) * 1.2,
        Math.sin(phase * 0.6) * 2.2,
      )
      particle.sprite.scale.setScalar(4.5 + t * 17)
      particle.sprite.material.opacity = zoneFade * particle.falloff * (1 - t * 0.72)
    })
  }

  private screenToWorld(
    camera: THREE.PerspectiveCamera,
    ndcX: number,
    ndcY: number,
    distance: number,
  ): THREE.Vector3 {
    const point = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera)
    return point.sub(camera.position).normalize().multiplyScalar(distance).add(camera.position)
  }

  private rebuild(): void {
    this.group.clear()
    this.particles = []

    for (let i = 0; i < this.quality.trailParticles; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: i % 3 === 0 ? '#ffe3a1' : '#ff8d52',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
      const sprite = new THREE.Sprite(material)
      sprite.renderOrder = 18
      this.group.add(sprite)
      this.particles.push({
        sprite,
        phase: Math.random() * Math.PI * 2,
        falloff: 0.4 + Math.random() * 0.6,
      })
    }
  }

  private createTrailTexture(): THREE.CanvasTexture {
    const size = 192
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to create rocket trail texture.')
    }

    const gradient = ctx.createRadialGradient(96, 96, 4, 96, 96, 92)
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    gradient.addColorStop(0.28, 'rgba(255,196,92,0.5)')
    gradient.addColorStop(1, 'rgba(255,116,65,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }
}
