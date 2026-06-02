import type { QualityName } from '../types'

export interface DemoParams {
  debug: boolean
  initialQuality: QualityName
  initialZone?: number
}

const qualityValues: QualityName[] = ['high', 'medium', 'low']

export function readDemoParams(search = window.location.search): DemoParams {
  const params = new URLSearchParams(search)
  const quality = params.get('quality')?.toLowerCase()
  const zone = Number(params.get('zone'))

  return {
    debug: params.get('debug') === 'true',
    initialQuality: qualityValues.includes(quality as QualityName)
      ? (quality as QualityName)
      : 'high',
    initialZone: Number.isInteger(zone) && zone >= 1 && zone <= 5 ? zone : undefined,
  }
}
