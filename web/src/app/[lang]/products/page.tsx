import type { Metadata } from "next";
import ProductsDemo from "@/components/ProductsDemo";
import { getCatalogSeries } from "@/lib/catalogData";
import { getProductByOrderNo } from "@/lib/repo";
import { getProductContent } from "@/lib/productContent";
import { cmsPageMetadata } from "@/lib/pageGeo";
import { toLang } from "@/lib/lang";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return cmsPageMetadata({ lang, path: "/products", title: lang === "zh" ? "产品中心 | 高松 DEGSON" : "Product center | DEGSON", description: lang === "zh" ? "浏览高松工业连接产品、筛选端子系列，并查看型号参数与技术资料。" : "Explore DEGSON industrial connectivity, filter terminal block series and review product specifications and technical documents." });
}

export default async function ProductsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const lang = toLang((await params).lang);
  const [catalog, sample] = await Promise.all([getCatalogSeries(lang), getProductByOrderNo("10010012354", lang)]);
  const content = sample ? await getProductContent(sample.product.id, sample.resolvedLang) : null;
  const query = (await searchParams).q;
  return <ProductsDemo lang={lang} catalog={catalog} initialQuery={typeof query === "string" ? query.slice(0, 200) : ""} sample={sample ? { product: sample.product, lang: sample.resolvedLang, content } : null} />;
}
