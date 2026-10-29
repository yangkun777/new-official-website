export const CONTENT_TAGS = {
  settings: "content:site-settings",
  category: "content:category",
  series: "content:series",
  product: "content:product",
  news: "content:news",
  media: "content:media",
  pages: "content:site-pages",
  social: "content:social-links",
  home: "content:home-blocks",
} as const;

type PublicCollection = keyof typeof COLLECTION_TAGS;
export type ContentTag = (typeof CONTENT_TAGS)[keyof typeof CONTENT_TAGS];

const COLLECTION_TAGS = {
  site_settings: CONTENT_TAGS.settings,
  category: CONTENT_TAGS.category,
  category_translations: CONTENT_TAGS.category,
  series: CONTENT_TAGS.series,
  series_translations: CONTENT_TAGS.series,
  product: CONTENT_TAGS.product,
  product_translations: CONTENT_TAGS.product,
  product_media: CONTENT_TAGS.product,
  product_spec: CONTENT_TAGS.product,
  product_spec_translations: CONTENT_TAGS.product,
  product_certification: CONTENT_TAGS.product,
  product_certification_row: CONTENT_TAGS.product,
  product_document: CONTENT_TAGS.product,
  product_relation: CONTENT_TAGS.product,
  news: CONTENT_TAGS.news,
  news_translations: CONTENT_TAGS.news,
  media: CONTENT_TAGS.media,
  site_pages: CONTENT_TAGS.pages,
  site_pages_translations: CONTENT_TAGS.pages,
  page_sections: CONTENT_TAGS.pages,
  page_sections_translations: CONTENT_TAGS.pages,
  social_links: CONTENT_TAGS.social,
  home_blocks: CONTENT_TAGS.home,
  home_blocks_translations: CONTENT_TAGS.home,
  home_banner: CONTENT_TAGS.home,
  home_banner_translations: CONTENT_TAGS.home,
} as const;

export const REVALIDATION_COLLECTIONS = Object.keys(COLLECTION_TAGS);

export function tagForCollection(collection: string): ContentTag {
  if (collection in COLLECTION_TAGS) {
    return COLLECTION_TAGS[collection as PublicCollection];
  }
  throw new Error(`Unknown public collection: ${collection}`);
}
