"use client";
import { useMemo, useState } from "react";
import { GitBranch, Search, CheckCircle2, AlertTriangle, Mountain } from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Kpi, Panel, Skeleton, Chip, Empty, PriorityLegend } from "@/components/Ui";
import { useAggregates } from "@/lib/data";
import { yearColor } from "@/lib/palette";

export default function DependenciesPage() {
  const { data, loading, error } = useAggregates();
  const [q, setQ] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.toLowerCase();
    return data.dependency.villages.filter((v) => {
      if (onlyIssues && v.ok) return false;
      if (needle && !`${v.village} ${v.taluka}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, q, onlyIssues]);

  if (error) return <Shell title="Dependency check" subtitle=""><Empty>Could not load — {error}</Empty></Shell>;
  if (loading || !data) return <Shell title="Dependency check" subtitle="Loading…"><Skeleton rows={9} /></Shell>;
  const d = data.dependency;

  return (
    <Shell title="Dependency check"
      subtitle="Verifying that no work is scheduled before the treatment it depends on">

      <div className="surface rise mb-4 flex items-start gap-3 p-4">
        <GitBranch className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          <strong style={{ color: "var(--ink)" }}>Rule under test:</strong> {d.rule}
          <br />
          Treating a stream before the slope above it has been trenched means the new structure silts up in the
          first monsoon. This page proves that never happens in the plan.
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Villages checked" value={d.checked} icon={<Mountain className="h-4 w-4" />} delay={0} />
        <Kpi label="Passing" value={d.passing} icon={<CheckCircle2 className="h-4 w-4" />} delay={40} />
        <Kpi label="Failing" value={d.failing} icon={<AlertTriangle className="h-4 w-4" />}
             tone={d.failing ? "critical" : "brand"} delay={80} />
        <Kpi label="Treatment stages" value={Object.keys(d.stages).length} icon={<GitBranch className="h-4 w-4" />} delay={120} />
      </div>

      <div className="surface rise mb-4 flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input className="field w-full pl-9" placeholder="Village or taluka…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="seg-item" data-on={onlyIssues} onClick={() => setOnlyIssues((v) => !v)}
                style={{ height: 34, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px" }}>
          Only failures
        </button>
      </div>

      <Panel title="Village by village" subtitle={`${rows.length} villages · one row per treatment stage, shaded by how many works fall in each priority`}
             icon={<GitBranch className="h-4 w-4" />} action={<PriorityLegend />} delay={160}>
        <div className="scroll max-h-[66vh] overflow-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
          <table className="w-full">
            <thead><tr>
              <th className="th">Village</th><th className="th">Taluka</th>
              <th className="th" style={{ textAlign: "right" }}>Works</th>
              <th className="th" style={{ textAlign: "right" }}>Stages</th>
              <th className="th" style={{ minWidth: 260 }}>Ridge → valley across priorities 1–5</th>
              <th className="th">Result</th>
            </tr></thead>
            <tbody>
              {rows.map((v) => (
                <tr key={`${v.taluka}-${v.village}`}>
                  <td className="td font-medium" style={{ color: "var(--ink)" }}>{v.village}</td>
                  <td className="td">{v.taluka}</td>
                  <td className="td text-right tabular-nums">{v.works.toLocaleString("en-IN")}</td>
                  <td className="td text-right tabular-nums">{v.stages}</td>
                  <td className="td">
                    <div className="flex flex-col gap-[3px]">
                      {v.span.map(([st, counts, n]) => {
                        const peak = Math.max(...counts, 1);
                        return (
                          <div key={st} className="flex items-center gap-1.5">
                            <span className="w-5 shrink-0 text-right text-[10px] tabular-nums" style={{ color: "var(--ink-3)" }}>{st}</span>
                            <div className="flex flex-1 gap-[2px]">
                              {counts.map((c, i) => (
                                <div key={i} className="h-[8px] flex-1 rounded-[2px]"
                                     title={`${data.meta.stages[String(st)]} — P${i + 1}: ${c} of ${n} works`}
                                     style={{
                                       background: c === 0 ? "var(--line)" : yearColor(i + 1),
                                       opacity: c === 0 ? 1 : 0.35 + 0.65 * (c / peak),
                                     }} />
                              ))}
                            </div>
                            <span className="w-8 shrink-0 text-right text-[10px] tabular-nums" style={{ color: "var(--ink-3)" }}>{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="td">
                    {v.ok ? <Chip kind="good">Ridge before valley</Chip>
                          : <Chip kind="critical">{v.issue ?? "Out of order"}</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}
