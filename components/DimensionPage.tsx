"use client";
import { useMemo, useState } from "react";
import { Layers, MapPin, Maximize, Flag, Download, RotateCcw, Search, ChevronRight } from "lucide-react";
import { Shell } from "./Chrome";
import { Kpi, Panel, PriorityBar, PriorityLegend, Bar, Skeleton, Empty, AgencyTag } from "./Ui";
import WorksTable from "./WorksTable";
import { useAggregates, useWorks } from "@/lib/data";
import { viewById, WORK_COLUMNS } from "@/lib/config";
import { agencyColor, agencyShort } from "@/lib/palette";
import { toCsv, download } from "@/lib/export";
import { useRuleOverrides, applyRuleOverrides, applyPriorityOverrides } from "@/lib/overrides";
import { RuleBook } from "@/lib/rules";
import type { Work } from "@/lib/types";

export default function DimensionPage({ viewId }: { viewId: string }) {
  const cfg = viewById(viewId)!;
  const { data, loading, error } = useAggregates();
  const { overrides } = useRuleOverrides();
  const [taluka, setTaluka] = useState("");
  const [priority, setPriority] = useState(0);
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");

  // Rule edits made on the Rules page (lead/fallback/priority) are applied
  // live here so Departments and every other dimension view stays in sync.
  const book = useMemo(
    () => new RuleBook(applyRuleOverrides(data?.rules ?? [], overrides)),
    [data, overrides]
  );

  const talukas = useMemo(() => (taluka ? [taluka] : data?.meta.talukas ?? []), [taluka, data]);
  const { works: rawWorks, loading: wLoading } = useWorks(talukas);
  const works = useMemo(
    () => (rawWorks ? applyPriorityOverrides(rawWorks, overrides) : rawWorks),
    [rawWorks, overrides]
  );

  const keyOf = (w: Work) =>
    cfg.groupBy === "agency" ? (book?.lead(w) ?? "") : String((w as unknown as Record<string, unknown>)[cfg.groupBy] ?? "—");

  const filtered = useMemo(() => {
    if (!works || !book) return [];
    const needle = q.toLowerCase();
    return works.filter((w) => {
      if (priority && w.p !== priority) return false;
      if (group && keyOf(w) !== group) return false;
      if (needle) {
        const hay = `${w.v} ${w.gp ?? ""} ${book.lead(w)} ${w.ac} ${w.wc} ${w.ta ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [works, book, priority, group, q, cfg.groupBy]);

  const groups = useMemo(() => {
    const m = new Map<string, { n: number; byPriority: number[]; area: number }>();
    for (const w of filtered) {
      const k = keyOf(w);
      let g = m.get(k);
      if (!g) { g = { n: 0, byPriority: [0, 0, 0, 0, 0], area: 0 }; m.set(k, g); }
      g.n++; g.byPriority[w.p - 1]++; g.area += w.ar ?? 0;
    }
    return [...m.entries()].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.n - a.n);
  }, [filtered, cfg.groupBy, book]);

  const kpi = useMemo(() => ({
    works: filtered.length,
    villages: new Set(filtered.map((w) => w.v)).size,
    area: filtered.reduce((s, w) => s + (w.ar ?? 0), 0),
    // The 4th tile follows the active filter: with a priority selected it shows
    // that priority; with none it shows the most urgent band.
    focus: priority ? filtered.length : filtered.filter((w) => w.p === 1).length,
  }), [filtered, priority]);

  const isAgency = cfg.groupBy === "agency";
  const label = (k: string) =>
    isAgency ? agencyShort(k) : cfg.groupBy === "st" ? (data?.meta.stages[k] ?? k) : k;
  const dirty = taluka || priority || group || q;

  const actions = (
    <button className="btn btn-ghost" onClick={() => book && download(`pinjal-${viewId}.csv`, toCsv(
      filtered.map((w) => ({ village: w.v, gramPanchayat: w.gp ?? "", leadAgency: book.lead(w),
        fallback: book.fallback(w) ?? "", workCategory: w.wc, activity: w.ac,
        stage: data?.meta.stages[String(w.st)] ?? w.st, priority: w.p, areaHa: w.ar ?? "",
        technicalAssistant: w.ta ?? "", rule: w.rk }))))}>
      <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
    </button>
  );

  if (error) return <Shell title={cfg.title} subtitle={cfg.subtitle}><Empty>Could not load data — {error}</Empty></Shell>;
  const maxN = groups[0]?.n ?? 1;

  return (
    <Shell title={cfg.title} subtitle={cfg.subtitle} actions={actions}>
      <div className="surface rise mb-4 flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input className="field w-full pl-9" placeholder="Search village, panchayat, activity, TA…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field" value={taluka} onChange={(e) => setTaluka(e.target.value)}>
          <option value="">All talukas</option>
          {data?.meta.talukas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="seg" title="Priority band — 1 is most urgent. Not a calendar year.">
          {[0, 1, 2, 3, 4, 5].map((y) => (
            <button key={y} className="seg-item" data-on={priority === y} onClick={() => setPriority(y)}>
              {y === 0 ? "All priorities" : `P${y}`}
            </button>
          ))}
        </div>
        {dirty && (
          <button className="btn btn-ghost" onClick={() => { setTaluka(""); setPriority(0); setGroup(""); setQ(""); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Works" value={kpi.works} icon={<Layers className="h-4 w-4" />} delay={0} />
        <Kpi label="Villages" value={kpi.villages} icon={<MapPin className="h-4 w-4" />} delay={40} />
        <Kpi label="Area treated" value={Math.round(kpi.area)} unit="ha" icon={<Maximize className="h-4 w-4" />} delay={80} />
        <Kpi label={priority ? `Priority ${priority} works` : "Priority 1 · most urgent"}
             value={kpi.focus} icon={<Flag className="h-4 w-4" />} tone="warn" delay={120} />
      </div>

      {wLoading || loading || !data ? <Skeleton rows={8} /> : (
        <div className="flex flex-col gap-4">
          <Panel title={cfg.title} subtitle="Click a row to filter the table below"
                 icon={<Layers className="h-4 w-4" />} action={<PriorityLegend />}>
            {groups.length === 0 ? (
              <p className="py-8 text-center text-[13px]" style={{ color: "var(--ink-3)" }}>Nothing matches these filters.</p>
            ) : (
              <div className="flex flex-col">
                {groups.map((g) => {
                  const on = group === g.key;
                  return (
                    <button key={g.key} onClick={() => setGroup(on ? "" : g.key)}
                      className="group flex flex-col gap-1.5 rounded-[10px] px-2.5 py-2.5 text-left transition-colors"
                      style={on ? { background: "var(--brand-wash)" } : undefined}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                          {isAgency
                            ? <AgencyTag agency={g.key} color={agencyColor(g.key)} short={agencyShort(g.key)} size="md" />
                            : <span className="truncate">{label(g.key)}</span>}
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
                        </span>
                        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                          {g.n.toLocaleString("en-IN")} · {Math.round(g.area).toLocaleString("en-IN")} ha
                        </span>
                      </div>
                      <Bar value={g.n} max={maxN} color={isAgency ? agencyColor(g.key) : "var(--brand)"} height={6} />
                      <PriorityBar byYear={g.byPriority} height={5} />
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title={group ? label(group) : "All matching works"}
                 subtitle={`${filtered.length.toLocaleString("en-IN")} works`}
                 icon={<Layers className="h-4 w-4" />}
                 action={group ? <button className="btn btn-ghost" onClick={() => setGroup("")}>Clear</button> : undefined}>
            {/* Remounting on taluka/priority/group change resets the table's own
                column filters along with it — one filter reset, not two disconnected
                systems, and it sidesteps a stale column-filter selection silently
                zeroing out the table when the option pool underneath it changes. */}
            <WorksTable key={`${taluka}-${priority}-${group}`}
              works={filtered} columns={WORK_COLUMNS} stages={data?.meta.stages ?? {}} book={book} />
          </Panel>
        </div>
      )}
    </Shell>
  );
}
