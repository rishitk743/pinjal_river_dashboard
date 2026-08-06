import { readFileSync, readdirSync } from "node:fs";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:");
const DATA_DIR = `${ROOT}public/data`;
const BASELINE_DIR = `${ROOT}scratch/data-baseline`;

const load = (dir, name) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));

function diffCount(a, b, path = "$") {
  let n = 0;
  if (typeof a !== typeof b) return 1;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return 1;
    for (let i = 0; i < a.length; i++) n += diffCount(a[i], b[i], `${path}[${i}]`);
    return n;
  }
  if (a && typeof a === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b ?? {})]);
    for (const k of keys) n += diffCount(a[k], b?.[k], `${path}.${k}`);
    return n;
  }
  return a === b ? 0 : 1;
}

for (const name of ["meta.json", "by_agency.json", "by_ta.json", "by_village.json", "rules.json", "dependency.json"]) {
  const fresh = load(DATA_DIR, name);
  const base = load(BASELINE_DIR, name);
  const n = diffCount(fresh, base);
  console.log(`${name}: ${n === 0 ? "0 mismatches (exact match)" : n + " field-level differences"}`);
}

const freshShards = readdirSync(`${DATA_DIR}/works`).sort();
const baseShards = readdirSync(`${BASELINE_DIR}/works`).sort();
console.log(`works/ shard files: fresh=${freshShards.length} baseline=${baseShards.length}`);
for (const f of baseShards) {
  const fresh = load(`${DATA_DIR}/works`, f);
  const base = load(`${BASELINE_DIR}/works`, f);
  const byId = (arr) => new Map(arr.map((w) => [w.i, w]));
  const fMap = byId(fresh), bMap = byId(base);
  let missing = 0, extra = 0, diffFields = 0;
  for (const [id, bw] of bMap) {
    if (!fMap.has(id)) { missing++; continue; }
    diffFields += diffCount(fMap.get(id), bw);
  }
  for (const id of fMap.keys()) if (!bMap.has(id)) extra++;
  console.log(`  ${f}: baseline=${base.length} fresh=${fresh.length} missing=${missing} extra=${extra} fieldDiffs=${diffFields}`);
}
