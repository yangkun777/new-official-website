import Link from "next/link";
import { Fragment } from "react";
import ProductImage from "@/components/ProductImage";
import MediaReveal from "@/components/MediaReveal";
import ScrollReveal from "@/components/ScrollReveal";
import IndustryApplications, { IndustryNavigation, IndustryQuestions } from "@/components/IndustryApplications";
import SolutionWorkbench from "@/components/SolutionWorkbench";
import ProductLoopVideo from "@/components/ProductLoopVideo";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const INDUSTRIES = [
  {
    id: "automation", image: "/images/marketing/feature-automation.jpg",
    zh: { name: "工业自动化", title: "从控制柜，到设备末端。", text: "一条产线里的连接需求各不相同。围绕控制柜接线、传感器与执行器、设备模块接口，把信号、数据和电力连接放在同一张应用图景中考虑。", tags: ["控制柜", "传感器与执行器", "设备模块"] },
    en: { name: "Industrial automation", title: "From the cabinet to the machine edge.", text: "A production line brings different connection needs together. Consider cabinet wiring, sensors, actuators and machine modules as parts of one signal, data and power system.", tags: ["Cabinet wiring", "Sensors and actuators", "Machine modules"] },
  },
  {
    id: "energy", image: "/images/marketing/home-app-2.jpg",
    zh: { name: "新能源", title: "在能源流动的每一站，建立连接。", text: "从发电侧接口到储能系统和设备内部配线，不同连接点面对不同的电气条件与安装环境。沿着系统路径，找到需要优先确认的选型方向。", tags: ["光伏发电", "储能系统", "设备配线"] },
    en: { name: "New energy", title: "Connect every stage of the energy journey.", text: "Generation, storage and internal equipment wiring each bring different electrical and installation conditions. Follow the system path to identify the requirements that matter at each point.", tags: ["Solar generation", "Energy storage", "Equipment wiring"] },
  },
  {
    id: "rail", image: "/images/marketing/feature-rail.jpg",
    zh: { name: "轨道交通", title: "面向长久运行，也面向每一次维护。", text: "轨道设备需要兼顾振动环境、紧凑安装与检修便利。把车载控制、设备间连接和轨旁信号设备分别考虑，让接口布局与实际使用条件相匹配。", tags: ["车载控制", "设备间连接", "轨旁信号"] },
    en: { name: "Rail transit", title: "Built around operation. Planned for service.", text: "Rail equipment combines vibration, compact installation and long service cycles. Consider onboard control, equipment interconnection and trackside signals in the context of their real operating conditions.", tags: ["Onboard control", "Equipment interconnection", "Trackside signals"] },
  },
] as const;

const FAMILIES = [
  { image: "/images/marketing/home-push.jpg", href: "/product/category/terminal-blocks", zh: ["接线端子", "组织柜内与设备内部的电力、信号回路。"], en: ["Terminal blocks", "Organize power and signal circuits inside cabinets and equipment."] },
  { image: "/images/marketing/circular-connectors.jpg", href: "/product/category/circular-connectors", zh: ["圆形连接器", "将信号、数据与电力带到设备接口。"], en: ["Circular connectors", "Bring signal, data and power to the equipment interface."] },
  { image: "/images/marketing/home-banner-heavy-duty.jpg", href: "/services#service-explorer", zh: ["重载连接器", "围绕复杂接口与设备维护继续选型。"], en: ["Heavy-duty connectors", "Explore interfaces for demanding installations and maintenance."] },
] as const;

function ConnectionInMotion({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  return <section id="connection-in-motion" className="scroll-mt-44 border-y border-[#dce1e5] bg-[#f5f6f7] md:scroll-mt-32">
    <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-12 lg:py-20">
      <ScrollReveal direction="left"><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "连接细节 · PUSH-SNAP" : "Connection details · PUSH-SNAP"}</p><h2 className="mt-4 max-w-[13em] text-[clamp(30px,3.2vw,46px)] font-semibold leading-[1.2] tracking-[-0.035em]">{zh ? "从方案中的一个点，\n看到接线的每一步。" : "See the detail behind a single connection."}</h2><p className="mt-5 max-w-[460px] text-[15px] leading-8 text-[#53606a]">{zh ? "连接方案最终要落到现场操作。通过接线过程，进一步了解导线进入、连接到位与结构配合的细节。" : "A connection plan becomes a hands-on installation. See how the wire enters, seats and works with the connection mechanism."}</p>
        <div className="mt-7 grid grid-cols-3 border-y border-[#dce1e5] py-4 text-[12px] text-[#68747e]">{(zh ? ["导线准备", "插入连接", "确认到位"] : ["Prepare", "Insert", "Confirm"]).map((label, index) => <div key={label} className="border-r border-[#dce1e5] px-3 first:pl-0 last:border-r-0"><span className="mr-2 text-[#af1728]">0{index + 1}</span>{label}</div>)}</div>
        <Link href={siteHref(lang, "/product/category/terminal-blocks")} className="motion-arrow mt-7 inline-flex border-b-2 border-[#af1728] pb-2 text-[13px] font-semibold">{zh ? "了解接线产品" : "Explore terminal blocks"}<span className="ml-4" aria-hidden="true">↗</span></Link>
      </ScrollReveal>
      <ScrollReveal direction="right" className="border border-[#dce1e5] bg-white"><ProductLoopVideo lang={lang} /><div className="flex justify-between gap-4 border-t border-[#dce1e5] px-5 py-4 text-[11px] text-[#89939b]"><span>{zh ? "PUSH-SNAP 接线过程" : "PUSH-SNAP connection demonstration"}</span><span>{zh ? "静音循环" : "Silent loop"}</span></div></ScrollReveal>
    </div>
  </section>;
}

export default function SolutionsDemo({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const stages = zh ? [
    ["梳理场景", "明确设备、安装位置与现场环境。"], ["定位连接点", "区分电力、信号与数据接口。"], ["确认产品组合", "逐一核对参数、尺寸与资料。"], ["进入工程确认", "结合图纸、样件与安装要求推进。"],
  ] : [
    ["Define the application", "Identify equipment, mounting and environment."], ["Locate connection points", "Separate power, signal and data interfaces."], ["Review product families", "Check ratings, dimensions and documents."], ["Continue the engineering review", "Work through drawings, samples and installation needs."],
  ];

  return <div className="solutions-demo bg-white text-[#17212b]">
    <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.83fr_1.17fr] lg:gap-16 lg:px-12 lg:py-24">
      <ScrollReveal direction="left">
        <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "高松 · 行业方案" : "DEGSON · Industry solutions"}</p>
        <h1 className="mt-6 max-w-[11em] text-[clamp(42px,4.4vw,68px)] font-semibold leading-[1.1] tracking-[-0.045em]">{zh ? "从一个连接点，\n看见整个应用。" : "Every connection is part of a bigger picture."}</h1>
        <p className="mt-7 max-w-[500px] text-[17px] leading-8 text-[#53606a]">{zh ? "走进自动化、能源与轨道交通现场，从应用环境出发，连接产品、系统与工程需求。" : "Explore automation, energy and rail applications. Connect product choices to the systems and engineering needs behind them."}</p>
        <a href="#automation" className="motion-arrow motion-arrow-down mt-8 inline-flex min-h-12 items-center border-b-2 border-[#af1728] text-sm font-semibold hover:text-[#af1728]">{zh ? "探索应用场景" : "Explore applications"}<span className="ml-5" aria-hidden="true">↘</span></a>
        <div className="mt-9 flex gap-7 text-[12px] text-[#89939b]">{(zh ? ["信号连接", "数据连接", "电力连接"] : ["Signal", "Data", "Power"]).map(label => <span key={label} className="border-t border-[#cbd2d7] pt-3">{label}</span>)}</div>
      </ScrollReveal>
      <MediaReveal direction="right" className="relative aspect-[5/4] bg-[#eef1f3]"><ProductImage src="/images/marketing/hero-solutions.jpg" alt={zh ? "工业设备现场" : "Industrial equipment in operation"} priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" /></MediaReveal>
    </section>

    <IndustryNavigation lang={lang} />
    <div id="industries">
      {INDUSTRIES.map((item, index) => {
        const copy = zh ? item.zh : item.en;
        return <Fragment key={item.id}><section id={item.id} className={`scroll-mt-44 md:scroll-mt-32 ${index === 1 ? "bg-[#eef1f3]" : "bg-white"}`}>
          <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
            <ScrollReveal direction={index % 2 === 0 ? "left" : "right"} className="grid items-end gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
              <div><p className="text-[13px] font-semibold text-[#af1728]">{copy.name}</p><h2 className="mt-4 max-w-[16em] text-[clamp(31px,3.3vw,47px)] font-semibold leading-[1.2] tracking-[-0.035em]">{copy.title}</h2></div>
              <div><p className="text-[15px] leading-8 text-[#53606a]">{copy.text}</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{copy.tags.map(tag => <span key={tag} className="text-[12px] text-[#89939b]">{tag}</span>)}</div></div>
            </ScrollReveal>
            <IndustryApplications industry={item.id} lang={lang} image={item.image} name={copy.name} />
          </div>
        </section>{index === 0 ? <ConnectionInMotion lang={lang} /> : null}</Fragment>;
      })}
    </div>

    <SolutionWorkbench lang={lang} />

    <section className="border-t border-[#dce1e5] bg-[#f5f6f7]">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
        <ScrollReveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "从场景回到产品" : "From application to product"}</p><h2 className="mt-4 text-[clamp(30px,3.2vw,44px)] font-semibold tracking-[-0.035em]">{zh ? "为不同连接点，组合合适的产品。" : "Different connection points. Complementary products."}</h2></div><Link href={siteHref(lang, "/product/category/terminal-blocks")} className="motion-link shrink-0 text-[13px] font-semibold">{zh ? "进入产品目录" : "Open the catalog"}</Link></ScrollReveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">{FAMILIES.map((family, index) => {
          const [title, text] = zh ? family.zh : family.en;
          return <Link key={title} href={siteHref(lang, family.href)} className="solution-family motion-card group relative block border border-[#e0e4e7] bg-white"><MediaReveal delay={index * 60} className="relative aspect-[16/10] overflow-hidden bg-[#f5f6f7]"><ProductImage src={family.image} alt="" sizes="(min-width:1024px) 420px, (min-width:640px) 35vw, 85vw" className="object-cover object-right transition-transform duration-500 group-hover:scale-[1.04] group-focus-visible:scale-[1.04]" /></MediaReveal><div className="border-t border-[#e0e4e7] p-6"><h3 className="flex justify-between gap-3 text-[21px] font-semibold">{title}<span className="text-[#af1728] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true">↗</span></h3><p className="mt-3 text-[13px] leading-6 text-[#68747e]">{text}</p></div></Link>;
        })}</div>
      </div>
    </section>

    <section id="project-path" className="scroll-mt-44 bg-[#17212b] text-white md:scroll-mt-32"><div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-20"><p className="text-[13px] font-semibold text-[#f2a8ae]">{zh ? "项目推进路径" : "The engineering path"}</p><h2 className="mt-4 text-[clamp(30px,3.2vw,44px)] font-semibold tracking-[-0.035em]">{zh ? "把应用想法，变成清晰的选型依据。" : "Turn the application into a clear selection brief."}</h2><div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{stages.map(([title, text], index) => <ScrollReveal key={title} delay={index * 50} className="service-process relative border-t border-white/25 pt-6"><span className="absolute -top-1 left-0 h-2 w-2 bg-[#d33749]" aria-hidden="true" /><p className="text-[12px] tabular-nums text-white/40">0{index + 1}</p><h3 className="mt-4 text-[20px] font-semibold">{title}</h3><p className="mt-3 text-[14px] leading-7 text-white/60">{text}</p></ScrollReveal>)}</div></div></section>

    <IndustryQuestions lang={lang} />
    <section className="bg-white"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-7 px-6 py-16 sm:px-10 lg:flex-row lg:items-center lg:px-12 lg:py-20"><div><h2 className="text-[clamp(28px,3vw,40px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "你的应用，下一步从哪里开始？" : "Where does your application go next?"}</h2><p className="mt-4 text-[15px] leading-7 text-[#68747e]">{zh ? "带上应用条件和接口需求，继续与工程团队沟通。" : "Bring the application conditions and interface needs to the next conversation."}</p></div><Link href={siteHref(lang, "/services#service-explorer")} className="motion-arrow inline-flex min-h-12 w-fit shrink-0 items-center bg-[#af1728] px-7 text-sm font-semibold text-white hover:bg-[#891220]">{zh ? "获取选型支持" : "Explore selection support"}<span className="ml-5" aria-hidden="true">↗</span></Link></div></section>
  </div>;
}
