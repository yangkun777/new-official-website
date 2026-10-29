"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";
import type { HomeBannerSlide } from "@/lib/homeBannerModel";

export default function HomeBanner({ lang, slides }: { lang: Lang; slides: HomeBannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [visible, setVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [destination, setDestination] = useState<number | null>(null);
  const [settling, setSettling] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);
  const gesture = useRef<{ id: number; x: number; y: number; time: number; horizontal: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  const zh = lang === "zh";
  const wrap = (index: number) => (index + slides.length) % slides.length;

  const finishMove = useCallback(() => {
    if (destination !== null) setActive(destination);
    setOffset(0);
    setDestination(null);
    setSettling(false);
  }, [destination]);

  const move = useCallback((direction: number, target = (active + direction + slides.length) % slides.length) => {
    if (settling) return;
    if (reducedMotion.current) {
      setActive(target);
      setOffset(0);
      return;
    }
    setDestination(target);
    setSettling(true);
    setOffset(-direction * (viewport.current?.clientWidth ?? 0));
  }, [active, settling, slides.length]);

  const resetDrag = () => {
    if (offset === 0 || reducedMotion.current) setOffset(0);
    else {
      setDestination(active);
      setSettling(true);
      setOffset(0);
    }
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (settling || !event.isPrimary || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), horizontal: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      start.horizontal = true;
    }
    event.preventDefault();
    const width = viewport.current?.clientWidth ?? 0;
    setOffset(Math.max(-width, Math.min(width, dx)));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!start.horizontal) return;
    suppressClickUntil.current = performance.now() + 250;
    const dx = event.clientX - start.x;
    const elapsed = Math.max(1, performance.now() - start.time);
    const threshold = Math.min(100, (viewport.current?.clientWidth ?? 0) * 0.16);
    if (Math.abs(dx) >= threshold || (Math.abs(dx) > 30 && Math.abs(dx) / elapsed > 0.5)) move(dx < 0 ? 1 : -1);
    else resetDrag();
  };

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const respectMotion = () => {
      reducedMotion.current = motion.matches;
      if (motion.matches) setAutoPlay(false);
    };
    const updateVisibility = () => setVisible(!document.hidden);
    respectMotion();
    updateVisibility();
    motion.addEventListener("change", respectMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      motion.removeEventListener("change", respectMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || !visible || dragging || settling) return;
    const timer = window.setTimeout(() => move(1), 6500);
    return () => window.clearTimeout(timer);
  }, [active, autoPlay, visible, dragging, settling, move]);

  useEffect(() => {
    if (!settling) return;
    const timer = window.setTimeout(finishMove, 600);
    return () => window.clearTimeout(timer);
  }, [settling, finishMove]);

  const direction = offset < 0 ? 1 : -1;

  return (
    <section
      className="home-banner relative overflow-hidden border-b border-[#e5e7eb] bg-[#0c1929]"
      aria-label={zh ? "首页焦点" : "Featured stories"}
    >
      <div
        ref={viewport}
        className={`relative min-h-[620px] touch-pan-y select-none overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={() => { gesture.current = null; setDragging(false); resetDrag(); }}
        onLostPointerCapture={() => { if (gesture.current) { gesture.current = null; setDragging(false); resetDrag(); } }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => { if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}
      >
        <div
          className="home-banner-track relative min-h-[620px]"
          data-settling={settling ? "true" : "false"}
          style={{ transform: `translate3d(${offset}px, 0, 0)` }}
          onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === "transform") finishMove(); }}
        >
          {[-1, 0, 1].map((position) => {
            const index = position === 0 ? active : (destination !== null && destination !== active && direction === position ? destination : wrap(active + position));
            const slide = slides[index];
            const cinematic = index === 0;
            const headingClass = `text-[clamp(40px,4.1vw,60px)] font-semibold leading-[1.13] tracking-[-0.045em] ${cinematic ? "text-white" : "text-[#17212b]"}`;
            return <div key={position} className={`absolute inset-0 ${cinematic ? "home-banner-cinematic" : "home-banner-light"}`} style={{ transform: `translateX(${position * 100}%)` }} aria-hidden={position !== 0} inert={position !== 0}>
              <div className="home-banner-art" style={{ backgroundImage: `url('${slide.image}')` }} aria-hidden="true" />
              <div className="home-banner-shade" aria-hidden="true" />
              <div className="relative mx-auto flex min-h-[620px] max-w-[1280px] flex-col justify-start px-6 pb-20 pt-14 sm:justify-center sm:px-10 lg:px-12">
                <div className="max-w-[510px]" aria-live={position === 0 && !autoPlay ? "polite" : "off"}>
                  {slide.tag && <p className={`mb-6 text-[13px] font-semibold tracking-[0.08em] ${cinematic ? "text-[#ff9852]" : "text-[#af1728]"}`}>{slide.tag}</p>}
                  {position === 0 ? <h1 className={headingClass}>{slide.title}</h1> : <p className={headingClass}>{slide.title}</p>}
                  {slide.text && <p className={`mt-6 max-w-[480px] text-[16px] leading-7 sm:text-[17px] ${cinematic ? "text-white/80" : "text-[#53606a]"}`}>{slide.text}</p>}
                  <a href={slide.href.startsWith("https://") ? slide.href : siteHref(lang, slide.href)} tabIndex={position === 0 ? undefined : -1} className={`action-link mt-9 inline-flex min-h-12 cursor-pointer items-center px-6 text-[14px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 ${cinematic ? "bg-[#c92b2f] hover:bg-[#e43b3f] focus-visible:outline-white" : "bg-[#17212b] hover:bg-[#af1728] focus-visible:outline-[#af1728]"}`}>
                    {slide.cta}<span className="ml-5 text-lg" aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
        <div className={`flex items-center gap-1 rounded-full px-2 py-1 shadow-sm backdrop-blur-sm ${active === 0 ? "bg-[#0c1929]/70" : "bg-white/80"}`}>
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={zh ? `查看第 ${index + 1} 张：${item.tag || item.title}` : `View slide ${index + 1}: ${item.tag || item.title}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => { if (index !== active) move(index === wrap(active + 1) ? 1 : -1, index); }}
              className="group grid h-7 w-7 place-items-center rounded-full"
            ><span className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${index === active ? active === 0 ? "scale-110 bg-[#ff9852]" : "scale-110 bg-[#af1728]" : active === 0 ? "bg-white/55 group-hover:bg-white" : "bg-[#65717a]/45 group-hover:bg-[#65717a]"}`} /></button>
          ))}
        </div>
      </div>
    </section>
  );
}
