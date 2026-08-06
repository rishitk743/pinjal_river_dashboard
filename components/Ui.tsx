"use client";
import clsx from "clsx";
import { STATUS, type StatusKind, yearColor, yearInk } from "@/lib/palette";

export function Kpi({ label, value, unit, icon, tone = "brand", note, delay = 0 }: {
  label: string; value: string | number; unit?: string; icon?: React.ReactNode;
  tone?: "brand" | "warn" | "critical"; note?: string; delay?: number;
}) {
  const wash = tone === "critical" ? "var(--critical-wash)" : tone === "warn" ? "var(--warn-wash)" : "var(--brand-wash)";
  const fg = tone === "critical" ? "var(--critical)" : tone === "warn" ? "var(--warn)" : "var(--brand)";
  return (
    <div className="surface surface-hover rise p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">{label}</p>
          <p className="display mt-1.5">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
            {unit && <span className="ml-1 text-[13px] font-medium" style={{ color: "var(--ink-3)" }}>{unit}</span>}
          </p>
          {note && <p className="mt-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>{note}</p>}
        </div>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                style={{ background: wash, color: fg }}>{icon}</span>
        )}
      </div>
    </div>
  );
}

export function Panel({ title, subtitle, icon, action, children, className, delay = 0 }: {
  title: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode;
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <section className={clsx("surface rise overflow-hidden", className)} style={{ animationDelay: `${delay}ms` }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && <span className="shrink-0" style={{ color: "var(--ink-3)" }}>{icon}</span>}
          <div className="min-w-0">
            <h2 className="h-title truncate">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--ink-3)" }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

export function Chip({ kind, children, dot = true }: { kind: StatusKind; children: React.ReactNode; dot?: boolean }) {
  const s = STATUS[kind];
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />}
      {children}
    </span>
  );
}

/** Agency identity: swatch + name together, so colour is never the only cue. */
export function AgencyTag({ agency, color, short, size = "sm" }: {
  agency: string; color: string; short: string; size?: "sm" | "md";
}) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5", size === "md" ? "text-[13.5px] font-medium" : "text-[13px]")}
          title={agency}>
      <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: color }} />
      <span className="truncate">{short}</span>
    </span>
  );
}

/** Magnitude bar — 4px rounded data-end, anchored to the baseline. */
export function Bar({ value, max, color = "var(--brand)", showValue = false, height = 8 }: {
  value: number; max: number; color?: string; showValue?: boolean; height?: number;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, 1.5) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 overflow-hidden rounded-[4px]" style={{ height, background: "var(--line)" }}>
        <div className="h-full rounded-[4px] transition-[width] duration-500"
             style={{ width: `${pct}%`, background: color }} />
      </div>
      {showValue && (
        <span className="w-14 shrink-0 text-right text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
          {value.toLocaleString("en-IN")}
        </span>
      )}
    </div>
  );
}

/** Stacked ordinal-year bar. 2px surface gap between segments; each has a tooltip. */
export function PriorityBar({ byYear, height = 8 }: { byYear: number[]; height?: number }) {
  const total = byYear.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex w-full overflow-hidden rounded-[4px]"
         style={{ height, gap: 2, background: "var(--line)" }}>
      {byYear.map((n, i) =>
        n > 0 ? (
          <div key={i} title={`Priority ${i + 1} — ${n.toLocaleString("en-IN")} works`}
               style={{ width: `${(n / total) * 100}%`, background: yearColor(i + 1) }} />
        ) : null
      )}
    </div>
  );
}

export function PriorityLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {!compact && <span className="eyebrow">Priority</span>}
      {[1, 2, 3, 4, 5].map((y) => (
        <span key={y} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
          <span className="h-2 w-2 rounded-[3px]" style={{ background: yearColor(y) }} />{y}
        </span>
      ))}
    </div>
  );
}

export function PriorityPip({ p }: { p: number }) {
  return (
    <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px] text-[11.5px] font-bold"
          style={{ background: yearColor(p), color: yearInk(p) }}>{p}</span>
  );
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface overflow-hidden p-4">
      <div className="skeleton h-8 w-52" />
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="surface p-12 text-center text-[13px]" style={{ color: "var(--ink-3)" }}>{children}</div>;
}
