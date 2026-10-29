"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "degson-theme";
export type SiteTheme = "teal" | "blue";

const OPTIONS: { id: SiteTheme; label: string; swatch: string }[] = [
  { id: "teal", label: "青绿", swatch: "#107a6b" },
  { id: "blue", label: "蓝色", swatch: "#003f88" },
];

function readTheme(): SiteTheme {
  if (typeof document === "undefined") return "teal";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "blue" || attr === "teal") return attr;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "blue" || stored === "teal") return stored;
  } catch {
    /* ignore */
  }
  return "teal";
}

function applyTheme(theme: SiteTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>("teal");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  return (
    <div
      role="group"
      aria-label="主题色"
      className="flex items-center gap-1 rounded-full border border-slate-200 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const selected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={selected}
            onClick={() => {
              setTheme(opt.id);
              applyTheme(opt.id);
            }}
            className={`h-3.5 w-3.5 rounded-full border ${
              selected
                ? "border-slate-500 ring-1 ring-slate-400 ring-offset-1"
                : "border-slate-300 opacity-70 hover:opacity-100"
            }`}
            style={{ backgroundColor: opt.swatch }}
          />
        );
      })}
    </div>
  );
}
