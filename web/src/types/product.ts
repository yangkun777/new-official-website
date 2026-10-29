// 前台视图类型：由 repo.ts 把「主表 + *_translations」拍平成页面直接可用的形状。
// 页面不感知 translations 结构，字段名保持 name / slug / description 稳定。

import type { Lang } from "@/lib/lang";

export interface SiteSettings {
  id: number;
  site_name: string;
  site_description: string | null;
  site_description_zh?: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_title_zh?: string | null;
  hero_subtitle_zh?: string | null;
  footer_text: string | null;
  footer_text_zh?: string | null;
  contact_email: string | null;
  hero_image?: string | null;
  hero_kicker?: string | null;
  hero_kicker_zh?: string | null;
  cta_title?: string | null;
  cta_title_zh?: string | null;
  cta_text?: string | null;
  cta_text_zh?: string | null;
  cta_link?: string | null;
}

/** 按语言拍平后的站点文案（Hero / 页脚等） */
export interface LocalizedSiteCopy {
  siteName: string;
  siteDescription: string | null;
  heroTitle: string;
  heroSubtitle: string;
  heroKicker: string;
  heroImage: string | null;
  footerText: string;
  ctaTitle: string;
  ctaText: string;
  ctaLink: string;
}

/** 面包屑用的轻量节点（name/slug 已按语言解析） */
export interface CatLite {
  id: number;
  name: string;
  slug: string;
  level: number;
}

export interface CategoryPathNode extends CatLite {}

/** 分类详情（含父级链，用于面包屑） */
export interface Category extends CatLite {
  description: string | null;
  short_description: string | null;
  image: string | null;
  sort: number;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  h1: string | null;
  parent_id: (CatLite & { parent_id: CatLite | null }) | null;
  categoryPath: CategoryPathNode[];
}

/**
 * 列表卡片条目。`lang` = 该条内容实际所属语言：
 * 请求语言有翻译时等于请求语言；回退到 en 时等于 en，
 * 卡片据此把链接指向真正有内容的语言页（PRD §6.4，避免空壳页）。
 */
export interface SubCategoryCard {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  lang: Lang;
  fallback: boolean;
  categoryPath: CategoryPathNode[];
  /** CMS 主表真实更新时间；为空时 sitemap 不输出 lastmod。 */
  updated_at?: string | null;
}

export interface SeriesListItem {
  id: number;
  name: string;
  slug: string;
  matecode: string;
  image: string | null;
  description: string | null;
  lang: Lang;
  fallback: boolean;
  categoryPath: CategoryPathNode[];
  /** CMS 主表真实更新时间；为空时 sitemap 不输出 lastmod。 */
  updated_at?: string | null;
}

export interface Series {
  id: number;
  name: string;
  slug: string;
  matecode: string;
  description: string | null;
  short_description: string | null;
  image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  h1: string | null;
  categoryPath: CategoryPathNode[];
  category_id: {
    id: number;
    name: string;
    slug: string;
    level: number;
    parent_id: {
      id: number;
      name: string;
      slug: string;
      level: number;
      parent_id: { id: number; name: string; slug: string; level: number } | null;
    } | null;
  } | null;
}

/** 产品变体：参数仍在 product 主表（与语言无关），title 是主表遗留显示名 */
export interface Variant {
  id: number;
  title: string | null;
  order_no: string | null;
  poles: string | null;
  pitch: string | null;
}

export type ProductMediaKind = "product_main" | "product_detail" | "product_diagram";

export interface ProductMedia {
  id: number;
  kind: ProductMediaKind | string;
  sort: number;
  is_primary: boolean;
  url: string | null;
  alt: string | null;
  caption: string | null;
}

export interface ProductDetail {
  id: number;
  lang: Lang;
  order_no: string;
  title: string | null;
  poles: string | null;
  pitch: string | null;
  combined_title: string | null;
  name: string;
  slug: string;
  h1: string | null;
  short_description: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  media: ProductMedia[];
  series: { matecode: string; slug: string; name: string; lang: Lang; image: string | null; categoryPath: CategoryPathNode[] } | null;
}

export interface Crumb {
  id: number;
  title: string;
  href?: string;
  current?: boolean;
}
