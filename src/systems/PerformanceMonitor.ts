export class PerformanceMonitor {
  private frames = 0
  private elapsed = 0
  private lowFpsSeconds = 0
  private latestFps = 60

  update(deltaSeconds: number, onLowFps: () => void): number {
    this.frames += 1
    this.elapsed += deltaSeconds

    if (this.elapsed < 1) {
      return this.latestFps
    }

    this.latestFps = Math.round(this.frames / this.elapsed)
    this.lowFpsSeconds = this.latestFps < 30 ? this.lowFpsSeconds + this.elapsed : 0
    this.frames = 0
    this.elapsed = 0

    if (this.lowFpsSeconds >= 5) {
      this.lowFpsSeconds = 0
      onLowFps()
    }

    return this.latestFps
  }

  get fps(): number {
    return this.latestFps
  }
}
