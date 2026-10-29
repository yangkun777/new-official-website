import assert from "node:assert/strict";
import { mapHomeBannerRows } from "../web/src/lib/homeBannerModel.ts";

const rows = [
  {
    id: 2, sort: 20, status: "published", image: "/shared.jpg", link_path: "external",
    link_url: "https://example.com/campaign",
    translations: [
      { language: "en", status: "published", tag: "English", title: "English title", text: "EN text", cta: "Read", image: null },
      { language: "zh", status: "draft", tag: "中文", title: "中文标题", text: "中文内容", cta: "查看", image: null },
    ],
  },
  {
    id: 1, sort: 10, status: "published", image: "/shared-1.jpg", link_path: "/solutions",
    link_url: null,
    translations: [
      { language: "en", status: "published", tag: "One", title: "First", text: "First text", cta: "Explore", image: null },
      { language: "zh", status: "published", tag: "一", title: "第一张", text: "中文内容", cta: "探索", image: "/zh-1.jpg" },
    ],
  },
  {
    id: 3, sort: 30, status: "draft", image: "/draft.jpg", link_path: "/products", link_url: null,
    translations: [{ language: "en", status: "published", title: "Draft banner", cta: "Open", image: null }],
  },
  {
    id: 4, sort: 40, status: "published", image: "/bad.jpg", link_path: "external",
    link_url: "javascript:alert(1)",
    translations: [{ language: "en", status: "published", title: "Unsafe link", cta: "Open", image: null }],
  },
];

const image = (value) => value;
const en = mapHomeBannerRows(rows, "en", image);
assert.deepEqual(en.map((slide) => slide.title), ["First", "English title"]);
assert.equal(en[0].image, "/shared-1.jpg");
assert.equal(en[0].href, "/solutions");
assert.equal(en[1].href, "https://example.com/campaign");
const zh = mapHomeBannerRows(rows, "zh", image);
assert.deepEqual(zh.map((slide) => slide.title), ["第一张"]);
assert.equal(zh[0].image, "/zh-1.jpg");
assert.deepEqual(mapHomeBannerRows([], "en", image), []);
console.log("PASS homepage Banner mapping");
