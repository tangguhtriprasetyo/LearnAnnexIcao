# DEP Prep · B737-800

Study and mock-exam trainer for **Boeing 737-800 direct-entry (DEP) airline assessments**:
aircraft systems, limitations, QRH memory items, performance, and **ICAO air law** (Chicago Convention, Annexes, PANS-OPS / PANS-ATM).

Static site: no backend, no accounts. Progress is stored in the browser (IndexedDB), with JSON export and import.

## Features

| Section | What it does |
|---|---|
| Practice | Pick topics (ATA chapter / ICAO Annex), choose all, unseen or missed questions. You get an explanation and a source citation after every answer. |
| Flashcards | Limitations, memory items in QRH checklist format, and air law figures, scheduled with FSRS spaced repetition (92% target recall). |
| Mock Exam | Timed with no feedback until you submit. Flag questions, use the navigator, see results by topic, review answers. Survives a page reload, but the clock keeps running. |
| Systems Lab | Interactive 737-800 hydraulic logic: pumps, standby auto-activation, PTU, LGTU, and which users stay powered. |
| Library | Browse and filter every item by status, so you can verify content against your manuals. |
| Progress Data | Export, import and reset your progress. |

## ⚠️ Content status: everything is UNVERIFIED

The starter bank (81 questions, 37 flashcards) was written from general 737NG and ICAO knowledge.
It has **not** been checked against controlled documents. Limitations, memory items and system logic vary with:

- FCOM / QRH **revision** (e.g. Airspeed Unreliable and Runaway Stabilizer memory items have changed in recent years)
- engine variant (CFM56-7B24/26/27), winglet type, optional equipment
- operator-specific procedures and approvals (e.g. 15 kt tailwind)

The UI marks each item **Unverified** until someone flips it. See [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Copyright

FCOM, FCTM and QRH are Boeing proprietary documents licensed to operators. ICAO Annexes are ICAO copyright.
**Write questions in your own words and cite the reference. Never paste manual text, tables or schematics into this repo**, especially if the repo or site is public.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # content validation + logic tests
npm run build        # static site -> dist/
npm run build:single # one self-contained HTML file -> dist-single/index.html (works offline)
```

Deploy: `.github/workflows/deploy.yml` tests, builds and publishes `dist/` to GitHub Pages on every push to `main`.
Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Layout

```
src/content/        questions/*.json, flashcards.json, topics.ts, schema.ts (zod)
src/lib/            quiz.ts (selection/stats), exam.ts (build/score), srs.ts (FSRS), storage.ts, progress.tsx
src/lab/            hydraulics.ts: pure logic model, unit-tested
src/pages/          one file per section
tests/              content.test.ts (integrity), logic.test.ts
```
