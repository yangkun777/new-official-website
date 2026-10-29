import type { Metadata } from "next";
import SolutionsDemo from "@/components/SolutionsDemo";
import { toLang } from "@/lib/lang";
import { cmsPageMetadata, webPageJsonLd } from "@/lib/pageGeo";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

interface PageProps { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({
    lang, path: "/solutions",
    title: lang === "zh" ? "行业解决方案 | 高松 DEGSON" : "Industry solutions | DEGSON",
    description: lang === "zh" ? "探索高松面向工业自动化、新能源与轨道交通的连接方案。" : "Explore DEGSON connectivity for industrial automation, energy and rail.",
  });
}

export default async function SolutionsPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const name = lang === "zh" ? "行业解决方案" : "Industry solutions";
  const description = lang === "zh" ? "从设备内部到现场接口，连接贯穿每一套工业系统。" : "From inside the device to the field interface, connectivity runs through every industrial system.";
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageJsonLd({ name, description, url: siteUrl(lang, "/solutions"), lang })) }} />
    <SolutionsDemo lang={lang} />
  </>;
}
