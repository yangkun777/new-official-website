import assert from "node:assert/strict";
import { mapRedirects, slugify } from "./migration/buildUrlRedirectPreview.mjs";

assert.equal(slugify("PCB Plug / 3.5mm"), "pcb-plug-3-5mm");

const rows = mapRedirects([
  { id: 1, catid: 549, old_url: "/old/category.html", title: "PCB Plug", order_no: "", matecode: "", classify: "" },
  { id: 2, catid: 550, old_url: "/old/series.html", title: "Series", order_no: "", matecode: "100", classify: "1" },
  { id: 3, catid: 552, old_url: "/old/product.html", title: "Product", order_no: "SKU-1", matecode: "100", classify: "" },
  { id: 4, catid: 552, old_url: "/old/product-2.html", title: "Product 2", order_no: "SKU-1", matecode: "100", classify: "" },
], "https://www.degson.com");

assert.equal(rows[0].target_url, "https://www.degson.com/product/category/pcb-plug");
assert.equal(rows[1].status, "OK");
assert.equal(rows[2].status, "REVIEW_DUPLICATE_ORDER_NO");
assert.equal(rows[3].status, "REVIEW_DUPLICATE_ORDER_NO");

console.log("PASS URL redirect preview");
