import Lenis from 'lenis'
import { gsap } from 'gsap'
import { clamp } from '../utils/math'

interface ScrollControllerOptions {
  initialProgress: number
  onActivity: () => void
}

export class ScrollController {
  private readonly lenis: Lenis
  private readonly scrollSpace: HTMLDivElement
  private readonly onActivity: () => void
  private progress: number
  private isProgrammaticScroll = false

  constructor(options: ScrollControllerOptions) {
    this.onActivity = options.onActivity
    this.progress = clamp(options.initialProgress)
    this.scrollSpace = document.createElement('div')
    this.scrollSpace.className = 'scroll-space'
    document.body.appendChild(this.scrollSpace)

    this.lenis = new Lenis({
      duration: 1.8,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    this.lenis.on('scroll', () => {
      this.progress = this.readProgress()
      if (!this.isProgrammaticScroll) {
        this.onActivity()
      }
    })

    window.addEventListener('wheel', this.handleManualActivity, { passive: true })
    window.addEventListener('touchstart', this.handleManualActivity, { passive: true })
    window.addEventListener('keydown', this.handleManualActivity)

    requestAnimationFrame(() => this.jumpTo(options.initialProgress))
  }

  raf(time: number): void {
    this.lenis.raf(time)
    this.progress = this.readProgress()
  }

  getProgress(): number {
    return this.progress
  }

  resetToGround(): void {
    this.scrollToProgress(0, 3)
  }

  dispose(): void {
    window.removeEventListener('wheel', this.handleManualActivity)
    window.removeEventListener('touchstart', this.handleManualActivity)
    window.removeEventListener('keydown', this.handleManualActivity)
    this.lenis.destroy()
    this.scrollSpace.remove()
  }

  private jumpTo(progress: number): void {
    this.isProgrammaticScroll = true
    this.lenis.scrollTo(this.progressToScrollY(progress), { immediate: true })
    this.progress = this.readProgress()
    requestAnimationFrame(() => {
      this.isProgrammaticScroll = false
    })
  }

  private scrollToProgress(progress: number, duration: number): void {
    const state = { progress: this.readProgress() }
    this.isProgrammaticScroll = true
    gsap.to(state, {
      progress: clamp(progress),
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.lenis.scrollTo(this.progressToScrollY(state.progress), { immediate: true })
        this.progress = state.progress
      },
      onComplete: () => {
        this.isProgrammaticScroll = false
      },
    })
  }

  private get limit(): number {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  }

  private readProgress(): number {
    return clamp(1 - window.scrollY / this.limit)
  }

  private progressToScrollY(progress: number): number {
    return this.limit * (1 - clamp(progress))
  }

  private readonly handleManualActivity = (): void => {
    if (!this.isProgrammaticScroll) {
      this.onActivity()
    }
  }
}
