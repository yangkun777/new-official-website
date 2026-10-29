import type { Metadata } from "next";
import ServicesDemo from "@/components/ServicesDemo";
import { toLang } from "@/lib/lang";
import { cmsPageMetadata, webPageJsonLd } from "@/lib/pageGeo";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

interface PageProps { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({ lang, path: "/services", title: lang === "zh" ? "选型与支持 | 高松 DEGSON" : "Selection and support | DEGSON", description: lang === "zh" ? "了解高松的产品选型与技术支持。" : "Explore DEGSON product selection and technical support." });
}

export default async function ServicesPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const name = lang === "zh" ? "选型与支持" : "Selection and support";
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageJsonLd({ name, description: name, url: siteUrl(lang, "/services"), lang })) }} /><ServicesDemo lang={lang} /></>;
}
