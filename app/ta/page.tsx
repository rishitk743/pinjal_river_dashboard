"use client";
import { useMemo, useState } from "react";
import { Users, Download, Search, Phone, AlertTriangle, Gauge, ChevronDown, ListChecks } from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Kpi, Panel, Bar, PriorityBar, PriorityLegend, Skeleton, Chip, AgencyTag, Empty } from "@/components/Ui";
import { useAggregates } from "@/lib/data";
import { agencyColor, agencyShort, taStatusKind } from "@/lib/palette";
import { toCsv, download } from "@/lib/export";
import TaWorksPanel from "@/components/TaWorksPanel";

export default function TaPage() {
  const { data, book, loading, error } = useAggregates();
  const [taluka, setTaluka] = useState("");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.toLowerCase();
    return data.tas.filter((t) => {
      if (taluka && t.taluka !== taluka) return false;
      if (needle) {
        const hay = `${t.ta ?? "vacant"} ${t.taluka} ${t.office} ${t.villages.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, taluka, q]);

  const actions = data && (
    <button className="btn btn-ghost" onClick={() => download("pinjal-ta-allocation.csv", toCsv(
      rows.map((r) => ({ taluka: r.taluka, office: r.office, ta: r.ta ?? "(vacant)", mobile: r.mobile ?? "",
        status: r.status, works: r.works, villages: r.villages.join("; "), gramPanchayats: r.gramPanchayats.join("; ") }))))}>
      <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
    </button>
  );

  if (error) return <Shell title="Technical Assistants" subtitle=""><Empty>Could not load — {error}</Empty></Shell>;
  if (loading || !data) return <Shell title="Technical Assistants" subtitle="Loading…"><Skeleton rows={8} /></Shell>;

  const max = Math.max(...rows.map((r) => r.works), 1);
  const named = rows.filter((r) => r.ta);
  // Count postings, not distinct name strings — two different people can
  // share a name (e.g. two "Rahul Patil"s, one in Wada, one in Vikramgad),
  // and a Set/dedup-by-name would silently undercount by one per collision.
  const peopleCount = named.length;
  const vacantWorks = rows.filter((r) => !r.ta).reduce((s, r) => s + r.works, 0);
  const avg = peopleCount ? Math.round(named.reduce((s, r) => s + r.works, 0) / peopleCount) : 0;

  return (
    <Shell title="Technical Assistants"
      subtitle="Who prepares every estimate and measurement — the binding delivery constraint"
      actions={actions}>

      <div className="surface rise mb-4 flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input className="field w-full pl-9" placeholder="Name, office or village…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field" value={taluka} onChange={(e) => setTaluka(e.target.value)}>
          <option value="">All talukas</option>
          {data.meta.talukas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Technical Assistants" value={peopleCount} icon={<Users className="h-4 w-4" />} delay={0} />
        <Kpi label="Average load" value={avg} unit="works" icon={<Gauge className="h-4 w-4" />} delay={40} />
        <Kpi label="Heaviest load" value={max} unit="works" note="16% of the whole plan" icon={<AlertTriangle className="h-4 w-4" />} tone="warn" delay={80} />
        <Kpi label="Works with no TA" value={vacantWorks} icon={<AlertTriangle className="h-4 w-4" />} tone="critical" delay={120} />
      </div>

      <Panel title="Workload by Technical Assistant" subtitle={`${rows.length} postings`}
             icon={<Users className="h-4 w-4" />} action={<PriorityLegend />} delay={160}>
        <div className="flex flex-col gap-1">
          {rows.map((t) => {
            const vacant = !t.ta;
            const key = `${t.taluka}-${t.ta ?? "vacant"}-${t.office}`;
            const isOpen = expanded === key;
            return (
              <div key={key}
                   className="rounded-[11px] p-3 transition-colors"
                   style={vacant ? { background: "var(--critical-wash)" } : undefined}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-[-.01em]" style={{ color: "var(--ink)" }}>
                      {t.ta ?? "Post vacant"}
                    </span>
                    <Chip kind={taStatusKind(t.status)}>{t.ta ? "Assigned" : "No TA"}</Chip>
                    <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>{t.office}</span>
                    {t.mobile && (
                      <a href={`tel:${t.mobile}`} className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>
                        <Phone className="h-3 w-3" />{t.mobile}
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                    <strong style={{ color: "var(--ink)" }}>{t.works.toLocaleString("en-IN")}</strong> works ·
                    {" "}{t.villages.length} villages · {t.gramPanchayats.length} GPs
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Bar value={t.works} max={max} color={vacant ? "var(--critical)" : "var(--brand)"} height={7} />
                  <PriorityBar byYear={t.byPriority} height={5} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {Object.entries(t.byAgency).sort((a, b) => b[1] - a[1]).map(([ag, n]) => (
                    <span key={ag} className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                      <AgencyTag agency={ag} color={agencyColor(ag)} short={agencyShort(ag)} />
                      <span className="tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{t.villages.join(" · ")}</p>
                {t.ta && (
                  <button className="btn btn-ghost mt-2" onClick={() => setExpanded(isOpen ? null : key)}>
                    <ListChecks className="h-3.5 w-3.5" />
                    {isOpen ? "Hide" : "View"} {t.ta.split(" ")[0]}'s works
                    <ChevronDown className="h-3.5 w-3.5 transition-transform" style={isOpen ? { transform: "rotate(180deg)" } : undefined} />
                  </button>
                )}
                {isOpen && book && (
                  <div className="mt-3">
                    <TaWorksPanel taluka={t.taluka} ta={t.ta} book={book} stages={data.meta.stages} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </Shell>
  );
}
