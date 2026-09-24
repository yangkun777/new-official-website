// 新闻（多语言 translations）类型

export interface NewsListItem {
  id: number; // news_translations 行 id
  newsId: number; // news 主表 id
  slug: string;
  publish_date: string | null;
  cover_image: string | null;
  title: string;
  summary: string | null;
}

export interface NewsDetail extends NewsListItem {
  body: string | null;
}
