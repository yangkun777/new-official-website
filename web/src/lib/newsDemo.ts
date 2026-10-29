import type { Lang } from "@/lib/lang";

export interface DemoNewsCopy {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  paragraphs: string[];
  relatedHref: string;
  relatedLabel: string;
}

export interface DemoNewsStory {
  image: string;
  en: DemoNewsCopy;
  zh: DemoNewsCopy;
}

export const NEWS_DEMO_STORIES: DemoNewsStory[] = [
  {
    image: "/images/marketing/home-push.jpg",
    en: {
      slug: "push-snap-wiring-efficiency",
      tag: "Connection technology",
      title: "PUSH-SNAP and more efficient wiring",
      summary: "A closer look at push-in connections and the choices behind a well-organized cabinet.",
      relatedHref: "/product/category/terminal-blocks",
      relatedLabel: "Explore terminal blocks",
      paragraphs: [
        "From conductor size and available installation space to maintenance access, each detail helps shape a practical wiring plan.",
        "Push-in connection technology can make installation more direct for suitable applications. The right terminal block still depends on the conductor, electrical ratings, accessories and the equipment layout.",
        "Reviewing these conditions together helps teams compare product options and prepare a clearer specification.",
      ],
    },
    zh: {
      slug: "push-snap-关注更高效的现场接线",
      tag: "接线技术",
      title: "PUSH-SNAP：关注更高效的现场接线",
      summary: "从直插连接方式出发，看看如何让控制柜接线更清晰、更便于维护。",
      relatedHref: "/product/category/terminal-blocks",
      relatedLabel: "查看接线端子产品",
      paragraphs: [
        "导线规格、安装空间和后续维护方式，都会影响控制柜内的接线规划。提前梳理这些条件，有助于明确连接产品的选择方向。",
        "对于适用的场景，直插连接方式可以简化接线操作。具体端子仍需结合导线、额定参数、附件和设备布局进行确认。",
        "把这些条件放在一起评估，能帮助工程团队更清楚地比较产品方案并准备技术要求。",
      ],
    },
  },
  {
    image: "/images/marketing/circular-connectors.jpg",
    en: {
      slug: "circular-connectors-device-interfaces",
      tag: "Product focus",
      title: "Circular connectors for device interfaces",
      summary: "Signal and power connections start with the interface, installation and environment.",
      relatedHref: "/product/category/circular-connectors",
      relatedLabel: "Explore circular connectors",
      paragraphs: [
        "A device-side connection needs to fit the interface and the conditions where equipment will be installed and serviced.",
        "Connector size, coding, contact arrangement, cable direction and environmental protection are among the details to review before selecting a product.",
        "A clear view of the installation point makes it easier to compare connector families and confirm the requirements with engineering teams.",
      ],
    },
    zh: {
      slug: "圆形连接器面向设备端的信号与电力",
      tag: "产品聚焦",
      title: "圆形连接器：面向设备端的信号与电力",
      summary: "从接口规格、安装位置与使用环境出发，梳理设备端连接需求。",
      relatedHref: "/product/category/circular-connectors",
      relatedLabel: "查看圆形连接器",
      paragraphs: [
        "设备端连接需要适配接口，也要满足设备安装和维护现场的实际条件。先明确连接位置，能帮助缩小产品选择范围。",
        "选型时可逐项确认接口规格、编码方式、芯数、出线方向和环境防护要求，再结合线缆与安装空间核对产品方案。",
        "把具体安装点和使用条件说明清楚，有助于工程团队比较不同连接器系列并确认技术要求。",
      ],
    },
  },
  {
    image: "/images/marketing/home-banner-energy.jpg",
    en: {
      slug: "connectivity-across-new-energy-applications",
      tag: "Applications",
      title: "Connectivity across new energy applications",
      summary: "Generation, storage and charging systems each bring different connection conditions.",
      relatedHref: "/solutions",
      relatedLabel: "Explore energy solutions",
      paragraphs: [
        "New energy systems bring together equipment installed in different locations and operating conditions. The connection requirements can vary across generation, storage and charging applications.",
        "Electrical ratings, temperature, outdoor exposure, cable routing and maintenance access are useful starting points when describing an application.",
        "Defining these conditions at each connection point helps teams prepare a more focused product and engineering review.",
      ],
    },
    zh: {
      slug: "连接产品如何走进新能源现场",
      tag: "行业应用",
      title: "连接产品如何走进新能源现场",
      summary: "从发电、储能到充电设施，看看不同连接点需要关注哪些应用条件。",
      relatedHref: "/solutions",
      relatedLabel: "查看新能源行业方案",
      paragraphs: [
        "新能源系统包含不同位置和运行条件下的设备，发电、储能与充电场景中的连接需求也各有特点。",
        "描述应用时，可以先整理额定参数、温度条件、户外环境、线缆路径和维护空间等信息。",
        "逐一明确连接点的现场条件，能让后续产品比较和工程沟通更有针对性。",
      ],
    },
  },
];

export function getDemoNewsBySlug(lang: Lang, slug: string): DemoNewsStory | null {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Keep the original value; it will simply fail to match a known slug.
  }
  return NEWS_DEMO_STORIES.find((story) => story[lang].slug === decoded) ?? null;
}
