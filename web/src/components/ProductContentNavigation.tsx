"use client";

import { useEffect, useRef, useState } from "react";

export default function ProductContentNavigation({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState(items[0]?.id ?? "");
  const ids = items.map(item => item.id).join(",");
  useEffect(() => {
    let frame = 0;
    const sections = ids.split(",").map(id => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    const update = () => {
      frame = 0;
      const bottom = (nav.current?.getBoundingClientRect().bottom ?? 150) + 48;
      let current = sections[0]?.id ?? "";
      for (const section of sections) if (section.getBoundingClientRect().top <= bottom) current = section.id;
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) current = sections.at(-1)?.id ?? current;
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [ids]);
  useEffect(() => {
    const element = nav.current?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!element || !nav.current) return;
    const left = element.getBoundingClientRect().left - nav.current.getBoundingClientRect().left + nav.current.scrollLeft;
    if (left < nav.current.scrollLeft || left + element.offsetWidth > nav.current.scrollLeft + nav.current.clientWidth) nav.current.scrollTo({ left: Math.max(0, left - 8), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [active]);
  return <nav ref={nav} aria-label={label} className="product-content-nav flex gap-2 overflow-x-auto border-t border-[#dce1e5] py-4">{items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} className="product-section-link relative shrink-0 whitespace-nowrap border border-[#dce1e5] px-4 py-2 text-sm font-medium text-[#17212b] hover:border-[#af1728] hover:text-[#af1728]">{item.label}</a>)}</nav>;
}
