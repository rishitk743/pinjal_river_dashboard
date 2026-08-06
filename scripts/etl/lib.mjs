import { google } from "googleapis";
import { readFileSync } from "node:fs";

// Local-dev fallback only — a deploy or CI job has no access to this machine's
// filesystem, so the real path comes from env vars. Set GOOGLE_SERVICE_ACCOUNT_KEY
// (the key file's JSON contents, e.g. a GitHub Actions secret) or
// GOOGLE_SERVICE_ACCOUNT_KEY_PATH (a file path) to override this fallback.
const DEV_FALLBACK_KEY_PATH = "C:/Users/Rishit Keshari/Downloads/pinjal-river-9f0ea9af0f3d.json";
const DEV_FALLBACK_SHEET_ID = "1tjZL_VkerOPZDk4bcgIRDubRWY8IqNaLUFIP264yS7E";

export const SHEET_ID = process.env.PINJAL_SHEET_ID || DEV_FALLBACK_SHEET_ID;

function loadServiceAccountKey() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  }
  const path = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || DEV_FALLBACK_KEY_PATH;
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    console.warn(`[etl] No GOOGLE_SERVICE_ACCOUNT_KEY(_PATH) set — falling back to a local dev path (${path}). This will not work outside this machine.`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export async function getSheetsClient() {
  const key = loadServiceAccountKey();
  const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  return google.sheets({ version: "v4", auth });
}

export async function fetchActionPlan(sheets) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Action Plan!A1:AN19269" });
  const [header, ...rows] = res.data.values;
  const idx = (n) => header.indexOf(n);
  return { header, rows, idx };
}

// R-code (workbook's own Allotment_Rule) -> app rule key. R4 splits by Layer_Name stream number.
export function ruleKeyFor(rCode, layerName) {
  switch (rCode) {
    case "R1a": return "FOREST|PLANTATION";
    case "R1b": return "FOREST|SOILWATER";
    case "R2": return "NONFOREST|TRENCH";
    case "R3": return "NONFOREST|DLT|ORDER-1-3";
    case "R4": {
      const m = /Stream-(\d+)/.exec(layerName || "");
      const n = m ? Number(m[1]) : null;
      if (n === 4 || n === 5) return "NONFOREST|DLT|ORDER-4-5";
      if (n === 6 || n === 7) return "NONFOREST|DLT|ORDER-6-7";
      return null;
    }
    case "R5": return "NONFOREST|RECHARGE-SHAFT";
    case "R6": return "NONFOREST|WELL";
    case "R7a": return "NONFOREST|WATERBODY|GE-1HA";
    case "R7b": return "NONFOREST|WATERBODY|LT-1HA";
    case "R8": return "NONFOREST|CHECKDAM";
    default: return null;
  }
}

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
