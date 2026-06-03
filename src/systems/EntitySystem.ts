import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { AssetManager } from './AssetManager'
import { ZONES } from '../zones/zoneConfig'
import type { EntityKey, EntityMotionDefinition, QualityPreset, ZoneState } from '../types'
import { clamp, lerp, smoothstep } from '../utils/math'

interface EntityRecord {
  key: EntityKey
  label: string
  group: THREE.Group
  hero: THREE.Sprite
  aura: THREE.Sprite
  shadow: THREE.Sprite
  modelRoot?: THREE.Group
  update: (
    elapsed: number,
    opacity: number,
    state: ZoneState,
    camera: THREE.PerspectiveCamera,
  ) => void
}

interface HeroOptions {
  key: EntityKey
  label: string
  size: number
  auraColor: string
  paint: (ctx: CanvasRenderingContext2D, size: number) => void
  rotation: (elapsed: number, state: ZoneState) => number
  modelUrl?: string
  modelScale?: number
  modelRotation?: THREE.Euler
}

export class EntitySystem {
  private readonly records: EntityRecord[]
  private readonly gltfLoader = new GLTFLoader()
  private readonly auraTexture = this.createRadialTexture()
  private readonly shadowTexture = this.createShadowTexture()
  private readonly entityZones = new Map(
    ZONES.map((zone, index) => [zone.entity, { zone, zoneIndex: index }] as const),
  )

  private quality: QualityPreset

  constructor(scene: THREE.Scene, assets: AssetManager, quality: QualityPreset) {
    this.quality = quality
    this.records = [
      this.createHero({
        key: 'peacock',
        label: 'Peacock',
        size: 15,
        auraColor: '#43f09a',
        paint: (ctx, size) => this.paintPeacock(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.6) * 0.04,
      }),
      this.createHero({
        key: 'hotAirBalloon',
        label: 'Hot-Air Balloon',
        size: 13.8,
        auraColor: '#ffcf7a',
        paint: (ctx, size) => this.paintHotAirBalloon(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.46) * 0.035,
      }),
      this.createHero({
        key: 'glider',
        label: 'Glider',
        size: 15.2,
        auraColor: '#e7f8ff',
        paint: (ctx, size) => this.paintGlider(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.48) * 0.09,
      }),
      this.createHero({
        key: 'commercialJet',
        label: 'Commercial Jet',
        size: 16.2,
        auraColor: '#d8f4ff',
        paint: (ctx, size) => this.paintCommercialJet(ctx, size),
        rotation: (elapsed) => -0.04 + Math.sin(elapsed * 0.34) * 0.035,
      }),
      this.createHero({
        key: 'weatherBalloon',
        label: 'Weather Balloon',
        size: 13.6,
        auraColor: '#dff7ff',
        paint: (ctx, size) => this.paintWeatherBalloon(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.38) * 0.045,
      }),
      this.createHero({
        key: 'stratosphericBalloon',
        label: 'Stratospheric Research Balloon',
        size: 17.6,
        auraColor: '#aee7ff',
        paint: (ctx, size) => this.paintStratosphericBalloon(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.24) * 0.03,
        modelUrl: assets.getOptionalModel('stratosphericBalloon'),
        modelScale: 4.2,
      }),
      this.createHero({
        key: 'soundingRocket',
        label: 'Sounding Rocket',
        size: 17.2,
        auraColor: '#f8d28a',
        paint: (ctx, size) => this.paintSoundingRocket(ctx, size),
        rotation: (elapsed) => -0.1 + Math.sin(elapsed * 0.38) * 0.03,
        modelUrl: assets.getOptionalModel('soundingRocket'),
        modelScale: 5.4,
        modelRotation: new THREE.Euler(0, 0, -0.1),
      }),
      this.createHero({
        key: 'spaceStation',
        label: 'Orbital Station',
        size: 18.6,
        auraColor: '#d7f6ff',
        paint: (ctx, size) => this.paintSpaceStation(ctx, size),
        rotation: (elapsed) => Math.sin(elapsed * 0.22) * 0.055,
        modelUrl: assets.getOptionalModel('spaceStation'),
        modelScale: 3.8,
        modelRotation: new THREE.Euler(0.25, -0.45, 0.05),
      }),
    ]

    this.records.forEach((record) => scene.add(record.group))
  }

  applyQuality(quality: QualityPreset): void {
    this.quality = quality
  }

  update(state: ZoneState, elapsed: number, camera: THREE.PerspectiveCamera): string {
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
      record.update(elapsed, opacity, entityState, camera)

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
    const record: EntityRecord = {
      key: options.key,
      label: options.label,
      group,
      hero,
      aura,
      shadow,
      update: (elapsed, opacity, state, camera) => {
        const position = this.getScreenPathPosition(state.zone.entityMotion, elapsed, state, camera)
        const prominence = 1 + smoothstep(0.15, 0.5, opacity) * 0.08
        group.position.copy(position)
        group.rotation.set(0, 0, 0)
        hero.material.rotation = options.rotation(elapsed, state)
        hero.scale.setScalar(options.size * prominence)
        aura.scale.setScalar(options.size * (1.48 + Math.sin(elapsed * 1.2) * 0.035))
        shadow.scale.set(options.size * 1.05, options.size * 0.38, 1)
        hero.material.opacity = record.modelRoot ? opacity * 0.08 : opacity
        aura.material.opacity = opacity * 0.55
        shadow.material.opacity = opacity * 0.34

        if (record.modelRoot) {
          record.modelRoot.visible = opacity > 0.02
          record.modelRoot.rotation.copy(options.modelRotation ?? new THREE.Euler())
          record.modelRoot.rotation.z += options.rotation(elapsed, state) * 0.7
          record.modelRoot.scale.setScalar(
            (options.modelScale ?? 1) * this.quality.modelRenderScale,
          )
          this.setModelOpacity(record.modelRoot, opacity)
        }
      },
    }

    if (options.modelUrl) {
      this.loadModel(record, options)
    }

    return record
  }

  private getScreenPathPosition(
    motion: EntityMotionDefinition,
    elapsed: number,
    state: ZoneState,
    camera: THREE.PerspectiveCamera,
  ): THREE.Vector3 {
    const passT =
      motion.mode === 'grounded'
        ? smoothstep(0.08, 1, state.localT)
        : smoothstep(0, 1, state.localT)
    const phase = motion.driftPhase ?? 0
    const x = motion.x + Math.sin(elapsed * (motion.driftSpeed ?? 0) + phase) * (motion.driftX ?? 0)
    const y =
      lerp(motion.startY, motion.endY, passT) +
      Math.sin(elapsed * (motion.bobSpeed ?? 0) + phase) * (motion.bobY ?? 0)

    return this.screenToWorld(camera, x, y, motion.distance)
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

  private loadModel(record: EntityRecord, options: HeroOptions): void {
    if (!options.modelUrl) {
      return
    }

    this.gltfLoader.load(
      options.modelUrl,
      (gltf) => {
        const modelRoot = new THREE.Group()
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxAxis = Math.max(size.x, size.y, size.z, 0.001)

        model.position.sub(center)
        model.scale.setScalar(1 / maxAxis)
        modelRoot.add(model)
        modelRoot.visible = false
        modelRoot.renderOrder = 43
        this.prepareModelMaterials(modelRoot)
        record.modelRoot = modelRoot
        record.group.add(modelRoot)
      },
      undefined,
      () => {
        record.modelRoot = undefined
      },
    )
  }

  private prepareModelMaterials(root: THREE.Object3D): void {
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return
      }

      child.frustumCulled = false
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.transparent = true
        material.depthTest = false
        material.depthWrite = false
        material.toneMapped = true
      })
    })
  }

  private setModelOpacity(root: THREE.Object3D, opacity: number): void {
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.opacity = opacity
      })
    })
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

  private paintStratosphericBalloon(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 18)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const envelope = ctx.createRadialGradient(-44, -220, 26, 0, -160, 230)
    envelope.addColorStop(0, '#ffffff')
    envelope.addColorStop(0.44, '#d9f7ff')
    envelope.addColorStop(1, '#6f9eb5')
    this.strokeFillEllipse(ctx, 0, -176, 176, 218, '#f6fdff', envelope, 18)

    ctx.strokeStyle = 'rgba(255,255,255,0.58)'
    ctx.lineWidth = 7
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath()
      ctx.ellipse(i * 28, -176, 40 + Math.abs(i) * 12, 212, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.strokeStyle = '#bfefff'
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(-106, -8)
    ctx.lineTo(-60, 144)
    ctx.moveTo(106, -8)
    ctx.lineTo(60, 144)
    ctx.moveTo(-34, 34)
    ctx.lineTo(-24, 148)
    ctx.moveTo(34, 34)
    ctx.lineTo(24, 148)
    ctx.stroke()

    this.strokeFillPolygon(
      ctx,
      [
        [-98, 140],
        [98, 140],
        [74, 246],
        [-74, 246],
      ],
      '#0e314f',
      '#eef8fb',
      13,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [-56, 166],
        [56, 166],
        [42, 226],
        [-42, 226],
      ],
      '#244864',
      '#f1b94e',
      8,
    )
    this.strokeFillEllipse(ctx, 0, 204, 34, 22, '#18334b', '#203a57', 7)

    ctx.strokeStyle = '#ffce6a'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(-78, 248)
    ctx.lineTo(78, 248)
    ctx.stroke()
    ctx.restore()
  }

  private paintSoundingRocket(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c + 24)
    ctx.rotate(-0.1)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const plume = ctx.createRadialGradient(0, 270, 8, 0, 270, 180)
    plume.addColorStop(0, 'rgba(255,246,194,0.92)')
    plume.addColorStop(0.34, 'rgba(255,145,55,0.54)')
    plume.addColorStop(1, 'rgba(255,112,45,0)')
    ctx.fillStyle = plume
    ctx.beginPath()
    ctx.ellipse(0, 278, 92, 180, 0, 0, Math.PI * 2)
    ctx.fill()

    this.strokeFillPolygon(
      ctx,
      [
        [0, -356],
        [76, -210],
        [62, 168],
        [0, 232],
        [-62, 168],
        [-76, -210],
      ],
      '#081a2d',
      '#f5f8fb',
      16,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [0, -356],
        [76, -210],
        [-76, -210],
      ],
      '#081a2d',
      '#e84d3f',
      14,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [-62, 48],
        [-182, 194],
        [-58, 162],
      ],
      '#081a2d',
      '#d54c3f',
      13,
    )
    this.strokeFillPolygon(
      ctx,
      [
        [62, 48],
        [182, 194],
        [58, 162],
      ],
      '#081a2d',
      '#d54c3f',
      13,
    )

    ctx.fillStyle = '#2b88c8'
    ctx.beginPath()
    ctx.arc(0, -118, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#081a2d'
    ctx.lineWidth = 10
    ctx.stroke()

    ctx.strokeStyle = '#f4bd57'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(-48, -14)
    ctx.lineTo(48, -14)
    ctx.moveTo(-44, 66)
    ctx.lineTo(44, 66)
    ctx.stroke()
    ctx.restore()
  }

  private paintSpaceStation(ctx: CanvasRenderingContext2D, size: number): void {
    const c = size / 2
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(-0.08)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.strokeStyle = '#081827'
    ctx.lineWidth = 14
    ctx.fillStyle = '#1f78b7'
    for (const side of [-1, 1]) {
      for (let row = -1; row <= 1; row += 1) {
        ctx.beginPath()
        ctx.rect(side * 128, row * 78 - 38, side * 246, 62)
        ctx.fill()
        ctx.stroke()
      }
    }

    ctx.strokeStyle = '#ffcf68'
    ctx.lineWidth = 6
    for (const side of [-1, 1]) {
      for (let x = 152; x <= 342; x += 48) {
        ctx.beginPath()
        ctx.moveTo(side * x, -112)
        ctx.lineTo(side * x, 100)
        ctx.stroke()
      }
    }

    ctx.strokeStyle = '#e8f7ff'
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.moveTo(-138, 0)
    ctx.lineTo(138, 0)
    ctx.moveTo(0, -104)
    ctx.lineTo(0, 106)
    ctx.stroke()

    this.strokeFillEllipse(ctx, 0, 0, 72, 38, '#081827', '#edf6fb', 12)
    this.strokeFillEllipse(ctx, -78, 0, 42, 30, '#081827', '#c7dce8', 10)
    this.strokeFillEllipse(ctx, 80, 0, 50, 32, '#081827', '#dcecf4', 10)
    this.strokeFillPolygon(
      ctx,
      [
        [-32, 56],
        [32, 56],
        [54, 132],
        [-54, 132],
      ],
      '#081827',
      '#f0f5f8',
      10,
    )

    ctx.fillStyle = '#9ee7ff'
    ctx.beginPath()
    ctx.arc(0, -8, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private strokeFillPolygon(
    ctx: CanvasRenderingContext2D,
    points: Array<[number, number]>,
    stroke: string,
    fill: string | CanvasGradient,
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
    fill: string | CanvasGradient,
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
