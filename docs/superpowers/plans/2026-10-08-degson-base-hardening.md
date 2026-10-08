# DEGSON 官网基座加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不扩展会员、搜索、下载等业务模块的前提下，收紧当前官网 demo 的 URL、数据约束、内容安全、媒体边界、缓存接口和项目文档，并生成一份与实际基座一致的新 PRD。

**Architecture:** 保留 `Next.js → repository 适配层 → Directus REST → MySQL` 主链路。新增站点 URL 配置、内容净化和媒体 URL resolver 三个小边界；schema 约束通过建模脚本、SQL 约束脚本和验证脚本共同表达；发布/搜索队列只定义稳定接口，不在本计划中实现。

**Tech Stack:** Next.js 15.5.25, React 19.2.8, TypeScript 5, Directus 11.17.4, MySQL 8, Node 22, pnpm lockfile, Node-based verification scripts.

**Spec:** `docs/superpowers/specs/2026-10-08-degson-base-hardening-design.md`

## Global Constraints

- 英文主站生产 URL 无 `/en` 前缀。
- 其他国际语言使用路径前缀，例如 `/de/`、`/es/`。
- 中文生产站使用 `degson.com.cn`，不在国际主域生成可索引 `/zh/` 页面。
- 当前本地 demo 必须继续支持可配置的 `/en`、`/zh` 模式，避免破坏现有 M1 验收环境。
- 前台只通过 Directus REST API 取数，不引入数据库连接。
- 不实现会员、Meilisearch、下载权限、询盘、全量迁移、CI/CD、灰度或灾备。
- 任何 schema 约束变更都必须同时更新建模脚本、约束脚本、snapshot 或验证脚本，并通过重复数据检查。
- 富文本不得直接把未净化 CMS HTML 输出到前台。

## Review Focus

- 同一条页面在本地 demo、英文主域、国际语言前缀和中文独立域名模式下的 canonical/hreflang 是否一致。
- 已存在重复 `order_no`、`matecode`、翻译行或 slug 时，验证是否失败而不是覆盖数据。
- 富文本中的 `script`、事件属性、`javascript:` 链接、危险 iframe 是否被清除，正常段落和链接是否保留。
- 环境变量缺失、媒体 ID 为空、媒体域不允许时，前台是否安全降级而不是拼出错误 URL。
- 现有 `verify_m1_web.mjs`、TypeScript 检查和 Next 构建是否保持可运行。

---

### Task 1: 站点 URL 与语言配置边界

**Files:**
- Create: `web/src/lib/siteConfig.ts`
- Modify: `web/src/lib/site.ts`
- Modify: `web/src/middleware.ts`
- Modify: `web/src/app/[lang]/layout.tsx`
- Create: `data/verify_site_urls.mjs`
- Modify: `web/.env.example`

**Interfaces:**
- Produces `SiteMode = "demo-path" | "production"`。
- Produces `siteUrl(lang: Lang, path?: string): string`，用于 canonical、hreflang 和绝对链接。
- Produces `localePath(lang: Lang, path?: string): string`，用于页面内部链接。
- `demo-path` 保留 `/en`、`/zh`；`production` 使用英文无前缀、国际语言前缀、中文独立域名。

- [ ] **Step 1: Write the failing URL verification script**

在 `data/verify_site_urls.mjs` 中用纯函数断言以下结果：

```js
assert.equal(siteUrl("en", "/news"), "https://www.degson.com/news");
assert.equal(siteUrl("de", "/news"), "https://www.degson.com/de/news");
assert.equal(siteUrl("zh", "/news"), "https://www.degson.com.cn/news");
assert.equal(demoLocalePath("en", "/news"), "/en/news");
assert.equal(demoLocalePath("zh", "/news"), "/zh/news");
```

- [ ] **Step 2: Run the verifier and confirm it fails for the current hard-coded `/en` implementation**

Run: `node data/verify_site_urls.mjs`

Expected: FAIL because current URL functions always use one host and always prepend the language.

- [ ] **Step 3: Implement the minimal configuration boundary**

Read `SITE_MODE`, `SITE_ORIGIN`, and `CN_SITE_ORIGIN` from environment variables with safe local defaults. Keep existing page call sites using `localePath`, `absUrl`, and `hreflangMap`; update those functions to delegate to the configured site policy instead of string concatenation.

- [ ] **Step 4: Update middleware and layout metadata to use the same policy**

Ensure middleware only rewrites paths for the active demo mode. Ensure `generateMetadata` and `htmlLang` do not infer a production host from request headers, IP, UA, or browser language.

- [ ] **Step 5: Run the verifier and the existing M1 regression**

Run: `node data/verify_site_urls.mjs`

Expected: PASS for both production and demo cases.

Run: `node data/verify_m1_web.mjs`

Expected: Existing local `/en` and `/zh` cases remain unchanged when `SITE_MODE=demo-path`.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/siteConfig.ts web/src/lib/site.ts web/src/middleware.ts web/src/app/[lang]/layout.tsx web/.env.example data/verify_site_urls.mjs
git commit -m "feat: centralize multilingual site URL policy"
```

### Task 2: 数据约束与重建验证

**Files:**
- Modify: `data/build_model.mjs`
- Create: `data/04_constraints.sql`
- Create: `data/verify_constraints.mjs`
- Modify: `data/99_verify.sql`
- Modify: `cms/snapshot.yaml`

**Interfaces:**
- `data/verify_constraints.mjs` exits non-zero and prints every duplicate group when constraints are not satisfied.
- `data/04_constraints.sql` is idempotent and contains only approved MySQL 8 DDL for indexes/unique keys.

- [ ] **Step 1: Write duplicate fixtures and the failing verifier**

The verifier must check:

```text
series.matecode is unique
product.order_no is unique
each translation parent has at most one row per language
slug is unique within its entity and language scope
```

Run against a fixture or local database with one duplicate in each category.

Expected: FAIL with collection, key, duplicate value, and row IDs.

- [ ] **Step 2: Run the verifier against current demo data**

Run: `node data/verify_constraints.mjs`

Expected: It reports any existing seed conflicts before DDL is applied. No data is deleted or silently merged.

- [ ] **Step 3: Add idempotent constraint SQL**

Use named keys and guarded information-schema checks. Add single-column unique keys for `series.matecode` and `product.order_no`; add composite keys for translation parent/language and the agreed entity/language/slug scope. Add indexes for status, parent/category relations, series relations, and translation lookup columns.

- [ ] **Step 4: Make the model builder express the same intent**

Set Directus field metadata for required/indexed fields where supported. Remove the relation PATCH fallback that is known to be unsafe on Directus 11.17.4; report an actionable failure when an existing relation has the wrong O2M alias instead of attempting the unsafe mutation.

- [ ] **Step 5: Refresh snapshot and verification SQL**

Export or update `cms/snapshot.yaml` only from the resulting Directus schema. Update `data/99_verify.sql` so it validates the new model rather than the old M0.2 columns.

- [ ] **Step 6: Run model and data verification**

Run: `node data/verify_constraints.mjs`

Expected: PASS with zero duplicate groups.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 7: Commit**

```bash
git add data/build_model.mjs data/04_constraints.sql data/verify_constraints.mjs data/99_verify.sql cms/snapshot.yaml
git commit -m "feat: enforce content identity constraints"
```

### Task 3: 富文本净化与媒体 URL resolver

**Files:**
- Modify: `web/package.json`
- Modify: `web/pnpm-lock.yaml`
- Create: `web/src/lib/contentSafety.ts`
- Create: `web/src/lib/media.ts`
- Modify: `web/src/lib/repo.ts`
- Modify: `web/src/app/[lang]/news/[slug]/page.tsx`
- Create: `data/verify_content_safety.mjs`
- Modify: `web/.env.example`

**Interfaces:**
- `sanitizeRichText(input: string | null | undefined): string`
- `resolveMediaUrl(input: string | null | undefined): string | null`
- `isAllowedMediaUrl(input: string): boolean`

- [ ] **Step 1: Write the failing content safety verifier**

Assert that the sanitizer removes scripts, event attributes, `javascript:` URLs, unknown iframes and tracking pixels while preserving paragraphs, lists, safe HTTPS links and approved image URLs.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node data/verify_content_safety.mjs`

Expected: FAIL because the current news detail renders raw body HTML and media URLs are assembled inline.

- [ ] **Step 3: Add `sanitize-html` and implement the approved allowlist**

Use an allowlist-based sanitizer configured for the PRD-approved semantic tags and URL protocols. Do not accept arbitrary HTML configuration from CMS content.

- [ ] **Step 4: Add the media resolver**

Resolve Directus file IDs through `DIRECTUS_PUBLIC_URL`/`DIRECTUS_URL`, allow only configured media origins, and return `null` for empty or disallowed input. Keep local development origins explicit in `.env.example`.

- [ ] **Step 5: Route news bodies and cover images through the boundaries**

Sanitize news body before `dangerouslySetInnerHTML`. Use `resolveMediaUrl` from the repository layer for cover images. Do not change the page's visible content model.

- [ ] **Step 6: Run safety and type checks**

Run: `node data/verify_content_safety.mjs`

Expected: PASS.

Run: `tsc --noEmit` from `web` using the project-local compiler.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml web/src/lib/contentSafety.ts web/src/lib/media.ts web/src/lib/repo.ts web/src/app/[lang]/news/[slug]/page.tsx data/verify_content_safety.mjs web/.env.example
git commit -m "feat: sanitize CMS rich text and centralize media URLs"
```

### Task 4: 发布缓存边界与首页内容配置

**Files:**
- Create: `web/src/lib/cacheTags.ts`
- Modify: `web/src/lib/directus.ts`
- Modify: `web/src/lib/repo.ts`
- Modify: `web/src/app/[lang]/page.tsx`
- Modify: `data/build_model.mjs`
- Modify: `cms/snapshot.yaml`
- Create: `data/verify_cache_contract.mjs`

**Interfaces:**
- `CONTENT_TAGS` exposes stable tags for settings, category, series, product, news and media.
- `tagForCollection(collection: string): string` returns a stable tag or throws for an unknown public collection.
- `apiGet` and `apiGetList` accept only those tags for production cache metadata.

- [ ] **Step 1: Write the failing cache contract verifier**

Assert that all repository reads use named stable tags, unknown tags are rejected, development reads remain `no-store`, and production reads use revalidation metadata.

- [ ] **Step 2: Run the verifier and confirm it fails**

Run: `node data/verify_cache_contract.mjs`

Expected: FAIL because tags are currently arbitrary strings and there is no shared contract.

- [ ] **Step 3: Implement stable cache tags**

Replace string literals in repository reads with `CONTENT_TAGS` values. Keep the 60-second fallback for demo production mode; do not add webhook endpoints in this task.

- [ ] **Step 4: Move homepage operational copy into translated settings fields**

Extend the settings model and view type for translated hero/section copy. Keep safe defaults for an empty database. Do not introduce a generic arbitrary HTML block system.

- [ ] **Step 5: Run cache and M1 verification**

Run: `node data/verify_cache_contract.mjs`

Expected: PASS.

Run: `node data/verify_m1_web.mjs`

Expected: PASS for existing supported routes.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/cacheTags.ts web/src/lib/directus.ts web/src/lib/repo.ts web/src/app/[lang]/page.tsx data/build_model.mjs cms/snapshot.yaml data/verify_cache_contract.mjs
git commit -m "feat: formalize cache tags and translated site settings"
```

### Task 5: 生成新版基座 PRD 并清理冲突文档

**Files:**
- Create: `docs/新官网基座优化版PRD_2026-10-08.md`
- Modify: `README.md`
- Modify: `PROJECT-HANDOFF.md`
- Modify: `web/README.md`
- Modify: `docs/M0.3-底座重建手册.md`

**Interfaces:**
- New PRD is the authoritative document for the base-hardening phase.
- Historical M0.2 material remains labeled historical and does not describe the current Directus 11 runtime.

- [ ] **Step 1: Write the PRD from the implemented contracts**

Include current state, fixed URL policy, data model contracts, content safety, media rules, public API rules, cache contract, verification commands, explicit non-scope, M1.5/M2/M3 gates, and known limitations.

- [ ] **Step 2: Add a requirement-to-evidence matrix**

For each requirement mark exactly one of `已验证`, `本次加固`, `后续开发`, or `生产 Gate` and link to the script/file that proves it.

- [ ] **Step 3: Remove contradictory current-state statements**

Keep Directus 11.17.4 as the current runtime, distinguish demo-path mode from production URL policy, and remove statements that imply member/search/migration/production readiness has already been delivered.

- [ ] **Step 4: Run document consistency checks**

Search the active docs for `Directus 12`, stale `/en` production claims, and claims that M2/production work is complete. Historical sections may keep old facts only when explicitly labeled historical.

- [ ] **Step 5: Commit**

```bash
git add docs/新官网基座优化版PRD_2026-10-08.md README.md PROJECT-HANDOFF.md web/README.md docs/M0.3-底座重建手册.md
git commit -m "docs: publish base hardening PRD"
```

### Task 6: Full verification and handoff

**Files:**
- Modify: `data/verify_m1_web.mjs` only if URL assertions need the new configured policy.
- Create: `data/verify_base.mjs`

- [ ] **Step 1: Add the aggregate base verifier**

The script must run the URL, constraint, content safety, and cache contract checks and return non-zero if any check fails.

- [ ] **Step 2: Run all checks**

Run from the worktree:

```powershell
node data/verify_base.mjs
node data/verify_m1_web.mjs
git diff --check
```

Run from `web` with project-local binaries:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\next.cmd build
```

Expected: all available checks pass. If a build is blocked by the local pnpm/runtime environment, record the exact blocker and do not claim a passing production build.

- [ ] **Step 3: Review final diff and status**

Confirm only the isolated branch changed, no `.env`, token, database dump or generated build artifact is tracked, and the new PRD matches the implemented behavior.

- [ ] **Step 4: Commit verification tooling**

```bash
git add data/verify_base.mjs data/verify_m1_web.mjs
git commit -m "test: add base hardening verification gate"
```

## Review Focus Mapping

- URL mode and canonical mismatch → Task 1 URL verifier.
- Duplicate business identifiers → Task 2 duplicate verifier and SQL fixture.
- Dangerous rich text → Task 3 sanitizer verifier.
- Missing/disallowed media URL → Task 3 media verifier.
- Regression of existing M1 routes → Tasks 1, 4 and 6 run `verify_m1_web.mjs`.

## Known Gaps Explicitly Preserved

This plan does not claim production readiness. Membership, search, downloads, forms, full migration, 301 ledger, CI/CD, performance testing, compliance, observability, rollback and disaster recovery remain later work described in the new PRD.
