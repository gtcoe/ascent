import * as THREE from 'three'
import { readDemoParams } from '../demo/urlParams'
import { HUD } from '../hud/HUD'
import { LoadingScreen } from '../hud/LoadingScreen'
import { ScrollController } from '../scroll/ScrollController'
import { AtmosphereSystem } from '../systems/AtmosphereSystem'
import { AssetManager } from '../systems/AssetManager'
import { AudioManager } from '../systems/AudioManager'
import { CloudSystem } from '../systems/CloudSystem'
import { EarthCurvatureSystem } from '../systems/EarthCurvatureSystem'
import { EntitySystem } from '../systems/EntitySystem'
import { GroundSystem } from '../systems/GroundSystem'
import { LightingSystem } from '../systems/LightingSystem'
import { OrbitalSystem } from '../systems/OrbitalSystem'
import { PerformanceMonitor } from '../systems/PerformanceMonitor'
import { QualityManager } from '../systems/QualityManager'
import { RocketTrailSystem } from '../systems/RocketTrailSystem'
import { StarfieldSystem } from '../systems/StarfieldSystem'
import { ZoneManager } from '../zones/ZoneManager'
import { SceneRenderer } from './SceneRenderer'

export class ExperienceApp {
  private readonly shell = document.createElement('div')
  private readonly canvas = document.createElement('canvas')
  private readonly loading: LoadingScreen
  private readonly params = readDemoParams()
  private readonly qualityManager = new QualityManager(this.params.initialQuality)
  private readonly sceneRenderer: SceneRenderer
  private readonly scrollController: ScrollController
  private readonly zoneManager = new ZoneManager()
  private readonly assetManager = new AssetManager()
  private readonly hud: HUD
  private readonly performanceMonitor = new PerformanceMonitor()
  private readonly atmosphere: AtmosphereSystem
  private readonly lighting: LightingSystem
  private readonly ground: GroundSystem
  private readonly clouds: CloudSystem
  private readonly stars: StarfieldSystem
  private readonly earthCurvature: EarthCurvatureSystem
  private readonly rocketTrail: RocketTrailSystem
  private readonly orbit: OrbitalSystem
  private readonly entities: EntitySystem
  private readonly audio = new AudioManager()

  private animationFrame = 0
  private lastActivity = performance.now()
  private lastFrameTime = 0
  private elapsed = 0
  private readonly root: HTMLElement

  constructor(root: HTMLElement) {
    this.root = root
    this.shell.className = 'ascent-shell'
    this.canvas.className = 'ascent-canvas'
    this.shell.appendChild(this.canvas)
    this.root.replaceChildren(this.shell)

    this.loading = new LoadingScreen(this.shell)
    this.loading.setProgress(0.18, 'Creating 4K-ready renderer.')

    this.sceneRenderer = new SceneRenderer(this.canvas, this.qualityManager.preset)
    this.sceneRenderer.scene.fog = new THREE.FogExp2('#d4b483', 0.018)

    this.loading.setProgress(0.34, 'Preparing scroll engine.')
    this.scrollController = new ScrollController({
      initialProgress: this.initialProgress,
      onActivity: () => {
        this.lastActivity = performance.now()
      },
    })

    this.loading.setProgress(0.52, 'Building atmosphere and terrain.')
    this.assetManager.getOptionalTexture('earth')
    this.hud = new HUD(this.shell, this.params.debug)
    this.atmosphere = new AtmosphereSystem(this.sceneRenderer.scene)
    this.lighting = new LightingSystem(this.sceneRenderer.scene)
    this.ground = new GroundSystem(this.sceneRenderer.scene)

    this.loading.setProgress(0.74, 'Preparing premium flight and orbital entities.')
    this.clouds = new CloudSystem(this.sceneRenderer.scene, this.qualityManager.preset)
    this.stars = new StarfieldSystem(this.sceneRenderer.scene, this.qualityManager.preset)
    this.earthCurvature = new EarthCurvatureSystem(this.sceneRenderer.scene)
    this.rocketTrail = new RocketTrailSystem(this.sceneRenderer.scene, this.qualityManager.preset)
    this.orbit = new OrbitalSystem(this.sceneRenderer.scene, this.qualityManager.preset)
    this.entities = new EntitySystem(
      this.sceneRenderer.scene,
      this.assetManager,
      this.qualityManager.preset,
    )
    this.loading.hide()
  }

  start(): void {
    this.loop(0)
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame)
    this.scrollController.dispose()
    this.audio.dispose()
    this.sceneRenderer.dispose()
  }

  private loop = (time: number): void => {
    this.animationFrame = requestAnimationFrame(this.loop)
    const deltaSeconds =
      this.lastFrameTime === 0 ? 0 : Math.min(0.05, (time - this.lastFrameTime) / 1000)
    this.lastFrameTime = time
    this.elapsed += deltaSeconds

    this.scrollController.raf(time)
    this.handleIdleReset()

    const progress = this.scrollController.getProgress()
    const state = this.zoneManager.getState(progress)
    const fps = this.performanceMonitor.update(deltaSeconds, () => this.downgradeQuality())

    this.zoneManager.applyCamera(this.sceneRenderer.camera, state)
    this.updateFog(state)
    this.atmosphere.update(state)
    this.lighting.update(state)
    this.ground.update(state)
    this.clouds.update(state, this.elapsed)
    this.stars.update(state, this.elapsed)
    this.earthCurvature.update(state, this.elapsed)
    this.rocketTrail.update(state, this.elapsed, this.sceneRenderer.camera)
    this.orbit.update(state, this.elapsed)
    const entityLabel = this.entities.update(state, this.elapsed, this.sceneRenderer.camera)
    this.audio.update(state)

    this.hud.update(state, entityLabel)
    this.hud.updateDebug({
      progress,
      fps,
      quality: this.qualityManager.name,
      renderScale: this.qualityManager.preset.renderScale,
    })

    this.sceneRenderer.render()
  }

  private get initialProgress(): number {
    if (!this.params.initialZone) {
      return 0
    }

    return this.zoneManager.zones.find((zone) => zone.id === this.params.initialZone)?.start ?? 0
  }

  private handleIdleReset(): void {
    const inactiveFor = performance.now() - this.lastActivity
    if (inactiveFor > 60000 && this.scrollController.getProgress() > 0.02) {
      this.lastActivity = performance.now()
      this.scrollController.resetToGround()
    }
  }

  private updateFog(state: ReturnType<ZoneManager['getState']>): void {
    const fog = this.sceneRenderer.scene.fog
    if (fog instanceof THREE.FogExp2) {
      fog.color.copy(state.visual.fogColor)
      fog.density = state.visual.fogDensity
    }
  }

  private downgradeQuality(): void {
    const next = this.qualityManager.downgrade()
    if (!next) {
      return
    }

    this.sceneRenderer.applyQuality(next)
    this.clouds.applyQuality(next)
    this.stars.applyQuality(next)
    this.rocketTrail.applyQuality(next)
    this.orbit.applyQuality(next)
    this.entities.applyQuality(next)
  }
}
