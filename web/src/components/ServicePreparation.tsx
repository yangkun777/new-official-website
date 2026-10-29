"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import type { Lang } from "@/lib/lang";

const FIELDS = [
  { zh: ["应用场景", "设备用途、安装位置与项目阶段"], en: ["Application", "Equipment, installation and project stage"] },
  { zh: ["电气参数", "工作电压、电流与连接回路"], en: ["Electrical ratings", "Voltage, current and circuit requirements"] },
  { zh: ["导线与接口", "导线规格、极数与接线方式"], en: ["Wires & interfaces", "Wire size, poles and connection method"] },
  { zh: ["安装空间", "外形限制、固定方式与操作空间"], en: ["Installation space", "Dimensions, mounting and operating access"] },
  { zh: ["使用环境", "温度、振动与防护要求"], en: ["Environment", "Temperature, vibration and protection"] },
  { zh: ["参考资料", "已有型号、图纸或现场照片"], en: ["References", "Existing models, drawings or site photos"] },
] as const;

export default function ServicePreparation({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const summary = `${zh ? "工业连接需求沟通清单" : "Industrial connection requirements"}\n\n${FIELDS.map((field, index) => `${selected.includes(index) ? "[✓]" : "[ ]"} ${field[lang][0]} — ${field[lang][1]}`).join("\n")}\n\n${zh ? "请在各项后补充实际要求，并附上对应资料。" : "Add your actual requirements and attach the relevant documents."}`;
  async function copy() {
    try { await navigator.clipboard.writeText(summary); setMessage(zh ? "清单已复制，可粘贴到邮件中补充具体要求。" : "Checklist copied. Paste it into an email and add your requirements."); }
    catch { setMessage(zh ? "当前浏览器未允许复制，可直接按左侧清单准备资料。" : "Copy is unavailable. Use the checklist to prepare your requirements."); }
  }
  return <section id="service-preparation" className="scroll-mt-32 border-y border-[#dce1e5] bg-[#f5f6f7]">
    <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
      <ScrollReveal direction="left" className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "工程沟通清单" : "Prepare for the conversation"}</p><h2 className="mt-4 max-w-[15em] text-[clamp(32px,3.4vw,50px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "让一次沟通，\n更接近你要的答案。" : "Make the next conversation more useful."}</h2></div><p className="max-w-[390px] text-sm leading-7 text-[#68747e]">{zh ? "点选已经准备好的信息，看看还可以补充什么。清单可复制，方便整理后与工程团队交流。" : "Mark the information you have and see what else to prepare. Copy the checklist to help structure an engineering discussion."}</p></ScrollReveal>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12"><div className="grid content-start gap-3 sm:grid-cols-2">{FIELDS.map((field, index) => {
        const checked = selected.includes(index);
        return <button key={index} type="button" aria-pressed={checked} onClick={() => { setSelected(previous => previous.includes(index) ? previous.filter(value => value !== index) : [...previous, index]); setMessage(""); }} className="preparation-option group flex items-start gap-4 border border-[#dce1e5] bg-white px-5 py-6 text-left sm:min-h-[132px]"><span className="preparation-check mt-1 flex h-5 w-5 shrink-0 items-center justify-center border border-[#b9c2c9] text-xs" aria-hidden="true">{checked ? "✓" : "+"}</span><span><span className="block text-[17px] font-semibold">{field[lang][0]}</span><span className="mt-3 block text-[13px] leading-6 text-[#68747e]">{field[lang][1]}</span></span></button>;
      })}</div><aside className="border-t-[3px] border-[#af1728] bg-white px-6 py-8 sm:p-9"><div className="flex items-end justify-between gap-4"><h3 className="text-xl font-semibold">{zh ? "准备进度" : "Your preparation"}</h3><p className="text-xs text-[#68747e]"><span className="text-3xl font-medium tabular-nums text-[#af1728]">{selected.length}</span><span className="ml-2">/ 6</span></p></div><div className="mt-6 grid grid-cols-6 gap-1.5" aria-hidden="true">{FIELDS.map((_, index) => <span key={index} className={`preparation-segment h-1.5 ${index < selected.length ? "bg-[#af1728]" : "bg-[#e9edef]"}`} />)}</div><div className="mt-7 min-h-[175px]" aria-live="polite"><p className="text-sm font-semibold">{selected.length === 6 ? (zh ? "沟通要点已备齐" : "Your checklist is ready") : selected.length ? (zh ? "已准备的信息" : "Information prepared") : (zh ? "从已有信息开始" : "Start with what you know")}</p><p className="mt-3 text-[13px] leading-6 text-[#68747e]">{selected.length === 0 ? (zh ? "不必等所有资料齐全再开始。先标记已有信息，再逐步补充具体要求。" : "You do not need every detail to start. Mark what you know and add the specifics as you go.") : (zh ? "请为已选项目补充实际参数或附件，具体选型还需结合应用逐项确认。" : "Add the actual values or attachments. Product selection still needs a review of the application.")}</p><div className="mt-4 flex flex-wrap gap-2">{FIELDS.filter((_, index) => selected.includes(index)).map(field => <span key={field[lang][0]} className="preparation-tag bg-[#f8edef] px-2.5 py-1.5 text-xs text-[#af1728]">{field[lang][0]}</span>)}</div></div><button type="button" onClick={copy} className="motion-arrow mt-6 inline-flex min-h-12 w-full items-center justify-between bg-[#17212b] px-5 text-sm font-semibold text-white hover:bg-[#af1728]">{zh ? "复制沟通清单" : "Copy the checklist"}<span aria-hidden="true">↗</span></button><p role="status" className="mt-3 min-h-10 text-xs leading-5 text-[#68747e]">{message || (zh ? "仅用于整理需求；点选内容不会提交。" : "For preparing requirements; selections are not submitted.")}</p></aside></div>
    </div>
  </section>;
}
