export class LoadingScreen {
  private readonly root: HTMLDivElement
  private readonly fill: HTMLDivElement
  private readonly note: HTMLDivElement

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div')
    this.root.className = 'loading'
    this.root.innerHTML = `
      <div class="loading__panel">
        <div class="loading__eyebrow">Museum prototype</div>
        <div class="loading__title">ASCENT</div>
        <div class="loading__bar"><div class="loading__bar-fill"></div></div>
        <div class="loading__note">Preparing atmosphere, terrain, and scroll systems.</div>
      </div>
    `
    parent.appendChild(this.root)

    const fill = this.root.querySelector<HTMLDivElement>('.loading__bar-fill')
    const note = this.root.querySelector<HTMLDivElement>('.loading__note')
    if (!fill || !note) {
      throw new Error('Loading screen elements were not created.')
    }
    this.fill = fill
    this.note = note
  }

  setProgress(progress: number, note: string): void {
    this.fill.style.width = `${Math.round(progress * 100)}%`
    this.note.textContent = note
  }

  hide(): void {
    this.setProgress(1, 'Ready.')
    this.root.classList.add('loading--hidden')
  }
}
