import type { DebugState, ZoneState } from '../types'
import { formatAltitude } from '../utils/math'

export class HUD {
  private readonly altitudeEl: HTMLDivElement
  private readonly zoneEl: HTMLDivElement
  private readonly entityEl: HTMLDivElement
  private readonly progressEl: HTMLDivElement
  private readonly debugEl: HTMLDivElement

  constructor(root: HTMLElement, debug: boolean) {
    const hud = document.createElement('div')
    hud.className = debug ? 'hud hud--debug' : 'hud'
    hud.innerHTML = `
      <div class="hud__top">
        <div class="hud__brand">
          <div class="hud__title">ASCENT</div>
          <div class="hud__subtitle">Interactive ground-to-orbit museum prototype</div>
        </div>
        <div class="hud__readout">
          <div class="hud__altitude">0 m</div>
          <div class="hud__zone">Earth Surface</div>
        </div>
      </div>
      <div class="hud__debug"></div>
      <div class="hud__bottom">
        <div class="hud__progress"><div class="hud__progress-fill"></div></div>
        <div class="hud__entity">Peacock</div>
      </div>
    `
    root.appendChild(hud)

    this.altitudeEl = this.query(hud, '.hud__altitude')
    this.zoneEl = this.query(hud, '.hud__zone')
    this.entityEl = this.query(hud, '.hud__entity')
    this.progressEl = this.query(hud, '.hud__progress-fill')
    this.debugEl = this.query(hud, '.hud__debug')
  }

  update(state: ZoneState, entityLabel: string): void {
    this.altitudeEl.textContent = formatAltitude(state.altitude)
    this.zoneEl.textContent = state.zone.name
    this.entityEl.textContent = entityLabel
    this.progressEl.style.width = `${Math.round(state.progress * 1000) / 10}%`
  }

  updateDebug(state: DebugState): void {
    this.debugEl.innerHTML = [
      `progress: ${state.progress.toFixed(3)}`,
      `fps: ${state.fps}`,
      `quality: ${state.quality}`,
      `render scale: ${state.renderScale}`,
    ].join('<br>')
  }

  private query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
    const el = root.querySelector<T>(selector)
    if (!el) {
      throw new Error(`HUD element ${selector} was not found.`)
    }
    return el
  }
}
