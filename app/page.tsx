"use client";
import Link from "next/link";
import { useMemo } from "react";
import {
  Layers, MapPin, Maximize, Users, AlertTriangle, ArrowUpRight, TrendingUp, Building2, Mountain,
} from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Kpi, Panel, Bar, PriorityBar, PriorityLegend, Skeleton, Chip, AgencyTag } from "@/components/Ui";
import { useAggregates } from "@/lib/data";
import { agencyColor, agencyShort, taStatusKind, yearColor } from "@/lib/palette";

export default function Home() {
  const { data, loading, error } = useAggregates();

  const t = useMemo(() => {
    if (!data) return null;
    const byPriority = [1, 2, 3, 4, 5].map((y) => data.agencies.reduce((s, a) => s + a.byPriority[y - 1], 0));
    return {
      works: data.meta.totalWorks,
      area: data.agencies.reduce((s, a) => s + a.areaHa, 0),
      byPriority,
      // Count postings, not distinct name strings — two different people can
      // share a name (e.g. two "Rahul Patil"s, one in Wada, one in Vikramgad),
      // and a Set/dedup-by-name would silently undercount by one per collision.
      taCount: data.tas.filter((x) => x.ta).length,
      vacant: data.tas.filter((x) => !x.ta).reduce((s, x) => s + x.works, 0),
      noList: data.villages.filter((v) => v.status.startsWith("Not covered")).reduce((s, v) => s + v.works, 0),
      busiest: [...data.tas].filter((x) => x.ta).sort((a, b) => b.works - a.works),
    };
  }, [data]);

  if (error) return <Shell title="Dashboard" subtitle="Corrected five year action plan"><div className="surface p-8">Could not load data — {error}</div></Shell>;
  if (loading || !data || !t) return <Shell title="Dashboard" subtitle="Loading the corrected plan…"><Skeleton rows={9} /></Shell>;

  const maxAgency = data.agencies[0]?.total ?? 1;
  const maxPriority = Math.max(...t.byPriority);

  return (
    <Shell title="Dashboard" subtitle="19,268 works · 136 villages · Palghar & Nashik">
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Total works" value={t.works} icon={<Layers className="h-4 w-4" />} delay={0} />
        <Kpi label="Villages" value={data.meta.villages.length} note={`${data.meta.gramPanchayats.length} gram panchayats`} icon={<MapPin className="h-4 w-4" />} delay={40} />
        <Kpi label="Area treated" value={Math.round(t.area)} unit="ha" icon={<Maximize className="h-4 w-4" />} delay={80} />
        <Kpi label="Technical Assistants" value={t.taCount} note="1 post vacant" icon={<Users className="h-4 w-4" />} delay={120} />
      </div>

      {/* Delivery risks — status colour always with icon + label */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Link href="/ta" className="surface surface-hover rise flex items-start gap-3 p-4"
              style={{ animationDelay: "160ms", borderLeftWidth: 3, borderLeftColor: "var(--critical)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--critical)" }} />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              {t.vacant.toLocaleString("en-IN")} works have no Technical Assistant
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--ink-3)" }}>
              The Mokhada post is unfilled — nobody is preparing these estimates.
            </p>
          </div>
          <ArrowUpRight className="ml-auto h-4 w-4 shrink-0" style={{ color: "var(--ink-3)" }} />
        </Link>
        <div className="surface rise flex items-start gap-3 p-4"
             style={{ animationDelay: "200ms", borderLeftWidth: 3, borderLeftColor: "var(--warn)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--warn)" }} />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              {t.noList.toLocaleString("en-IN")} works await a Nashik allocation list
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--ink-3)" }}>
              Trimbakeshwar is in Nashik district, outside the Palghar TA list.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2" delay={240} title="Works by lead agency" icon={<Building2 className="h-4 w-4" />}
          action={<Link href="/agency" className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>Open <ArrowUpRight className="h-3 w-3" /></Link>}>
          <div className="flex flex-col gap-3">
            {data.agencies.map((a) => (
              <div key={a.agency} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <AgencyTag agency={a.agency} color={agencyColor(a.agency)} short={agencyShort(a.agency)} size="md" />
                  <span className="text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                    {a.total.toLocaleString("en-IN")} · {((a.total / t.works) * 100).toFixed(1)}%
                  </span>
                </div>
                <Bar value={a.total} max={maxAgency} color={agencyColor(a.agency)} height={7} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-3" delay={280} title="Workload by priority band"
          subtitle="Priority 1 is most urgent — not a calendar year"
          icon={<TrendingUp className="h-4 w-4" />} action={<PriorityLegend compact />}>
          <div className="flex h-[196px] items-end gap-3">
            {t.byPriority.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                  {n.toLocaleString("en-IN")}
                </span>
                <div className="w-full rounded-t-[5px] transition-all duration-700"
                     title={`Priority ${i + 1} — ${n.toLocaleString("en-IN")} works`}
                     style={{ height: `${(n / maxPriority) * 138}px`, background: yearColor(i + 1) }} />
                <span className="eyebrow">P{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-[10px] px-3 py-2 text-[12px] leading-relaxed"
             style={{ background: "var(--surface-2)", color: "var(--ink-3)" }}>
            A priority band is a sequencing rank, not a calendar year — P5 work is not &ldquo;next year&rsquo;s
            problem&rdquo;. The original plan stacked <strong style={{ color: "var(--ink-2)" }}>60% into one band</strong>;
            levelling holds ridge-to-valley with zero violations across 136 villages.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel delay={320} title="Busiest Technical Assistants"
          subtitle={`${t.busiest[t.busiest.length - 1].works} to ${t.busiest[0].works.toLocaleString("en-IN")} works — a 62× spread`}
          icon={<Users className="h-4 w-4" />}
          action={<Link href="/ta" className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>All <ArrowUpRight className="h-3 w-3" /></Link>}>
          <div className="flex flex-col gap-2.5">
            {t.busiest.slice(0, 8).map((x) => (
              <div key={`${x.taluka}-${x.ta}`} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px]" style={{ color: "var(--ink)" }}>
                    {x.ta}<span className="ml-1.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>{x.taluka}</span>
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>{x.works.toLocaleString("en-IN")}</span>
                </div>
                <Bar value={x.works} max={t.busiest[0].works} height={6} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel delay={360} title="Largest villages by workload" icon={<Mountain className="h-4 w-4" />}
          action={<Link href="/villages" className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>All <ArrowUpRight className="h-3 w-3" /></Link>}>
          <div className="scroll max-h-[298px] overflow-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
            <table className="w-full">
              <thead><tr>
                <th className="th">Village</th><th className="th">Taluka</th><th className="th">TA</th>
                <th className="th" style={{ textAlign: "right" }}>Works</th><th className="th" style={{ minWidth: 84 }}>Priority</th>
              </tr></thead>
              <tbody>
                {data.villages.slice(0, 12).map((v) => (
                  <tr key={`${v.taluka}-${v.village}-${v.gp}`}>
                    <td className="td font-medium" style={{ color: "var(--ink)" }}>{v.village}</td>
                    <td className="td">{v.taluka}</td>
                    <td className="td">{v.ta ?? <Chip kind={taStatusKind(v.status)}>Vacant</Chip>}</td>
                    <td className="td text-right tabular-nums">{v.works.toLocaleString("en-IN")}</td>
                    <td className="td"><PriorityBar byYear={v.byPriority} height={6} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
