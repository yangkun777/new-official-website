# 产品媒体与 SKU 详情闭环实施计划

> 依据设计：`docs/superpowers/specs/2026-10-08-product-media-detail-design.md`

## 目标

在当前隔离分支完成一个最小可验证闭环：Directus 能保存 SKU 媒体关联，前台能按订货号访问中英文产品详情，并展示主图与详情图；已有新闻、分类、系列、SEO 和 URL 回归保持通过。

## 全局约束

- 不修改 `master`，不触碰生产环境。
- 不导入旧库全量图片，不创建独立语言项目。
- 不新增技术参数、认证、附件、下载和搜索的完整业务模块；仅预留稳定关联边界。
- 每个行为先写失败验证，确认 RED 后再实现；每个任务单独运行验证。
- Directus schema、SQL/建模脚本、snapshot、验证脚本必须保持可重建。
- 前台媒体 URL 必须经过 `resolveMediaUrl`，不在页面中拼接裸 URL。

## 文件范围

- `data/build_model.mjs`：幂等创建 media / product_media 和产品详情字段。
- `cms/snapshot.yaml`：导出并固定新增 schema 关系。
- `data/verify_product_media.mjs`：schema、关系、媒体取数和约束验证。
- `web/src/lib/repo.ts`：产品详情与媒体查询、语言回退。
- `web/src/types/product.ts`：详情模型和媒体类型。
- `web/src/app/[lang]/product/[orderNo]/page.tsx`：SKU 详情页。
- `web/src/components/ProductMediaGallery.tsx`：主图和详情图展示。
- `web/src/components/ProductDetail.tsx`：详情基础信息展示。
- `data/verify_m1_web.mjs`：加入真实 SKU 详情路由回归。
- `data/verify_directus_admin_ui.mjs` / `data/apply_directus_admin_ui.mjs`：中文标签、媒体字段界面元数据。
- `docs/progress-2026-10-08.md`：记录阶段结果和剩余风险。

## Task 1：建立媒体和产品详情 schema

### 产出

- `media` 集合：Directus 文件引用、kind、语言、alt、caption、排序、状态和时间字段。
- `product_media` 集合：product、media、kind、sort、is_primary 及关系。
- `product_translations` 确认并补齐详情/SEO 字段，不重复创建已有字段。
- 对 product、media、product_media 的关系、索引和可空性做幂等处理。
- 导出 `cms/snapshot.yaml`。

### RED

新增 `data/verify_product_media.mjs`，先断言集合、字段、关系和产品详情字段存在；在当前 schema 上运行，必须因缺少新集合或关系失败。

### GREEN

扩展 `data/build_model.mjs`，执行建模脚本，再运行验证脚本；失败时只修复根因，不改验证条件。

### 验证

```text
node data/verify_product_media.mjs
node data/verify_base.mjs
```

### 提交

`feat: add product media schema`

## Task 2：实现产品详情 repository 和页面

### 产出

- 增加 `ProductDetail`、`ProductMedia` 类型。
- 增加按 `order_no + language` 的详情查询，限制 published 数据，支持翻译回退。
- 加入主图优先、详情图按 sort 的媒体组装。
- 新增 `/[lang]/product/[orderNo]` 页面，包含基础信息、媒体画廊、SEO metadata、canonical、hreflang、Product JSON-LD。
- 无 SKU 404，无媒体不报错。

### RED

先在 `data/verify_product_media.mjs` 增加真实 API 取数验证；先在 `data/verify_m1_web.mjs` 增加真实订货号详情页 200、主图/详情图、404 和中英文回归，运行后必须失败，因为路由不存在。

### GREEN

实现最小 repository、组件和页面，保持现有服务端取数风格，不引入新依赖。

### 验证

```text
node data/verify_product_media.mjs
node data/verify_m1_web.mjs
cd web; pnpm exec tsc --noEmit
pnpm build
```

### 提交

`feat: add product detail page with media`

## Task 3：配置 Directus 中文运营界面

### 产出

- media / product_media 的中文集合名、字段名、显示顺序和关系配置。
- product 详情字段的中文提示、只读/必填边界。
- 文件选择、预览和关联编辑配置；如果当前 Directus 版本无法稳定提供主图排序 UI，保留可用的关联编辑，不引入自定义后台。
- 更新并验证 schema snapshot。

### RED/GREEN

扩展 `data/verify_directus_admin_ui.mjs` 先断言新增集合和字段配置；确认当前配置缺失后，再扩展 `data/apply_directus_admin_ui.mjs` 并重复验证。

### 验证

```text
node data/verify_directus_admin_ui.mjs
node data/verify_product_media.mjs
```

### 提交

`chore: configure product media admin ui`

## Task 4：回归、迁移边界和代码 review

### 产出

- 全量运行现有验证脚本和新增验证。
- 检查 schema 可重建、中文后台元数据、媒体安全边界和生产 URL 策略。
- 更新 `docs/progress-2026-10-08.md`，明确本阶段完成项、未做项和旧库迁移前置条件。
- 对本分支 diff 做一次独立 review，按 Critical/Important/Minor 分级处理。

### 验证

```text
node data/verify_base.mjs
node data/verify_product_media.mjs
node data/verify_directus_admin_ui.mjs
node data/verify_content_safety.mjs
node data/verify_news_language_switch.mjs
node data/verify_category_pagination.mjs
node data/verify_variant_pagination.mjs
node data/verify_m1_web.mjs
node data/verify_seo_routes.mjs
cd web; pnpm exec tsc --noEmit
pnpm build
```

### 提交

`docs: record product media detail progress`

## 完成标准

- 新增 schema 可重复执行，snapshot 与运行中的 Directus 一致。
- 至少一个真实 SKU 能通过 API 和前台详情页展示媒体。
- 中英文详情路由、无媒体、无 SKU、SEO 和现有回归全部通过。
- 未导入旧库媒体，未改变生产 URL 策略和旧分类迁移门禁。
- 代码 review 没有未处理的 Critical/Important 问题。
