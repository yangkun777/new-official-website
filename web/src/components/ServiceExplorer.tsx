"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import ProductImage from "@/components/ProductImage";
import ScrollReveal from "@/components/ScrollReveal";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";
import { FAQ_ITEMS } from "@/lib/faqDemo";

const SERVICES = [
  {
    id: "selection", image: "/images/marketing/circular-connectors.jpg", href: "/product/category/circular-connectors",
    zh: { label: "产品选型", hint: "从工况到具体型号", title: "先明确工况，再找到合适的连接。", text: "把安装位置、电气条件和维护方式放在一起考虑，让每一次选型都有清晰的起点。", checks: ["额定电压、电流与导线截面积", "安装空间、间距与接线方式", "温度、振动与防护要求"], action: "探索连接产品", caption: "圆形连接器 · 设备端与现场接口" },
    en: { label: "Product selection", hint: "From requirements to products", title: "The right connection starts with the application.", text: "Consider the installation, electrical ratings and maintenance needs together to build a clear starting point for selection.", checks: ["Rated voltage, current and wire size", "Space, pitch and wiring method", "Temperature, vibration and protection"], action: "Explore connection products", caption: "Circular connectors · Device and field interfaces" },
  },
  {
    id: "documents", image: "/images/marketing/hero-services.jpg", href: "/product/category/terminal-blocks",
    zh: { label: "技术资料", hint: "让设计依据更完整", title: "从订货号出发，把设计细节确认清楚。", text: "按系列和订货号找到对应产品，进一步确认尺寸、规格、认证与可用文件，让资料与具体选型保持一致。", checks: ["产品规格与关键尺寸", "可用图纸与三维模型", "对应认证与安装资料"], action: "进入产品目录", caption: "工程资料 · 为设计与选型提供依据" },
    en: { label: "Technical documents", hint: "A stronger basis for design", title: "Use the order number to confirm the details.", text: "Start with a series and order number, then check dimensions, specifications, certifications and the files available for that product.", checks: ["Specifications and key dimensions", "Available drawings and 3D models", "Applicable certifications and installation material"], action: "Open the product catalog", caption: "Engineering documents · Support for design decisions" },
  },
  {
    id: "custom", image: "/images/marketing/home-banner-heavy-duty.jpg", href: "/solutions",
    zh: { label: "定制支持", hint: "围绕应用一起讨论", title: "标准产品之外，从你的应用继续向前。", text: "当接口、结构或安装条件有特殊要求，准备应用说明和关键尺寸，帮助工程团队更快理解你的连接需求。", checks: ["使用场景与现有连接方案", "接口、外形与安装尺寸", "预期数量与项目阶段"], action: "查看应用方案", caption: "重载连接器 · 面向复杂安装条件" },
    en: { label: "Custom support", hint: "Built around your application", title: "Take the next step when standard needs more.", text: "If the interface, form or installation needs something specific, share the application and key dimensions to start a focused engineering discussion.", checks: ["Application and current connection design", "Interface, housing and installation dimensions", "Expected quantity and project stage"], action: "Explore application solutions", caption: "Heavy-duty connectors · Demanding installations" },
  },
] as const;

const FAQS = ["start", "matching-files", "custom-request", "certification"].map(id => FAQ_ITEMS.find(item => item.id === id)!);

export default function ServiceExplorer({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const item = SERVICES[active];
  const copy = zh ? item.zh : item.en;

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % SERVICES.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + SERVICES.length - 1) % SERVICES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SERVICES.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return <>
    <section id="service-explorer" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
        <ScrollReveal direction="left" className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "工程支持" : "Engineering support"}</p><h2 className="mt-4 text-[clamp(32px,3.2vw,48px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "你需要的支持，从这里开始。" : "The support you need starts here."}</h2></div>
          <p className="max-w-[340px] text-[14px] leading-7 text-[#68747e]">{zh ? "选择当前任务，找到下一步需要确认的内容。" : "Choose your task and find out what to confirm next."}</p>
        </ScrollReveal>
        <div className="grid border-y border-[#dce1e5] lg:grid-cols-[0.62fr_1.38fr]">
          <div role="tablist" aria-label={zh ? "支持类型" : "Support type"} className="grid grid-cols-3 lg:flex lg:flex-col lg:border-r lg:border-[#dce1e5]">
            {SERVICES.map((service, index) => {
              const label = zh ? service.zh : service.en;
              return <button key={service.id} ref={node => { tabRefs.current[index] = node; }} type="button" role="tab" id={`service-tab-${service.id}`} aria-controls="service-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => moveTab(event, index)} className="service-tab relative flex min-h-20 items-center justify-between gap-3 border-b border-[#dce1e5] px-3 py-5 text-left sm:px-5 lg:min-h-32 lg:px-8">
                <span><span className="block text-[15px] font-semibold sm:text-lg lg:text-[22px]">{label.label}</span><span className="mt-2 hidden text-[13px] text-[#68747e] lg:block">{label.hint}</span></span><span className="service-tab-arrow hidden text-xl sm:block" aria-hidden="true">↗</span>
              </button>;
            })}
          </div>
          <div id="service-panel" role="tabpanel" aria-labelledby={`service-tab-${item.id}`} tabIndex={0} className="min-w-0 bg-[#f6f7f8] p-6 sm:p-9 lg:p-10">
            <div key={item.id} className="service-content grid items-center gap-7 sm:grid-cols-[1.1fr_0.9fr] sm:gap-9">
              <div><h3 className="max-w-[16em] text-[clamp(25px,2.5vw,36px)] font-semibold leading-[1.25] tracking-[-0.03em]">{copy.title}</h3><p className="mt-5 text-[14px] leading-7 text-[#53606a]">{copy.text}</p>
                <ul className="mt-6 space-y-3">{copy.checks.map(check => <li key={check} className="flex items-start gap-3 text-[13px] leading-6 text-[#53606a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#af1728]" aria-hidden="true" />{check}</li>)}</ul>
                <Link href={siteHref(lang, item.href)} className="motion-arrow mt-7 inline-flex items-center border-b-2 border-[#af1728] pb-2 text-[13px] font-semibold hover:text-[#af1728]">{copy.action}<span className="ml-4" aria-hidden="true">↗</span></Link>
              </div>
              <figure><div className="relative aspect-square overflow-hidden bg-white"><ProductImage key={item.image} src={item.image} alt={copy.caption} sizes="(min-width:1024px) 780px, (min-width:640px) 95vw, 200vw" className="object-cover" /></div><figcaption className="mt-4 text-[11px] leading-5 text-[#68747e]">{copy.caption}</figcaption></figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>;
}

export function ServiceQuestions({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <section id="service-faq" className="scroll-mt-24 border-y border-[#dce1e5] bg-[#f5f6f7]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20 lg:px-12 lg:py-24">
        <ScrollReveal direction="left"><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "常见问题" : "Common questions"}</p><h2 className="mt-4 text-[clamp(32px,3.2vw,46px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? <><span className="block">选型之前，</span><span className="block">你可能想了解。</span></> : "A clearer starting point."}</h2><p className="mt-6 max-w-[320px] text-[14px] leading-7 text-[#68747e]">{zh ? "从选型到资料确认，一些经常遇到的问题。" : "A few useful answers, from selection to documentation."}</p><a href={siteHref(lang, "/services/faq")} className="motion-arrow mt-6 inline-flex border-b-2 border-[#af1728] pb-2 text-[13px] font-semibold">{zh ? "查看全部常见问题" : "Explore all questions"}<span className="ml-4" aria-hidden="true">↗</span></a></ScrollReveal>
        <div className="border-t border-[#cbd2d7]">{FAQS.map((faq, index) => {
          const [question, answer] = zh ? faq.zh : faq.en;
          const expanded = openFaq === index;
          return <article key={question} className="service-faq-item border-b border-[#cbd2d7]" data-open={expanded}>
            <h3><button id={`faq-button-${index}`} type="button" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(expanded ? null : index)} className="flex w-full items-center justify-between gap-6 py-6 text-left text-[16px] font-semibold leading-7 hover:text-[#af1728] sm:text-[18px]">{question}<span className="service-faq-plus relative h-5 w-5 shrink-0" aria-hidden="true" /></button></h3>
            <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-button-${index}`} aria-hidden={!expanded} className="service-faq-answer"><div className="overflow-hidden"><p className="max-w-[650px] pb-6 pr-8 text-[14px] leading-7 text-[#53606a]">{answer}</p></div></div>
          </article>;
        })}</div>
      </div>
    </section>
  );
}
