"use client";
import { useEffect, useMemo, useState } from "react";
import type { AgencyRollup, Dependency, Meta, Rule, TaRollup, VillageRollup, Work } from "./types";
import { RuleBook } from "./rules";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
async function j<T>(p: string): Promise<T> {
  const r = await fetch(p);
  if (!r.ok) throw new Error(`${p} — ${r.status}`);
  return r.json() as Promise<T>;
}

export interface Aggregates {
  meta: Meta; agencies: AgencyRollup[]; tas: TaRollup[];
  villages: VillageRollup[]; rules: Rule[]; dependency: Dependency;
}

/** ~93 kB. Everything above the fold renders from this. */
export function useAggregates() {
  const [data, setData] = useState<Aggregates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    Promise.all([
      j<Meta>("/data/meta.json"),
      j<AgencyRollup[]>("/data/by_agency.json"),
      j<TaRollup[]>("/data/by_ta.json"),
      j<VillageRollup[]>("/data/by_village.json"),
      j<Rule[]>("/data/rules.json"),
      j<Dependency>("/data/dependency.json"),
    ])
      .then(([meta, agencies, tas, villages, rules, dependency]) => {
        if (!off) setData({ meta, agencies, tas, villages, rules, dependency });
      })
      .catch((e) => !off && setError(String(e)));
    return () => { off = true; };
  }, []);

  const book = useMemo(() => (data ? new RuleBook(data.rules) : null), [data]);
  return { data, book, loading: !data && !error, error };
}

/** Per-work detail, sharded by taluka, fetched only on drill-down. */
const cache = new Map<string, Work[]>();
export function useWorks(talukas: string[]) {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [loading, setLoading] = useState(true);
  const key = [...talukas].sort().join("|");

  useEffect(() => {
    let off = false;
    setLoading(true);
    const want = key ? key.split("|") : [];
    Promise.all(
      want.map(async (t) => {
        const k = slug(t);
        if (cache.has(k)) return cache.get(k)!;
        const rows = await j<Work[]>(`/data/works/${k}.json`);
        cache.set(k, rows);
        return rows;
      })
    ).then((sets) => {
      if (off) return;
      setWorks(sets.flat());
      setLoading(false);
    });
    return () => { off = true; };
  }, [key]);

  return { works, loading };
}
