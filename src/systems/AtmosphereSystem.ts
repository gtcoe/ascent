import * as THREE from 'three'
import fragmentShader from '../shaders/atmosphere.frag.glsl'
import vertexShader from '../shaders/atmosphere.vert.glsl'
import type { ZoneState } from '../types'
import { lerp } from '../utils/math'

export class AtmosphereSystem {
  private readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh

  constructor(scene: THREE.Scene) {
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uBottomColor: { value: new THREE.Color('#ff9b42') },
        uTopColor: { value: new THREE.Color('#87ceeb') },
        uProgress: { value: 0 },
        uHaze: { value: 0.35 },
      },
      vertexShader,
      fragmentShader,
    })

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(480, 48, 24), this.material)
    scene.add(this.mesh)
  }

  update(state: ZoneState): void {
    this.material.uniforms.uBottomColor.value.copy(state.visual.skyBottom)
    this.material.uniforms.uTopColor.value.copy(state.visual.skyTop)
    this.material.uniforms.uProgress.value = state.progress
    this.material.uniforms.uHaze.value = lerp(0.2, 1.0, state.progress)
    this.mesh.position.copy(state.visual.cameraLookAt)
  }
}
