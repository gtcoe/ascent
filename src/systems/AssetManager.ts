import { assetManifest } from '../assets/manifest'

export class AssetManager {
  readonly manifest = assetManifest

  getOptionalModel(key: keyof typeof assetManifest.models): string | undefined {
    return this.manifest.models[key]
  }

  getOptionalTexture(key: keyof typeof assetManifest.textures): string | undefined {
    return this.manifest.textures[key]
  }

  getOptionalSound(key: keyof typeof assetManifest.sounds): string | undefined {
    return this.manifest.sounds[key]
  }
}
