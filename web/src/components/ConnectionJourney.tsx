"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import ProductImage from "@/components/ProductImage";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const STEPS = [
  {
    code: "01", image: "/images/marketing/home-product-1.png",
    zh: { title: "控制与 I/O", detail: "让控制信号清晰进入系统，为自动化设备建立可靠起点。", tags: ["PLC", "I/O", "信号"] },
    en: { title: "Control & I/O", detail: "Bring control signals into the system with a clear, reliable starting point.", tags: ["PLC", "I/O", "Signal"] },
  },
  {
    code: "02", image: "/images/marketing/home-push.jpg",
    zh: { title: "配电与接线", detail: "以紧凑、易维护的连接方式组织柜内电力与信号回路。", tags: ["端子", "PCB", "配电"] },
    en: { title: "Wiring & distribution", detail: "Organize power and signal circuits with compact, serviceable connections.", tags: ["Terminal", "PCB", "Power"] },
  },
  {
    code: "03", image: "/images/marketing/circular-connectors.jpg",
    zh: { title: "设备接口", detail: "把信号、数据与电力稳定带到设备端和复杂环境中。", tags: ["圆形", "重载", "防护"] },
    en: { title: "Device interface", detail: "Carry signal, data and power reliably to devices in demanding environments.", tags: ["Circular", "Heavy-duty", "Protected"] },
  },
  {
    code: "04", image: "/images/marketing/feature-automation.jpg",
    zh: { title: "现场应用", detail: "在自动化、新能源与轨道交通场景中完成整条连接链路。", tags: ["自动化", "新能源", "交通"] },
    en: { title: "Field application", detail: "Complete the connection path across automation, energy and transportation.", tags: ["Automation", "Energy", "Mobility"] },
  },
] as const;

export default function ConnectionJourney({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || hovering || focused || !pageVisible) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % STEPS.length), 4200);
    return () => window.clearInterval(timer);
  }, [running, hovering, focused, pageVisible, active]);

  const step = STEPS[active];
  const copy = zh ? step.zh : step.en;
  const style = { "--journey-progress": `${(active / (STEPS.length - 1)) * 100}%` } as CSSProperties;

  return (
    <section id="connection-journey" ref={rootRef} className="connection-journey scroll-mt-20 overflow-hidden bg-[#101820] text-white" data-running={running && !hovering && !focused && pageVisible} aria-label={zh ? "连接能力全景" : "Connection journey"}>
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.06em] text-[#ef8c98]">{zh ? "连接能力全景" : "CONNECTION JOURNEY"}</p>
            <h2 className="mt-5 max-w-[10em] text-[clamp(34px,4vw,58px)] font-semibold leading-[1.08] tracking-[-0.045em]">
              {zh ? "从控制柜，到每一个现场。" : "From the cabinet to every field device."}
            </h2>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-[620px] text-[16px] leading-8 text-white/62">
              {zh ? "一条连接链路，同时承载信号、数据与电力。选择不同节点，查看高松产品如何进入完整工业系统。" : "One connection path carries signal, data and power. Explore how DEGSON products fit into a complete industrial system."}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-[12px] font-semibold tracking-[0.08em] text-white/42">
              <span>SIGNAL</span><span>DATA</span><span>POWER</span>
            </div>
          </div>
        </div>

        <div className="mt-12 border border-white/12 bg-white/[0.035] p-5 sm:p-8 lg:mt-16 lg:p-10" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
          <div className="journey-track relative grid grid-cols-2 gap-3 md:grid-cols-4" style={style}>
            <span className="journey-line" aria-hidden="true"><span className="journey-line-progress" /></span>
            {STEPS.map((item, index) => {
              const itemCopy = zh ? item.zh : item.en;
              const selected = index === active;
              return (
                <button
                  key={item.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(index)}
                  onPointerEnter={() => setActive(index)}
                  className="journey-step group relative z-10 min-w-0 p-4 text-left sm:p-5"
                >
                  <span className="journey-node inline-flex h-12 w-12 items-center justify-center border border-white/25 bg-[#101820] text-[12px] font-semibold tabular-nums text-white/60 group-hover:border-[#ef6675]" aria-hidden="true">{item.code}</span>
                  <span className="mt-4 block text-[16px] font-semibold tracking-[-0.02em] text-white md:mt-7 md:text-[18px]">{itemCopy.title}</span>
                  <span className="mt-2 block text-[12px] text-white/38">{itemCopy.tags.join(" · ")}</span>
                </button>
              );
            })}
          </div>

          <div key={step.code} className="journey-detail mt-6 grid gap-8 border-t border-white/12 pt-8 sm:grid-cols-[0.72fr_1.28fr] sm:items-center lg:gap-12">
            <div className="relative aspect-[16/9] overflow-hidden bg-white"><ProductImage key={step.image} src={step.image} alt={copy.title} sizes="(min-width:1024px) 380px, (min-width:640px) 35vw, 85vw" className={active === 3 ? "object-cover" : "object-contain p-4"} /></div>
            <div>
              <span className="text-[12px] font-semibold tracking-[0.12em] text-[#ef8c98]">STEP {step.code}</span>
              <h3 className="mt-3 text-[clamp(25px,2.8vw,38px)] font-semibold tracking-[-0.035em]">{copy.title}</h3>
              <p className="mt-3 max-w-[650px] text-[15px] leading-7 text-white/58">{copy.detail}</p>
            <Link href={siteHref(lang, "/solutions")} className="motion-arrow mt-6 inline-flex w-fit border-b border-[#ef6675] pb-2 text-[13px] font-semibold text-white hover:text-[#ef8c98]">
              {zh ? "查看应用方案" : "Explore solutions"}<span className="ml-2" aria-hidden="true">↗</span>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
