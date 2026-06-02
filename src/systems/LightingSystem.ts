import * as THREE from 'three'
import type { ZoneState } from '../types'
import { lerp } from '../utils/math'

export class LightingSystem {
  private readonly ambient = new THREE.HemisphereLight('#dfefff', '#3b2516', 0.8)
  private readonly sun = new THREE.DirectionalLight('#fff2d6', 2.2)

  constructor(scene: THREE.Scene) {
    this.sun.position.set(24, 48, 18)
    scene.add(this.ambient, this.sun)
  }

  update(state: ZoneState): void {
    this.sun.color.copy(state.visual.lightColor)
    this.sun.intensity = state.visual.lightIntensity
    this.ambient.intensity = lerp(0.8, 0.45, state.progress)
  }
}
