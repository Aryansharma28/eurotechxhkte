# CareBridge 康橋

> Keep recently-discharged elderly Hong Kong patients well at home — so they don't get readmitted.

A transitional-care webapp with **three roles around one shared care picture**, fed by a frictionless **daily phone call** to the elder:

- **Elder 長者** — no app at all. Answers a warm daily check-in call in Cantonese.
- **Adult child 子女** — a phone app: at-a-glance reassurance + only-when-it-matters nudges.
- **Social worker 社工** — a web dashboard (+ tablet visit mode) to triage a caseload of 5 elders.

This repo is the **scheme overview (`index.html`)** plus the clickable hi-fi prototypes it links to.

## Run it

No build step. It's static HTML/CSS/JS — the prototypes use CDN React + Babel-standalone, so you just need to serve the folder over HTTP (opening files via `file://` won't load the `.jsx`).

```bash
npm start            # → http://localhost:8080   (zero-dependency Node server)
# or
PORT=3000 npm start
# or, with no Node:
python -m http.server 8080
```

Then open **http://localhost:8080** — that's `index.html`, the landing hub.

## What's here

| File | What it is |
|---|---|
| `index.html` | **Landing hub** — thesis, three-role care loop, design system, links to everything |
| `Social Worker Dashboard.html` | Caseload, ADL tracking, risk triage, elder-detail drawer, tablet visit mode |
| `Family App.html` | The adult child's reassuring phone screen |
| `Elder Call.html` | The daily call walkthrough + what it captures |
| `Spec.html` / `SPEC.md` | Full build spec — roles, data model, flows, i18n, stack, milestones |
| `styles/system.css` | Design tokens (colours, type, components) |
| `sw/`, `fam/`, `elder/`, `frames/` | Per-prototype React (JSX) + CSS |
| `server.js` | Tiny zero-dependency static server |

## Design

Warm neutrals + a green health accent; amber/red reserved strictly for triage so they never lose meaning. Hanken Grotesk (Latin) + Noto Sans HK (中文). Bilingual EN / 繁體中文 throughout.

> The landing page is fully offline-capable (HTML/CSS only, aside from web fonts). The sub-prototypes pull React + Babel from a CDN, so they need network the first load.

_Generated from a [Claude Design](https://claude.ai/design) handoff bundle._

Hello from Langy
