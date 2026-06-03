import type { AmbienceKey, EntityKey } from '../types'

export interface AssetManifest {
  models: Partial<Record<EntityKey, string>>
  textures: Record<string, string | undefined>
  sounds: Partial<Record<AmbienceKey | 'wind', string>>
}

export const assetManifest: AssetManifest = {
  models: {
    stratosphericBalloon: undefined,
    soundingRocket: undefined,
    spaceStation: undefined,
  },
  textures: {
    earth: undefined,
    cloud: undefined,
    earthLimb: undefined,
    starfield: undefined,
    rocketPlume: undefined,
    stationMaterial: undefined,
  },
  sounds: {
    ground: undefined,
    wind: undefined,
    engine: undefined,
    thinStratosphere: undefined,
    rocketAscent: undefined,
    orbitalSilence: undefined,
  },
}
