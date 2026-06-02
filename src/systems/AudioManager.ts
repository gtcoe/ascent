import type { AmbienceKey, ZoneState } from '../types'
import { ZONES } from '../zones/zoneConfig'
import { smoothstep } from '../utils/math'

interface Voice {
  key: AmbienceKey
  oscillator: OscillatorNode
  gain: GainNode
}

const voiceConfig: Record<AmbienceKey, { frequency: number; type: OscillatorType }> = {
  ground: { frequency: 92, type: 'sine' },
  lowSky: { frequency: 146, type: 'triangle' },
  fog: { frequency: 64, type: 'sine' },
  highWind: { frequency: 212, type: 'sawtooth' },
  engine: { frequency: 48, type: 'sawtooth' },
}

export class AudioManager {
  private context?: AudioContext
  private voices: Voice[] = []
  private started = false

  constructor() {
    window.addEventListener('pointerdown', this.unlock, { once: true })
    window.addEventListener('keydown', this.unlock, { once: true })
  }

  update(state: ZoneState): void {
    if (!this.context || !this.started) {
      return
    }

    this.voices.forEach((voice) => {
      const influence = ZONES.reduce((total, zone) => {
        if (zone.ambience !== voice.key) {
          return total
        }

        const zoneT = (state.progress - zone.start) / (zone.end - zone.start)
        return total + smoothstep(-0.18, 0.18, zoneT) * (1 - smoothstep(0.82, 1.18, zoneT))
      }, 0)
      const target = 0.0001 + influence * 0.045
      voice.gain.gain.setTargetAtTime(target, this.context!.currentTime, 0.8)
    })
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.unlock)
    window.removeEventListener('keydown', this.unlock)
    this.voices.forEach((voice) => voice.oscillator.stop())
    void this.context?.close()
  }

  private readonly unlock = (): void => {
    if (this.started) {
      return
    }

    this.context = new AudioContext()
    this.voices = Object.entries(voiceConfig).map(([key, config]) => {
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      oscillator.type = config.type
      oscillator.frequency.value = config.frequency
      gain.gain.value = 0.0001
      oscillator.connect(gain)
      gain.connect(this.context!.destination)
      oscillator.start()
      return { key: key as AmbienceKey, oscillator, gain }
    })
    this.started = true
  }
}
