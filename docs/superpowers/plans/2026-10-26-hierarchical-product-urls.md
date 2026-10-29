# Hierarchical Product URLs Implementation Plan

> **For agentic workers:** Follow this plan task by task; keep the visible page design unchanged.

**Goal:** Replace generic series/product route markers with readable product-category hierarchy paths while preserving existing links through redirects.

**Architecture:** Build canonical paths from each language's published category and content translation slugs. Reuse the existing series and SKU detail pages by internally rewriting hierarchical `/products/...` requests, and make legacy routes redirect to the canonical path. Update generated metadata, sitemap entries and in-site product links to the same path helpers.

**Tech Stack:** Next.js 15 App Router middleware, TypeScript, Directus REST adapter.

**Spec:** `docs/DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md` §4.4, §4.6, §8.1, §8.4.

## Global Constraints

- Keep canonical slug values in each content translation; do not derive slugs from titles per request.
- Do not use database IDs or UUIDs as public URL identifiers.
- Preserve the existing series and SKU page UI and interactions.
- Redirect legacy product URLs to the language-specific canonical URL without loops.
- Continue using the shared Next.js application for both languages.

## Review Focus

- A localized category path missing a translation must not be fabricated from another language.
- A series slug that collides with a SKU-like suffix must resolve by content lookup and canonical path comparison.
- Existing numeric matecode and SKU URLs must redirect to their current canonical paths.
- Dotted slugs such as `9edgk-5.0` must pass through middleware.
- Canonical, hreflang, JSON-LD and sitemap URLs must agree with the browser URL.

## Implementation Tasks

1. Update PRD §4.4 and §4.6 to state the hierarchical product URL shape and legacy-route behavior.
2. Add localized category-path helpers; extend series and product query results with their category hierarchy.
3. Route hierarchical series and SKU URLs through the existing detail pages; redirect legacy routes to canonical URLs.
4. Update all generated series/SKU links and sitemap URLs to use the shared path helpers.
5. Update the project progress and Directus integration notes with the URL change and remaining verification boundary.

## Verification Boundary

No test or build commands will be run in this turn. Code paths and route behavior will be reviewed from the changed source; end-to-end HTTP status, redirect, canonical/hreflang and sitemap checks remain for a later requested verification pass.
