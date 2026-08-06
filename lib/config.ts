// ============================================================================
// VIEW CONFIGS — one template renders every dimension page.
// Adding a view is a config entry, not a new page component.
// ============================================================================
import type { Work } from "./types";

export interface ColumnSpec {
  label: string;
  key: keyof Work | "agency" | "location";
  width?: number;
  align?: "right";
  render?: "agency" | "priority" | "confidence" | "stage" | "rule" | "maps";
  /** Column header gets a multi-select filter menu. Default true — set false
   *  for columns that aren't meaningfully filterable (a free-form link, a
   *  continuous number). */
  filterable?: boolean;
}

export interface ViewConfig {
  id: string;
  title: string;
  subtitle: string;
  /** "agency" groups by the rule table's lead agency; others are Work fields. */
  groupBy: keyof Work | "agency";
}

// Work_ID is a backend key and is deliberately not shown.
// The original priority is deliberately not shown — the plan is the plan now.
export const WORK_COLUMNS: ColumnSpec[] = [
  { label: "Village", key: "v", width: 140 },
  { label: "Gram Panchayat", key: "gp", width: 150 },
  { label: "Lead agency", key: "agency", width: 190, render: "agency" },
  { label: "Work category", key: "wc", width: 170 },
  { label: "Activity", key: "ac", width: 220 },
  { label: "Activity detail", key: "ac2", width: 240 },
  { label: "Treatment stage", key: "st", width: 210, render: "stage" },
  { label: "Priority", key: "p", width: 84, render: "priority" },
  { label: "Area (ha)", key: "ar", width: 92, align: "right", filterable: false },
  { label: "Location", key: "location", width: 110, render: "maps", filterable: false },
  { label: "Technical Assistant", key: "ta", width: 165 },
  { label: "Rule", key: "rk", width: 190, render: "rule" },
];

export const VIEWS: ViewConfig[] = [
  { id: "agency",   title: "Departments",       subtitle: "Every work by the agency accountable for delivering it", groupBy: "agency" },
  { id: "category", title: "Work categories",   subtitle: "Trenching, drainage line treatment, plantation, wells and water bodies", groupBy: "wc" },
  { id: "stage",    title: "Treatment stages",  subtitle: "Ridge to valley — stage 1 is the ridge, stage 13 the valley floor", groupBy: "st" },
  { id: "forest",   title: "Land status",       subtitle: "Notified forest land versus non-forest, which decides the sanctioning route", groupBy: "ft" },
];

export const viewById = (id: string) => VIEWS.find((v) => v.id === id);
