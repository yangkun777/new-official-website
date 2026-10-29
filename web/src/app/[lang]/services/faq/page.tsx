import type { Metadata } from "next";
import FaqDemo from "@/components/FaqDemo";
import { toLang } from "@/lib/lang";
import { cmsPageMetadata } from "@/lib/pageGeo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({ lang, path: "/services/faq", title: lang === "zh" ? "常见问题 FAQ | 高松 DEGSON" : "Frequently asked questions | DEGSON", description: lang === "zh" ? "查找高松工业连接产品选型、技术资料、安装与定制咨询的常见问题。" : "Find answers about DEGSON product selection, technical documents, installation and custom requests." });
}

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLang((await params).lang);
  return <FaqDemo lang={lang} />;
}
