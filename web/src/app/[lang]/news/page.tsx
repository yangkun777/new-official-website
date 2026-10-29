import type { Metadata } from "next";
import NewsDemo from "@/components/NewsDemo";
import { toLang } from "@/lib/lang";
import { cmsPageMetadata, webPageJsonLd } from "@/lib/pageGeo";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

interface PageProps { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({ lang, path: "/news", title: lang === "zh" ? "产品与应用通讯 | 高松 DEGSON" : "Products and applications | DEGSON", description: lang === "zh" ? "了解高松的连接产品、技术与行业应用。" : "Explore DEGSON connectivity products, technology and applications." });
}

export default async function NewsPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const name = lang === "zh" ? "产品与应用通讯" : "Products and applications";
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPageJsonLd({ name, description: name, url: siteUrl(lang, "/news"), lang })) }} /><NewsDemo lang={lang} /></>;
}
