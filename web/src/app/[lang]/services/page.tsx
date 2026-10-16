import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicesPageView from "@/components/ServicesPage";
import { getPageSections, getSitePage } from "@/lib/repo";
import { toLang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const page = await getSitePage("services", lang);
  if (!page) return { title: "Services" };
  const title = page.seo_title || page.title;
  const description = page.seo_description || page.summary || undefined;
  return {
    title,
    description,
    ...socialMetadata({ title, description: description ?? "", url: siteUrl(lang, "/services") }),
    alternates: {
      canonical: siteUrl(lang, "/services"),
      languages: hreflangMap("/services", page.availableLangs),
    },
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const page = await getSitePage("services", lang);
  if (!page) notFound();
  const sections = await getPageSections("services", lang);
  return (
    <ServicesPageView
      title={page.title}
      summary={page.summary}
      coverImage={page.coverImage}
      sections={sections}
    />
  );
}
