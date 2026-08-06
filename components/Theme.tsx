"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
const Ctx = createContext<{ mode: Mode; toggle: () => void }>({ mode: "light", toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const saved = (localStorage.getItem("pinjal-theme") as Mode | null) ?? null;
    const sys: Mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved ?? sys;
    setMode(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () =>
    setMode((m) => {
      const next: Mode = m === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("pinjal-theme", next);
      return next;
    });

  return <Ctx.Provider value={{ mode, toggle }}>{children}</Ctx.Provider>;
}
