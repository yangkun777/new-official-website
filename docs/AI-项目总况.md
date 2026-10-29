# DEGSON 新官网 · 项目总况（供 AI / 新接手者）

> **用途**：在 5 分钟内了解仓库**当前真实状态**（含 Git、双工作区、试点功能与 PRD 差距）。  
> **最后更新**：2026-10-26
> **维护**：Demo 工作有完成、暂停或范围调整时，更新相关能力现状、验证结果与「§13 下一步」；分支/工作区变化时同步更新「§2 Git」。
> **进度维护入口**：从 2026-10-21 起，本文件是官网 Demo 当前进度的唯一持续更新入口；每次完成、暂停或调整 Demo 工作，都在这里更新实际状态、验证结果和下一步。`progress-2026-10-08.md` 保留为历史过程记录，不再追加新进度。需求变更统一维护下方链接的 PRD，并记录修订内容。各前台模块当前是否读取 Directus，以及静态演示与正式开发边界，统一维护在 [`演示模块与Directus联动清单.md`](./演示模块与Directus联动清单.md)。

**阅读顺序建议**

| 优先级 | 文档 | 说明 |
|--------|------|------|
| 1 | 本文 | **当前总况**（Git、worktree、试点、与 PRD 关系） |
| 2 | [`PROJECT-HANDOFF.md`](../PROJECT-HANDOFF.md) | 交接、坑位、数据模型、启动命令 |
| 3 | [`DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md`](./DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md) | **正式需求基线（PRD v3.2）** |
| 4 | [`M0.3-底座重建手册.md`](./M0.3-底座重建手册.md) | 删库重建步骤 |
| 5 | [`演示模块与Directus联动清单.md`](./演示模块与Directus联动清单.md) | **前台模块当前联动状态与演示/正式版边界** |

---

## 1. 一句话

**重建 DEGSON 官网**：一套 **Next.js 前台** + 一个 **Directus 11** + 一个 **MySQL 8**，主数据 + `*_translations` 多语言；本地已跑通 **M0.3 底座 + M1 前台**（路径式 `/en` `/zh`）。远程已推到 GitHub；**`feat/base-hardening` 已于 2026-10-13 合并进 `master`**。

**2026-10-16 基座 demo 增量（工作区，未必已全部提交）**：首页/方案/关于/服务改为后台可配；服务页按宏瑞做成「服务板块」树；页头语言切换与社交图标；品牌中文名统一为 **高松**（禁止「德昌」）。

**2026-10-22 前台演示视觉（工作区，未要求 commit）**：领导反馈 UI 不够「高大上」。方向定为白底工业目录（不是绿主题、不是全屏车间色罩）。首页 Banner 现读 Directus；首页其他区块和方案、关于、服务、资讯列表目前是**写死的演示稿**，不读对应 CMS 内容；产品分类、系列与订货号继续展示已有真实数据，版式按首页统一。搜索从首页挪到产品分类/系列页；顶部有产品 banner 轮播。详见 §5.2。

---

## 2. Git 与仓库（重要）

| 项 | 状态 |
|----|------|
| 远程仓库 | **已配置**：`https://github.com/yangkun777/new-official-website.git`（`origin`） |
| 默认分支 | `master` @ `D:\degson-pilot`（已跟踪 `origin/master`） |
| 功能分支 | `feat/base-hardening`（历史分支，内容已合并进 `master`；远程仍保留） |
| 工作区 | 日常开发以 **`D:\degson-pilot`（`master`）** 为准；`.worktrees/base-hardening` 可忽略或日后清理 |
| `.gitignore` | 含 `.worktrees/` |

**对 AI 的约束**

- 扩展在 **`cms/extensions/`**（`excel-hook` / `excel-tools` / `product-media-editor` / `revalidate-hook`），从仓库根目录的 `cms` 启动 Directus。
- 远程默认分支名为 **`master`**（不是 `main`）。
- **不要**提交 `.env`、`web/.env.local`、token 文件。

---

## 3. 技术栈（已定，勿随意更换）

| 层 | 选型 | 备注 |
|----|------|------|
| 后台 | **Directus 11.17.4** | **不升 12**（许可/额度锁死风险，见 HANDOFF §4） |
| 数据库 | **MySQL 8.0** @ 本机 **3307** | 库名 `degson_pilot`；Docker 可选 `docker-compose.yml` |
| 前台 | **Next.js 15** App Router + TS | 数据 **只走 Directus REST**，不直连 MySQL |
| Node | **22.x**（非 24） | `isolated-vm` 预编译与 Directus 沙箱 |
| 包管理 | **pnpm 12** | CMS 构建设置在 `cms/pnpm-workspace.yaml` 的 `allowBuilds` |
| 搜索 | Meilisearch | **未接入**，属 M2 |

---

## 4. 服务与入口

| 服务 | 端口 | 启动要点 |
|------|------|----------|
| MySQL | 3307 | `start-all.ps1` 或 `config/mysql/my.ini` + mysqld |
| Directus | 8055 | `cd cms && pnpm exec directus start`（**扩展在哪个 cms 目录，就从哪起**） |
| Next 前台 | 3000 | 演示用 `cd web && pnpm exec next start -p 3000`（先 `next build`）；改代码时再用 `pnpm dev`。`start-all.ps1` 默认也是 start，加 `-Dev` 才是热更新 |

**一键启动（推荐）**：仓库根目录 `start-all.ps1`（见 HANDOFF §6）。

**验证**

```powershell
curl http://localhost:8055/server/ping          # pong
cd D:\degson-pilot\data; node verify_m1_web.mjs   # 当前 PASS 56 / FAIL 0
```

凭据位置（**文档不写明文**）：`cms/.env`、`web/.env.local`、根目录 `.admin_token` / `.web_token`（脚本用）。

---

## 5. 已完成能力（基线 / master 侧）

- **数据模型**：`category` / `series` / `product` / `news` + 对应 `*_translations`；语言码 **`en` / `zh`** 单一来源 `web/src/lib/lang.ts`。
- **数据量（种子）**：分类 5、系列 60、产品 378（订货号唯一）、新闻 1 条（中英翻译）。
- **前台**：`web/src/app/[lang]/...` 路径式多语言；middleware 无语言前缀 → `/en/...`；`repo.ts` 适配主表+翻译。
- **GEO 基建**：canonical / hreflang / metadata；`next.config.ts` 中 `htmlLimitedBots: /.*/`（无 JS 爬虫可读 head）。
- **后台**：中文元数据、快照 `cms/snapshot.yaml`；**product-media-editor** 等 interface 扩展（master 上至少有 product-media-editor）。
- **品牌**：中文名 **高松**；仓库根目录 [`AGENTS.md`](../AGENTS.md)、[`web/AGENTS.md`](../web/AGENTS.md) 有硬性约定。种子、后台文案、前台若再出现「德昌」应改掉。

### 5.1 最近一轮（2026-10-16）— 营销站与后台运营

面向「新官网 demo 看起来像站、运营能改」而不是全量 1.3 万 SKU。

| 能力 | 后台入口 | 前台 |
|------|----------|------|
| 首页 Hero / 信任条 / 应用带 / 产品图 | **站点配置 → 站点设置**、**内容管理 → 首页内容块**（`home_blocks`）、**内容管理 → 首页 Banner**（`home_banner`） | 首页 Banner 已由 `/[lang]` 读取 `home_banner` / `home_banner_translations`，继续使用原 `HomeBanner` 轮播组件；后台改动经现有缓存刷新链路生效。品牌叙事、公司概览、产品入口、重点产品、应用、通讯卡片等仍由 `HomeCatalogDemo` 静态演示。`home_blocks` 还未接入。完整内容状态见 §5.2 和联动清单 |
| 方案 / 服务 / 关于 页头 | **内容管理 → 页面管理（方案 / 服务 / 关于）**（`site_pages`，slug 下拉） | `/solutions` `/services` `/about` |
| 服务里的具体板块 | **内容管理 → 页面管理 → 服务 → 服务页板块**；新增顶级板块仍从 **页面板块** 创建 | 内容打在 **`/services` 单页**上，**没有**页内左侧目录。旧站「服务一级 + 悬停下的二级菜单/独立子页」**未做**。 |
| 社交外链 | **站点配置 → 社交外链** | 页头/页脚图标 |
| 语言切换 | — | 页头 `HeaderLangSwitcher`，路径式 `/en` `/zh` |

**服务页集中编辑样本（2026-10-21）**

- 同一条「服务」页面记录里可打开中英文页面内容与 SEO、共用图片、8 条现有服务板块，并通过中英文按钮预览。页面记录仍只有一条，语言内容保存在翻译表中。
- 已在真实 Directus 页面打开现有板块，修改后台显示名并通过页面保存流程落库，随后恢复原值。关系与字段脚本均可重复运行，补关联时不覆盖正文。
- 后台列表的页面类型、发布状态改为中文显示；首页、新闻列表的后台名称在原值为空时补齐。实测中文与英文服务页均为 200，后台服务板块内容仍正常展示。
- 建模脚本：`node data/apply_service_page_editor.mjs`；只读验收：`node data/verify_service_page_editor.mjs`。页面板块表的原有 `page_slug` 保留，前台服务页渲染逻辑未改。
- 样本限制：从页面表单可编辑已有板块；新增顶级板块仍从独立列表进入并选择所属页面。`robots.txt` / `llms.txt` 后台配置尚未开发。
- 本轮校验：`verify_service_page_editor.mjs`（8 条关联）、`verify_directus_admin_ui.mjs`（193 项）、`verify_page_sections.mjs`（8 条）通过；`verify_m1_web.mjs` 91 项通过，前台 TypeScript 与 `git diff --check` 通过。

**服务板块数据**

- 集合：`page_sections` + `page_sections_translations`。
- 树：上级板块自关联。种子示例：研发技术能力 → 强大的研发能力 / 模拟仿真 / 技术支持 / 专利；另有认证实验室、下载中心、FAQ。
- 每条翻译字段：标题、简介、数据 1 / 介绍、数据 2 / 介绍、介绍 1、介绍 2；主表有图片（`product-media-editor`）、显示顺序、发布状态。
- 多语言用 **list-o2m**（`zh · 标题` / `en · 标题`），不要用 Directus 原生 translations 控件（本项目语言存在翻译表的 `language` 字段，原生控件会显示空下拉）。
- 初次建库种子：`node data/seed_page_sections.mjs`；已有运营内容时不要重跑该种子，以免覆盖正文。日常补建页面关联用 `node data/apply_service_page_editor.mjs`。
- 元数据/权限：`apply_directus_admin_ui.mjs`、`apply_content_editor_access.mjs`；校验 `verify_page_sections.mjs`、`verify_directus_admin_ui.mjs`。

**产品图预览（`product-media-editor`）**

- Directus 文件 UUID → `/assets/{id}`。
- 站点 public 路径（如 `/images/marketing/hero-solutions.jpg`）必须走前台 `http://{当前主机}:3000/...`，**不能**当成文件 ID 打 `/assets/...`（会 403，预览白块）。
- 本机 `cms/.env` 的 `CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC` 需含历史 CDN（`enoss.degson.com`、`oss.degson.com`）以及本地预览用的 `http:`。OSS 防盗链会拦 `localhost` Referer，预览控件必须 `referrerpolicy="no-referrer"`。此文件 gitignore，换机器要重配。
- 改了 `cms/extensions/product-media-editor/src/interface.vue` 后必须更新 `dist/app.js` 并 **重启 Directus**。在扩展目录对占用中的 cms 跑 `pnpm build` 可能误触发 `isolated-vm` 重编译（Windows 上 Directus 占用 .node 时会把包拆坏）；优先在扩展目录 `pnpm exec --ignore-workspace directus-extension build`，或停掉 Directus 再装依赖。

### 5.2 2026-10-22 — 首页白底工业目录演示

给领导看效果，**当前首页、行业方案、关于、服务、资讯列表的视觉与新增内容主要属于演示版**，暂以双语静态组件呈现，目的是丰富内容、确认排版与动效。首页 Banner 已接入 Directus 内容；首页其它营销区块及行业方案、关于、服务、资讯列表仍为静态演示。产品分类、系列和订货号仍沿用已有真实数据。未 commit。

**PRD 功能进展（2026-10-26）**：首页 Banner 已由 `/[lang]` 服务端读取 `home_banner`，按当前语言过滤整体发布状态与翻译状态，并复用原轮播组件。`data/apply_home_banner.mjs` 已调整为只补建缺失的种子记录，不覆盖运营已有文案、图片、排序和状态。前台样式与交互保持不变；Directus 保存后前台实际刷新仍需按 PRD 现场验收。其它首页内容仍是静态演示。

**正式开发的明确要求（用户于 2026-10-23 重申）**：演示通过后，前台所有区域均须能在 Directus 中配置。当前写死的演示稿不是正式内容管理方案，不能将本轮静态展示记作 CMS 联动已完成。

各页面和模块的逐项状态（包括部分联动的页头、页脚、产品中心与产品展示）见 [`演示模块与Directus联动清单.md`](./演示模块与Directus联动清单.md)。后续每增加或调整一个静态演示模块，必须同步更新该清单；正式开发后逐项将状态更新为实际接入并记录“后台修改 → 前台显示”验收结果。**正式版要求是前台每个内容模块都与 Directus 联动，不以当前演示状态作为例外。**

- 配置范围覆盖顶部导航、页脚、首页、行业解决方案、关于、服务、资讯及产品展示区域；运营所需的中英文标题、正文、图片、视频与封面、卡片、FAQ、按钮文案与目标链接、排序、启停和区块组合等均要纳入内容模型。
- 本轮新增的场景连接点、连接需求矩阵、关于页能力切换、服务类型、工程沟通清单与流程，也要迁入可配置模型；轮播间隔、自动播放开关及需要运营调整的交互参数应提供配置。组件与动效实现继续由前端代码维护，运营通过后台配置其内容和展示选项。
- 2026-10-26 关于页补充公司概览双语内容（创立年份、官网列示的实验室资质、应用行业）并使用高松官网园区图；当前是静态演示，正式开发时事实数据、资质有效状态、文案、图片和顺序都要接入 Directus，详见联动清单。
- 正式接入时统一使用 Directus 关联媒体与中英翻译，不继续把内容散落在组件常量里；提供中文字段说明、有限选项下拉、媒体预览和真实编辑路径。同步维护种子、权限、配置脚本和前台验收，验证“后台修改 → 前台显示”。
- 当前交互只展示浏览与需求整理体验；不能视为已完成下载中心、客户咨询工单、定制受理或工程服务承诺。正式功能按实际业务流程另行开发和验收。

**视觉约定**

- 白底、细线、少圆角少阴影；正文黑 `#161616`，品牌色不再铺满首屏。
- 顶栏用官网 logo：`https://oss.degson.com/imgs/logo.png`（本地 `web/public/images/degson-logo.png`），不再用红三角 + 文字。
- 语言切换改为黑/灰，不再用主题绿（`LangSwitcher`）。
- 字体：`IBM Plex Sans` + `Noto Sans SC`（`web/src/app/[lang]/layout.tsx`）。
- 图片进视野时裁切展开（`MediaReveal`）；尊重 `prefers-reduced-motion`。
- **不上全屏首屏视频**：旧站/bb&b 可以，本仓库没有高松成片；白底目录也不该再盖车间片。有产品特写成片后再接到 banner 右侧。

**首页现在长什么样（对照旧站 [www.degson.com](https://www.degson.com/) / [degson.com.cn](https://www.degson.com.cn/?lang=cn)）**

| 块 | 做法 |
|----|------|
| 顶部 banner | `HomeBanner`：3 张高松官网自有横幅（圆形连接器、储能连接器、PUSH-SNAP），约 6.5s 轮播；完整横幅铺开、左侧文字叠加、手动切换与悬停暂停 |
| 品牌过渡 | 深色品牌叙事带，衔接首屏与产品 |
| 产品族 | 4 个重点入口：接线端子、圆形连接器、重载连接器、能源连接器 |
| 重点产品 | PUSH-SNAP 图文带，使用高松官网原图 |
| 应用 | 工业自动化、新能源、轨道交通；官网对应图只有 302×302，放大后发虚，演示页改用项目里已有的 1200px 行业场景图 |
| 数据与新闻 | 暂时移除演示数字、系列参数表与虚构日期，避免展示时产生口径问题 |
| 搜索 | **不在首页**。分类页、系列页的 `ProductSearch` 仅支持订货号、接线端子、圆形连接器；其他词显示提示，不再误跳到接线端子。正式全文搜索仍待开发 |
| 顶栏「产品」 | 链到 `/product/category/terminal-blocks`，不再是首页锚点 |

**关键文件（演示可整份删）**

- `web/src/components/HomeCatalogDemo.tsx` — 首页演示稿
- `web/src/components/HomeBanner.tsx` — 轮播
- `web/src/components/ProductSearch.tsx` — 产品模块搜索
- `web/src/components/MediaReveal.tsx` — 图片揭示
- `web/src/app/[lang]/page.tsx` — 只挂 SEO/JSON-LD + `HomeCatalogDemo`
- `web/public/images/marketing/home-banner-*.jpg` — 从 `www.degson.com` 当前英文站提取并存到本地的原图；PUSH-SNAP 与圆形连接器复用已有官网原图。行业卡使用已有 `feature-automation.jpg`、`feature-energy.jpg`、`feature-rail.jpg` 高清场景图
- 分类/系列页插入搜索：`web/src/app/[lang]/product/category/[slug]/page.tsx`、`.../series/[matecode]/page.tsx`

**同日内页演示延展**：用户确认把首页白底、墨色字、品牌红的视觉语言扩展到方案、关于、服务、新闻和产品浏览路径。方案、关于、服务、新闻列表改成双语静态演示内容，不读 Directus；方案页用高清场景图与交错的大幅图文，不再使用青绿罩层或三张相同卡片。新闻列表改为不标虚构日期的产品通讯入口，避免后台测试新闻露出。分类、系列、订货号及新闻详情仍保留现有真实数据读取，只统一排版。中文 `terminal-blocks` 与 `circular-connectors` 两个首页主推分类加静态演示标题/说明；更深层的英文数据仍以 EN 提示跳英文页。正式开发时再接回营销栏目与翻译数据。设计与实施边界见 `docs/superpowers/specs/2026-10-22-demo-interior-pages-design.md`。

**新闻列表到详情修正（2026-10-23）**：保留现有新闻列表的图文排版和三篇双语静态演示内容，修复卡片误链到产品分类/解决方案的问题；现在每篇进入自己的本地化 slug 详情，可切换另一语言并返回列表。之前的三个去向分别作为统一样式的「继续探索」入口放到对应详情底部（接线端子、圆形连接器、新能源方案）。已知静态演示 slug 在 CMS 没有对应新闻时显示演示详情；真实 CMS 新闻详情仍按 Directus 内容读取。实现见 `web/src/lib/newsDemo.ts`、`NewsDemo.tsx` 与 `web/src/app/[lang]/news/[slug]/page.tsx`；`data/verify_news_demo_navigation.mjs` 通过。

**新闻 UI 细节（2026-10-23）**：保留新闻列表首篇大图、侧边两篇的原排版；列表图片复用 `MediaReveal` 做轻量滚动进入，卡片补键盘焦点提示和阅读箭头反馈；新闻详情主图加入同一套轻量进入效果。系统设置减少动态效果时关闭图片位移/缩放与过渡。

**2026-10-23 演示 UI 续修**：关于页首屏标题/说明与页尾图文、产品中心的产品族标题及底部工程引导、服务页流程标题补左右方向轻量入场；产品族卡片补键盘焦点图片反馈，服务页 CTA 的焦点状态与悬停状态一致。沿用已有 `ScrollReveal`/`MediaReveal`，内容初始可见，快速滚动不留空白，系统要求减少动态效果时关闭过渡。这些图文仍是静态双语演示内容，正式开发迁入 Directus 的范围见 `docs/演示模块与Directus联动清单.md`。

**2026-10-23 首页内容补充**：在行业应用与选型支持之间增加三篇“产品与应用通讯”图文卡，复用 `lib/newsDemo.ts` 的双语演示文章，分别进入对应的本地化新闻详情。封面使用已有本地高清素材，图片入场与悬停/键盘焦点反馈沿用当前动效；不新增虚构日期。该区块为静态演示，不读取 Directus；正式开发要让后台配置选篇、顺序、封面、文案与启停。

**2026-10-23 演示新闻语言入口**：顶部语言切换 `HeaderLangSwitcher.tsx` 现能对三篇演示文章使用另一语言的 slug，实测中文文章顶部切到英文详情、英文顶部切回中文均正常。正式 CMS 新闻及其他详情页的跨语言 slug 映射仍需从 Directus 获取并统一验收。

**2026-10-23 全站页脚**：原单行版权/社交图标扩为深灰多栏页脚，增加产品、探索、支持三组双语导航、联系邮箱和回到顶部的轻量反馈，使长页面收尾更完整。版权文字和社交外链继续读取原有 Directus 数据；导航栏目、邮箱和引导文案仍为前端静态演示，正式开发需迁入 Directus。`SiteFooter.tsx` 与布局传入 `lang`，中英文页面均已检查。

**2026-10-27 全站页脚视觉调整**：参照用户提供的设计图，把页脚改为带高松真实厂区照片的深色联系横幅、紧凑的产品/方案/服务/关于四栏导航、新闻入口、社交图标和底部版权区；Logo 保留红色标识并在深底显示白色字样。新闻入口直接进入新闻页，没有做无后端的假订阅表单。版权文字与社交链接继续读取 Directus；横幅图片/文案、栏目、联系邮箱和入口仍属演示静态配置，正式开发按《演示模块与Directus联动清单》迁入 Directus。独立构建、TypeScript 检查通过；`localhost:3000` 的中英文首页、方案/新闻/FAQ 与厂区图片返回 200。

**2026-10-27 首页视觉试版**：按用户提供的深色工业风参考，仅调整首页：第一张 Banner 视觉图暂用旧英文官网的高松深色产品横幅 `web/public/images/marketing/home-dark-industrial.jpg`，标题、说明、按钮和跳转仍读取 Directus；其余轮播图片仍读 Directus。原深色公司介绍收紧为浅色实力条，四个产品族入口改成左侧导语、右侧 2×2 紧凑卡片；保留原有行业、视频、技术和新闻区块及其他页面。此为可回撤的演示视觉试版，不代表首页图片或营销内容已经完成后台联动，正式开发要恢复第一张 Banner 图片的 Directus 配置。改前的 `HomeBanner.tsx`、`HomeCatalogDemo.tsx`、`globals.css` 备份在 `.codex-tmp/home-style-before-2026-10-27/`。联动边界同步记录于《演示模块与Directus联动清单》。

**2026-10-23 异常页面统一**：`/[lang]/not-found.tsx`、`error.tsx` 改为白底、深灰与品牌红的双语页面，提供清楚的返回/重试路径，移除面向访客的原始错误堆栈。中英文 404 已实测；首页通讯封面比例微调以减少宽图裁切，页脚社交图标悬停边框也统一为品牌红。

**2026-10-23 产品分类视觉续修**：分类首屏、目录标题与底部工程入口加入轻量左右入场，分类/系列卡片键盘焦点与悬停反馈一致。接线端子页的三个英文子分类卡片临时提供中文演示标题与摘要，同时保留 EN 标识和英文详情链接；正式开发必须由 Directus 补齐中文翻译，不能把前端静态覆盖视为完成。

**2026-10-23 产品详情视觉续修**：详情首屏参数卡片、咨询/返回按钮和图库放大入口统一品牌红交互反馈；缩略图悬停、选中与键盘焦点一致，图片弹层关闭按钮也补齐焦点状态。下方参数行、资料下载行、相关产品卡片加入轻量阅读/焦点反馈，长页面仍保持克制。保持产品参数、媒体与附件原有 Directus 来源，没有增加静态产品资料。浏览器验证放大与关闭弹层正常。

**2026-10-23 首页行业应用改版**：把原先三张同尺寸竖卡改为一大两小的横向图文编排，减少对现有横幅素材的裁切；每张卡补一条中英文场景说明，并直达行业方案页对应的自动化、新能源、轨道段落。图片滚动轻量进入，鼠标悬停和键盘焦点显示同一套放大、红线与箭头反馈；减少动态效果时关闭过渡。这些场景文案和排序仍为前端静态演示，正式版需由 Directus 配置。

**2026-10-23 关于页导览细节**：首屏制造场景大图下方保留「1990 高松创立」，把原先三个短链接扩为产品、应用、支持三栏导览，展示已有双语说明并给出明确去向。卡片加入轻量滚动进入、顶部红线和箭头的悬停/键盘焦点反馈；中文应用入口已验证到达本页对应段落。三栏标题、说明、动作、链接与顺序仍为静态演示，正式版需纳入 Directus。

**2026-10-23 服务页资料路径改版**：把规格参数、图纸模型、安装应用三张平均卡片改为左侧固定阅读说明、右侧三条资料路径，补充「先定位产品，再逐项核对」的双语引导。每条路径保留原有目标链接，图标线条、顶部红线与箭头在悬停和键盘焦点时反馈；手机改为单列并保持操作文字可见。该区文案、图标对应、顺序和链接仍是前端演示配置，正式开发迁入 Directus。

**2026-10-23 产品中心视觉续修**：首屏复用本地高松高清 PUSH-SNAP 横图，放大产品画面；接线端子产品族入口换成另一张高松产品图，消除首屏与入口的重复用图，并按素材构图调整四张产品族卡片裁切。产品族说明明确当前可筛选的是真实端子系列，其余入口通向已有产品族或应用页；重点产品的中文参数标签补充翻译，参数值仍来自现有产品资料。产品族图片、说明和展示方式属于静态演示配置，正式版须迁入 Directus；60 个真实系列目录、样板产品及其参数来源不变。

**2026-10-23 产品目录图卡密度微调**：系列卡片图片区从 4:3 改为 16:10，缩小图像内边距，使已有真实产品图在目录中更清楚、卡片更紧凑；重点产品参考图也适度放大。保留原图比例、型号链接、筛选、分页及真实数据来源。此项只改前端展示样式，不新增演示数据或 Directus 字段。

**2026-10-23 产品目录切换反馈修正**：筛选、排序和翻页时不再强制重新挂载整个系列卡片网格，也移除整块网格重复淡入位移。结果、数量和当前页显示范围仍立即更新，避免连续输入或快速筛选时目录反复闪动；分类、视图切换、筛选标签和分页补统一键盘焦点反馈，卡片悬停与产品跳转保留。此项只改交互呈现，目录内容仍来自 Directus。

**2026-10-23 方案页产品入口图卡微调**：底部三张产品族卡片按现有高松横幅素材改为 16:10 画框，优先保留产品所在的右侧构图，减少原先完整缩图带来的大面积留白；鼠标及键盘焦点补轻微图像/箭头反馈，减少动态效果时禁用位移。图片、文案、顺序和去向仍为静态演示配置，正式开发迁入 Directus。

**2026-10-23 服务页结尾图文密度微调**：底部重载连接器横幅改为 16:10 横向画框并按产品侧裁切，减少 4:3 完整缩图产生的留白；仍使用现有本地高松素材，文案与链接不变。该图片和结尾图文仍是静态演示配置，正式版纳入 Directus。

**本轮暂停点（额度原因）**：方案、关于、服务、资讯列表及产品分类/系列/订货号页已完成首轮视觉改版；关于页改为通栏大图版式，产品搜索修正误跳转，系列页中文面包屑和方案页按钮文案已补齐。`pnpm exec tsc --noEmit`、`git diff --check` 通过；主要页面已做桌面/手机浏览器抽查，产品浏览链路可走通。**下次继续**：重点目测刚改的关于页通栏图和搜索提示交互，按反馈微调各内页排版；演示稿尚未 commit。当前营销页是静态展示，正式开发时再接 Directus；产品深层中文翻译仍未补齐。

**同日续作：轮播与图片动效**：复现首页轮播在按钮获得焦点后持续暂停的问题，改为默认每 6.5 秒切换、显式暂停/播放；手动选图后继续计时，页面不可见时暂停计时，系统开启减少动态效果时默认不自动播放。首页 Banner 新增鼠标按住左右拖动切换，移动端同一套 Pointer Events 支持手势滑动；拖动过程跟手，距离或速度达到阈值后切换，否则回弹，拖动结束还会阻止误点链接。手机端隐藏重复的数字计数，避免控制按钮被挤出。浏览器已实测左右双向拖动切换。TypeScript 与 diff 检查通过，仍未 commit。

**后续品牌视频素材**：首页 banner 下方深色品牌过渡区仍适合高松自己的产线、自动装配、检测或产品微距画面，截取约 8–15 秒的无声循环；建议横版 1080p 以上、无大面积字幕。若找到较完整的企业/工厂宣传片，可放关于页通栏图位置，点击播放。先拿到素材再确定裁切、封面和加载策略。

**PUSH-SNAP 短视频已接入首页**：用户提供 `https://enoss.degson.com/upload/image/20230720/DGPS2.5R-5.0-en.mp4`，原片约 110.23 秒、1280×720、13.9 MB。本轮截取原片 31–40 秒的导线插入动画，裁去上下说明文字，首尾淡入淡出，移除音轨；成片 `web/public/videos/push-snap-loop.mp4` 为 9 秒、1000×480、约 1.35 MB，封面为 `web/public/images/marketing/push-snap-video-poster.jpg`。`ProductLoopVideo.tsx` 在首页 `#push-snap` 区可见时自动静音循环，离屏/页面隐藏时暂停，支持手动暂停，减少动态效果偏好下默认展示封面。原片保留在 `.codex-tmp/media/DGPS2.5R-5.0-en-source.mp4`。

**图片与视频动效调整**：首页四个产品入口、三个行业入口以及方案/关于页继续复用 `MediaReveal`，但已取消会把图片完全遮住的裁切揭示，图片从首屏起始终可见；进入视口只做 1.06→1 的轻缩放，悬停放大到 1.05，快速下滑不会出现疑似卡住的空白。PUSH-SNAP 短视频恢复原展示尺寸，移除播放/暂停按钮，在可见区域内自动静音循环，离屏或页面隐藏时暂停；系统减少动态效果设置仍生效。

**同日续作：滚动节奏、首页信息与分页主题**：新增通用 `ScrollReveal`，首页及方案、关于、服务页的图文容器按版式从左、右或下方轻快进入；观察范围提前到视口外 140px，位移收敛到 20–28px、时长 520ms，初始透明度保留 0.9，因此快速下滑也不会留下空白。`MediaReveal` 同步支持方向并沿用“图片始终可见”的安全策略。首页补充 1990、40,000+、UL/VDE/CNAS 三组实力信息，以及“浏览产品目录 / 获取选型与资料支持 / 按行业查看解决方案”三条工程浏览路径，让演示内容更接近成熟工业官网。产品系列分页取消旧绿色和圆角，当前页统一改为品牌红 `#af1728`，普通页码维持白底灰边、悬停转红。相关文件：`web/src/components/ScrollReveal.tsx`、`MediaReveal.tsx`、`HomeCatalogDemo.tsx`、`Pagination.tsx`、`web/src/app/globals.css`。浏览器已用快速连续滚动验证内容不会消失，并确认分页当前页计算样式为 `rgb(175, 23, 40)`；`pnpm exec tsc --noEmit` 与 `git diff --check` 通过，仍未 commit。

**2026-10-23 续作：首页与服务页交互打磨**：新增双语静态 `ServiceExplorer.tsx`，服务页加入“产品选型 / 技术资料 / 定制支持”三类可切换面板，图文与需求清单同步更新；支持鼠标、触屏和键盘方向键/Home/End，FAQ 通过收放动画展开并同步无障碍状态。原三张支持卡片改成深色连续流程线，首屏按钮直接进入工程支持面板。首页 `ConnectionJourney` 加入各阶段产品/场景原图，4.2 秒自动推进；鼠标停留、键盘焦点、离屏和切后台时暂停，移动端节点改成 2×2 排列；系统减少动态效果时不自动推进。内容区 `overflow-x: clip` 防止左右入场位移产生手机横向滚动，不创建嵌套滚动容器。桌面实测三种服务面板高度一致、键盘切换与 FAQ 展开正常；390px 手机视口的服务页与首页内容宽度等于可用视口，阅读暂停测试正常。全部继续按演示内容处理，不读 Directus，也未提交 Git。行业方案页已复看，下一步可围绕“场景大图 → 应用连接点 → 产品组合 → 技术支持”增加内容深度，避免直接套用招聘页内容。

**2026-10-23 行业方案页扩充**：参考用户提供的版式稿中“大图、流程、卡片、FAQ 交替”的节奏，`SolutionsDemo.tsx` 从三组简短图文升级为完整双语演示页：三行业章节、9 个应用连接点、产品组合、四步项目推进与方案 FAQ。新增客户端组件 `IndustryApplications.tsx`：场景图点位、下方选项、应用说明、3 项选型关注点和相关产品方向同步切换；支持触屏及方向键/Home/End；悬浮行业导航跟随当前章节，减少长页面查找成本。图片优先复用现有高松产品素材及已确认的高清行业图，图片点位为应用方向示意，不代表照片中的具体设备型号或认证承诺。关联入口使用现有产品分类或服务支持，不制造虚构下载和项目案例。继续静态演示、不接 CMS。已在桌面及 390px 手机视口验证中英文显示、点位联动、锚点、键盘操作和 FAQ；手机页面无横向溢出。后续正式开发再迁入 Directus 内容模型。

**2026-10-23 方案页第二轮内容与动效**：新增双语 `SolutionWorkbench.tsx`，以 4 类连接需求 × 4 个产品族的交互矩阵展示浏览起点，点选任务后同步切换产品图、说明、关注条件和现有产品/服务入口；“优先了解 / 可组合了解”只表达应用方向，不作为型号或性能承诺。手机端矩阵局部横向滑动，提供当前方向和“查看说明”锚点；修复表格内无障碍文字绝对定位导致的页面横向溢出，390px 中英文视口实测根页面宽度与可用视口一致。自动化章节后新增“连接细节”视频图文区，复用原有 9 秒 PUSH-SNAP 静音循环，离屏暂停、减少动态效果偏好继续生效。场景点位新增选中扩散和通向说明面板的流动虚线（只在场景可见时播放）；悬浮行业导航增加阅读进度，矩阵区对应“连接需求速览”状态；产品卡片增加红色边线与悬停反馈，标题按预期换行。桌面实测矩阵切换高度一致、四类任务联动正确、视频处于 muted/loop/playing 状态；静态演示范围与后台联动边界不变。

**2026-10-23 关于与服务页续作**：沿用行业方案页的白红视觉、大图、深浅区块与轻快动效。关于页增加创立年份、`AboutCapabilities.tsx` 设计/制造/应用三种切换面板、四项连接确认维度和三行业图片入口；切换同步更新图片、说明、标签与三步流程线，支持方向键/Home/End。服务页新增 `ServicePreparation.tsx` 六项工程沟通清单，点选同步更新进度与摘要，可复制成邮件准备清单；补充规格、图纸和应用资料入口，流程扩成四步，FAQ 移至流程之后。复制功能只整理需求，不提交询盘；资料入口指向现有目录与方案，不冒充可下载文件。相关新增内容均为演示稿，正式开发按本节开头要求迁入 Directus。

**2026-10-23 顶部导航偶发等待处理**：用户反馈任意顶部菜单都可能出现停留原页。排查未发现遮挡，开发日志实际出现页面重新编译 14.4 秒，浏览器捕获过 `Connection closed`。仅添加加载提示不足以处理该情况，因此 `SiteNavigation.tsx` 六个主菜单、logo 和顶部语言切换改为原生链接，跳转不再依赖 App Router 的待处理客户端状态；保留悬停反馈，扩大点击区域，标出当前页面，并在点击时提示加载。保留 `[lang]/loading.tsx` 供其他站内客户端链接使用。`next.config.ts` 将开发页面闲置保留延长到一小时、缓冲 12 页，减少演示往返时淘汰页面并重复编译。重启后已预热主要演示路径；六菜单连续往返实测均到达正确 URL 与 H1（该轮约 0.9–1.5 秒），包括产品 → 方案。开发服务器重启后的首次编译仍可能较慢；正式演示与上线应使用构建后的运行模式，不能把开发热更新环境当作生产稳定性验收。

本轮验证：TypeScript 与相关已跟踪文件的 `git diff --check` 通过；服务清单点选 3 项后显示 3/6、对应摘要正确，复制成功提示正常；关于页点击及 Home 键切换正常。390px 手机下中英文关于与服务页根页面 `scrollWidth === clientWidth`，FAQ 仅一份。预览：`web/public/preview/about-capabilities-2026-10-23.png`、`web/public/preview/services-preparation-2026-10-23.png`。继续保留工作区改动，未提交 Git。

**2026-10-23 FAQ 演示模块**：新增中英文 `/[lang]/services/faq`，统一白底、品牌红、细分隔线与现有字体。`FaqDemo.tsx` 提供四类主题筛选、关键词搜索（问答正文及辅助关键词）、常用词入口、匹配计数、无结果重置和带收放动效的问答列表；桌面左侧分类随阅读停留，手机改为上方两列分类。`lib/faqDemo.ts` 集中维护 12 条双语演示问答，服务页摘要复用同一来源，避免两套文案后续打架。入口在顶部“服务”二级菜单和服务页“查看全部常见问题”；服务主菜单仍能直接进入总览，子项保持原生跳转。二级菜单支持鼠标悬停、手机点击、键盘 Enter/Escape 与点击外部关闭，手机菜单展开不挤动导航或产生横向溢出。

本模块仍是丰富页面的演示版，尚未接 CMS。演示确认后，FAQ 分类、标题/答案、辅助关键词、推荐词、排序、发布状态、中英翻译、联系入口与导航项等均须迁入 Directus 可配置内容；有限选项用下拉，按真实后台编辑路径验收。问答仅为一般性工程沟通说明，不替代具体型号资料，也不承诺样品或交付条件。

FAQ 验证：分类筛出 3 条、`CAD` 检索出 1 条、无结果提示与重置正常，问答可通过 Enter 展开；英文多词 `wire voltage` 搜索正常。顶部子菜单及服务页入口均实测到达 FAQ，手机点击展开、外部关闭及 Escape 关闭正常。390px 中英文页面与菜单均无横向溢出，英文手机导航仍为单行。TypeScript 与相关已跟踪文件的 `git diff --check` 通过。截图：`web/public/preview/faq-desktop-2026-10-23.png`；未提交 Git。

**2026-10-23 产品展示闭环优化**：新增中英文 `/[lang]/products` 产品中心，顶部“产品”和产品页的面包屑/返回入口指向总览。首屏合并搜索与产品展示，补充四个产品族浏览方向、重点产品及工程支持入口；端子目录直接呈现已有 60 个真实系列（PCB 插头、PCB 插座、导轨/面板各 20 个），不用逐层点到目录底部。其余产品族入口按实际内容指向现有分类或行业应用，不把展示方向当成新增型号。没有全量导入旧库，也未新增 Directus 模型。

- 新增 `SeriesExplorer.tsx`、`catalogData.ts`、`catalogTypes.ts`：分类、名称/系列码搜索、间距与额定电流筛选、名称排序、12 条分页和无结果重置。数据仍读 Directus；参数摘要仅提取旧系列简介里明确标注的值，额定电压的类别/污染等级条件不被擅自省略；产品主表中的历史 `pitch` 码未当作毫米参数展示。分类页复用目录筛选，端子一级分类直接展示三级连接方式入口；原 `?page=2` 仍可作为初始页读取。
- 系列页增加简介中已有的间距、电流与真实型号数；`VariantTable.tsx` 增加型号/极数/订货号即时筛选、结果计数、滚动表头和行反馈。目录、型号、主搜索均保留有效原生导航。主搜索支持订货号、现有类别及系列名称，名称查询进入产品中心 `?q=...#catalog`，不是全量搜索引擎。
- 系列详情 URL 已由纯 `matecode` 切换为 `series_translations.slug`（例如 `/product/series/9edgk-5.0`）；旧 matecode 地址保留并重定向到规范 URL。订货号详情使用“型号 slug + 订货号”，旧纯订货号地址继续兼容。正式开发时可读 slug 由 Directus 管理，当前演示 slug 生成规则及模块边界见 [`演示模块与Directus联动清单.md`](./演示模块与Directus联动清单.md)。

**2026-10-26 产品规范 URL 更新**：在上面的 10-23 阶段基础上，产品分类、系列和已关联系列的 SKU 改为按真实分类父子层级组成地址，例如 `/en/products/terminal-blocks/pluggable-terminal-blocks/pcb-plug/9edgk-5.0`，SKU 再追加可读型号与订货号。中文路径使用对应的中文分类 slug；缺翻译时收敛到有内容的语言。旧 `/product/category/…`、`/product/series/…`、`/product/{订货号}` 由 Middleware 在渲染前返回 HTTP 301；层级不符或 SKU slug 不完整也跳到规范地址。页面样式未改，站点地图和产品目录内链接已使用层级路径。本地独立 `next start` 构建与 HTTP 验证通过（规范页 200、旧路径及错误层级 301、sitemap 含分类/系列/SKU）。当前 SKU 可读段仍由型号与订货号实时生成，未迁成 Directus 可编辑且持久化的翻译 slug；正式开发按 PRD 完成字段、冲突校验、变更后旧地址映射和全量迁移。缺分类祖先或没有系列关联的记录暂保留旧式路径，待数据补齐。

**同日图片故障修复**：上线前发现 Middleware 的通配匹配把 `/images/products/...` 当作 `/:lang/products/...`，错误跳到 `/en/images/products/...`，使产品图片接口返回 404/400。将匹配项限定为 `/en/products`、`/zh/products` 后，在当前 `localhost:3000` 上逐张请求产品中心、接线端子分类及 9EDGK 系列页共 56 个图片地址，失败 0。演示端口已切到包含此修复且使用真实字体文件的新构建。
- 重点样板为已核对的订货号 `10010012354`（2CDGKRP-5.08）：参数摘要、5 项技术参数、UL/VDE 条件数据与 PDF/CAD/STP 下载仍取已有后台资料。补充系列参考图并明确“具体外观以订货号为准”，不把它当作该 SKU 的实拍图。`ProductMediaGallery.tsx` 支持真实图片切换与原生弹窗放大、键盘切换及 Escape 关闭；`ProductEngineeringGuide.tsx` 增加工程核对路径，资料导航随滚动停留。STP 当前作为文件下载，交互 3D 浏览需后续转换模型并另行开发。
- 官网系列图、分类图和参考图的 63 个图片来源已缓存在 `web/public/images/products/`，映射位于 `catalogAssets.ts`，减少演示时远程图片超时；图片来源可追溯至已有库记录及旧站只读缓存。发现一条缺名称、含测试文本的中文系列翻译，系列读取现仅将有名称的翻译视为可展示内容，回退至完整英文行；没有修改或删除后台记录。
- 继续按演示版处理：产品中心的文案、产品族展示、重点产品选择、分类配置、参考图及工程引导等仍有静态配置，正式开发均须迁入 Directus，按本节开头的全区域可配置要求实现。真实型号、参数、文件和认证条件没有改成 mock；现有圆形连接器演示方向未计入这 60 个真实端子系列。

本轮已验证：目录显示 60 个系列，PCB 插头 + 5.08mm 筛出 4 个；分页、空结果、重置和名称搜索正常。目录 → 9EDGK-5.0 系列 → 11 个型号 → 订货号详情链路正常，型号查询可缩小到 1 个。样板图放大及 Escape 关闭正常，PDF/DXF/STP 三个下载接口均 200、附件文件名正确。390px 中英文产品中心及样板详情无页面横向溢出；手机弹窗和资料入口正常。按用户要求不再生成后续预览截图，直接在网页查看。关键文件包括 `ProductsDemo.tsx`、`SeriesExplorer.tsx`、产品分类/系列/详情路由和上述组件；未提交 Git。

**2026-10-23 产品 UI 细节第二轮**：`SeriesExplorer.tsx` 增加可单独移除的筛选条件、网格/列表视图切换及桌面悬浮筛选栏；列表视图把产品图、名称、间距/电流和查看入口组织成横向行，手机自动回到单列卡片，筛选栏在手机保持普通滚动。卡片图片、底部红线与入口箭头在鼠标悬停和键盘聚焦时提供一致反馈。系列首屏采用 `MediaReveal`/`ScrollReveal`，详情图与介绍也按左右方向轻快进入，沿用初始可见、快速滚动不留白的策略，并尊重减少动态效果偏好。

新增 `ProductContentNavigation.tsx`，产品资料悬浮导航随当前阅读章节更新红色选中状态，手机横向导航会把当前章节带入可见范围；原生锚点仍可直接跳转。验证了 5.08mm 筛选显示 19 个系列、单项条件移除恢复 60 个系列，列表名称与参数无重叠；390px 目录和详情根页面无横向溢出。Downloads 跳转后选中状态正确，标题位于悬浮导航下方，图片放大与 Escape 关闭回归正常。新增交互仍按演示版处理，正式开发的运营配置范围沿用本节开头约定。按用户要求未再生成预览截图。

**未做（首页演示范围外）**

- 顶栏产品大菜单（旧站悬停一级/二级）
- 真搜索（Meilisearch）
- banner / 新品通讯接回 Directus

**第二类目试点**

- 圆形连接器等演示分类/图，优先用本地旧库 `degson_legacy.hr_article.thumb`，不要用网图凑。脚本：`data/seed_demo_circular_category.mjs`。端子三个子分类中文翻译：`data/ensure_zh_terminal_subcategories.mjs`。

**尚未按 PRD v3 生产形态完成**

- **前台会员登录及后台会员管理**：已确认为整体上线硬门槛；当前 demo 尚无会员认证、旧账号迁移与真实登录验收，见 PRD v3.2 §6.1.1。
- 独立语言 **域名 + Host rewrite**（当前为 localhost 路径式 + 部分硬编码 `SITE_ORIGIN`）。
- `site_settings` **无翻译表**。
- 列表 **导入导出** 的 PRD 级模板/校验/错误报告/权限追溯（见 §6）。
- **可配置后台菜单**（增删排序/角色可见，且不替代权限）。
- FAQ、认证、附件、Meilisearch、全量迁移与 301。
- 方案/关于尚未做成与「服务板块」相同的树（集合已预留 `page_slug`）。
- Directus 保存后 **按需踢 Next 缓存**：接口 + `revalidate-hook` 本地已接通；旧 Flow 保持停用。`next start` 下改分类中文名后，规范中文 URL 立刻更新。详见 §7。

---

## 6. Excel / 后台试点（已在 master）

> **状态**：已合并 `master`；仍是运营演示级能力，**不等于 PRD 验收**。

### 6.1 Excel 列表导入 / 导出

| 组件 | 路径 | 作用 |
|------|------|------|
| `excel-hook` | `cms/extensions/excel-hook` | Hook：在 admin HTML 注入外链脚本 |
| `excel-tools` | `cms/extensions/excel-tools` | Endpoint：`/excel-tools/xlsx.js`、`/excel-tools/app.js` |
| `revalidate-hook` | `cms/extensions/revalidate-hook` | Hook：内容保存后异步通知 Next `/api/revalidate` |

**交互约定（当前实现）**

- 在 **原生列表页顶栏**（`.header-bar .actions`）插入 **导入 / 导出**，**不**用自定义 layout 替换表格。
- **白名单集合**：`product`、`category`、`series`（新闻/媒体/站点配置等 **无** 顶栏 Excel 按钮）。
- 在上述三页 **隐藏** Directus 右侧 accordion「导入 / 导出」（CSV/JSON）；**其它页**保留原生侧栏。
- 导出：当前搜索词 + `.xlsx`；导入：弹窗 + 模板下载（客户端 SheetJS + REST PATCH/POST）。

**运行注意**

- 必须从 **含扩展的 cms 目录** 启动 Directus（worktree 需复制 `cms/.env` 或共用配置）。
- 8055 被旧进程占用时会加载旧代码 → 先释放端口再重启。

**相关脚本（worktree `data/`）**：如 `verify_excel_flow.mjs`、`apply_excel_presets.mjs` 等（以 worktree 实际文件为准）。

### 6.2 其它 worktree 方向（摘要）

- 图片 interface：历史外链与预览布局修复（commit 如 `da097fb` 一带）。
- Content Editor 策略、preset 同步、原生导入导出清理验证等脚本——见 worktree `git status`。

---

## 7. 前台缓存（上线后改内容会有多快）

本地 `pnpm dev`：**每次请求直打 Directus**（`web/src/lib/directus.ts` 里 `NODE_ENV === "development"` → `cache: "no-store"`），所以后台一保存、刷新前台就变。这不是生产行为。

生产（`next start`）：页面与 fetch 均为 **ISR 60 秒** + cache tag（`web/src/lib/cacheTags.ts`）。**不会**像旧宏瑞那样改一个英文产品就全量生成 1.3 万静态页。改一条订货号只影响对应 URL 下次重建；无人访问的页可以一直不生成。

- 默认体感：保存后最多约 **1 分钟**内下次打开是新内容。
- 要「保存立刻变」：接口 + Directus hook 本地已接通（失败不挡保存）。现有 tag 按集合（如整个 `content:product`），不是按单个 SKU 路径。PRD 里的签名队列 / 搜索同步不要为 demo 做。本地 `pnpm dev` 仍是每次直打 Directus，看不出踢缓存效果。
- 2026-10-23 接口验收：`data/verify_cache_contract.mjs`、`data/verify_revalidation_contract.mjs`、`data/verify_revalidation_http.mjs` 与前台 TypeScript 检查通过；本机密钥只在 Git 忽略的 `web/.env.local`。旧 `data/verify_m1_web.mjs` 当时为 PASS 63 / FAIL 25，失败集中在当前演示页静态内容、已改的 slug 路由和旧页型断言，尚需按现版基座更新后再作为统一前台门禁。
- 旧站流程（中文后台筛英文 → 英文后台全量生成）在本项目不存在：一个 Directus，同一条 SKU 上改 `en` / `zh` 翻译即可。

### 7.1 保存后踢缓存（2026-10-26 接完）

Directus 自带的 Flow「请求」操作会拒绝 `localhost`（内网 IP 防护），所以 Codex 那条 Flow **不能**作为本机接线，也不要为了打通去关防护。正式路径改成 Node hook：保存后异步 `POST /api/revalidate`，失败只打日志，不挡后台保存。

**已完成**

- Next `POST /api/revalidate`：密钥 + 24 个集合白名单 + `revalidateTag`。`data/verify_revalidation_http.mjs` 通过。
- `cms/extensions/revalidate-hook`：监听创建/修改/删除，密钥来自 `cms/.env` 的 `REVALIDATE_SECRET`（与 `web/.env.local` 同值，未写入代码）。启动日志已加载该扩展。
- 2026-10-26 本机验收：`PATCH site_settings/1` 返回 200；hook 随后打到 Next，HTTP 200。脚本：`data/verify_revalidation_hook.mjs`、`data/verify_revalidation_hook_run.mjs`。
- 2026-10-26 `next start` 页面体感：改 `jie-xian-duan-zi` 中文名后，`/zh/product/category/jie-xian-duan-zi` 立刻出新 H1；hook HTTP 200。脚本：`data/verify_revalidation_page.mjs`。
- 2026-10-26 去掉分类页 `DEMO_ZH_FAMILIES`。访问 `/zh/product/category/terminal-blocks` 跳到 `/zh/product/category/jie-xian-duan-zi`，标题跟 CMS。脚本：`data/verify_category_lang_slug.mjs`。
- 旧 Flow「前台内容缓存刷新」保持 **`inactive`**；`data/apply_revalidation_flow.mjs` 默认也不启用。`data/verify_revalidation_flow.mjs` 只断言配置仍在且停用。

**未完成**

- tag 仍按集合，不是按单个 SKU 路径。
- `data/verify_revalidation_flow_run.mjs` 仍是 10-23 的失败证据脚本，不要当通过项。

**风险**

- 不要在后台手动启用那条 Flow：目标仍是 localhost，每次保存会留 reject 记录。
- `cms/.env` 与 `web/.env.local` 必须是同一条 `REVALIDATE_SECRET`；换机器或删库后要两边都配。可选 `WEB_PREVIEW_ORIGIN`（默认 `http://localhost:3000`）。
- hook 状态文件 `cms/.revalidate-last.json` 仅供本地验证，已 gitignore，不含密钥。
- 删库重建后扩展会随 `cms/extensions` 回来；旧 Flow 若还要保留，需重跑安装脚本并保持停用。

## 8. 与 PRD v3 的关系

**产品基线**：以 GPT 版 **PRD v3 / 仓库 v3.1** 为准（独立语言域名 + GEO + 后台运营）。DeepSeek 版只作底座/建模补充，冲突时听 v3。

**架构结论（2026-10 评审）**：**技术栈与分层正确**，不必换 CMS/多套前台。

**v3 GEO 本轮已落地的部分（§7.2 / §8 / §6.1 SEO）**

- 内容翻译行与营销页可配 **H1、SEO 标题、SEO 描述、关键词**；说明写在字段 note 上。
- Schema / JSON-LD **按页型由前台代码输出**（WebPage / Product / NewsArticle 等），后台不贴 JSON。
- 首页、新闻列表改为 `site_pages` 的 `home` / `news` 配 SEO，不再写死在代码里。
- 脚本：`node data/apply_seo_fields.mjs`。

**仍待升级（v3 范围，本轮不做）**

1. 路径式本地 demo → 独立语言域名生产形态（`LanguageSite`、Host rewrite）。
2. 服务端导入导出、自定义后台菜单、FAQ、第三方登录。
3. 后台可开关 JSON-LD 类型 / 自定义 JSON-LD（v3 只要页面输出结构化数据，未要求运营贴 schema）。

---

## 9. 关键路径速查

```text
D:\degson-pilot\
├── PROJECT-HANDOFF.md          # 交接与坑
├── README.md                     # 历史 M0.2 记录 + 指向 HANDOFF
├── start-all.ps1                 # 一键启动
├── cms/                          # Directus（master）
├── web/src/
│   ├── middleware.ts             # 语言前缀
│   ├── lib/lang.ts               # LANGS / 翻译 pick
│   ├── lib/site.ts               # localePath / hreflang / absUrl
│   ├── lib/repo.ts               # 含 getSitePage / getPageSections / getHomeBlocks
│   └── components/
│       ├── ServicesPage.tsx
│       ├── HomeCatalogDemo.tsx   # 2026-10-22 首页演示，不接 CMS
│       ├── HomeBanner.tsx
│       └── ProductSearch.tsx
├── data/                         # SQL、建模、seed_page_sections.mjs、seed_home_cms.mjs、verify_*.mjs
├── docs/                         # PRD、手册、本文
└── .worktrees/base-hardening/    # 功能 worktree（gitignore 于主树）
    └── cms/extensions/           # excel-hook, excel-tools, …
```

---

## 10. 常见误区（AI 勿犯）

1. **把 `degson-web` 或直连 MySQL 的前台方案带进本仓库**（已归档）。
2. **在 master 起 Directus 却期望看到 worktree 才有的扩展**。
3. **用 PowerShell `Invoke-WebRequest` 测 Directus 带 `[]` 的 URL**（用 Node `fetch`，见 HANDOFF §7）。
4. **用 PowerShell JSON 写中文进 Directus**（易乱码；用界面或 UTF-8 SQL）。
5. **把浏览器注入的 Excel 按钮当作 PRD 正式导入导出**。
6. **升级 Directus 12 或 Node 24** 未经人类明确决策。
7. **写「德昌」**：中文品牌是 **高松**。
8. **把 `/images/...` 公共路径当 Directus 文件 ID 预览**。
9. **在扩展目录对占用中的 Directus 跑 `pnpm build`**，易搞坏 `isolated-vm`，8055 起不来。
10. **以为生产也会像 `pnpm dev` 一样保存即刷新**（见 §7）。

---

## 11. 文档与需求索引

| 文档 | 路径 |
|------|------|
| 本文（总况） | `docs/AI-项目总况.md` |
| 交接 + 坑 | `PROJECT-HANDOFF.md` |
| DeepSeek 版 PRD | `docs/DEGSON新官网项目需求文档-DeepSeek版.md` |
| 底座重建 | `docs/M0.3-底座重建手册.md` |
| PRD v3.2 | [`docs/DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md`](./DEGSON新官网多语言独立域名与GEO一体化项目PRD-v3.2.md) |

---

## 12. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-13 | 初版：Git 无 remote、worktree、Excel 试点范围、PRD 对齐摘要 |
| 2026-10-13 | 更新：已绑定 GitHub `yangkun777/new-official-website` 并推送 master / feat/base-hardening |
| 2026-10-13 | `feat/base-hardening` 已合并进 `master`；根 README 改为当前入口页 |
| 2026-10-16 | 营销页 CMS（`site_pages` / `home_blocks` / `social_links`）；服务板块树 `page_sections`；图片预览修 public 路径；品牌「高松」；缓存策略说明（ISR 60s，hook 未做） |
| 2026-10-19 | 正式基线改为 PRD v3；后台补 H1/SEO 标题/描述/关键词；首页与新闻列表 SEO 可配；前台各页输出 canonical/hreflang/JSON-LD |
| 2026-10-21 | PRD 补页面集中编辑与抓取文件受控配置；服务页集中编辑样本可在同一页面记录打开中英文内容、SEO、板块与前台预览。 |
| 2026-10-22 | 首页演示二次视觉调整：3 张官网原图横幅、深色品牌过渡、4 个产品入口、PUSH-SNAP 与 3 个应用；删去演示数字、参数表和虚构新闻日期；当时首页正文及 SEO 暂不读 CMS。未 commit。 |
| 2026-10-26 | 复核缓存 Flow 半成品：后台保存成功且不阻塞；Flow 曾触发但请求未达 Next（localhost 被拒）；Flow 现为 inactive。 |
| 2026-10-26 | 用 `revalidate-hook` 接完保存后踢缓存：保存仍 200，本机已打到 Next `/api/revalidate` 200。旧 Flow 继续停用。 |
| 2026-10-26 | 分类页首屏改为白底目录。产品悬停大菜单已按反馈撤回，顶栏「产品」仍直接进入产品中心。 |
| 2026-10-26 | 本机前台改为 `next start`（先 build），并预热中英文首页、产品中心、接线端子/圆形分类、9EDGK-5.0、订货号 10010012354、方案/关于/服务/FAQ/新闻。均为 200。 |
| 2026-10-26 | 按 PRD 建 `home_banner` / `home_banner_translations`：中文下拉、图片预览、中英文一条记录、三张种子。后续首页路由接入 Directus Banner 数据并保留原轮播组件；种子脚本改为不覆盖运营数据，前后台运行时闭环待验收。脚本 `data/apply_home_banner.mjs`、`data/verify_home_banner.mjs`。 |
| 2026-10-26 | 后台列表图片改为缩略图（`product-media-thumbnail`），补齐运营可见字段中文名（含站点设置列头、`sort`→显示顺序）。约定写入 `AGENTS.md`。前台演示未改。 |
| 2026-10-26 | 分类列表不再把无中文翻译的分类显示到中文站，并去掉子分类中文演示覆盖。英文站仍显示仅有英文翻译的分类。 |
| 2026-10-26 | 分类等图片字段可从 Directus 媒体库选择/替换，不再只能本地上传。 |
| 2026-10-26 | 选图面板可点缩略图放大后再使用。 |
| 2026-10-26 | 端子三个子分类补中文翻译（`data/ensure_zh_terminal_subcategories.mjs`）。产品中心目录不展示尚无该语言翻译的分组。 |
| 2026-10-26 | `next start` 下改分类中文名后，规范中文 URL 立刻刷新（`data/verify_revalidation_page.mjs`）。英文 slug 的中文演示页仍被 `DEMO_ZH_FAMILIES` 覆盖。 |
| 2026-10-26 | 去掉分类页 `DEMO_ZH_FAMILIES`。有中文翻译时，英文 slug 的中文地址跳到中文 slug（`data/verify_category_lang_slug.mjs`）。 |
| 2026-10-26 | 基座首轮加固：演示站通用 CMS 图片代理改为签名 URL，拒绝未签名、篡改参数及非图片文件，生产模式关闭此代理；分类跨语言 slug 在 Middleware 中返回真正的 HTTP 308，避免流式页面返回 200 加刷新。`data/verify_base.mjs`、`data/verify_cms_asset_signature.mjs`、`data/verify_category_lang_slug.mjs`、TypeScript 与 `pnpm build` 通过，另在独立 3001 端口验证图片 200 / 非法请求 404。后台列表预设脚本改为保留个人预设，验证其图片首列，`data/verify_admin_list_presets.mjs` 通过。 |

## 13. 下一步（接手优先看）

**2026-10-26 后续继续开发：当前工作区停点如下。**

- 已完成首轮加固：`web/src/lib/media.ts` 与 `web/src/app/api/cms-asset/[fileId]/route.ts` 给演示站图片代理加签名、只转发图片、拒绝未签名和篡改请求；`web/src/middleware.ts` 将分类跨语言 slug 的纠正跳转移到渲染前，实测返回 HTTP 308。`data/verify_base.mjs`、签名脚本、分类脚本、TypeScript、`pnpm build` 及独立 3001 端口的 HTTP 验证已通过。`data/apply_admin_list_presets.mjs` 不再删除个人预设，`data/verify_admin_list_presets.mjs` 已验证现有个人预设的图片首列。
- **首页 Banner 前后台代码闭环已补齐，现场验收待做。** `/[lang]` 已读取 Directus `home_banner`，按语言映射后传给原 `HomeBanner` 组件，界面与交互未改。已更新 `data/verify_home_banner.mjs` 的前后台联动断言；`data/apply_home_banner.mjs` 现只创建缺失的默认记录与翻译，保留已有运营内容。尚未重新运行前台构建、HTTP 页面验证、Directus 真实编辑和保存后刷新；因此联动清单保留“部分联动”状态，不记为端到端验收完成。
- 后续验收 Banner 时核对中英文、每语言草稿、共用图/语言覆盖图、站内和外部 HTTPS 链接、运营改动保存后刷新。完成后优先按 PRD 推进服务页集中编辑与前台联动；会员登录、受控下载、Meilisearch、全量内容迁移和部署验收按各自阶段处理。会员资料不能复用公开图片代理。`robots.txt` / `llms.txt` 后台受控配置按 PRD 后续阶段实现。

本轮详细步骤见 `docs/superpowers/plans/2026-10-26-base-hardening.md`。当前工作区包含 Cursor 的大量未提交改动和本轮改动；不要整体重置或覆盖。

未排期，按对话里业务意向大致是：

1. **首页内容联动**：首页 Banner 已接入 `home_banner`；公司介绍、产品/应用区块和通讯选篇仍是静态演示，正式开发迁入 Directus。端子三个子分类已有中文翻译；其它分类要在中文站出现，仍须在 Directus 补中文翻译行。
2. 旧站导航：产品悬停大菜单、服务为一级悬停下二级并进独立页——**未做**。不要再在 `/services` 上画页内树目录。
3. 将服务页试点中的集中编辑方式逐步推广到方案 / 关于，并决定新增板块如何从页面内安全创建。
4. 旧宏瑞「服务」里更多板块字段若还要对齐，在 `page_sections_translations` 加字段并改前台，不要再写死页面。
5. Directus 保存后踢缓存：本地 hook 已接通，`next start` 下规范中文 URL 立刻更新（见 §7.1）。不要启用 localhost Flow，也不要上队列。有中文翻译的分类，英文 slug 会跳到中文 slug。
6. 全量 1.3 万订货号迁移：仍等业务确认旧分类映射，见 `docs/progress-2026-10-08.md` 迁移审计。
7. 把 `robots.txt` / `llms.txt` 做成受控后台配置并验证双域名输出；PRD v3 其余项包括独立语言域名、服务端导入导出、可配置菜单、FAQ、Meilisearch。
8. 真搜索（Meilisearch）与会员下载仍未做；产品页 `ProductSearch` 只是演示跳转。
9. 图片代理签名仅适用于公开页面图片；会员资料和受控下载仍须独立登录态、逐文件授权与审计。首页 Banner 已接 Directus，其他静态演示内容及服务页前台联动仍按《演示模块与Directus联动清单》推进。

本地验证服务页：`http://localhost:3000/zh/services`；后台集中编辑：`http://localhost:8055/admin/content/site_pages/2`。
