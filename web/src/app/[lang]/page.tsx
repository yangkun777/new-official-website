import type { Metadata } from "next";
import { toLang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";
import { cmsPageMetadata, webPageJsonLd } from "@/lib/pageGeo";
import HomeCatalogDemo from "@/components/HomeCatalogDemo";
import { getHomeBanners } from "@/lib/homeBanners";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const title = lang === "zh" ? "高松 DEGSON | 工业连接解决方案" : "DEGSON | Industrial Connectivity";
  const description = lang === "zh"
    ? "高松提供接线端子、工业连接器与行业连接方案，服务工业自动化、能源和轨道交通。"
    : "DEGSON provides terminal blocks, industrial connectors and connectivity solutions for automation, energy and rail.";
  return cmsPageMetadata({
    lang,
    path: "/",
    title,
    description,
  });
}

export default async function Home({ params }: PageProps) {
  const lang = toLang((await params).lang);
  const bannerSlides = await getHomeBanners(lang);
  const name = lang === "zh" ? "高松 DEGSON | 工业连接解决方案" : "DEGSON | Industrial Connectivity";
  const description = lang === "zh"
    ? "高松提供接线端子、工业连接器与行业连接方案。"
    : "DEGSON provides terminal blocks, industrial connectors and connectivity solutions.";
  const homeJsonLd = webPageJsonLd({
    name,
    description,
    url: siteUrl(lang, "/"),
    lang,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd) }}
      />
      <HomeCatalogDemo lang={lang} bannerSlides={bannerSlides} />
    </>
  );
}
