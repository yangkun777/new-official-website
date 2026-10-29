import type { Metadata } from "next";
import AboutDemo from "@/components/AboutDemo";
import { toLang } from "@/lib/lang";
import { cmsPageMetadata, webPageJsonLd } from "@/lib/pageGeo";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

interface PageProps { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({ lang, path: "/about", title: lang === "zh" ? "关于高松 | DEGSON" : "About DEGSON", description: lang === "zh" ? "了解高松的工业连接产品、应用方向与选型支持。" : "Learn about DEGSON industrial connectivity, applications and product selection." });
}

export default async function AboutPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const name = lang === "zh" ? "关于高松" : "About DEGSON";
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageJsonLd({ name, description: name, url: siteUrl(lang, "/about"), lang })) }} /><AboutDemo lang={lang} /></>;
}
