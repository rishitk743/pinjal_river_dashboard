// Categorical hues are assigned in FIXED ORDER by agency identity — never cycled,
// never reassigned by rank. Both themes are validated with the dataviz six-checks:
//   light  · all-pairs   · ALL CHECKS PASS
//   dark   · adjacent    · ALL CHECKS PASS (worst adjacent ΔE 15.6, floor is 8)
// Every swatch ships beside its agency name, so identity is never colour-alone.
export const AGENCY_ORDER = [
  "Forest Department",
  "VB-G RAM G (Gram Panchayat)",
  "Water Resources Department",
  "Minor Irrigation (Zilla Parishad)",
  "GSDA (Groundwater Surveys & Development Agency)",
] as const;

/** CSS variable, so the colour follows the active theme without a re-render. */
export function agencyColor(agency: string): string {
  const i = AGENCY_ORDER.indexOf(agency as (typeof AGENCY_ORDER)[number]);
  return i >= 0 ? `var(--cat-${i + 1})` : "var(--ink-3)"; // 'Other' — never a generated hue
}
export function agencyWash(agency: string): string {
  const i = AGENCY_ORDER.indexOf(agency as (typeof AGENCY_ORDER)[number]);
  return i >= 0 ? `var(--cat-${i + 1}-wash)` : "var(--surface-2)";
}

export function agencyShort(agency: string): string {
  return (
    {
      "Forest Department": "Forest Dept",
      "VB-G RAM G (Gram Panchayat)": "VB-G RAM G",
      "Water Resources Department": "WRD",
      "Minor Irrigation (Zilla Parishad)": "MI (ZP)",
      "GSDA (Groundwater Surveys & Development Agency)": "GSDA",
      "Soil & Water Conservation Dept (Agriculture)": "SWC Dept",
    }[agency] ?? agency
  );
}

// Priority year is ORDINAL → sequential ramp, one hue, light to dark.
export const yearColor = (y: number) => `var(--seq-${Math.min(5, Math.max(1, y))})`;
export const yearInk = (y: number) => `var(--seq-${Math.min(5, Math.max(1, y))}-ink)`;

export type StatusKind = "good" | "warning" | "serious" | "critical" | "neutral";
export const STATUS: Record<StatusKind, { bg: string; fg: string }> = {
  good: { bg: "var(--good-wash)", fg: "var(--good)" },
  warning: { bg: "var(--warn-wash)", fg: "var(--warn)" },
  serious: { bg: "var(--serious-wash)", fg: "var(--serious)" },
  critical: { bg: "var(--critical-wash)", fg: "var(--critical)" },
  neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
};

export function taStatusKind(s: string): StatusKind {
  if (s.startsWith("Assigned")) return "good";
  if (s.startsWith("Vacant")) return "critical";
  return "warning";
}
export function confidenceKind(c: string): StatusKind {
  if (c === "High") return "good";
  if (c.startsWith("High -")) return "warning";
  if (c.startsWith("Medium")) return "serious";
  return "neutral";
}
