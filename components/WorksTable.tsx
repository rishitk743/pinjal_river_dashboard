"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowUp, ArrowDown, ChevronsUpDown, MapPin, X } from "lucide-react";
import type { Work } from "@/lib/types";
import type { ColumnSpec } from "@/lib/config";
import type { RuleBook } from "@/lib/rules";
import { agencyColor, agencyShort, confidenceKind } from "@/lib/palette";
import { AgencyTag, Chip, PriorityPip } from "./Ui";
import ColumnFilterMenu, { type FilterOption } from "./ColumnFilterMenu";

const PAGE = 150;
const NONE = "—"; // sentinel for blank/null cells so they're filterable as their own value

export default function WorksTable({ works, columns, stages, book }: {
  works: Work[]; columns: ColumnSpec[]; stages: Record<string, string>; book: RuleBook;
}) {
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "p", d: 1 });
  const [shown, setShown] = useState(PAGE);
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});

  const val = (w: Work, k: string) =>
    k === "agency" ? book.lead(w) : k === "location" ? w.lat : (w as unknown as Record<string, unknown>)[k];

  // Canonical display value per column, used both to build filter option lists
  // and to test a row against the active filters — mirrors what cell() renders.
  const filterValue = (w: Work, c: ColumnSpec): string => {
    if (c.render === "agency") return book.lead(w);
    if (c.render === "priority") return `P${w.p}`;
    if (c.render === "confidence") return book.confidence(w);
    if (c.render === "stage") return stages[String(w.st)] ?? String(w.st);
    if (c.render === "rule") return book.label(w.rk);
    const v = (w as unknown as Record<string, unknown>)[c.key as string];
    return v == null || v === "" ? NONE : String(v);
  };

  const filterableColumns = useMemo(() => columns.filter((c) => c.filterable !== false), [columns]);

  const columnOptions = useMemo(() => {
    const out: Record<string, FilterOption[]> = {};
    for (const c of filterableColumns) {
      const counts = new Map<string, number>();
      for (const w of works) {
        const v = filterValue(w, c);
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[String(c.key)] = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, filterableColumns, book, stages]);

  const activeFilterEntries = useMemo(
    () => Object.entries(colFilters).filter(([, set]) => set.size > 0),
    [colFilters]
  );

  const filtered = useMemo(() => {
    if (activeFilterEntries.length === 0) return works;
    return works.filter((w) =>
      activeFilterEntries.every(([key, set]) => {
        const c = columns.find((c) => String(c.key) === key);
        return c ? set.has(filterValue(w, c)) : true;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, activeFilterEntries, columns, book, stages]);

  const rows = useMemo(() => {
    const a = [...filtered];
    a.sort((x, y) => {
      const av = val(x, sort.k), bv = val(y, sort.k);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.d;
      return String(av).localeCompare(String(bv)) * sort.d;
    });
    return a;
  }, [filtered, sort, book]);

  const toggle = (k: string) => setSort((s) => (s.k === k ? { k, d: s.d === 1 ? -1 : 1 } : { k, d: 1 }));

  const setColumnFilter = (key: string, next: Set<string>) => {
    setColFilters((prev) => ({ ...prev, [key]: next }));
    setShown(PAGE);
  };
  const clearAllFilters = () => { setColFilters({}); setShown(PAGE); };

  const cell = (c: ColumnSpec, w: Work) => {
    if (c.render === "agency") {
      const a = book.lead(w);
      return <AgencyTag agency={a} color={agencyColor(a)} short={agencyShort(a)} />;
    }
    if (c.render === "priority") return <PriorityPip p={w.p} />;
    if (c.render === "confidence") return <Chip kind={confidenceKind(book.confidence(w))}>{book.confidence(w)}</Chip>;
    if (c.render === "stage") return <span className="text-[12.5px]">{stages[String(w.st)] ?? w.st}</span>;
    if (c.render === "rule") return <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>{book.label(w.rk)}</span>;
    if (c.render === "maps") {
      if (w.lat == null || w.lng == null) return <span style={{ color: "var(--ink-3)", opacity: .45 }}>—</span>;
      return (
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lng}`}
           target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
           className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>
          <MapPin className="h-3 w-3" /> Directions
        </a>
      );
    }
    const v = (w as unknown as Record<string, unknown>)[c.key as string];
    if (v == null || v === "") return <span style={{ color: "var(--ink-3)", opacity: .45 }}>—</span>;
    if (typeof v === "number") return <span className="tabular-nums">{v.toLocaleString("en-IN")}</span>;
    if (c.key === "v") return <span className="font-medium" style={{ color: "var(--ink)" }}>{String(v)}</span>;
    return String(v);
  };

  return (
    <div className="overflow-hidden rounded-[12px] border" style={{ borderColor: "var(--line)" }}>
      {activeFilterEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
          <span className="text-[11.5px]" style={{ color: "var(--ink-3)" }}>Filters:</span>
          {activeFilterEntries.map(([key, set]) => {
            const c = columns.find((c) => String(c.key) === key);
            return (
              <span key={key} className="chip" style={{ background: "var(--brand-wash)", color: "var(--brand-ink)" }}>
                {c?.label}: {set.size}
                <button type="button" aria-label={`Clear ${c?.label} filter`} onClick={() => setColumnFilter(key, new Set())}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button type="button" className="ml-1 text-[11.5px] font-medium" style={{ color: "var(--ink-3)" }} onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}
      <div className="scroll max-h-[62vh] overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={String(c.key) + c.label} className="th select-none"
                    style={{ minWidth: c.width, textAlign: c.align === "right" ? "right" : "left" }}>
                  <span className={clsx("inline-flex items-center gap-1.5", c.align === "right" && "flex-row-reverse")}>
                    <span className="inline-flex cursor-pointer items-center gap-1" onClick={() => toggle(String(c.key))}>
                      {c.label}
                      {sort.k === c.key
                        ? (sort.d === 1 ? <ArrowUp className="h-3 w-3" style={{ color: "var(--brand)" }} />
                                        : <ArrowDown className="h-3 w-3" style={{ color: "var(--brand)" }} />)
                        : <ChevronsUpDown className="h-3 w-3 opacity-25" />}
                    </span>
                    {c.filterable !== false && (
                      <ColumnFilterMenu
                        label={c.label}
                        options={columnOptions[String(c.key)] ?? []}
                        selected={colFilters[String(c.key)] ?? new Set()}
                        onChange={(next) => setColumnFilter(String(c.key), next)}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((w) => (
              <tr key={w.i}>
                {columns.map((c) => (
                  <td key={String(c.key) + c.label} className={clsx("td", c.align === "right" && "text-right")}>
                    {cell(c, w)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
           style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
        <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          {Math.min(shown, rows.length).toLocaleString("en-IN")} of {rows.length.toLocaleString("en-IN")} works
          {activeFilterEntries.length > 0 && <> · filtered from {works.length.toLocaleString("en-IN")}</>}
        </span>
        {shown < rows.length && (
          <button className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE * 6)}>Load more</button>
        )}
      </div>
    </div>
  );
}
