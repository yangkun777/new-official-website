"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import ScrollReveal from "@/components/ScrollReveal";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const FAMILIES = [
  { zh: "接线端子", en: "Terminal blocks", image: "/images/marketing/home-push.jpg", href: "/product/category/terminal-blocks" },
  { zh: "圆形连接器", en: "Circular connectors", image: "/images/marketing/circular-connectors.jpg", href: "/product/category/circular-connectors" },
  { zh: "重载连接器", en: "Heavy-duty connectors", image: "/images/marketing/home-banner-heavy-duty.jpg", href: "/services#service-explorer" },
  { zh: "能源连接器", en: "Energy connectors", image: "/images/marketing/home-banner-energy.jpg", href: "/services#service-explorer" },
] as const;

const NEEDS = [
  { family: 0, related: [2], zh: { title: "控制柜与设备接线", detail: "从柜内回路开始，优先了解接线端子的布局、接线方式与标识；设备需要整体拆装时，再考虑模块接口的组合。", checks: ["导线截面积", "接线间距与布局", "检修与标识"] }, en: { title: "Cabinet and equipment wiring", detail: "Start with terminal block layout, connection method and identification. Consider modular interfaces where equipment units need to be disconnected as a whole.", checks: ["Wire size", "Pitch and layout", "Service and identification"] } },
  { family: 1, related: [0], zh: { title: "传感器与现场信号", detail: "从设备端接口出发，关注编码、针位、线缆和安装方向，让现场信号连接与柜内接线形成清晰路径。", checks: ["接口编码与针位", "出线方向", "现场防护条件"] }, en: { title: "Sensors and field signals", detail: "Start with device interfaces, coding, pin layout, cabling and mounting orientation. Connect field signals to a clear cabinet wiring path.", checks: ["Coding and pin layout", "Cable orientation", "Site protection conditions"] } },
  { family: 2, related: [0, 1], zh: { title: "设备模块拆装", detail: "围绕设备单元的安装、换线与维护，了解重载接口的组合方式，并分别确认每个电力和信号回路。", checks: ["回路与接口组合", "安装与锁紧方式", "操作空间与维护"] }, en: { title: "Removable machine modules", detail: "Explore heavy-duty interface combinations around installation, rewiring and service. Confirm the power and signal circuits individually.", checks: ["Circuit and interface layout", "Mounting and locking", "Service access"] } },
  { family: 3, related: [0], zh: { title: "能源系统功率连接", detail: "先梳理系统电压、电流与温升条件，再了解功率接口；控制与通讯回路作为独立连接点分别确认。", checks: ["电流与温升条件", "接触防护与插接防错", "系统布线与安装"] }, en: { title: "Energy system power connections", detail: "Review voltage, current and thermal conditions before exploring the power interface. Confirm control and communication circuits as separate connection points.", checks: ["Current and temperature", "Contact and mating protection", "System routing and installation"] } },
] as const;

export default function SolutionWorkbench({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [active, setActive] = useState(0);
  const need = NEEDS[active];
  const copy = zh ? need.zh : need.en;
  const family = FAMILIES[need.family];

  return <section id="connection-guide" className="scroll-mt-44 border-y border-[#dce1e5] bg-white md:scroll-mt-32">
    <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
      <ScrollReveal direction="left" className="mb-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16"><div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "连接需求速览" : "Explore by connection need"}</p><h2 className="mt-4 max-w-[19em] text-[clamp(30px,3.2vw,46px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "你的连接需求，\n从哪一类产品开始？" : "Where should your connection search begin?"}</h2></div><p className="max-w-[400px] text-[14px] leading-7 text-[#68747e]">{zh ? "选择一项应用任务，了解优先浏览的产品族与需要确认的条件。" : "Choose an application task to explore a product family and the conditions to confirm."}</p></ScrollReveal>
      <div id="connection-matrix" className="grid scroll-mt-44 border border-[#dce1e5] md:scroll-mt-32 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0 border-b border-[#dce1e5] lg:border-b-0 lg:border-r">
          <p className="border-b border-[#dce1e5] bg-[#f5f6f7] px-5 py-3 text-[11px] leading-5 text-[#68747e] sm:hidden">{zh ? "点选左侧任务，横向滑动查看产品族。" : "Select a task; swipe to view the product families."}</p>
          <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label={zh ? "连接需求与产品方向对照，可横向滚动" : "Connection needs and product families; scroll horizontally"}>
            <table className="solution-matrix w-full min-w-[580px] border-collapse text-left">
              <caption className="sr-only">{zh ? "选择行标题，查看应用连接方向" : "Select a row heading to explore a connection need"}</caption>
              <thead><tr className="bg-[#f5f6f7]"><th scope="col" className="w-[36%] px-5 py-6 text-[12px] font-medium text-[#68747e]">{zh ? "应用任务" : "Application task"}</th>{FAMILIES.map(item => <th key={item.en} scope="col" className="px-2 py-6 text-center text-[12px] font-semibold leading-5">{zh ? item.zh : item.en}</th>)}</tr></thead>
              <tbody>{NEEDS.map((item, index) => <tr key={item.en.title} data-active={active === index}>
                <th scope="row" className="border-t border-[#dce1e5]"><button type="button" aria-pressed={active === index} aria-controls="connection-guide-detail" onClick={() => setActive(index)} className="flex min-h-24 w-full items-center justify-between gap-3 px-5 py-5 text-left text-[13px] font-semibold leading-6"><span>{zh ? item.zh.title : item.en.title}</span><span className="solution-matrix-arrow shrink-0 text-[#af1728]" aria-hidden="true">↗</span></button></th>
                {FAMILIES.map((itemFamily, column) => <td key={itemFamily.en} className="border-t border-[#dce1e5] px-2 py-5 text-center">{column === item.family ? <span className="solution-matrix-dot solution-matrix-primary"><span className="sr-only">{zh ? "优先了解" : "Start here"}</span></span> : (item.related as readonly number[]).includes(column) ? <span className="solution-matrix-dot solution-matrix-related"><span className="sr-only">{zh ? "可组合了解" : "Explore alongside"}</span></span> : <span className="text-[#d6dce0]" aria-label={zh ? "按具体需求确认" : "Confirm for the application"}>—</span>}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#dce1e5] px-5 py-4 text-[11px] text-[#68747e]"><span className="inline-flex items-center gap-2"><span className="solution-matrix-dot solution-matrix-primary" aria-hidden="true" />{zh ? "优先了解" : "Start here"}</span><span className="inline-flex items-center gap-2"><span className="solution-matrix-dot solution-matrix-related" aria-hidden="true" />{zh ? "可组合了解" : "Explore alongside"}</span></div>
          <div className="flex justify-between gap-4 border-t border-[#dce1e5] px-5 py-4 text-[12px] lg:hidden"><span role="status">{zh ? "当前方向：" : "Explore: "}<strong className="font-semibold text-[#af1728]">{zh ? family.zh : family.en}</strong></span><a href="#connection-guide-detail" className="font-semibold">{zh ? "查看说明 ↓" : "View details ↓"}</a></div>
        </div>
        <div id="connection-guide-detail" className="min-w-0 scroll-mt-44 bg-[#f7f8f9] p-6 sm:p-8 md:scroll-mt-32">
          <div key={active} className="solution-guide-detail">
            <p className="text-[12px] font-semibold text-[#af1728]">{zh ? "从这里了解" : "A product family to explore"}</p>
            <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.03em]">{zh ? family.zh : family.en}</h3>
            <div className="relative my-5 aspect-[16/7] overflow-hidden bg-white"><ProductImage key={family.image} src={family.image} alt={zh ? family.zh : family.en} sizes="(min-width:1024px) 420px, 85vw" className="object-contain p-3" /></div>
            <p className="min-h-24 text-[13px] leading-7 text-[#53606a]">{copy.detail}</p>
            <div className="mt-5 flex flex-wrap gap-2">{copy.checks.map(check => <span key={check} className="border border-[#dce1e5] px-2.5 py-1 text-[11px] leading-5 text-[#68747e]">{check}</span>)}</div>
            <Link href={siteHref(lang, family.href)} className="motion-arrow mt-6 inline-flex border-b-2 border-[#af1728] pb-2 text-[13px] font-semibold">{need.family < 2 ? (zh ? "浏览产品" : "Browse products") : (zh ? "了解选型支持" : "Explore selection support")}<span className="ml-4" aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
      <p className="mt-4 max-w-[920px] text-[11px] leading-6 text-[#89939b]">{zh ? "以上为应用方向速览。具体产品的额定参数、防护要求与适用范围，应结合完整订货号及应用条件进一步确认。" : "This is an application overview. Confirm ratings, protection and suitability against the complete order number and operating conditions."}</p>
    </div>
  </section>;
}
