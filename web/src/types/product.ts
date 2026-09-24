// 清洁模型类型（对应 Directus 清洁表 category / series / product / site_settings）

export interface SiteSettings {
  id: number;
  site_name: string;
  site_description: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  footer_text: string | null;
  contact_email: string | null;
}

export interface CatLite {
  id: number;
  name: string;
  slug: string;
  level: number;
}

/** 分类（含父级链，用于面包屑；Directus M2O 关系字段 parent_id 深层展开） */
export interface Category extends CatLite {
  description: string | null;
  image: string | null;
  sort: number;
  status: string;
  parent_id: (CatLite & { parent_id: CatLite | null }) | null;
}

export interface SubCategoryCard {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
}

export interface SeriesListItem {
  id: number;
  name: string;
  matecode: string;
  image: string | null;
  description: string | null;
}

export interface Series {
  id: number;
  name: string;
  matecode: string;
  description: string | null;
  image: string | null;
  category_id: {
    id: number;
    name: string;
    slug: string;
    parent_id: {
      id: number;
      name: string;
      slug: string;
      parent_id: { id: number; name: string; slug: string } | null;
    } | null;
  } | null;
}

export interface Variant {
  id: number;
  title: string;
  order_no: string;
  poles: string | null;
  pitch: string | null;
}

export interface Crumb {
  id: number;
  title: string;
  href?: string;
  current?: boolean;
}
