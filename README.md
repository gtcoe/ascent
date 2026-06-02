# ASCENT Prototype

Browser-first MVP for the ASCENT museum installation: a scroll-driven cinematic ascent from Earth Surface to Cloud Kingdom.

## What Is Implemented

- Vite + TypeScript + Three.js project structure.
- Lenis v1 scroll controller with normalized `0..1` progress.
- Five configured zones:
  - Earth Surface: `0-300m`
  - Lower Sky: `300m-2km`
  - Canopy Airspace: `2-5km`
  - High Altitude Flight: `5-12km`
  - Cloud Kingdom: `12-20km`
- HUD with altitude, zone name, entity label, progress indicator, and optional debug panel.
- Procedural atmosphere shader, fog, lighting, ground, clouds, and placeholder entities.
- Adaptive quality presets and low-FPS downgrade.
- Generated WebAudio ambience after first user gesture.
- Idle reset back to ground after 60 seconds.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run format:check
```

## Demo Controls

Use URL params during client review:

- `?quality=high`
- `?quality=medium`
- `?quality=low`
- `?debug=true`
- `?zone=1` through `?zone=5`

Examples:

```text
http://localhost:5173/?debug=true&quality=medium
http://localhost:5173/?zone=4&quality=high
```

## Prototype Limitations

- Entity models are procedural placeholders, not final GLB assets.
- Audio is generated locally with WebAudio oscillators so the demo has no external sound dependency.
- The atmosphere uses a premium shader approximation, not full physical Rayleigh scattering.
- Kiosk packaging is intentionally deferred until target OS, GPU, and input hardware are confirmed.

## Production Upgrade Path

- Replace placeholder entities with curated, optimized GLB assets in `public/assets/models`.
- Add compressed texture sets in `public/assets/textures`.
- Replace generated audio with mastered loopable ambience in `public/assets/sounds`.
- Extend `src/zones/zoneConfig.ts` with Zones 6-12.
- Add orbit, Earth sphere, starfield, and deep-space systems as new config-driven systems.
- Add OS-specific kiosk launch scripts for Windows/Linux/macOS once target hardware is known.
