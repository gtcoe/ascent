# ASCENT Prototype

Browser-first MVP for the ASCENT museum installation: a scroll-driven cinematic ascent from Earth Surface to Low Earth Orbit.

## What Is Implemented

- Vite + TypeScript + Three.js project structure.
- Lenis v1 scroll controller with normalized `0..1` progress.
- Eight configured zones:
  - Earth Surface: `0-300m`
  - Lower Sky: `300m-2km`
  - Canopy Airspace: `2-5km`
  - High Altitude Flight: `5-12km`
  - Cloud Kingdom: `12-20km`
  - Stratospheric Frontier: `20-50km`
  - Edge of Space: `50-100km`
  - Low Earth Orbit: `100-420km`
- HUD with altitude, zone name, entity label, progress indicator, and optional debug panel.
- Procedural atmosphere shader, fog, lighting, ground, clouds, stars, Earth curvature, orbit accents, rocket trail, and hero entities.
- GLB-first asset path for Zones 6-8 with polished procedural fallbacks when local model files are not installed.
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
- `?zone=1` through `?zone=8`

Examples:

```text
http://localhost:5173/?debug=true&quality=medium
http://localhost:5173/?zone=7&quality=high
```

## Premium GLB Asset Slots

Zones 6-8 are ready for real local GLB assets. Place optimized, licensed models in `public/assets/models`, then wire their paths in `src/assets/manifest.ts`:

- `stratosphericBalloon`: large envelope plus payload capsule for Zone 6.
- `soundingRocket`: clean non-branded research rocket for Zone 7.
- `spaceStation`: ISS-style station with readable solar panels for Zone 8.

Keep production hero models around `2-5MB` after optimization where possible. Record source URL, author, license, and modification notes in `public/assets/models/ASSET_LICENSES.md`.

## Prototype Limitations

- Zones 6-8 use procedural premium fallbacks until licensed GLB files are added to the manifest.
- Audio is generated locally with WebAudio oscillators so the demo has no external sound dependency.
- The atmosphere uses a premium shader approximation, not full physical Rayleigh scattering.
- Kiosk packaging is intentionally deferred until target OS, GPU, and input hardware are confirmed.

## Production Upgrade Path

- Replace placeholder entities with curated, optimized GLB assets in `public/assets/models`.
- Add compressed texture sets in `public/assets/textures`.
- Replace generated audio with mastered loopable ambience in `public/assets/sounds`.
- Extend `src/zones/zoneConfig.ts` with Zones 9-12.
- Replace the procedural Earth limb with a textured/physical Earth model once the final space art direction is approved.
- Add OS-specific kiosk launch scripts for Windows/Linux/macOS once target hardware is known.
