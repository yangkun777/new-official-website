# DEGSON Demo Interior Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将演示站内页与首页统一，并让行业方案页成为可单独演示的视觉页面。

**Architecture:** 营销栏目使用静态双语演示组件，不读取 Directus。产品与新闻详情保留现有真实数据，仅更换展示层。静态内容和图片路径放在页面组件内，避免侵入后台模型。

**Tech Stack:** Next.js App Router、React、TypeScript、Tailwind CSS、现有 ProductImage。

**Spec:** `docs/superpowers/specs/2026-10-22-demo-interior-pages-design.md`

## Global Constraints

- 中文品牌名只能写“高松”；不得编造技术参数、日期或客户案例。
- 保留现有产品详情数据与 SEO 路径；不修改 Directus 模型。
- 使用本地高清图，首页配色与字体，兼顾移动端。

## Review Focus

- 中文入口缺翻译时仍需能辨识页面语言与跳转去向。
- 图片不得把小于卡片显示尺寸的源图放大。
- 静态营销页的 CTA 必须有实际可访问的目标。
- 新闻列表不得展示测试占位内容。
- 方案、关于、服务三个页面不得重复使用同一组三图布局。

---

### Task 1: 行业方案页

**Files:** `web/src/app/[lang]/solutions/page.tsx`，新建 `web/src/components/SolutionsDemo.tsx`

**Interfaces:** `SolutionsDemo({lang}: {lang: Lang})` 输出静态双语方案页面。

- [x] 阅读现有路由与图片组件约定。
- [x] 实现宽幅图、三个交错行业章节、产品入口与服务 CTA。
- [x] 检查中英页面、手机和桌面截图，运行 `pnpm exec tsc --noEmit`。

### Task 2: 关于、服务、新闻

**Files:** `web/src/app/[lang]/about/page.tsx`、`services/page.tsx`、`news/page.tsx`；新建对应演示组件。

**Interfaces:** 各组件接收 `lang: Lang`；新闻卡只链接真实存在的产品与方案页。

- [x] 实现各自不同的图文版式，保留静态 SEO。
- [x] 处理新闻演示占位数据，不输出虚构日期。
- [x] 检查中英页面和移动端截图，运行类型检查。

### Task 3: 产品与内容详情视觉统一

**Files:** 产品分类、系列、订货号详情、新闻详情页面及相关卡片组件。

**Interfaces:** 保留 repo 数据读取、路由、SEO，调整展示类名与必要的共享展示组件。

- [x] 替换旧青绿色 Hero、圆角阴影卡片与品牌绿按钮。
- [x] 检查分类到系列到订货号的链接、面包屑和新闻详情。
- [x] 对所有改动运行 `pnpm exec tsc --noEmit` 与 `git diff --check`，目视检查代表页。

### Task 4: 演示收口

**Files:** `docs/AI-项目总况.md` §5.2、预览截图。

- [x] 记录演示页面与正式 CMS 接入边界。
- [x] 检查主导航落点与中英页面无明显错误。

