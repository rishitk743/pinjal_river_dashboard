// ---- Rules table: the single place allotment is decided -------------------
export interface Rule {
  key: string;               // derived from the work's own attributes
  land: string;              // Forest | Non-forest
  workType: string;
  streamOrder: string;       // "" when not applicable
  lead: string;              // 1st priority agency
  fallback: string;          // "" when one body owns it outright
  technicalSanction: string;
  confidence: string;
  works: number;
  /** [p1..p5] — lets the Rules page default its Priority selector to the
   *  actual current priority when every work under this rule shares one
   *  (e.g. after a bulk edit), instead of always showing "Mixed". */
  byPriority: number[];
}

// ---- A work. Agency is NOT stored here — it resolves from the rule table. --
export interface Work {
  i: string;            // internal id (not shown in the UI)
  v: string;            // village
  gp: string | null;    // gram panchayat
  rk: string;           // rule key -> Rule
  lg: string;           // layer
  wc: string;           // work category
  ac: string;           // activity
  ac2: string | null;   // activity detail / sub-components (e.g. "Gullyplugh"), populated for ~37% of works
  ft: string;           // land status
  st: number;           // treatment stage 1..13
  p: number;            // priority 1..5
  ar: number | null;    // area ha
  lat: number | null;   // start latitude — ~18% of works lack coordinates
  lng: number | null;   // start longitude
  ta: string | null;    // technical assistant
  tsx: string;          // TA status
}

export interface AgencyRollup {
  agency: string; total: number; target: number;
  byPriority: number[]; maxDevPct: number;
  byTaluka: Record<string, number>;
  byStage: Record<string, number>;
  byCategory: Record<string, number>;
  byRule: Record<string, number>;
  areaHa: number; villages: number;
  confidence: Record<string, number>;
}

export interface TaRollup {
  taluka: string; office: string; ta: string | null; status: string;
  mobile: string | null; works: number;
  villages: string[]; gramPanchayats: string[];
  byPriority: number[]; byAgency: Record<string, number>;
}

export interface VillageRollup {
  village: string; taluka: string; district: string;
  gp: string | null; ta: string | null; mobile: string | null;
  status: string; works: number; byPriority: number[];
  byAgency: Record<string, number>; areaHa: number;
}

export interface DependencyVillage {
  village: string; taluka: string; stages: number; works: number;
  ok: boolean; issue: string | null;
  /** [stage, worksPerPriority(5), totalWorks] */
  span: [number, number[], number][];
}
export interface Dependency {
  checked: number; passing: number; failing: number; rule: string;
  stages: Record<string, string>; villages: DependencyVillage[];
}

export interface Meta {
  version: string; totalWorks: number;
  agencies: string[]; talukas: string[]; districts: string[];
  villages: string[]; gramPanchayats: string[]; tas: string[];
  workCategories: string[]; forestTypes: string[]; ruleKeys: string[];
  stages: Record<string, string>; priorities: number[];
}
