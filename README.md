# VABB Runway Lab

Educational 3D schematic of Chhatrapati Shivaji Maharaj International Airport (ICAO **VABB**, IATA **BOM**). ICAO Annex 14 markings, lights, and signs on published runway dimensions.

**Not a photoreal digital twin. Not for real navigation or flight.**

## Run locally

Needs **Node.js 22+**.

```bash
git clone https://github.com/<your-user>/vabb-runway-lab.git
cd vabb-runway-lab
npm install --legacy-peer-deps
npm run dev
```

Then open the URL Vite prints (default `http://localhost:8080`).

`--legacy-peer-deps` is required because React 19.3 and `@react-three/fiber` disagree on a peer range; the app still runs.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on `0.0.0.0:8080` |
| `npm run build` | Production build (Vercel / Nitro) |
| `npm run typecheck` | TypeScript |

No login, no database. Auth is off (`.grok/app-env.json` → `VITE_AUTH_ENABLED=false`).

## Put it on GitHub

1. Create an empty repository (no README/license if you are uploading this zip).
2. Unzip this project, then:

```bash
cd vabb-runway-lab
git init
git add .
git commit -m "VABB Runway Lab"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## Deploy

This is a **TanStack Start** app with SSR. It will **not** run as a static GitHub Pages site.

Use **Vercel** (already configured in `vite.config.ts` via the Nitro `vercel` preset):

1. Import the GitHub repo in Vercel
2. Framework: Vite / other
3. Build command: `npm run build`
4. Install command: `npm install --legacy-peer-deps`

Or run it in **GitHub Codespaces** with `npm install --legacy-peer-deps && npm run dev`.

## What to try

- **Enter airfield** — orbit camera
- **Walk mode** — starts at RWY 09 threshold, looking east. WASD, Shift sprint, click to look, Q/E altitude, F nearest feature
- Click any marking, light, or sign for metres + Annex 14 notes
- **Night** — aerodrome lights
- Catalog jump, layer toggles (Markings / Lights / Signs / Buildings)

## Lab source (the 3D app)

| File | Role |
| --- | --- |
| `src/lab/world.ts` | Metres, headings, runway geometry (1 unit = 1 m, +Y up, −Z north) |
| `src/lab/catalog.ts` | Clickable features + ICAO text |
| `src/lab/markings.tsx` | Runway / taxiway paint |
| `src/lab/lights.tsx` | Edge, CL, ALS, PAPI, REIL, wig-wag |
| `src/lab/fixtures.tsx` | Signs, T2, tower, hangars, jets, windsock |
| `src/lab/systems.tsx` | Cameras, walk/inspect, picker, dimension gizmo |
| `src/lab/AirfieldCanvas.tsx` | React Three Fiber canvas |
| `src/lab/ui/` | Start screen, HUD, touch joystick |
| `src/routes/index.tsx` | `/` route |

Stack: TanStack Start + React 19 + Tailwind v4 + three.js / R3F / drei.

## Dimensions used

- RWY 09/27: 3448 × 60 m, displaced 142 m (09) / 482 m (27). CAT I on 09, CAT II on 27.
- RWY 14/32: 2871 × 45 m, displaced 377 m (14) / 260 m (32).
