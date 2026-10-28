# AI Infrastructure Atlas (standalone clone)

Single-page, dark-themed interactive world map of 42 source-backed AI data center locations.
Stack: Vite + React 19 + TypeScript + Leaflet + leaflet.markercluster, Esri Dark Gray tiles, plain CSS (Manrope / DM Mono). All data is static; no backend, no analytics.

## Branding
All branding (site name, eyebrow/logo text, tagline/meta description, page title, theme color) lives in **`src/config/brand.ts`**. Edit that one file to rebrand; `index.html` is filled from it at build time.

## Data
- `src/data/locations.json` – 42 locations
- `src/data/sources.json` – 8 source families
- `src/data/index.ts` – types plus evidence/status colors

## Commands
```bash
npm install          # install deps
npm run dev          # dev server on http://0.0.0.0:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ on http://0.0.0.0:5173
```

`verify/` has the headless-browser screenshots and the check script used to validate the build.
