import * as THREE from 'three'
import type { QualityPreset } from '../types'

export class SceneRenderer {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 1200)
  readonly renderer: THREE.WebGLRenderer

  private readonly resizeObserver: ResizeObserver
  private activePreset: QualityPreset

  constructor(canvas: HTMLCanvasElement, initialPreset: QualityPreset) {
    this.activePreset = initialPreset
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05

    this.camera.position.set(0, 3, 42)
    this.camera.lookAt(0, 7, 0)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.applyQuality(initialPreset)
    this.resize()
  }

  applyQuality(preset: QualityPreset): void {
    this.activePreset = preset
    this.resize()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.resizeObserver.disconnect()
    this.renderer.dispose()
  }

  private resize(): void {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    const pixelRatio = Math.min(1, window.devicePixelRatio || 1) * this.activePreset.renderScale

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
  }
}
