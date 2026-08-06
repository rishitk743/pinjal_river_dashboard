"use client";
import type { Rule, Work } from "./types";

/** Resolving allotment through the rules table means a rule edit changes the
 *  whole plan — nothing about the agency is baked into a work. */
export class RuleBook {
  private byKey: Map<string, Rule>;
  constructor(rules: Rule[]) { this.byKey = new Map(rules.map((r) => [r.key, r])); }
  rule(w: Work): Rule | undefined { return this.byKey.get(w.rk); }
  lead(w: Work): string { return this.byKey.get(w.rk)?.lead ?? "Unassigned"; }
  fallback(w: Work): string | null { return this.byKey.get(w.rk)?.fallback || null; }
  confidence(w: Work): string { return this.byKey.get(w.rk)?.confidence ?? "—"; }
  label(key: string): string {
    const r = this.byKey.get(key);
    if (!r) return key;
    return r.streamOrder ? `${r.workType} · order ${r.streamOrder}` : r.workType;
  }
}
