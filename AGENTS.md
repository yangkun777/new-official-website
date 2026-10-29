# DEGSON 项目 · Agent 约定

给 Cursor / Codex 等 AI 助手的硬性约定。写文案、种子数据、后台示例、前台中文 UI 前先读本文件。

## 品牌中文名（严禁写错）

- 英文：**DEGSON**
- 中文名：**高松**
- **禁止**使用「德昌」或其它臆造中文名。历史误写若仍出现在文档/种子/页面中，发现后应改成「高松」。

示例：

- 正确：`关于高松`、`高松工业连接解决方案`、`DEGSON（高松）`、`高松电子`
- 错误：`关于德昌`、`德昌电子`、`DEGSON（德昌）`

写新闻、营销页、Hero、页脚、种子 SQL、演示脚本时都要检查；Directus 里已有中文内容也要用搜索替换，不能只改代码常量。

## Directus 后台：有限选项必须用下拉（严禁自由输入）

运营人员不能靠记内部码。凡是取值集合固定的字段，**禁止**做成普通 `input` / 文本框，必须用 `select-dropdown`（或布尔用开关、关联用 M2O 选择器），选项展示中文，保存内部值。

固定选项包括但不限于：

| 字段 | 控件 | 选项（value） |
|------|------|----------------|
| `*_translations.language`、`media.language` | 下拉 | `en` 英文 / `zh` 中文 |
| `*.status`（发布状态） | 下拉 | `published` 已发布 / `draft` 草稿 |
| `category.level` | 下拉 | `1` 一级 / `2` 二级 / `3` 三级 |
| `product_media.kind`、`media.kind` | 下拉 | 主图 / 详情图 / 工程图等，不要让人填 `product_main` |
| `home_blocks.kind`、`page_slug`、`site_pages.slug`、`social_links.platform`、`cta_link`、`home_banner.link_path` | 下拉 | 以现有 choices 为准 |

新建字段时同步改 [`data/apply_directus_admin_ui.mjs`](data/apply_directus_admin_ui.mjs)，并在 [`data/verify_directus_admin_ui.mjs`](data/verify_directus_admin_ui.mjs) 里断言 `interface === select-dropdown`（或对应控件）。不要只改 Directus 界面不改脚本，重建环境会丢。

反例：新闻翻译的「语言」做成空文本框 → 保存报 `language Value is required`，或有人填「中文」两个字。

## Directus 后台：运营界面必须中文，图片列表必须缩略图

后台是给运营用的。数据库字段可以继续叫 `sort`、`image`、`hero_title`，**界面上禁止直接露出这些内部名**。

- 集合名、字段名、**列表列头**、编辑页标签、说明和下拉选项一律中文。
- `sort` 对运营显示为 **显示顺序**（不要只写英文 sort）。
- 图片字段在列表里必须显示缩略图，禁止把路径、UUID 或完整 URL 当列内容。空值显示「无图」。编辑页继续用 `product-media-editor` 预览/上传/从媒体库选择/放大查看/替换/清除。
- 列表缩略图 display id：`product-media-thumbnail`（与编辑控件同一扩展包）。
- 只在 Directus 界面里改一次不算完成：必须同步 [`data/apply_directus_admin_ui.mjs`](data/apply_directus_admin_ui.mjs)、[`data/verify_directus_admin_ui.mjs`](data/verify_directus_admin_ui.mjs)，以及列表预设 [`data/apply_admin_list_presets.mjs`](data/apply_admin_list_presets.mjs) / [`data/verify_admin_list_presets.mjs`](data/verify_admin_list_presets.mjs)。改了 `product-media-editor` 后更新 `dist` 并重启 Directus。

反例：分类列表 `image` 列显示 `/images/...`，列头写 `sort`；站点设置列头写 `hero_title`。

## 相关入口

- 项目总况：`docs/AI-项目总况.md`
- 交接与坑：`PROJECT-HANDOFF.md`
- 前台 Next 规则：`web/AGENTS.md`（Next 自动维护块之外，同样遵守本文件的品牌约定）
