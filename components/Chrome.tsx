"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  Waves, LayoutDashboard, Building2, Users, MapPin, Layers, Mountain, Trees,
  Table2, Scale, Sun, Moon, Menu, X, Database, GitBranch, type LucideIcon,
} from "lucide-react";
import { useTheme } from "./Theme";

const NAV: { section: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  { section: "Overview", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agency", label: "Departments", icon: Building2 },
  ]},
  { section: "Delivery", items: [
    { href: "/ta", label: "Technical Assistants", icon: Users },
    { href: "/villages", label: "Villages", icon: MapPin },
  ]},
  { section: "Plan structure", items: [
    { href: "/category", label: "Work categories", icon: Layers },
    { href: "/stage", label: "Treatment stages", icon: Mountain },
    { href: "/forest", label: "Land status", icon: Trees },
    { href: "/rules", label: "Allotment rules", icon: Scale },
    { href: "/dependencies", label: "Dependency check", icon: GitBranch },
  ]},
  { section: "Data", items: [
    { href: "/works", label: "All works", icon: Table2 },
  ]},
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const p = usePathname();
  const on = (h: string) => (h === "/" ? p === "/" : p.startsWith(h));
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto scroll px-3 py-1">
      {NAV.map((g) => (
        <div key={g.section}>
          <p className="eyebrow px-3 pb-1.5">{g.section}</p>
          <div className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const Icon = it.icon; const active = on(it.href);
              return (
                <Link key={it.href} href={it.href} onClick={onNavigate}
                  className="group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] transition-colors"
                  style={active
                    ? { background: "var(--brand-wash)", color: "var(--brand-ink)", fontWeight: 600 }
                    : { color: "var(--ink-2)" }}>
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                          style={{ background: "var(--brand)" }} />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0 opacity-80" />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3 py-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px]"
            style={{ background: "var(--brand)", color: "#fff" }}>
        <Waves className="h-[18px] w-[18px]" />
      </span>
      <span className="leading-tight">
        <span className="block text-[14.5px] font-semibold tracking-[-.015em]" style={{ color: "var(--ink)" }}>Pinjal River</span>
        <span className="eyebrow">Five year plan</span>
      </span>
    </Link>
  );
}

export function Shell({ title, subtitle, actions, children }: {
  title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const { mode, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col gap-4 border-r py-4 lg:flex"
             style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <Brand />
        <NavList />
        <p className="px-6 text-[10.5px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          Govardhan Ecovillage · GIZ · RuDRA
        </p>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col gap-4 py-4"
                 style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between pr-3"><Brand />
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[244px]">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 border-b backdrop-blur"
                style={{ background: "color-mix(in srgb, var(--canvas) 82%, transparent)", borderColor: "var(--line)" }}>
          <div className="mx-auto flex max-w-[1560px] items-center gap-3 px-4 py-3 sm:px-6">
            <button className="btn btn-ghost btn-icon lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-semibold tracking-[-.02em]" style={{ color: "var(--ink)" }}>{title}</h1>
              <p className="truncate text-[12.5px]" style={{ color: "var(--ink-3)" }}>{subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <span className="chip hidden sm:inline-flex" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}>
                <Database className="h-3 w-3" /> Tracking not connected
              </span>
              <button className="btn btn-ghost btn-icon" onClick={toggle}
                      aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
                {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
