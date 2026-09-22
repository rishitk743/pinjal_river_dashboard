"use client";
import { useMemo, useState } from "react";
import { MapPin, Download, Search, Layers, Maximize } from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Kpi, Panel, PriorityBar, PriorityLegend, Skeleton, Chip, Empty } from "@/components/Ui";
import { useAggregates } from "@/lib/data";
import { taStatusKind } from "@/lib/palette";
import { toCsv, download } from "@/lib/export";

export default function VillagesPage() {
  const { data, loading, error } = useAggregates();
  const [taluka, setTaluka] = useState("");
  const [q, setQ] = useState("");
  const [onlyVacant, setOnlyVacant] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.toLowerCase();
    return data.villages.filter((v) => {
      if (taluka && v.taluka !== taluka) return false;
      if (onlyVacant && v.status.startsWith("Assigned")) return false;
      if (needle && !`${v.village} ${v.gp ?? ""} ${v.ta ?? ""} ${v.taluka}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, taluka, q, onlyVacant]);

  const actions = data && (
    <button className="btn btn-ghost" onClick={() => download("pinjal-villages.csv", toCsv(
      rows.map((v) => ({ village: v.village, taluka: v.taluka, district: v.district, gramPanchayat: v.gp ?? "",
        ta: v.ta ?? "(vacant)", status: v.status, works: v.works, areaHa: v.areaHa,
        p1: v.byPriority[0], p2: v.byPriority[1], p3: v.byPriority[2], p4: v.byPriority[3], p5: v.byPriority[4] }))))}>
      <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
    </button>
  );

  if (error) return <Shell title="Villages" subtitle=""><Empty>Could not load — {error}</Empty></Shell>;
  if (loading || !data) return <Shell title="Villages" subtitle="Loading…"><Skeleton rows={10} /></Shell>;

  const works = rows.reduce((s, v) => s + v.works, 0);
  const area = rows.reduce((s, v) => s + v.areaHa, 0);
  const villageCount = new Set(rows.map((v) => `${v.taluka}|${v.village}`)).size;
  const gps = new Set(rows.map((v) => v.gp).filter(Boolean)).size;

  return (
    <Shell title="Villages" subtitle="Each village with its Gram Panchayat, Technical Assistant and priority spread" actions={actions}>
      <div className="surface rise mb-4 flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input className="field w-full pl-9" placeholder="Village, panchayat or TA…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field" value={taluka} onChange={(e) => setTaluka(e.target.value)}>
          <option value="">All talukas</option>
          {data.meta.talukas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="seg-item" data-on={onlyVacant} onClick={() => setOnlyVacant((v) => !v)}
                style={{ height: 34, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px" }}>
          Only without a TA
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Villages" value={villageCount} icon={<MapPin className="h-4 w-4" />} delay={0} />
        <Kpi label="Gram Panchayats" value={gps} icon={<MapPin className="h-4 w-4" />} delay={40} />
        <Kpi label="Works" value={works} icon={<Layers className="h-4 w-4" />} delay={80} />
        <Kpi label="Area" value={Math.round(area)} unit="ha" icon={<Maximize className="h-4 w-4" />} delay={120} />
      </div>

      <Panel title="All villages" subtitle={`${rows.length} rows`} icon={<MapPin className="h-4 w-4" />}
             action={<PriorityLegend />} delay={160}>
        <div className="scroll max-h-[68vh] overflow-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
          <table className="w-full">
            <thead><tr>
              <th className="th">Village</th><th className="th">Taluka</th><th className="th">Gram Panchayat</th>
              <th className="th">Technical Assistant</th>
              <th className="th" style={{ textAlign: "right" }}>Works</th>
              <th className="th" style={{ textAlign: "right" }}>Area (ha)</th>
              <th className="th" style={{ minWidth: 110 }}>Priority 1–5</th>
            </tr></thead>
            <tbody>
              {rows.map((v) => (
                <tr key={`${v.taluka}-${v.village}-${v.gp}`}>
                  <td className="td font-medium" style={{ color: "var(--ink)" }}>{v.village}</td>
                  <td className="td">{v.taluka}</td>
                  <td className="td">{v.gp ?? <span style={{ opacity: .4 }}>—</span>}</td>
                  <td className="td">
                    {v.ta ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {v.ta}
                      </span>
                    ) : <Chip kind={taStatusKind(v.status)}>{v.status.startsWith("Vacant") ? "Post vacant" : "No list"}</Chip>}
                  </td>
                  <td className="td text-right font-semibold tabular-nums" style={{ color: "var(--ink)" }}>{v.works.toLocaleString("en-IN")}</td>
                  <td className="td text-right tabular-nums">{Math.round(v.areaHa).toLocaleString("en-IN")}</td>
                  <td className="td"><PriorityBar byYear={v.byPriority} height={6} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}
