import ScrollReveal from "@/components/ScrollReveal";
import { siteHref } from "@/lib/site";
import type { ProductContent } from "@/lib/productContent";
import type { Lang } from "@/lib/lang";

export default function ProductEngineeringGuide({ content, lang }: { content: ProductContent; lang: Lang }) {
  const zh = lang === "zh";
  const steps = zh ? [["核对具体配置", "以完整订货号确认产品配置、尺寸及配对关系。"], ["确认额定条件", "结合使用环境，逐项核对电气参数与认证条件。"], ["带入工程设计", "使用对应的数据表与设计文件，继续安装和应用确认。"]] : [["Review the configuration", "Use the full order number to confirm configuration, dimensions and mating requirements."], ["Check the rated conditions", "Review electrical ratings and certification conditions against the operating environment."], ["Continue the design", "Use the corresponding data sheet and design files to review installation and application."]];
  const links = [
    { visible: content.specs.length > 0, anchor: "specifications", label: zh ? "技术参数" : "Specifications" },
    { visible: content.documents.length > 0, anchor: "downloads", label: zh ? `${content.documents.length} 份技术文件` : `${content.documents.length} technical files` },
    { visible: content.certifications.length > 0, anchor: "certifications", label: zh ? "认证参数" : "Certification data" },
  ];
  return <section className="border-y border-[#dce1e5] bg-white"><div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-10 lg:px-12 lg:py-18"><div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"><ScrollReveal direction="left"><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "从产品资料到设计确认" : "From product data to design decisions"}</p><h2 className="mt-4 max-w-[16em] text-[clamp(29px,3vw,43px)] font-semibold leading-tight tracking-[-0.03em]">{zh ? "选型的下一步，是把细节确认清楚。" : "Take the next step by confirming the details."}</h2></ScrollReveal><div className="flex flex-wrap gap-3">{links.filter(link => link.visible).map(link => <a key={link.anchor} href={`#${link.anchor}`} className="motion-link border border-[#dce1e5] px-4 py-3 text-xs font-semibold hover:border-[#af1728] hover:text-[#af1728]">{link.label}</a>)}</div></div><div className="mt-10 grid gap-7 md:grid-cols-3 md:gap-0">{steps.map(([title, text], index) => <ScrollReveal key={title} delay={index * 60} className="product-review-step relative border-t border-[#dce1e5] pb-2 pt-6 md:pr-10"><p className="text-xs tabular-nums text-[#af1728]">0{index + 1}</p><h3 className="mt-3 text-xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-7 text-[#68747e]">{text}</p></ScrollReveal>)}</div><a href={siteHref(lang, "/services#service-preparation")} className="motion-arrow mt-8 inline-flex text-xs font-semibold">{zh ? "整理工程沟通清单" : "Prepare the engineering checklist"}<span className="ml-4" aria-hidden="true">↗</span></a></div></section>;
}
