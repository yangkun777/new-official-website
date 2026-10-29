# SKU 产品资料试点 Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task. This checkout contains unrelated uncommitted Cursor changes; preserve them and do not commit the combined worktree.

**Goal:** Make two representative SKUs editable in one Directus product page and display verified technical, certification, download, and related-product content on the new SKU page.

**Architecture:** Product remains the parent record. Typed child collections hold specifications, certification groups and rows, documents, and product or series relationships. Directus groups the parent aliases into closed accordions. The Next repository maps published child data into localized page sections and hides empty sections.

**Tech Stack:** Directus 11.17.4, MySQL 8, Next.js 15, TypeScript, Node 22.

**Spec:** User approved one SKU editor with collapsed sections; research in `docs/legacy-product-modules-local-vs-online-2026-10-20.md` and this conversation. Scope is a local pilot for `10010012354` and `29010000012`, with the legacy PolarDB used only through `db_all_read` and SELECT.

## Global Constraints

- Brand is DEGSON / 高松; never 德昌.
- Fixed choices use Chinese dropdowns, relations use selectors, files use preview-capable fields.
- Frontend reads only Directus REST, never legacy MySQL.
- Preserve existing uncommitted Cursor changes in the current checkout.
- All pilot content must be traceable to source rows or explicitly marked as a trial entry; do not infer specifications.

## Review Focus

- Language fallback cannot combine English and Chinese labels in one displayed table.
- A related legacy code may identify a series and a SKU; preserve the intended target type.
- Documents need a real file or verified URL and must not expose draft/private files.
- Missing child rows must hide their section without creating an empty tab.
- Directus editor must show business names and file previews instead of IDs.

---

### Task 1: Schema and Directus editor

**Files:** `data/build_model.mjs`, `data/apply_directus_admin_ui.mjs`, `data/verify_directus_admin_ui.mjs`, `data/verify_product_content_pilot.mjs`.

- [ ] Add a failing verifier for collections, relations, aliases, group interfaces, Chinese labels, dropdown choices, and file/target selectors.
- [ ] Run it and confirm the missing-model failure.
- [ ] Add idempotent schema and metadata for product specs, certification, documents, and related targets; group O2M aliases under collapsed native accordions.
- [ ] Run the model and metadata scripts twice, then the verifier.

### Task 2: Frontend product detail

**Files:** `web/src/types/product.ts`, `web/src/lib/repo.ts`, `web/src/app/[lang]/product/[orderNo]/page.tsx`, focused product content component and `data/verify_m1_web.mjs`.

- [ ] Add a failing web verifier for real sections, language selection, empty sections, and related links.
- [ ] Run it and confirm the expected failure.
- [ ] Add REST reads and render only populated sections, preserving the current product hero, gallery, and SEO work.
- [ ] Run TypeScript and web verifier.

### Task 3: Two-SKU seed and operator walk-through

**Files:** `data/seed_product_content_pilot.mjs`, `docs/` pilot findings.

- [ ] Pull bounded source rows through `db_all_read` SELECT and record legacy IDs in the seed script.
- [ ] Upsert the two SKU records and only verified supporting content into local Directus; do not overwrite existing edited product copy.
- [ ] Check Directus edit path: one SKU, collapsed sections, relation picker, file preview, save/reopen.
- [ ] Check both localized SKU pages, download links, hidden empty sections, and the full base regression.

