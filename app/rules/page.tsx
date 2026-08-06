"use client";
import { useMemo } from "react";
import { Scale, ArrowRight, Info, Download, RotateCcw, Pencil } from "lucide-react";
import { Shell } from "@/components/Chrome";
import { Panel, Skeleton, Chip, AgencyTag, Bar, Empty } from "@/components/Ui";
import { useAggregates } from "@/lib/data";
import { agencyColor, agencyShort, confidenceKind, AGENCY_ORDER } from "@/lib/palette";
import { toCsv, download } from "@/lib/export";
import { useRuleOverrides } from "@/lib/overrides";

const PRIORITIES = [1, 2, 3, 4, 5];

export default function RulesPage() {
  const { data, loading, error } = useAggregates();
  const { overrides, set, resetOne, resetAll } = useRuleOverrides();
  const editedCount = Object.keys(overrides).length;

  const effectiveRules = useMemo(() => {
    if (!data) return [];
    return data.rules.map((r) => {
      const o = overrides[r.key];
      // If every work under this rule already shares one priority (either
      // baked into the data, or from a bulk edit made earlier), that's the
      // true current state — show it selected instead of defaulting to "Mixed".
      const usedBands = r.byPriority.map((n, i) => (n > 0 ? i + 1 : null)).filter((x): x is number => x != null);
      const currentPriority = usedBands.length === 1 ? usedBands[0] : undefined;
      return {
        ...r,
        lead: o?.lead ?? r.lead,
        fallback: o?.fallback ?? r.fallback,
        priorityOverride: o?.priority ?? currentPriority,
        edited: !!o,
      };
    });
  }, [data, overrides]);

  const actions = data && (
    <div className="flex items-center gap-2">
      {editedCount > 0 && (
        <button className="btn btn-ghost" onClick={resetAll}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset all ({editedCount})
        </button>
      )}
      <button className="btn btn-ghost" onClick={() => download("pinjal-rules.csv", toCsv(
        effectiveRules.map((r) => ({ Rule_Key: r.key, Land_Status: r.land, Work_Type: r.workType,
          Stream_Order: r.streamOrder, Lead_Agency: r.lead, Fallback_Agency: r.fallback,
          Priority_Override: r.priorityOverride ?? "", Technical_Sanction: r.technicalSanction,
          Confidence: r.confidence }))))}>
        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export rules</span>
      </button>
    </div>
  );

  if (error) return <Shell title="Allotment rules" subtitle=""><Empty>Could not load — {error}</Empty></Shell>;
  if (loading || !data) return <Shell title="Allotment rules" subtitle="Loading…"><Skeleton rows={7} /></Shell>;

  const max = Math.max(...effectiveRules.map((r) => r.works));
  const total = effectiveRules.reduce((s, r) => s + r.works, 0);

  return (
    <Shell title="Allotment rules"
      subtitle="Edit a rule and every work using it follows — across Departments, Categories, Stages and Land status."
      actions={actions}>

      <div className="surface rise mb-4 flex items-start gap-3 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
        <div className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Each work is tagged with a <strong style={{ color: "var(--ink)" }}>rule key</strong> derived from its own
          attributes — land status, work type, stream order, size. Exactly one key per work, so there is no rule
          ordering and no overlap to reason about. Editing lead, fallback or priority below is a{" "}
          <strong style={{ color: "var(--ink)" }}>local what-if view in this browser</strong> — it is not written
          back to the workbook or the shared Google Sheet.
        </div>
      </div>

      <Panel title="Rule table" subtitle={`${effectiveRules.length} rules covering all ${total.toLocaleString("en-IN")} works`}
             icon={<Scale className="h-4 w-4" />} delay={60}>
        <div className="scroll overflow-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
          <table className="w-full">
            <thead><tr>
              <th className="th">Land status</th>
              <th className="th">Work type</th>
              <th className="th">Stream order</th>
              <th className="th">Lead agency</th>
              <th className="th">Fallback</th>
              <th className="th">Priority</th>
              <th className="th">Confidence</th>
              <th className="th" style={{ textAlign: "right" }}>Works</th>
              <th className="th" style={{ minWidth: 120 }}>Share</th>
              <th className="th" />
            </tr></thead>
            <tbody>
              {effectiveRules.map((r) => (
                <tr key={r.key} style={r.edited ? { background: "var(--brand-wash)" } : undefined}>
                  <td className="td">
                    <Chip kind={r.land === "Forest" ? "good" : "neutral"} dot={false}>{r.land}</Chip>
                  </td>
                  <td className="td font-medium" style={{ color: "var(--ink)" }}>
                    {r.workType}
                    {r.edited && <Pencil className="ml-1.5 inline h-3 w-3 align-text-top" style={{ color: "var(--brand)" }} />}
                  </td>
                  <td className="td tabular-nums">{r.streamOrder || <span style={{ opacity: .4 }}>—</span>}</td>
                  <td className="td">
                    <select className="field" value={r.lead}
                      onChange={(e) => set(r.key, { lead: e.target.value })}>
                      {AGENCY_ORDER.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </td>
                  <td className="td">
                    <select className="field" value={r.fallback || ""}
                      onChange={(e) => set(r.key, { fallback: e.target.value })}>
                      <option value="">none</option>
                      {AGENCY_ORDER.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </td>
                  <td className="td">
                    <select className="field" value={r.priorityOverride ?? ""}
                      onChange={(e) => set(r.key, { priority: e.target.value ? Number(e.target.value) : undefined })}>
                      <option value="">Mixed</option>
                      {PRIORITIES.map((p) => <option key={p} value={p}>P{p} — all works</option>)}
                    </select>
                  </td>
                  <td className="td"><Chip kind={confidenceKind(r.confidence)}>{r.confidence}</Chip></td>
                  <td className="td text-right font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                    {r.works.toLocaleString("en-IN")}
                  </td>
                  <td className="td"><Bar value={r.works} max={max} color={agencyColor(r.lead)} height={6} /></td>
                  <td className="td">
                    {r.edited && (
                      <button className="btn btn-ghost" title="Reset this rule to default" onClick={() => resetOne(r.key)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          Setting a priority here bulk-stamps that priority onto every work carrying this rule, replacing
          whatever priority it had — the same as editing the source workbook directly, but scoped to this
          browser only. Rule keys themselves are fixed; they describe the work, not the decision.
        </p>
      </Panel>
    </Shell>
  );
}
