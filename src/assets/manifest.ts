export interface AssetManifest {
  models: Record<string, string>
  textures: Record<string, string>
  sounds: Record<string, string>
}

export const assetManifest: AssetManifest = {
  models: {
    peacock: '/assets/models/peacock-placeholder.glb',
    hotAirBalloon: '/assets/models/hot-air-balloon-placeholder.glb',
    glider: '/assets/models/glider-placeholder.glb',
    commercialJet: '/assets/models/commercial-jet-placeholder.glb',
    weatherBalloon: '/assets/models/weather-balloon-placeholder.glb',
  },
  textures: {
    earth: '/assets/textures/earth-placeholder.jpg',
    cloud: '/assets/textures/cloud-placeholder.png',
  },
  sounds: {
    ground: '/assets/sounds/ground.mp3',
    wind: '/assets/sounds/wind.mp3',
    engine: '/assets/sounds/engine.mp3',
  },
}
