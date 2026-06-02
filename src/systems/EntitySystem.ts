import * as THREE from 'three'
import { ZONES } from '../zones/zoneConfig'
import type { EntityKey, ZoneState } from '../types'
import { clamp, lerp, smoothstep } from '../utils/math'

interface EntityRecord {
  key: EntityKey
  label: string
  group: THREE.Group
  hero: THREE.Sprite
  aura: THREE.Sprite
  shadow: THREE.Sprite
  update: (elapsed: number, opacity: number, state: ZoneState) => void
}

interface HeroOptions {
  key: EntityKey
  label: string
  size: number
  auraColor: string
  paint: (ctx: CanvasRenderingContext2D, size: number) => void
  position: (elapsed: number, state: ZoneState) => THREE.Vector3
  rotation: (elapsed: number, state: ZoneState) => number
}

export class EntitySystem {
  private readonly records: EntityRecord[]
  private readonly auraTexture = this.createRadialTexture()
  private readonly shadowTexture = this.createShadowTexture()
  private readonly entityZones = new Map(
    ZONES.map((zone, index) => [zone.entity, { zone, zoneIndex: index }] as const),
  )

  constructor(scene: THREE.Scene) {
    this.records = [
      this.createHero({
        key: 'peacock',
        label: 'Peacock',
        size: 15,
        auraColor: '#43f09a',
        paint: (ctx, size) => this.paintPeacock(ctx, size),
        position: (elapsed, state) =>
          new THREE.Vector3(-7.5 + Math.sin(elapsed * 0.55) * 0.7, 6.2 - state.localT * 4.8, -15),
        rotation: (elapsed) => Math.sin(elapsed * 0.6) * 0.04,
      }),
      this.createHero({
        key: 'hotAirBalloon',
        label: 'Hot-Air Balloon',
        size: 13.8,
        auraColor: '#ffcf7a',
        paint: (ctx, size) => this.paintHotAirBalloon(ctx, size),
        position: (elapsed, state) =>
          new THREE.Vector3(
            5.8 + Math.sin(elapsed * 0.38) * 2.4,
            18.5 + state.localT * 10 + Math.sin(elapsed * 0.72) * 0.55,
            -16,
          ),
        rotation: (elapsed) => Math.sin(elapsed * 0.46) * 0.035,
      }),
      this.createHero({
        key: 'glider',
        label: 'Glider',
        size: 15.2,
        auraColor: '#e7f8ff',
        paint: (ctx, size) => this.paintGlider(ctx, size),
        position: (elapsed, state) =>
          new THREE.Vector3(
            Math.sin(elapsed * 0.36 + 2.4) * 7.2,
            state.zone.cameraY[0] + state.localT * 13 + Math.sin(elapsed * 0.58) * 0.55,
            -17,
          ),
        rotation: (elapsed) => Math.sin(elapsed * 0.48) * 0.09,
      }),
      this.createHero({
        key: 'commercialJet',
        label: 'Commercial Jet',
        size: 16.2,
        auraColor: '#d8f4ff',
        paint: (ctx, size) => this.paintCommercialJet(ctx, size),
        position: (elapsed, state) =>
          new THREE.Vector3(
            Math.sin(elapsed * 0.22 + 4.2) * 5.5,
            state.zone.cameraY[0] + state.localT * 14 + Math.sin(elapsed * 0.34) * 0.38,
            -18,
          ),
        rotation: (elapsed) => -0.04 + Math.sin(elapsed * 0.34) * 0.035,
      }),
      this.createHero({
        key: 'weatherBalloon',
        label: 'Weather Balloon',
        size: 15.4,
        auraColor: '#dff7ff',
        paint: (ctx, size) => this.paintWeatherBalloon(ctx, size),
        position: (elapsed, state) =>
          new THREE.Vector3(Math.sin(elapsed * 0.2) * 3.8, 74 + state.localT * 9, -17),
        rotation: (elapsed) => Math.sin(elapsed * 0.38) * 0.045,
      }),
    ]

    this.records.forEach((record) => scene.add(record.group))
  }

  update(state: ZoneState, elapsed: number): string {
    let activeLabel = ''
    let activeOpacity = 0

    this.records.forEach((record) => {
      const entityZone = this.entityZones.get(record.key)
      if (!entityZone) {
        return
      }

      const rawT =
        (state.progress - entityZone.zone.start) / (entityZone.zone.end - entityZone.zone.start)
      const opacity = smoothstep(-0.18, 0.18, rawT) * (1 - smoothstep(0.82, 1.18, rawT))
      const entityT = clamp(rawT)
      const entityState: ZoneState = {
        ...state,
        zone: entityZone.zone,
        zoneIndex: entityZone.zoneIndex,
        localT: entityT,
        altitude: lerp(entityZone.zone.altitudeMin, entityZone.zone.altitudeMax, entityT),
      }

      record.group.visible = opacity > 0.02
      record.update(elapsed, opacity, entityState)

      if (opacity > activeOpacity) {
        activeOpacity = opacity
        activeLabel = record.label
      }
    })

    return activeLabel
  }

  private createHero(options: HeroOptions): EntityRecord {
    const group = new THREE.Group()
    group.renderOrder = 40

    const texture = this.createEntityTexture(options.paint)
    const aura = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.auraTexture,
        color: options.auraColor,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    )
    const shadow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.shadowTexture,
        color: '#020812',
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    )
    const hero = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    )

    aura.renderOrder = 40
    shadow.renderOrder = 41
    hero.renderOrder = 42
    aura.scale.setScalar(options.size * 1.45)
    shadow.scale.set(options.size * 1.08, options.size * 0.42, 1)
    shadow.position.set(0, -options.size * 0.24, -0.02)
    hero.scale.setScalar(options.size)
    group.add(aura, shadow, hero)

    return {
      key: options.key,
      label: options.label,
      group,
      hero,
      aura,
      shadow,
      update: (elapsed, opacity, state) => {
        const position = options.position(elapsed, state)
        const prominence = 1 + smoothstep(0.15, 0.5, opacity) * 0.08
        group.position.copy(position)
        hero.material.rotation = options.rotation(elapsed, state)
        hero.scale.setScalar(options.size * prominence)
        aura.scale.setScalar(options.size * (1.48 + Math.sin(elapsed * 1.2) * 0.035))
        shadow.scale.set(options.size * 1.05, options.size * 0.38, 1)
        hero.material.opacity = opacity
        aura.material.opacity = opacity * 0.55
        shadow.material.opacity = opacity * 0.34
      },
    }
  }

  private createEntityTexture(
    paint: (ctx: CanvasRenderingContext2D, size: number) => void,
  ): THREE.CanvasTexture {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to create entity texture.')
    }

    ctx.clearRect(0, 0, size, size)
    paint(ctx, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  private paintPeacock(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 80)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    for (let i = 0; i < 29; i += 1) {
      const angle = -1.16 + (i / 28) * 2.32
      ctx.save()
      ctx.rotate(angle)
      ctx.translate(0, -210)
      this.strokeFillEllipse(ctx, 0, 0, 42, 210, '#0c3750', '#1cc681', 12)
      this.strokeFillEllipse(ctx, 0, -92, 30, 44, '#f7d76f', '#123a75', 9)
      this.strokeFillEllipse(ctx, 0, -92, 14, 22, '#d9fff6', '#27dca4', 5)
      ctx.restore()
    }

    this.strokeFillEllipse(ctx, 0, 20, 90, 55, '#f6f1d0', '#0c6371', 16)
    this.strokeFillEllipse(ctx, 72, -66, 34, 88, '#f6f1d0', '#176aa8', 14)
    this.strokeFillEllipse(ctx, 96, -145, 45, 38, '#f6f1d0', '#176aa8', 12)

    ctx.strokeStyle = '#f5c34b'
    ctx.lineWidth = 10
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      ctx.moveTo(72 + i * 12, -178)
      ctx.lineTo(60 + i * 17, -232 - Math.sin(i) * 12)
      ctx.stroke()
    }

    this.strokeFillPolygon(
      ctx,
      [
        [132, -146],
        [190, -126],
        [132, -106],
      ],
      '#0b2740',
      '#f2bd43',
      9,
    )
    ctx.restore()
  }

  private paintHotAirBalloon(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 20)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    this.strokeFillEllipse(ctx, 0, -130, 154, 196, '#532b18', '#f05d42', 18)

    const stripeColors = ['#ffcf5a', '#fff2bd', '#31a8c9', '#fff2bd', '#ffcf5a']
    for (let i = 0; i < stripeColors.length; i += 1) {
      const x = -96 + i * 48
      ctx.fillStyle = stripeColors[i]
      ctx.strokeStyle = 'rgba(83,43,24,0.45)'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.ellipse(x, -130, 28, 174, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    this.strokeFillEllipse(ctx, 0, -130, 154, 196, '#532b18', 'rgba(255,255,255,0)', 18)
    this.strokeFillPolygon(
      ctx,
      [
        [-90, 76],
        [90, 76],
        [58, 142],
        [-58, 142],
      ],
      '#532b18',
      '#f4b64d',
      14,
    )

    ctx.strokeStyle = '#5b321c'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(-70, 76)
    ctx.lineTo(-42, 206)
    ctx.moveTo(70, 76)
    ctx.lineTo(42, 206)
    ctx.stroke()

    this.strokeFillPolygon(
      ctx,
      [
        [-72, 204],
        [72, 204],
        [58, 282],
        [-58, 282],
      ],
      '#3a2116',
      '#8c5a32',
      12,
    )
    ctx.fillStyle = 'rgba(255, 233, 156, 0.3)'
    ctx.fillRect(-46, 218, 92, 22)
    ctx.restore()
  }

  private paintGlider(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 18)
    ctx.rotate(-0.08)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    this.strokeFillPolygon(
      ctx,
      [
        [-420, -28],
        [-44, -88],
        [0, -38],
        [44, -88],
        [420, -28],
        [70, 44],
        [0, 28],
        [-70, 44],
      ],
      '#0c2e4c',
      '#f6fbff',
      18,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [0, -96],
        [92, -12],
        [46, 142],
        [0, 190],
        [-46, 142],
        [-92, -12],
      ],
      '#0c2e4c',
      '#dfeeff',
      16,
    )
    this.strokeFillEllipse(ctx, 0, -18, 34, 70, '#0c2e4c', '#7fd9ff', 9)
    ctx.strokeStyle = '#f2ba4a'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(-316, -12)
    ctx.lineTo(316, -12)
    ctx.moveTo(0, 44)
    ctx.lineTo(0, 168)
    ctx.stroke()
    ctx.restore()
  }

  private paintCommercialJet(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 36)
    ctx.rotate(-0.04)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    this.strokeFillEllipse(ctx, 0, -18, 310, 48, '#092542', '#f4f8fb', 18)
    this.strokeFillPolygon(
      ctx,
      [
        [-80, -32],
        [-310, -184],
        [-170, -20],
      ],
      '#092542',
      '#d9e9f2',
      14,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [-60, 12],
        [-300, 166],
        [-150, 34],
      ],
      '#092542',
      '#cadce8',
      14,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [260, -40],
        [398, -8],
        [260, 30],
      ],
      '#092542',
      '#f4f8fb',
      12,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [-304, -44],
        [-414, -150],
        [-360, -22],
      ],
      '#092542',
      '#d6e6ef',
      12,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [-304, 8],
        [-410, 108],
        [-354, 28],
      ],
      '#092542',
      '#c8d8e2',
      12,
    )

    ctx.fillStyle = '#2c84b9'
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath()
      ctx.arc(-210 + i * 34, -44, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#f4b342'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(-238, 22)
    ctx.lineTo(228, 14)
    ctx.stroke()
    ctx.restore()
  }

  private paintWeatherBalloon(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 18)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    this.strokeFillEllipse(ctx, 0, -178, 148, 148, '#e9fbff', '#f9fdff', 18)
    ctx.fillStyle = 'rgba(126, 214, 255, 0.35)'
    ctx.beginPath()
    ctx.ellipse(-42, -210, 42, 70, -0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#e9fbff'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(-72, -52)
    ctx.lineTo(-44, 118)
    ctx.moveTo(72, -52)
    ctx.lineTo(44, 118)
    ctx.moveTo(0, -34)
    ctx.lineTo(0, 118)
    ctx.stroke()

    this.strokeFillPolygon(
      ctx,
      [
        [-84, 112],
        [84, 112],
        [58, 214],
        [-58, 214],
      ],
      '#1a4059',
      '#f0b94a',
      14,
    )
    this.strokeFillEllipse(ctx, 0, 162, 44, 34, '#1a4059', '#263d4f', 10)

    this.strokeFillPolygon(
      ctx,
      [
        [-22, 214],
        [22, 214],
        [42, 332],
        [-42, 332],
      ],
      '#1a4059',
      '#d8eef8',
      12,
    )

    ctx.strokeStyle = 'rgba(232, 251, 255, 0.65)'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(-130, -80)
    ctx.bezierCurveTo(-206, 20, -206, 180, -68, 268)
    ctx.moveTo(130, -80)
    ctx.bezierCurveTo(206, 20, 206, 180, 68, 268)
    ctx.stroke()

    ctx.fillStyle = '#ff5347'
    ctx.beginPath()
    ctx.arc(56, 150, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private strokeFillPolygon(
    ctx: CanvasRenderingContext2D,
    points: Array<[number, number]>,
    stroke: string,
    fill: string,
    lineWidth: number,
  ): void {
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
    ctx.fill()
  }

  private strokeFillEllipse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    stroke: string,
    fill: string,
    lineWidth: number,
  ): void {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
    ctx.fill()
  }

  private createRadialTexture(): THREE.CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to create aura texture.')
    }
    const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
    gradient.addColorStop(0, 'rgba(255,255,255,0.92)')
    gradient.addColorStop(0.32, 'rgba(255,255,255,0.24)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }

  private createShadowTexture(): THREE.CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to create shadow texture.')
    }
    const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 110)
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }
}
