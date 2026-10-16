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
  series: CONTENT_TAGS.series,
  product: CONTENT_TAGS.product,
  news: CONTENT_TAGS.news,
  site_pages: CONTENT_TAGS.pages,
  page_sections: CONTENT_TAGS.pages,
  page_sections_translations: CONTENT_TAGS.pages,
  social_links: CONTENT_TAGS.social,
  home_blocks: CONTENT_TAGS.home,
  home_blocks_translations: CONTENT_TAGS.home,
} as const;

export function tagForCollection(collection: string): ContentTag {
  if (collection in COLLECTION_TAGS) {
    return COLLECTION_TAGS[collection as PublicCollection];
  }
  throw new Error(`Unknown public collection: ${collection}`);
}
