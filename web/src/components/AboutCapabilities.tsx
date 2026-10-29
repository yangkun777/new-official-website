"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import ProductImage from "@/components/ProductImage";
import ScrollReveal from "@/components/ScrollReveal";
import type { Lang } from "@/lib/lang";

const CAPABILITIES = [
  { id: "design", image: "/images/marketing/hero-services.jpg", zh: { name: "设计与研发", title: "从应用条件开始，\n推敲连接的每个细节。", text: "电气参数、结构尺寸、接线方式与操作空间，共同决定一个连接方案。把这些条件放在设计之初，才能让产品与设备更好地配合。", tags: ["电气接口", "结构配合", "安装体验"], caption: "让需求成为清晰的设计依据", steps: ["理解应用", "定义接口", "确认结构"] }, en: { name: "Design & development", title: "Every connection begins with its application.", text: "Electrical ratings, dimensions, wiring methods and access all shape a connection. Bringing them into the design early helps the product fit the equipment.", tags: ["Electrical interface", "Mechanical fit", "Installation"], caption: "Turn requirements into design decisions", steps: ["Understand", "Define", "Refine"] } },
  { id: "manufacturing", image: "/images/marketing/hero-about.jpg", zh: { name: "制造与装配", title: "从零件到成品，\n关注每一处配合。", text: "连接产品需要让导电件、绝缘件与操作结构协同工作。从零件加工到成品装配，持续关注结构一致性和实际使用中的配合关系。", tags: ["零件加工", "装配配合", "过程确认"], caption: "把设计细节带入制造过程", steps: ["零件成型", "组件装配", "成品确认"] }, en: { name: "Manufacturing & assembly", title: "From individual parts to a working connection.", text: "Conductive parts, insulation and operating mechanisms need to work together. Manufacturing and assembly bring attention to consistency and mechanical fit.", tags: ["Component production", "Assembly", "Process checks"], caption: "Carry design detail through production", steps: ["Form", "Assemble", "Check"] } },
  { id: "application", image: "/images/marketing/push-snap-video-poster.jpg", zh: { name: "验证与应用", title: "回到真实操作，\n确认连接是否合适。", text: "不仅看参数，也看导线如何进入、部件如何锁定、维护如何进行。结合具体型号的资料与应用条件，逐项确认连接的适用范围。", tags: ["接线操作", "安装确认", "资料核对"], caption: "把连接放回设备与现场中考虑", steps: ["核对资料", "验证安装", "确认应用"] }, en: { name: "Verification & application", title: "Bring the connection back to real operation.", text: "Look beyond ratings to how wires enter, parts lock and maintenance happens. Check the documentation and application conditions for the specific model.", tags: ["Wiring", "Installation", "Documentation"], caption: "Consider the connection in its equipment", steps: ["Review", "Try the fit", "Confirm"] } },
] as const;

export default function AboutCapabilities({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const item = CAPABILITIES[active];
  const copy = item[lang];
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % CAPABILITIES.length;
    else if (event.key === "ArrowLeft") next = (index + 2) % CAPABILITIES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = CAPABILITIES.length - 1;
    else return;
    event.preventDefault(); setActive(next); tabs.current[next]?.focus();
  }
  return <section id="capabilities" className="scroll-mt-32 bg-[#f5f6f7]">
    <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
      <ScrollReveal direction="left" className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "连接背后的工作" : "Behind every connection"}</p><h2 className="mt-4 max-w-[15em] text-[clamp(32px,3.4vw,50px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "从一个想法，到现场的一次连接。" : "From an idea to a connection in the field."}</h2></div><p className="max-w-[390px] text-[15px] leading-7 text-[#68747e]">{zh ? "沿着设计、制造与应用的路径，了解一款工业连接产品需要考虑什么。" : "Follow the path through design, manufacturing and application to see what an industrial connection involves."}</p></ScrollReveal>
      <div role="tablist" aria-label={zh ? "连接能力" : "Connectivity capabilities"} className="grid grid-cols-3 border-b border-[#ccd3d8]">{CAPABILITIES.map((stage, index) => <button key={stage.id} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`capability-${stage.id}`} aria-controls="capability-panel" aria-selected={index === active} tabIndex={index === active ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => move(event, index)} className="capability-tab relative flex items-center justify-between gap-2 px-2 py-5 text-left text-sm font-semibold sm:px-6 sm:text-lg"><span>{stage[lang].name}</span><span aria-hidden="true" className="hidden sm:block">↗</span></button>)}</div>
      <div id="capability-panel" role="tabpanel" aria-labelledby={`capability-${item.id}`} tabIndex={0} className="bg-white"><div key={item.id} className="capability-content grid lg:grid-cols-[1.08fr_0.92fr]">
        <figure className="relative min-w-0"><div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[420px]"><ProductImage src={item.image} alt={copy.name} sizes="(min-width:1024px) 640px, 100vw" className={active === 2 ? "object-contain" : "object-cover"} /></div><figcaption className="absolute bottom-0 left-0 bg-[#17212b] px-5 py-3 text-xs text-white">{copy.caption}</figcaption></figure>
        <div className="flex flex-col justify-center px-6 py-10 sm:p-10 lg:p-12"><h3 className="text-[clamp(26px,2.6vw,38px)] font-semibold leading-[1.3] tracking-[-0.025em]">{copy.title}</h3><p className="mt-6 text-[15px] leading-8 text-[#53606a]">{copy.text}</p><div className="mt-7 flex flex-wrap gap-2">{copy.tags.map(tag => <span key={tag} className="border border-[#dce1e5] px-3 py-2 text-xs text-[#53606a]">{tag}</span>)}</div><ol className="capability-flow mt-10 grid grid-cols-3 border-t border-[#dce1e5]">{copy.steps.map((step, index) => <li key={step} className="relative pr-2 pt-5"><span aria-hidden="true" className="absolute -top-[4px] left-0 h-[7px] w-[7px] rounded-full bg-[#af1728]" /><span className="text-[11px] text-[#87919a]">0{index + 1}</span><span className="mt-2 block text-xs font-medium sm:text-sm">{step}</span></li>)}</ol></div>
      </div></div>
    </div>
  </section>;
}
