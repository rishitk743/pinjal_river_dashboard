"use client";
import { useMemo, useState } from "react";
import { Layers, MapPin, Maximize, Flag, Download, RotateCcw, Search, Database } from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Kpi, Panel, Skeleton, Empty } from "@/components/Ui";
import WorksTable from "@/components/WorksTable";
import { useAggregates, useWorks } from "@/lib/data";
import { WORK_COLUMNS } from "@/lib/config";
import { toCsv, download } from "@/lib/export";
import type { Work } from "@/lib/types";

/** The flat, ungrouped view of every work — distinct from Departments/
 *  Categories/Stages/Land status, which all group by one dimension first.
 *  This is the raw data-browsing / spreadsheet-equivalent view. */
export default function WorksPage() {
  const { data, book, loading, error } = useAggregates();
  const [taluka, setTaluka] = useState("");
  const [priority, setPriority] = useState(0);
  const [q, setQ] = useState("");

  const talukas = useMemo(() => (taluka ? [taluka] : data?.meta.talukas ?? []), [taluka, data]);
  const { works, loading: wLoading } = useWorks(talukas);

  const filtered = useMemo(() => {
    if (!works || !book) return [];
    const needle = q.toLowerCase();
    return works.filter((w: Work) => {
      if (priority && w.p !== priority) return false;
      if (needle) {
        const hay = `${w.v} ${w.gp ?? ""} ${book.lead(w)} ${w.ac} ${w.ac2 ?? ""} ${w.wc} ${w.ta ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [works, book, priority, q]);

  const kpi = useMemo(() => ({
    works: filtered.length,
    villages: new Set(filtered.map((w) => w.v)).size,
    area: filtered.reduce((s, w) => s + (w.ar ?? 0), 0),
    focus: priority ? filtered.length : filtered.filter((w) => w.p === 1).length,
  }), [filtered, priority]);

  const dirty = taluka || priority || q;

  const actions = (
    <button className="btn btn-ghost" onClick={() => book && download("pinjal-all-works.csv", toCsv(
      filtered.map((w) => ({ village: w.v, gramPanchayat: w.gp ?? "", leadAgency: book.lead(w),
        fallback: book.fallback(w) ?? "", workCategory: w.wc, activity: w.ac, activityDetail: w.ac2 ?? "",
        stage: data?.meta.stages[String(w.st)] ?? w.st, priority: w.p, areaHa: w.ar ?? "",
        latitude: w.lat ?? "", longitude: w.lng ?? "", technicalAssistant: w.ta ?? "", rule: w.rk }))))}>
      <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
    </button>
  );

  if (error) return <Shell title="All works" subtitle=""><Empty>Could not load data — {error}</Empty></Shell>;

  return (
    <Shell title="All works" subtitle="Every work, ungrouped — the full sortable, filterable record" actions={actions}>
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
          <button className="btn btn-ghost" onClick={() => { setTaluka(""); setPriority(0); setQ(""); }}>
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

      {wLoading || loading || !data || !book ? <Skeleton rows={8} /> : (
        <Panel title="All works" subtitle={`${filtered.length.toLocaleString("en-IN")} works`} icon={<Database className="h-4 w-4" />}>
          <WorksTable key={`${taluka}-${priority}`} works={filtered} columns={WORK_COLUMNS} stages={data.meta.stages} book={book} />
        </Panel>
      )}
    </Shell>
  );
}
