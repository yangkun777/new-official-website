"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Child = { href: string; label: string; path: string; description: string };
type Item = { href: string; label: string; path: string; children?: Child[] };

function NavigationLabel({ label, loading, pending }: { label: string; loading: string; pending: boolean }) {
  return <><span>{label}</span><span className="nav-pending" data-pending={pending} role="status"><span className="nav-pending-dot" aria-hidden="true" /><span className="sr-only">{pending ? loading : ""}</span></span></>;
}

export default function SiteNavigation({ items, mobile = false, zh }: { items: Item[]; mobile?: boolean; zh: boolean }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const submenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reset = () => setPendingHref(null);
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && submenu.current && !submenu.current.parentElement?.contains(event.target)) submenu.current.open = false;
    };
    window.addEventListener("pageshow", reset);
    document.addEventListener("pointerdown", closeOutside);
    return () => { window.removeEventListener("pageshow", reset); document.removeEventListener("pointerdown", closeOutside); };
  }, []);
  const current = pathname.replace(/^\/(en|zh)(?=\/|$)/, "") || "/";
  return <nav aria-label={zh ? "主导航" : "Main navigation"} className={mobile ? "grid grid-cols-6 border-t border-[#eee] px-2 text-[12px] text-[#444] md:hidden" : "hidden items-center gap-1 text-[13px] tracking-wide text-[#444] md:flex"}>
    {items.map(item => {
      const active = item.path === "/" ? current === "/" : item.path === "/products" ? current === "/products" || current.startsWith("/products/") || current.startsWith("/product/") : current === item.path || current.startsWith(`${item.path}/`);
      const link = <a href={item.href} aria-current={active ? "page" : undefined} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) setPendingHref(item.href); }} className={`site-nav-link relative inline-flex shrink-0 items-center justify-center gap-2 hover:text-[#af1728] ${mobile ? (item.children ? "min-h-12 flex-1 px-0" : "min-h-12 w-full px-1") : "h-16 px-3 lg:px-4"}`}><NavigationLabel label={item.label} pending={pendingHref === item.href} loading={zh ? `正在打开${item.label}` : `Opening ${item.label}`} /></a>;
      if (!item.children) return <span key={item.path} className="min-w-0">{link}</span>;
      return <div key={item.path} className={mobile ? "flex min-w-0 items-center" : "relative flex items-center"}
        onPointerEnter={event => { if (!mobile && event.pointerType === "mouse" && submenu.current) submenu.current.open = true; }}
        onPointerLeave={event => { if (!mobile && event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement) && submenu.current) submenu.current.open = false; }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && submenu.current) submenu.current.open = false; }}
        onKeyDown={event => { if (event.key === "Escape" && submenu.current?.open) { event.preventDefault(); submenu.current.open = false; submenu.current.querySelector("summary")?.focus(); } }}>
        {link}<details ref={submenu} className="nav-subnav"><summary aria-label={zh ? "展开服务二级菜单" : "Open services submenu"} className={`nav-subnav-toggle flex list-none items-center justify-center text-[#68747e] ${mobile ? "min-h-12 w-4" : "h-16 w-7"}`}><svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 4 4 4 4-4" /></svg></summary><div className="nav-submenu" aria-label={zh ? "服务二级导航" : "Services submenu"}>{item.children.map(child => <a key={child.path} href={child.href} aria-current={current === child.path ? "page" : undefined} className="nav-submenu-link group block px-5 py-4"><span className="flex items-center justify-between gap-4 text-sm font-semibold">{child.label}<span aria-hidden="true" className="nav-submenu-arrow">↗</span></span><span className="mt-2 block text-xs leading-5 text-[#68747e]">{child.description}</span></a>)}</div></details>
      </div>;
    })}
  </nav>;
}
