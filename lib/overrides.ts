"use client";
import { useCallback, useEffect, useState } from "react";
import type { Rule, Work } from "./types";

/** Per-rule edits made from the Rules page. Browser-only — a local "what if"
 *  view, not written back to the workbook or the Google Sheet. */
export interface RuleOverride {
  lead?: string;
  fallback?: string;
  /** Bulk-set priority: every work carrying this rule key is re-stamped to
   *  this priority, replacing its individual value, exactly like editing
   *  the source workbook directly. Undefined = leave priorities as-is. */
  priority?: number;
}
export type RuleOverrides = Record<string, RuleOverride>;

const STORAGE_KEY = "pinjal:rule-overrides:v1";

function readStorage(): RuleOverrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStorage(overrides: RuleOverrides) {
  // localStorage.setItem can throw (Safari private mode, quota exceeded,
  // storage disabled by policy) — an edit failing to persist across reloads
  // is a much better outcome than the whole page crashing on a click.
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn("[overrides] Could not save rule edits to localStorage — they will not survive a reload.", e);
  }
}

export function useRuleOverrides() {
  const [overrides, setOverrides] = useState<RuleOverrides>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOverrides(readStorage());
    setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setOverrides(readStorage()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = useCallback((key: string, patch: RuleOverride) => {
    setOverrides((prev) => {
      const merged = { ...prev[key], ...patch };
      // drop empty patches so an all-default row doesn't linger in storage
      const cleaned = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined && v !== ""));
      const next = { ...prev };
      if (Object.keys(cleaned).length === 0) delete next[key];
      else next[key] = cleaned;
      writeStorage(next);
      return next;
    });
  }, []);

  const resetOne = useCallback((key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      writeStorage(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    writeStorage({});
    setOverrides({});
  }, []);

  return { overrides, ready, set, resetOne, resetAll };
}

export function applyRuleOverrides(rules: Rule[], overrides: RuleOverrides): Rule[] {
  return rules.map((r) => {
    const o = overrides[r.key];
    if (!o) return r;
    return { ...r, lead: o.lead ?? r.lead, fallback: o.fallback ?? r.fallback };
  });
}

export function applyPriorityOverrides(works: Work[], overrides: RuleOverrides): Work[] {
  const hasAny = Object.values(overrides).some((o) => o.priority != null);
  if (!hasAny) return works;
  return works.map((w) => {
    const p = overrides[w.rk]?.priority;
    return p != null ? { ...w, p } : w;
  });
}
