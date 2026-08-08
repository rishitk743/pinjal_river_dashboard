import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, existsSync } from "node:fs";
import { getSheetsClient, fetchActionPlan, ruleKeyFor, slug } from "./lib.mjs";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:");
const DATA_DIR = `${ROOT}public/data`;
const BASELINE_DIR = `${ROOT}scratch/data-baseline`;

// ---- 0. snapshot current public/data as baseline (first run only) ---------
if (!existsSync(BASELINE_DIR)) {
  mkdirSync(BASELINE_DIR, { recursive: true });
  cpSync(DATA_DIR, BASELINE_DIR, { recursive: true });
  console.log("Snapshotted baseline to", BASELINE_DIR);
}

// ---- 1. reference tables that cannot come from the workbook ---------------
// gp + ta/mobile/status are real-world administrative/staffing data, not present
// in the Action Plan sheet. Extract once from the current (authoritative) output.
const rulesTable = JSON.parse(readFileSync(`${BASELINE_DIR}/rules.json`, "utf8"));
// NONFOREST|RECHARGE-SHAFT: swapped per direction — VB-G RAM G leads, GSDA is fallback
// (previously GSDA led). Mirrors the same swap made in the Allotment Rules sheet (R5).
{
  const r5 = rulesTable.find((r) => r.key === "NONFOREST|RECHARGE-SHAFT");
  if (r5) {
    r5.lead = "VB-G RAM G (Gram Panchayat)";
    r5.fallback = "GSDA (Groundwater Surveys & Development Agency)";
  }
}
const villageMetaBaseline = JSON.parse(readFileSync(`${BASELINE_DIR}/by_village.json`, "utf8"));
const gpByVillageTaluka = new Map(villageMetaBaseline.map((v) => [`${v.village}|${v.taluka}`, v.gp]));

// work id -> {ta, tsx, ft} lookup, built from the existing per-taluka shards.
// `ft` (forest-type code) does not reduce to a simple function of the raw Forest
// Type text (confirmed by cross-referencing every distinct value against the
// baseline codes), so it's preserved by id from baseline rather than recomputed.
const workRosterById = new Map();
for (const f of readdirSync(`${BASELINE_DIR}/works`)) {
  const shard = JSON.parse(readFileSync(`${BASELINE_DIR}/works/${f}`, "utf8"));
  for (const w of shard) workRosterById.set(w.i, { ta: w.ta, tsx: w.tsx, ft: w.ft });
}
console.log("Loaded roster for", workRosterById.size, "works from baseline shards");

// ---- 2. pull the Action Plan sheet -----------------------------------------
const sheets = await getSheetsClient();
const { rows, idx } = await fetchActionPlan(sheets);
console.log("Fetched", rows.length, "Action Plan rows");

const iWorkId = idx("Work_ID"), iLayer = idx("Layer_Name"), iWorkCatg = idx("Work_Catg"),
  iActivity = idx("Activity_N") !== -1 ? idx("Activity_N") : idx("Activity_Name"),
  iActivity2 = idx("Activity 2"), iVillage = idx("Village"), iTaluka = idx("Subdistric"),
  iDistrict = idx("District"), iArea = idx("Area_ha"), iForest = idx("Forest Type"),
  iRule = idx("Allotment_Rule"), iSeq = idx("Sequence_Stage"), iLat = idx("St_Lat"), iLng = idx("St_Long"),
  iEndLat = idx("End_Lat"), iEndLng = idx("End_Long"),
  iPriority = idx("Priority_Year_Corrected") !== -1 ? idx("Priority_Year_Corrected") : idx("Priority");

// A renamed/missing column silently produces `undefined` for every one of
// 19,268 rows with no error — this is a build-time contract check so that
// fails loudly and immediately instead of shipping quietly-corrupted data.
const REQUIRED_COLUMNS = {
  Work_ID: iWorkId, Layer_Name: iLayer, Work_Catg: iWorkCatg, "Activity_N (or Activity_Name)": iActivity,
  Village: iVillage, Subdistric: iTaluka, District: iDistrict, "Forest Type": iForest,
  Allotment_Rule: iRule, Sequence_Stage: iSeq, "Priority (or Priority_Year_Corrected)": iPriority,
};
const missing = Object.entries(REQUIRED_COLUMNS).filter(([, i]) => i === -1).map(([name]) => name);
if (missing.length) {
  throw new Error(`Action Plan sheet is missing required column(s): ${missing.join(", ")}. The sheet's header row must have changed — update scripts/etl/build.mjs's column mapping before re-running.`);
}
for (const [name, i] of Object.entries({ "Activity 2": iActivity2, St_Lat: iLat, St_Long: iLng, End_Lat: iEndLat, End_Long: iEndLng, Area_ha: iArea })) {
  if (i === -1) console.warn(`[etl] Optional column "${name}" not found — that field will be blank for every work.`);
}

// ft numeric code = 1-based index of first appearance of each distinct Forest Type,
// scanning the sheet top to bottom (confirmed against known samples: row1 "Degraded /
// Scrub Forest" -> ft:1, row3 "Non Forest Area" -> ft:2).
const forestTypeOrder = new Map();
for (const r of rows) {
  const f = r[iForest];
  if (!forestTypeOrder.has(f)) forestTypeOrder.set(f, forestTypeOrder.size + 1);
}

// ---- 3. build Work[] --------------------------------------------------------
const works = [];
const unmapped = [];
for (const r of rows) {
  const id = r[iWorkId];
  const rCode = r[iRule];
  const rk = ruleKeyFor(rCode, r[iLayer]);
  if (!rk) { unmapped.push({ id, rCode, layer: r[iLayer] }); continue; }

  const village = r[iVillage];
  const taluka = r[iTaluka];
  const gp = gpByVillageTaluka.get(`${village}|${taluka}`) ?? null;
  const roster = workRosterById.get(id) ?? { ta: null, tsx: "Unknown", ft: forestTypeOrder.get(r[iForest]) };

  const round6 = (v) => (v != null && v !== "" ? Math.round(Number(v) * 1e6) / 1e6 : null);
  const lat = round6(r[iLat]);
  const lng = round6(r[iLng]);
  const elat = round6(r[iEndLat]);
  const elng = round6(r[iEndLng]);

  works.push({
    i: id,
    v: village,
    gp,
    rk,
    lg: r[iLayer],
    wc: r[iWorkCatg],
    ac: r[iActivity],
    ac2: r[iActivity2] || null,
    ft: roster.ft,
    st: Number(r[iSeq]),
    p: Number(r[iPriority]),
    ar: r[iArea] != null && r[iArea] !== "" ? Math.round(Number(r[iArea]) * 1000) / 1000 : null,
    lat, lng, elat, elng,
    ta: roster.ta,
    tsx: roster.tsx,
    taluka,
    district: r[iDistrict],
  });
}
console.log("Built", works.length, "works;", unmapped.length, "unmapped");
if (unmapped.length) console.log("Sample unmapped:", unmapped.slice(0, 10));

// ---- 4. rules.json (unchanged reference table, just recount `works`) ------
const rkCounts = new Map();
const rkByPriority = new Map(); // key -> [p1..p5]
for (const w of works) {
  rkCounts.set(w.rk, (rkCounts.get(w.rk) ?? 0) + 1);
  if (!rkByPriority.has(w.rk)) rkByPriority.set(w.rk, [0, 0, 0, 0, 0]);
  rkByPriority.get(w.rk)[w.p - 1]++;
}
const rulesOut = rulesTable.map((r) => ({
  ...r,
  works: rkCounts.get(r.key) ?? 0,
  byPriority: rkByPriority.get(r.key) ?? [0, 0, 0, 0, 0],
}));

// ---- 5. meta.json -----------------------------------------------------------
const distinctSorted = (getter) => [...new Set(works.map(getter).filter((x) => x != null))].sort();
const forestTypesSorted = [...forestTypeOrder.keys()].sort();
const stagesMap = JSON.parse(readFileSync(`${BASELINE_DIR}/meta.json`, "utf8")).stages; // stage label text is static metadata

const metaOut = {
  version: "v5",
  totalWorks: works.length,
  agencies: distinctSorted((w) => rulesOut.find((r) => r.key === w.rk)?.lead),
  talukas: distinctSorted((w) => w.taluka),
  districts: distinctSorted((w) => w.district),
  villages: distinctSorted((w) => w.v),
  gramPanchayats: distinctSorted((w) => w.gp),
  tas: distinctSorted((w) => w.ta),
  workCategories: distinctSorted((w) => w.wc),
  forestTypes: forestTypesSorted,
  ruleKeys: [...rkCounts.keys()].sort(),
  stages: stagesMap,
  priorities: [1, 2, 3, 4, 5],
};

// ---- 6. rollups --------------------------------------------------------------
const ruleByKey = new Map(rulesOut.map((r) => [r.key, r]));
const leadOf = (w) => ruleByKey.get(w.rk)?.lead ?? "Unassigned";

function bump(map, key, n = 1) { map[key] = (map[key] ?? 0) + n; }

// by_agency.json
const agencyAcc = new Map();
for (const w of works) {
  const agency = leadOf(w);
  if (!agencyAcc.has(agency)) {
    agencyAcc.set(agency, {
      agency, total: 0, byPriority: [0, 0, 0, 0, 0],
      byTaluka: {}, byStage: {}, byCategory: {}, byRule: {},
      areaHa: 0, villagesSet: new Set(), confidence: {},
    });
  }
  const a = agencyAcc.get(agency);
  a.total++;
  a.byPriority[w.p - 1]++;
  bump(a.byTaluka, w.taluka);
  bump(a.byStage, String(w.st));
  bump(a.byCategory, w.wc);
  bump(a.byRule, w.rk);
  a.areaHa += w.ar ?? 0;
  a.villagesSet.add(`${w.v}|${w.taluka}`);
  bump(a.confidence, ruleByKey.get(w.rk)?.confidence ?? "—");
}
const byAgencyOut = [...agencyAcc.values()]
  .sort((a, b) => b.total - a.total)
  .map((a) => {
    const target = Math.round((a.total / 5) * 10) / 10;
    const maxDevPct = Math.round((Math.max(...a.byPriority.map((n) => Math.abs(n - target))) / target) * 1000) / 10;
    return {
      agency: a.agency, total: a.total, target,
      byPriority: a.byPriority, maxDevPct,
      byTaluka: a.byTaluka, byStage: a.byStage, byCategory: a.byCategory, byRule: a.byRule,
      areaHa: Math.round(a.areaHa * 10) / 10, villages: a.villagesSet.size,
      confidence: a.confidence,
    };
  });

// by_village.json
const villageAcc = new Map();
for (const w of works) {
  const k = `${w.v}|${w.taluka}`;
  if (!villageAcc.has(k)) {
    villageAcc.set(k, {
      village: w.v, taluka: w.taluka, district: w.district, gp: w.gp,
      ta: w.ta, mobile: null, status: null,
      works: 0, byPriority: [0, 0, 0, 0, 0], byAgency: {}, areaHa: 0,
    });
  }
  const v = villageAcc.get(k);
  v.works++;
  v.byPriority[w.p - 1]++;
  bump(v.byAgency, leadOf(w));
  v.areaHa += w.ar ?? 0;
}
// ta/mobile/status per village come from the baseline (real staffing roster, not in the sheet)
const villageStatusBaseline = new Map(villageMetaBaseline.map((v) => [`${v.village}|${v.taluka}`, v]));
const byVillageOut = [...villageAcc.values()].map((v) => {
  const b = villageStatusBaseline.get(`${v.village}|${v.taluka}`);
  return { ...v, ta: b?.ta ?? null, mobile: b?.mobile ?? null, status: b?.status ?? "Unknown", areaHa: Math.round(v.areaHa * 10) / 10 };
}).sort((a, b) => b.works - a.works);

// by_ta.json — TA roster (office, taluka grouping, villages/GPs covered) is baseline
// staffing metadata; works/byPriority/byAgency are recomputed fresh from the new plan.
const taBaseline = JSON.parse(readFileSync(`${BASELINE_DIR}/by_ta.json`, "utf8"));
const taAcc = new Map();
for (const w of works) {
  const key = `${w.taluka}|${w.ta ?? "__vacant__"}`;
  if (!taAcc.has(key)) taAcc.set(key, { works: 0, byPriority: [0, 0, 0, 0, 0], byAgency: {} });
  const t = taAcc.get(key);
  t.works++;
  t.byPriority[w.p - 1]++;
  bump(t.byAgency, leadOf(w));
}
const byTaOut = taBaseline.map((b) => {
  const key = `${b.taluka}|${b.ta ?? "__vacant__"}`;
  const t = taAcc.get(key);
  return t ? { ...b, works: t.works, byPriority: t.byPriority, byAgency: t.byAgency } : b;
});

// ---- 7. dependency.json ------------------------------------------------------
// Rule (verbatim from the existing dependency.json): within a village, no work may
// be scheduled at an earlier priority than any work at an earlier treatment stage.
const depAcc = new Map();
for (const w of works) {
  const k = `${w.v}|${w.taluka}`;
  if (!depAcc.has(k)) depAcc.set(k, { village: w.v, taluka: w.taluka, byStage: new Map() });
  const d = depAcc.get(k);
  if (!d.byStage.has(w.st)) d.byStage.set(w.st, [0, 0, 0, 0, 0]);
  d.byStage.get(w.st)[w.p - 1]++;
}
let passing = 0, failing = 0;
const depVillages = [...depAcc.values()].map((d) => {
  const stages = [...d.byStage.keys()].sort((a, b) => a - b);
  const span = stages.map((s) => {
    const dist = d.byStage.get(s);
    return [s, dist, dist.reduce((a, b) => a + b, 0)];
  });
  let maxPrevPriority = 0, ok = true;
  for (const [, dist] of span) {
    const usedPriorities = dist.map((n, i) => (n > 0 ? i + 1 : null)).filter((x) => x != null);
    const minHere = Math.min(...usedPriorities);
    if (minHere < maxPrevPriority) ok = false;
    maxPrevPriority = Math.max(maxPrevPriority, ...usedPriorities);
  }
  ok ? passing++ : failing++;
  const totalWorks = span.reduce((a, [, , t]) => a + t, 0);
  return { village: d.village, taluka: d.taluka, stages: stages.length, works: totalWorks, ok, issue: ok ? null : "Priority precedes an earlier treatment stage", span };
}).sort((a, b) => b.works - a.works);

const dependencyOut = {
  checked: depVillages.length, passing, failing,
  rule: "Within a village, no work may be scheduled at an earlier priority than any work at an earlier treatment stage (ridge before valley).",
  stages: stagesMap,
  villages: depVillages,
};

// ---- 8. write everything ------------------------------------------------------
mkdirSync(`${DATA_DIR}/works`, { recursive: true });
writeFileSync(`${DATA_DIR}/meta.json`, JSON.stringify(metaOut));
writeFileSync(`${DATA_DIR}/by_agency.json`, JSON.stringify(byAgencyOut));
writeFileSync(`${DATA_DIR}/by_ta.json`, JSON.stringify(byTaOut));
writeFileSync(`${DATA_DIR}/by_village.json`, JSON.stringify(byVillageOut));
writeFileSync(`${DATA_DIR}/rules.json`, JSON.stringify(rulesOut));
writeFileSync(`${DATA_DIR}/dependency.json`, JSON.stringify(dependencyOut));

const byTaluka = new Map();
for (const w of works) {
  const k = slug(w.taluka);
  if (!byTaluka.has(k)) byTaluka.set(k, []);
  byTaluka.get(k).push({ i: w.i, v: w.v, gp: w.gp, rk: w.rk, lg: w.lg, wc: w.wc, ac: w.ac, ac2: w.ac2, ft: w.ft, st: w.st, p: w.p, ar: w.ar, lat: w.lat, lng: w.lng, elat: w.elat, elng: w.elng, ta: w.ta, tsx: w.tsx });
}
for (const [k, list] of byTaluka) writeFileSync(`${DATA_DIR}/works/${k}.json`, JSON.stringify(list));

console.log("Wrote public/data/*.json and", byTaluka.size, "taluka shards");
console.log("Dependency check: checked", dependencyOut.checked, "passing", passing, "failing", failing);
