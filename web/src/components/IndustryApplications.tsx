"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

type Industry = "automation" | "energy" | "rail";
type Copy = { title: string; text: string; checks: string[]; product: string };
type Point = { x: number; y: number; image: string; href: string; zh: Copy; en: Copy };
const INDUSTRY_ENTRIES = [{ id: "automation", zh: "工业自动化", en: "Automation" }, { id: "energy", zh: "新能源", en: "New energy" }, { id: "rail", zh: "轨道交通", en: "Rail transit" }] as const;

const POINTS: Record<Industry, Point[]> = {
  automation: [
    { x: 28, y: 58, image: "/images/marketing/home-product-1.png", href: "/product/category/terminal-blocks", zh: { title: "控制柜接线", text: "从控制信号到电力分配，让柜内回路有序连接，也为后续维护留出空间。", checks: ["安装空间与导轨布局", "导线截面积与接线方式", "标识与维护可达性"], product: "接线端子" }, en: { title: "Cabinet wiring", text: "Organize control signals and power distribution while leaving room for service and maintenance.", checks: ["Space and DIN-rail layout", "Wire size and wiring method", "Identification and service access"], product: "Terminal blocks" } },
    { x: 61, y: 37, image: "/images/marketing/circular-connectors.jpg", href: "/product/category/circular-connectors", zh: { title: "传感器与执行器", text: "将设备状态与控制指令传递到现场，围绕接口、线缆和防护要求完成选型。", checks: ["接口规格与编码方式", "安装位置与出线方向", "防护等级与线缆条件"], product: "圆形连接器" }, en: { title: "Sensors and actuators", text: "Connect field signals and control commands around the interface, cabling and protection needs.", checks: ["Interface size and coding", "Mounting and cable orientation", "Protection and cabling conditions"], product: "Circular connectors" } },
    { x: 79, y: 72, image: "/images/marketing/home-banner-heavy-duty.jpg", href: "/services#service-explorer", zh: { title: "设备模块接口", text: "面向需要拆装与维护的设备单元，考虑电力、信号与机械接口的组合。", checks: ["电力与信号回路配置", "插拔频次与操作空间", "壳体安装与锁紧方式"], product: "重载连接器" }, en: { title: "Machine modules", text: "Consider power, signal and mechanical interfaces for equipment units that need to be disconnected and serviced.", checks: ["Power and signal circuit layout", "Mating cycles and access", "Housing mounting and locking"], product: "Heavy-duty connectors" } },
  ],
  energy: [
    { x: 22, y: 58, image: "/images/marketing/home-banner-energy.jpg", href: "/services#service-explorer", zh: { title: "发电侧连接", text: "在户外安装环境中，结合电气条件、布线路径与运维方式确认连接要求。", checks: ["直流电压与额定电流", "户外环境与耐候要求", "安装与检修操作方式"], product: "能源连接产品" }, en: { title: "Generation connections", text: "Plan outdoor connections around electrical ratings, cable routing and service needs.", checks: ["DC voltage and rated current", "Outdoor exposure and weathering", "Installation and maintenance"], product: "Energy connection products" } },
    { x: 53, y: 72, image: "/images/marketing/home-banner-energy.jpg", href: "/services#service-explorer", zh: { title: "储能系统接口", text: "围绕电池、功率转换与系统布线，梳理功率和信号连接的不同需求。", checks: ["系统电流与温升条件", "插接防错与接触防护", "功率与通讯接口布局"], product: "储能连接器" }, en: { title: "Storage interfaces", text: "Separate power and signal needs across batteries, power conversion and system wiring.", checks: ["Current and temperature conditions", "Mating and contact protection", "Power and communication layout"], product: "Energy storage connectors" } },
    { x: 81, y: 48, image: "/images/marketing/home-push.jpg", href: "/product/category/terminal-blocks", zh: { title: "设备内部配线", text: "在控制与配电单元内，用紧凑、易识别的连接方式组织系统回路。", checks: ["空间与散热条件", "接线方式与导线规格", "回路标识与维护效率"], product: "设备接线端子" }, en: { title: "Internal equipment wiring", text: "Organize circuits inside control and power distribution units with compact, identifiable connections.", checks: ["Space and thermal conditions", "Connection method and wire size", "Circuit identification and service"], product: "Equipment terminal blocks" } },
  ],
  rail: [
    { x: 24, y: 54, image: "/images/marketing/home-product-1.png", href: "/product/category/terminal-blocks", zh: { title: "车载控制系统", text: "从控制与配电回路出发，关注紧凑安装、抗振需求和长期维护条件。", checks: ["振动与安装固定方式", "导线规格与接线空间", "应用标准与材料要求"], product: "接线端子" }, en: { title: "Onboard control", text: "Consider compact mounting, vibration and long-term service when connecting control and distribution circuits.", checks: ["Vibration and mounting method", "Wire size and wiring space", "Application standards and materials"], product: "Terminal blocks" } },
    { x: 53, y: 40, image: "/images/marketing/home-banner-heavy-duty.jpg", href: "/services#service-explorer", zh: { title: "设备间连接", text: "为分布式设备的安装与检修规划接口，兼顾防护、锁紧和维护便利性。", checks: ["接口组合与额定参数", "锁紧、防护与操作空间", "线缆布置与检修路径"], product: "重载连接器" }, en: { title: "Equipment interconnection", text: "Plan interfaces between distributed units around protection, locking and service access.", checks: ["Interface layout and ratings", "Locking, protection and access", "Cable routing and maintenance"], product: "Heavy-duty connectors" } },
    { x: 79, y: 68, image: "/images/marketing/circular-connectors.jpg", href: "/product/category/circular-connectors", zh: { title: "轨旁与信号设备", text: "按设备端的信号接口与现场环境确认连接形式，为调试和维护提供清晰路径。", checks: ["信号接口与编码", "现场防护与安装环境", "接线方向与线缆长度"], product: "圆形连接器" }, en: { title: "Trackside and signal equipment", text: "Match the signal interface and site environment, with a clear path for commissioning and service.", checks: ["Signal interface and coding", "Site protection and mounting", "Cable orientation and length"], product: "Circular connectors" } },
  ],
};

export function IndustryNavigation({ lang }: { lang: Lang }) {
  const [current, setCurrent] = useState<Industry | "guide">("automation");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const visible = INDUSTRY_ENTRIES.map(item => ({ id: item.id, top: document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity })).filter(item => item.top <= window.innerHeight * 0.45);
      const guideTop = document.getElementById("connection-guide")?.getBoundingClientRect().top ?? Infinity;
      if (guideTop <= window.innerHeight * 0.45) setCurrent("guide");
      else if (visible.length) setCurrent(visible[visible.length - 1].id);
      else setCurrent("automation");
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  return <div className="sticky top-[112px] z-20 border-y border-[#dce1e5] bg-white/95 backdrop-blur-md md:top-16">
    <nav className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-6 sm:px-10 lg:px-12" aria-label={lang === "zh" ? "行业导航" : "Industry navigation"}>
      <div className="flex gap-5 sm:gap-10">{INDUSTRY_ENTRIES.map(item => <a key={item.id} href={`#${item.id}`} onClick={() => setCurrent(item.id)} aria-current={current === item.id ? "location" : undefined} className="industry-nav-link relative whitespace-nowrap py-5 text-[13px] font-semibold text-[#53606a] sm:text-sm">{lang === "zh" ? item.zh : item.en}</a>)}</div>
      <a href="#connection-guide" aria-current={current === "guide" ? "location" : undefined} className="industry-nav-link motion-arrow relative hidden self-stretch items-center text-[13px] font-semibold text-[#af1728] sm:inline-flex">{lang === "zh" ? "连接需求速览" : "Connection guide"}<span className="ml-3" aria-hidden="true">↘</span></a>
    </nav>
  </div>;
}

export default function IndustryApplications({ industry, lang, image, name }: { industry: Industry; lang: Lang; image: string; name: string }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const points = POINTS[industry];
  const selected = points[active];
  const zh = lang === "zh";
  const copy = zh ? selected.zh : selected.en;
  useEffect(() => {
    const root = scene.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return <div ref={scene} id={`${industry}-application`} data-in-view={inView} className="industry-scene mt-10 scroll-mt-44 border border-[#dce1e5] bg-white md:scroll-mt-32">
    <div className="grid lg:grid-cols-[1.55fr_1fr]">
      <div className="relative min-w-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#dce1e5] lg:h-full lg:min-h-[520px] lg:aspect-auto">
          <ProductImage src={image} alt={name} sizes="(min-width:1280px) 720px, (min-width:1024px) 60vw, 100vw" className="object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101820]/50 via-transparent to-transparent" />
          <svg key={active} viewBox="0 0 100 100" preserveAspectRatio="none" className="industry-point-connector pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true"><path d={`M ${selected.x} ${selected.y} H ${Math.min(91, selected.x + 8)} V 50 H 100`} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
          {points.map((point, index) => <button key={index} type="button" aria-label={`${zh ? "查看" : "View"}${zh ? point.zh.title : ` ${point.en.title}`}`} aria-pressed={active === index} onClick={() => { setActive(index); tabRefs.current[index]?.focus({ preventScroll: true }); }} className="industry-hotspot absolute inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white/65 bg-[#17212b]/75 text-[12px] font-semibold text-white shadow-lg backdrop-blur-sm" style={{ left: `${point.x}%`, top: `${point.y}%` }}><span aria-hidden="true">0{index + 1}</span></button>)}
          <p className="absolute bottom-5 left-5 right-5 text-[11px] leading-5 text-white/90 sm:bottom-6 sm:left-7">{zh ? "场景应用示意 · 点击连接点，查看选型方向" : "Application overview · Select a point to explore"}</p>
        </div>
      </div>
      <div className="min-w-0 bg-[#f7f8f9] p-6 sm:p-8 lg:p-9">
        <div className="mb-6 flex items-center justify-between border-b border-[#dce1e5] pb-4"><span className="text-[12px] font-semibold text-[#af1728]">{zh ? "应用连接点" : "Connection point"}</span><span className="text-[12px] tabular-nums text-[#89939b]">0{active + 1} / 03</span></div>
        <div id={`${industry}-panel`} role="tabpanel" aria-labelledby={`${industry}-point-${active}`} tabIndex={0} className="min-h-[390px]">
          <div key={active} className="industry-point-detail">
            <h3 className="text-[clamp(25px,2.6vw,35px)] font-semibold leading-tight tracking-[-0.03em]">{copy.title}</h3>
            <p className="mt-4 text-[14px] leading-7 text-[#53606a]">{copy.text}</p>
            <p className="mt-6 text-[12px] font-semibold text-[#af1728]">{zh ? "选型时关注" : "Selection considerations"}</p>
            <ul className="mt-3 space-y-2">{copy.checks.map(check => <li key={check} className="flex gap-3 text-[13px] leading-6 text-[#53606a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#af1728]" aria-hidden="true" />{check}</li>)}</ul>
            <Link href={siteHref(lang, selected.href)} className="industry-product-link group mt-7 flex items-center gap-5 border-t border-[#dce1e5] pt-5">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden bg-white"><ProductImage key={selected.image} src={selected.image} alt={copy.product} sizes="240px" className="object-contain p-1" /></div>
              <span><span className="block text-[11px] text-[#89939b]">{zh ? "相关产品方向" : "Related product family"}</span><span className="mt-1 block text-[15px] font-semibold group-hover:text-[#af1728]">{copy.product}</span></span><span className="ml-auto text-xl text-[#af1728]" aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <div role="tablist" aria-label={zh ? `${name}连接点` : `${name} connection points`} className="grid grid-cols-3 border-t border-[#dce1e5]">{points.map((point, index) => <button key={index} ref={node => { tabRefs.current[index] = node; }} id={`${industry}-point-${index}`} type="button" role="tab" aria-label={zh ? point.zh.title : point.en.title} aria-selected={active === index} aria-controls={`${industry}-panel`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
      const next = event.key === "ArrowRight" ? (index + 1) % points.length : event.key === "ArrowLeft" ? (index + points.length - 1) % points.length : event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : null;
      if (next !== null) { event.preventDefault(); setActive(next); tabRefs.current[next]?.focus(); }
    }} className="industry-point-label relative min-h-16 border-r border-[#dce1e5] px-2 py-4 text-[12px] font-medium last:border-r-0 sm:px-5 sm:text-sm"><span className="mr-2 text-[10px] tabular-nums text-[#89939b] sm:mr-3">0{index + 1}</span>{zh ? point.zh.title : point.en.title}</button>)}</div>
  </div>;
}

export function IndustryQuestions({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const questions = zh ? [
    ["能否直接按行业选择一个通用型号？", "行业场景适合用来确定产品方向，具体型号仍需要结合电流、电压、安装方式、环境和认证要求确认。建议准备应用条件，再与工程团队核对。"],
    ["一个系统中可以组合不同类型的连接产品吗？", "可以按安装位置划分需求，例如柜内接线、设备接口和现场信号连接。分别确认各连接点的参数与接口，再检查整个系统的兼容性和维护方式。"],
    ["讨论方案前，需要准备哪些资料？", "应用或系统示意图、关键电气参数、安装尺寸、使用环境，以及现有产品或接口信息。如果涉及专用标准或认证，也请在需求阶段说明。"],
  ] : [
    ["Can I choose one universal model for an industry?", "An industry application helps identify the product family. The specific model still depends on electrical ratings, installation, environment and certification needs. Share the requirements for an engineering review."],
    ["Can different connection families be combined in one system?", "Divide the needs by installation point, such as cabinet wiring, equipment interfaces and field signals. Confirm each point, then check compatibility and maintenance across the system."],
    ["What should I prepare for a solution discussion?", "Bring an application or system diagram, key electrical ratings, mounting dimensions, environment and existing interface details. Include any application-specific standards or certification needs."],
  ];
  return <section className="border-t border-[#dce1e5] bg-[#f5f6f7]"><div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-12 lg:py-24"><div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "方案沟通" : "Solution discussions"}</p><h2 className="mt-4 text-[clamp(30px,3vw,44px)] font-semibold leading-tight tracking-[-0.03em]">{zh ? "让需求更清楚，\n让沟通更有效。" : "Clearer requirements. Better conversations."}</h2><p className="mt-5 text-[14px] leading-7 text-[#68747e]">{zh ? "选型之前，先确认这些关键问题。" : "A few questions to clarify before selecting a product."}</p></div><div className="border-t border-[#cbd2d7]">{questions.map(([question, answer]) => <details key={question} className="industry-question border-b border-[#cbd2d7]"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-[16px] font-semibold"><span>{question}</span><span className="industry-question-symbol shrink-0 text-xl font-normal text-[#af1728]" aria-hidden="true">+</span></summary><p className="industry-point-detail max-w-[660px] pb-6 pr-6 text-[14px] leading-7 text-[#53606a]">{answer}</p></details>)}</div></div></section>;
}
