import type { QualityName, QualityPreset } from '../types'

export const QUALITY_PRESETS: Record<QualityName, QualityPreset> = {
  high: {
    name: 'high',
    renderScale: 1,
    cloudCount: 56,
    particleScale: 1,
    shadows: false,
  },
  medium: {
    name: 'medium',
    renderScale: 0.82,
    cloudCount: 34,
    particleScale: 0.65,
    shadows: false,
  },
  low: {
    name: 'low',
    renderScale: 0.64,
    cloudCount: 18,
    particleScale: 0.4,
    shadows: false,
  },
}

const downgradeOrder: QualityName[] = ['high', 'medium', 'low']

export class QualityManager {
  private currentName: QualityName

  constructor(initialName: QualityName) {
    this.currentName = initialName
  }

  get preset(): QualityPreset {
    return QUALITY_PRESETS[this.currentName]
  }

  get name(): QualityName {
    return this.currentName
  }

  downgrade(): QualityPreset | undefined {
    const index = downgradeOrder.indexOf(this.currentName)
    const next = downgradeOrder[index + 1]

    if (!next) {
      return undefined
    }

    this.currentName = next
    return this.preset
  }
}
