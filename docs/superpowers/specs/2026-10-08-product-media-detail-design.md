# 产品媒体与 SKU 详情闭环设计

日期：2026-10-08  
范围：当前 Demo 第一阶段，不包含全量历史数据迁移、技术参数全量建模、认证库、下载中心和搜索。

## 1. 目标

让当前 Demo 具备一个可验证的产品内容闭环：运营人员可以在 Directus 中给 SKU 维护图片，前台可以通过订货号访问产品详情并展示主图与基础产品信息。模型必须为后续技术参数、认证、附件和下载留下稳定的关联边界。

## 2. 现状与约束

- 当前 `product` 只有订货号、型号、系列、极数、节距等基础字段，没有媒体关联。
- 当前前台有分类页、系列页和新闻页，没有 SKU 详情路由。
- 旧后台的产品总览没有直接主图字段；媒体能力通过独立图片库和内容关联提供。
- 当前 Directus 采用主表 + `*_translations` 翻译表，继续保留这一方向，不复制多语言项目。
- 所有图片通过 Directus 文件库或受控媒体 resolver 进入前台，不允许在业务表里继续扩散任意 URL。
- 不在本阶段直接导入旧库图片，避免在媒体归属规则未验证前污染数据。

## 3. 方案

### 3.1 媒体实体

新增 `media` 业务集合，引用 Directus `directus_files`，保存用途和运营元数据：

- `id`、`file_id`；
- `kind`：`product_main`、`product_detail`、`series_cover`、`category_cover`、`news_cover`；
- `alt`、`caption`、`sort`；
- `language`，可为空表示语言无关；
- `status`、`created_at`、`updated_at`。

新增 `product_media` 关联集合：

- `product_id`；
- `media_id`；
- `kind`；
- `sort`；
- `is_primary`。

同一 SKU 同一用途最多一张主图；其它详情图按 `sort` 展示。第一阶段只开放 product 关联，但 `media.kind` 为后续系列、分类、新闻统一媒体入口预留。

### 3.2 产品详情内容

在现有 `product_translations` 上补齐产品详情所需的 SEO 和描述字段（如果字段已经存在则复用，不重复建列）：

- `name/title`；
- `slug` 或稳定的订货号路由；
- `h1`、`seo_title`、`seo_description`；
- `short_description`、`description`。

产品详情 URL 使用订货号，不随语言变化：

```text
/en/product/{order_no}
/zh/product/{order_no}
```

Demo 阶段保留现有 `/en`、`/zh` 前缀；生产 URL 继续遵守已有站点策略。

### 3.3 前台取数

新增 repository 查询：按 `order_no + language` 读取已发布 product、翻译和媒体，并在应用层组装详情模型。媒体 URL 统一经过现有 `resolveMediaUrl`，不在页面组件中拼接 Directus URL。

无翻译时遵循现有语言回退规则；无主图时允许页面正常渲染并显示占位状态，不伪造图片地址。

### 3.4 Directus 后台

通过 schema 和字段元数据配置：

- 产品详情字段中文显示；
- SKU 详情页可看到媒体关联；
- 文件选择、预览、排序和主图标记；
- `order_no` 唯一性和媒体关联必需关系；
- 不改变现有新闻、分类、系列业务数据。

如果 Directus 原生 M2M 编辑器无法在当前版本稳定支持主图排序，则第一阶段采用可验证的 O2M 关联编辑方式，不为了追求复杂 UI 引入自定义后台。

## 4. 不做的事情

- 不导入旧库全量产品图片；
- 不新增独立语言站点或复制数据库；
- 不在本阶段做技术参数、认证、附件、下载和搜索；
- 不把旧系统 `thumb/thumb1/thumb2` 直接照搬成固定字段；
- 不修改生产环境和 `master` 分支。

## 5. 验收标准

1. schema snapshot、SQL 和 Directus 重建流程能创建新增集合及关系。
2. 用测试数据为一个 SKU 关联一张主图和多张详情图，API 能按语言返回正确顺序。
3. `/en/product/{order_no}` 和 `/zh/product/{order_no}` 能展示详情、主图、详情图和基础字段。
4. 不存在的订货号返回 404；缺少媒体时页面不报错。
5. 媒体域名校验、草稿过滤和语言回退均有自动化验证。
6. 现有新闻语言切换、分类分页、系列产品列表、SEO 和生产路由回归全部通过。

## 6. 风险与后续接口

- 旧库产品媒体字段需要在正式迁移前重新盘点并人工确认归属。
- 认证图片、产品详情图和工程图必须通过 `kind` 区分，不能混用。
- 后续技术参数、认证、下载应以 `product_id` 关联，不以订货号字符串作为唯一外键。
- 如果媒体量进入数十万级，前台查询必须按 product、language、kind 建索引，并采用分页或按需读取。
