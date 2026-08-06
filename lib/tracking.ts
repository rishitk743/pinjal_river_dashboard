// ============================================================================
// TRACKING SEAM — deliberately stubbed.
//
// The government tracks execution in its own Google Sheets. When that sheet is
// shared, implement `fetchTracking` against the Sheets API (service account,
// cached server-side) and every consumer below starts showing live status with
// no change to the UI. This is the only file that needs to change.
//
// Designed against the same shape the existing Progress tab uses, with one
// correction: status is captured PER PLAN YEAR, so a year-filtered plan figure
// is never compared against an all-years government figure.
// ============================================================================
export type ExecStatus = "not_started" | "estimated" | "sanctioned" | "ongoing" | "completed";

export interface TrackingRow {
  workId: string;          // joins to Work.i
  status: ExecStatus;
  finYear: string | null;  // government financial year
  updatedAt: string | null;
  sourceRef: string | null;
}

export interface TrackingSnapshot {
  asOf: string | null;
  rows: Record<string, TrackingRow>;
  coveredTalukas: string[];  // never imply coverage where none exists
  unmatched: { ref: string; count: number }[];
}

export const EMPTY_TRACKING: TrackingSnapshot = {
  asOf: null, rows: {}, coveredTalukas: [], unmatched: [],
};

export async function fetchTracking(): Promise<TrackingSnapshot> {
  return EMPTY_TRACKING;
}

export const STATUS_LABEL: Record<ExecStatus, string> = {
  not_started: "Not started",
  estimated: "Estimate prepared",
  sanctioned: "Sanctioned",
  ongoing: "Ongoing",
  completed: "Completed",
};
