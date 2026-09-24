// 新闻视图类型：repo.ts 已把 news_translations 拍平（name→title, short_description→summary, description→body）

import type { Lang } from "@/lib/lang";

export interface NewsListItem {
  id: number; // news_translations 行 id
  newsId: number; // news 主表 id
  slug: string;
  publish_date: string | null;
  cover_image: string | null;
  title: string;
  summary: string | null;
  /** 该条内容实际所属语言（回退时等于 en） */
  lang: Lang;
  /** true = 请求语言无翻译，这一条来自 en 回退 */
  fallback: boolean;
}

export interface NewsDetail extends NewsListItem {
  body: string | null;
}
