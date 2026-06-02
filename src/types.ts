import type { Color, ColorRepresentation, Vector3, Vector3Tuple } from 'three'

export type QualityName = 'high' | 'medium' | 'low'

export interface QualityPreset {
  name: QualityName
  renderScale: number
  cloudCount: number
  particleScale: number
  shadows: boolean
}

export interface ZoneDefinition {
  id: number
  key: string
  name: string
  altitudeMin: number
  altitudeMax: number
  start: number
  end: number
  cameraY: [number, number]
  cameraZ: [number, number]
  cameraLookAt: Vector3Tuple
  skyBottom: ColorRepresentation
  skyTop: ColorRepresentation
  fogColor: ColorRepresentation
  fogDensity: [number, number]
  cloudDensity: [number, number]
  cloudBand: [number, number]
  lightColor: ColorRepresentation
  lightIntensity: [number, number]
  entity: EntityKey
  ambience: AmbienceKey
}

export type EntityKey = 'peacock' | 'hotAirBalloon' | 'glider' | 'commercialJet' | 'weatherBalloon'
export type AmbienceKey = 'ground' | 'lowSky' | 'fog' | 'highWind' | 'engine'

export interface ZoneState {
  zone: ZoneDefinition
  zoneIndex: number
  localT: number
  progress: number
  altitude: number
  visual: ZoneVisualState
}

export interface DebugState {
  progress: number
  fps: number
  quality: QualityName
  renderScale: number
}

export interface ZoneVisualState {
  cameraY: number
  cameraZ: number
  cameraLookAt: Vector3
  skyBottom: Color
  skyTop: Color
  fogColor: Color
  fogDensity: number
  cloudDensity: number
  cloudBand: [number, number]
  lightColor: Color
  lightIntensity: number
}
