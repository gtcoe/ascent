import './style.css'
import { ExperienceApp } from './core/ExperienceApp'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('ASCENT root element #app was not found.')
}

const app = new ExperienceApp(root)
app.start()

window.addEventListener('beforeunload', () => app.dispose())
