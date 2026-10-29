# 服务页集中编辑样本 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 让运营从同一个 Directus 服务页记录找到中英文页面内容、SEO 和服务板块，并能核对前台结果。

**Architecture:** 保留 `site_pages`、`site_pages_translations` 和 `page_sections` 的既有数据。给页面和板块建立明确关联，在页面编辑表单展示板块列表；用分组、中文业务名称和预览链接整理现有表单。此轮不建全站自定义后台，也不改变前台服务页 URL。

**Tech Stack:** Directus 11、MySQL 8、Next.js 15、Node.js 22。

**Spec:** `docs/DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md` §6.2.1、§8.4。

## Global Constraints

- 品牌中文名为“高松”；固定选项使用中文下拉，内部值不由运营手填。
- 保留当前工作区已有的未提交改动，幂等脚本重跑不能覆盖运营编辑过的内容。
- PRD 和进度分别只更新既定的两个 Markdown 入口。

## Review Focus

- 已有服务板块关联到服务页，不丢层级、语言内容或前台展示。
- 新建板块从服务页进入时能正确归属服务页，不误写到方案页。
- 编辑中文不会改动英文，反之亦然。
- 内部字段、技术码不干扰常规编辑。
- 后台有中英文预览入口，指向对应服务页。

---

### Task 1: 页面与板块的集中编辑关系

**Files:**
- Modify: `data/seed_page_sections.mjs`
- Modify: `data/apply_directus_admin_ui.mjs`
- Modify: `data/verify_directus_admin_ui.mjs`
- Modify: `data/verify_page_sections.mjs`

**Interfaces:** `site_pages.sections` 为 O2M 编辑入口；`page_sections.site_page_id` 指向所属页面，既有 `page_slug` 保留兼容。

- [x] 写只读验证：服务页具有板块入口、板块的页面关系指向 `services`，原有中英文板块数量不变。
- [x] 运行验证并确认因关系/入口不存在失败。
- [x] 在幂等脚本中添加关系、既有记录回填，以及页面编辑页的中文分组和业务标签。
- [x] 重跑脚本和只读验证；从真实 Directus 页面打开服务页，确认板块可见。

### Task 2: 运营编辑与前台核对

**Files:**
- Modify: `data/apply_directus_admin_ui.mjs`
- Modify: `data/verify_directus_admin_ui.mjs`
- Modify: `docs/AI-项目总况.md`

**Interfaces:** 服务页编辑表单的中英文内容、SEO 和预览入口。

- [x] 写验证：页面及板块编辑字段具中文业务名、语言下拉与预览入口。
- [x] 运行验证并确认缺项失败。
- [x] 补字段分组、说明和预览入口；按真实页面操作路径验收打开、编辑、保存、重开、前台对照。
- [x] 更新唯一进度文档，记录完成项、验证结果和剩余缺口。

### Task 3: 回归

- [x] 运行 `node data/verify_directus_admin_ui.mjs`、`node data/verify_page_sections.mjs`、`node data/verify_m1_web.mjs`。
- [x] 运行前台 TypeScript 检查与 `git diff --check`；只解决本轮引入的问题。

**验收注记**：服务页内编辑和保存现有板块已验证；新增顶级板块仍走独立列表，并在总况文档列为后续优化。

