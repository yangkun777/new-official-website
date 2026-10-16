import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingPage from "@/components/MarketingPage";
import { getSitePage } from "@/lib/repo";
import { toLang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const page = await getSitePage("solutions", lang);
  if (!page) return { title: "Solutions" };
  const title = page.seo_title || page.title;
  const description = page.seo_description || page.summary || undefined;
  return {
    title,
    description,
    ...socialMetadata({ title, description: description ?? "", url: siteUrl(lang, "/solutions") }),
    alternates: {
      canonical: siteUrl(lang, "/solutions"),
      languages: hreflangMap("/solutions", page.availableLangs),
    },
  };
}

export default async function SolutionsPage({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const page = await getSitePage("solutions", lang);
  if (!page) notFound();
  return (
    <MarketingPage
      title={page.title}
      summary={page.summary}
      body={page.body}
      coverImage={page.coverImage}
      panels={page.panels}
    />
  );
}
