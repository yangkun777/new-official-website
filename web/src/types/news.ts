// 新闻视图类型：repo.ts 已把 news_translations 拍平（name→title, short_description→summary, description→body）

import type { Lang } from "@/lib/lang";

export interface NewsListItem {
  id: number; // news_translations 行 id
  newsId: number; // news 主表 id
  slug: string;
  publish_date: string | null;
  cover_image: string | null;
  title: string;
  h1: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  summary: string | null;
  /** 该条内容实际所属语言（回退时等于 en） */
  lang: Lang;
  /** true = 请求语言无翻译，这一条来自 en 回退 */
  fallback: boolean;
  /** CMS 主表真实更新时间；为空时 sitemap 不输出 lastmod。 */
  updated_at?: string | null;
}

export interface NewsDetail extends NewsListItem {
  body: string | null;
}
