"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListFilter, Search } from "lucide-react";

export interface FilterOption { value: string; count: number }

/** Excel/data-grid style column filter — click the funnel, check off any
 *  number of values. Built plain (no external UI library) to match the
 *  rest of the app's dependency-free component set. */
export default function ColumnFilterMenu({ label, options, selected, onChange }: {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const active = selected.size > 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? options.filter((o) => o.value.toLowerCase().includes(needle)) : options;
  }, [options, q]);

  const toggle = (value: string) => {
    const next = new Set(selected);
    next.has(value) ? next.delete(value) : next.add(value);
    onChange(next);
  };

  return (
    <div ref={ref} className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Filter ${label}`}
        title={`Filter ${label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] transition-colors"
        style={active ? { background: "var(--brand)", color: "var(--surface)" } : { color: "var(--ink-3)" }}
      >
        <ListFilter className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[240px] overflow-hidden rounded-[10px] border"
             style={{ borderColor: "var(--line)", background: "var(--surface)", boxShadow: "var(--shadow-2)" }}>
          <div className="border-b p-2" style={{ borderColor: "var(--line)" }}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
                     className="field w-full py-1 pl-6 text-[12px]" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-b px-2.5 py-1.5" style={{ borderColor: "var(--line)" }}>
            <button type="button" className="text-[11px] font-medium" style={{ color: "var(--brand)" }}
                    onClick={() => onChange(new Set(options.map((o) => o.value)))}>Select all</button>
            <button type="button" className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}
                    onClick={() => onChange(new Set())}>Clear</button>
          </div>
          <div className="scroll max-h-[240px] overflow-auto py-1">
            {filteredOptions.length === 0 && (
              <p className="px-2.5 py-3 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>No matches</p>
            )}
            {filteredOptions.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[12.5px]"
                     style={{ color: "var(--ink)" }}>
                <input type="checkbox" checked={selected.has(o.value)} onChange={() => toggle(o.value)}
                       className="h-3.5 w-3.5 shrink-0 accent-[var(--brand)]" />
                <span className="min-w-0 flex-1 truncate">{o.value}</span>
                <span className="shrink-0 tabular-nums" style={{ color: "var(--ink-3)" }}>{o.count.toLocaleString("en-IN")}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
