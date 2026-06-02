import * as THREE from 'three'
import { ZONES } from './zoneConfig'
import type { ZoneDefinition, ZoneState, ZoneVisualState } from '../types'
import { clamp, lerp, smoothstep } from '../utils/math'

export class ZoneManager {
  readonly zones = ZONES

  getState(progress: number): ZoneState {
    const safeProgress = clamp(progress)
    const zoneIndex = Math.min(
      this.zones.length - 1,
      Math.max(
        0,
        this.zones.findIndex((zone) => safeProgress >= zone.start && safeProgress <= zone.end),
      ),
    )
    const zone = this.zones[zoneIndex] ?? this.zones[this.zones.length - 1]
    const localT = clamp((safeProgress - zone.start) / (zone.end - zone.start))
    const altitude = lerp(zone.altitudeMin, zone.altitudeMax, localT)

    return {
      zone,
      zoneIndex,
      localT,
      progress: safeProgress,
      altitude,
      visual: this.getVisualState(zoneIndex, localT),
    }
  }

  applyCamera(camera: THREE.PerspectiveCamera, state: ZoneState): void {
    camera.position.set(0, state.visual.cameraY, state.visual.cameraZ)
    camera.lookAt(state.visual.cameraLookAt)
  }

  private getVisualState(zoneIndex: number, localT: number): ZoneVisualState {
    const zone = this.zones[zoneIndex]
    const nextZone = this.zones[Math.min(this.zones.length - 1, zoneIndex + 1)]
    const current = this.sampleZone(zone, localT)
    const next = this.sampleZone(nextZone, 0)
    const transitionT = zone === nextZone ? 0 : smoothstep(0.62, 1, localT)

    return this.blendVisualState(current, next, transitionT)
  }

  private sampleZone(zone: ZoneDefinition, localT: number): ZoneVisualState {
    return {
      cameraY: lerp(zone.cameraY[0], zone.cameraY[1], localT),
      cameraZ: lerp(zone.cameraZ[0], zone.cameraZ[1], localT),
      cameraLookAt: new THREE.Vector3(...zone.cameraLookAt),
      skyBottom: new THREE.Color(zone.skyBottom),
      skyTop: new THREE.Color(zone.skyTop),
      fogColor: new THREE.Color(zone.fogColor),
      fogDensity: lerp(zone.fogDensity[0], zone.fogDensity[1], localT),
      cloudDensity: lerp(zone.cloudDensity[0], zone.cloudDensity[1], localT),
      cloudBand: [zone.cloudBand[0], zone.cloudBand[1]],
      lightColor: new THREE.Color(zone.lightColor),
      lightIntensity: lerp(zone.lightIntensity[0], zone.lightIntensity[1], localT),
    }
  }

  private blendVisualState(
    current: ZoneVisualState,
    next: ZoneVisualState,
    transitionT: number,
  ): ZoneVisualState {
    return {
      cameraY: lerp(current.cameraY, next.cameraY, transitionT),
      cameraZ: lerp(current.cameraZ, next.cameraZ, transitionT),
      cameraLookAt: current.cameraLookAt.clone().lerp(next.cameraLookAt, transitionT),
      skyBottom: current.skyBottom.clone().lerp(next.skyBottom, transitionT),
      skyTop: current.skyTop.clone().lerp(next.skyTop, transitionT),
      fogColor: current.fogColor.clone().lerp(next.fogColor, transitionT),
      fogDensity: lerp(current.fogDensity, next.fogDensity, transitionT),
      cloudDensity: lerp(current.cloudDensity, next.cloudDensity, transitionT),
      cloudBand: [
        lerp(current.cloudBand[0], next.cloudBand[0], transitionT),
        lerp(current.cloudBand[1], next.cloudBand[1], transitionT),
      ],
      lightColor: current.lightColor.clone().lerp(next.lightColor, transitionT),
      lightIntensity: lerp(current.lightIntensity, next.lightIntensity, transitionT),
    }
  }
}
