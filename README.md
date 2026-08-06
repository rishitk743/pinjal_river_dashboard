# Pinjal River — Five Year Plan Tracker

Department-wise project view and delivery tracking for the Pinjal river five year
action plan. Built for Govardhan Ecovillage with GIZ and RuDRA.

Source of truth: **corrected action plan v4** — corrected agency allotment,
ridge-to-valley priority years, and the Technical Assistant allocation.

## Stack

Next.js 15 (App Router) · React 19 · Tailwind 4 · TypeScript · Lucide icons.
Every route is statically prerendered; first-load JS is ~115 kB. Light and dark
themes, keyboard-focusable controls, and `prefers-reduced-motion` respected.

## Rules are data, not code

Every work carries a **rule key** derived from its own attributes — land status,
work type, stream order, size. `public/data/rules.json` maps each key to the lead
agency, fallback, technical sanction and confidence. The app resolves allotment
through `lib/rules.ts` at render time, so **changing a rule changes the whole
dashboard** and nothing about an agency is baked into a work record.

Exactly one key applies per work, so there is no rule ordering, no overlap and no
first-match-wins to reason about. Two rules can never disagree about the same work.

The workbook mirrors this: its `Rules` sheet is the control surface and the agency
columns on `Action Plan` are `INDEX`/`MATCH` formulas against it. Edit one cell,
19,268 rows follow.

## Terminology

**Priority, not year.** Priority 1–5 is a sequencing rank, not a calendar year.
"Priority 5" does not mean "nothing to do until year five" — it means the work must
follow the works above it in the same catchment. The UI says P1–P5 throughout, and
KPI tiles follow the active filter rather than hard-coding one band.

Work IDs are a backend key and are deliberately not shown. Neither is the original
priority — the plan is the plan now.

## Why the data loads the way it does

The earlier dashboard shipped an 8 MB JSON blob to the browser before anything
rendered, which is punishing on a rural connection. Here:

- **Aggregates (~66 kB)** — `by_agency`, `by_ta`, `by_village`, `rules`, `meta` —
  load first and drive every headline view.
- **Per-work detail is sharded by taluka** (`public/data/works/<taluka>.json`,
  260 kB–2.3 MB) and fetched only on drill-down, then cached in memory. Filter to
  Vikramgad and you never download Mokhada's 7,480 works.

## Layout

```
app/
  page.tsx          Dashboard overview
  agency/           Department view      ─┐
  category/         Work categories       │ all four render from
  stage/            Treatment stages      │ components/DimensionPage
  forest/           Land status          ─┘ driven by lib/config.ts
  ta/               Technical Assistants
  dependencies/     Ridge-to-valley verification
  villages/         Villages
  rules/            Allotment decision table
  works/            All works
components/
  Chrome.tsx        Sidebar, sticky top bar, mobile drawer, theme toggle
  Theme.tsx         Theme provider (localStorage + system preference)
  Ui.tsx            KPI, Section, Pill, Bar, YearBar, AgencyTag
  DimensionPage.tsx The one template behind every dimension page
  WorksTable.tsx    Sortable, paged works table
lib/
  config.ts         VIEWS — add a dimension by adding a config entry
  rules.ts          RuleBook — resolves allotment from the rules table
  palette.ts        Validated colour system
  data.ts           Aggregate + sharded work loading
  tracking.ts       Government tracking seam (stubbed)
  export.ts         CSV export
```

Adding a dimension page is a `VIEWS` entry in `lib/config.ts` plus a three-line
route file — the same config-driven pattern as `PROCESS_CONFIGS` in the GEV
Agriculture Dashboard.

## Colour

Both themes validated with the dataviz six-checks (lightness band, chroma floor,
CVD separation, normal-vision floor, contrast).

| | Categorical (agency identity, fixed order) | Result |
|---|---|---|
| Light | `#166534` `#2563eb` `#ea580c` `#db2777` `#0891b2` | all-pairs **PASS** |
| Dark | `#008344` `#5581ed` `#d37300` `#b43c5b` `#009ec4` | adjacent-pairs **PASS**, worst ΔE 15.6 (floor 8) |

The dark steps were found by search, not by lightening the light ones — a flipped
palette is not a validated palette. Five hues that pass *all-pairs* CVD on a dark
surface do not exist in the searched space (800 random + targeted attempts), so
dark mode uses adjacent-pairs. That is legitimate here because every agency swatch
is rendered beside its name, so identity is never carried by colour alone.

- **Sequential** — priority year is ordinal, so it uses one hue light→dark rather
  than five arbitrary hues. Dark mode inverts the ramp direction against its surface.
- **Status** — reserved (good / warning / serious / critical), never reused as a
  series colour, always shipped with an icon or a text label.

Theme is stored in `localStorage`, falls back to `prefers-color-scheme`, and is
applied by an inline script before paint so there is no flash of the wrong theme.

## Connecting the government tracking sheet

`lib/tracking.ts` is the only file that needs to change. It returns
`EMPTY_TRACKING` today. Implement `fetchTracking()` against the Sheets API with a
service account, cache it server-side, and every consumer starts showing live
status with no UI change.

It captures status **per plan year**, deliberately. The old Progress tab compared
a year-filtered plan figure against an all-years government figure, so its ratio
was not meaningful.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Deploys to Vercel as-is — no environment variables needed while tracking is stubbed.

## Regenerating the data

`public/data/*` is generated from the Google Sheets copy of the corrected action
plan workbook by `scripts/etl/build.mjs`. Nothing is computed at build time —
the ETL script is the only thing that touches this data.

```bash
npm run etl
```

Needs `GOOGLE_SERVICE_ACCOUNT_KEY` (or `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`) and
`PINJAL_SHEET_ID` set — see `.env.example`. A GitHub Action
(`.github/workflows/sync-data.yml`) runs this daily and commits any change,
which triggers a redeploy on hosts that auto-deploy on push (e.g. Vercel).

## Known gaps in the underlying plan

Carried from the plan itself, not introduced here:

- 4,663 trench rows hold bounding-box corners instead of feature endpoints, so
  those works cannot be located in the field. There is deliberately no map view
  until this is fixed — a map would render 4,663 works in the wrong place.
- No quantities, cost estimates or person-days anywhere, so no work can be
  estimated or technically sanctioned yet.
- No monitoring baseline: the plan counts structures, not water.
