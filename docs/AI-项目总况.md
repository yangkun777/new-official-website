# DEGSON 新官网 · 项目总况（供 AI / 新接手者）

> **用途**：在 5 分钟内了解仓库**当前真实状态**（含 Git、双工作区、试点功能与 PRD 差距）。  
> **最后更新**：2026-10-16  
> **维护**：有重大里程碑或分支/工作区变化时，请同步改本文「§2 Git」「§5 / §5.1」「§13 下一步」。

**阅读顺序建议**

| 优先级 | 文档 | 说明 |
|--------|------|------|
| 1 | 本文 | **当前总况**（Git、worktree、试点、与 PRD 关系） |
| 2 | [`PROJECT-HANDOFF.md`](../PROJECT-HANDOFF.md) | 交接、坑位、数据模型、启动命令 |
| 3 | [`DEGSON新官网项目需求文档-DeepSeek版.md`](./DEGSON新官网项目需求文档-DeepSeek版.md) | 需求基线（另有业务侧 **PRD v3** 多语言域名 + 导入导出 + 菜单，见 §7） |
| 4 | [`M0.3-底座重建手册.md`](./M0.3-底座重建手册.md) | 删库重建步骤 |

---

## 1. 一句话

**重建 DEGSON 官网**：一套 **Next.js 前台** + 一个 **Directus 11** + 一个 **MySQL 8**，主数据 + `*_translations` 多语言；本地已跑通 **M0.3 底座 + M1 前台**（路径式 `/en` `/zh`）。远程已推到 GitHub；**`feat/base-hardening` 已于 2026-10-13 合并进 `master`**。

**2026-10-16 基座 demo 增量（工作区，未必已全部提交）**：首页/方案/关于/服务改为后台可配；服务页按宏瑞做成「服务板块」树；页头语言切换与社交图标；品牌中文名统一为 **高松**（禁止「德昌」）。

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

- 扩展在 **`cms/extensions/`**（`excel-hook` / `excel-tools` / `product-media-editor`），从仓库根目录的 `cms` 启动 Directus。
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
| Next 前台 | 3000 | `cd web && pnpm dev` 或 `start-all.ps1` |

**一键启动（推荐）**：仓库根目录 `start-all.ps1`（见 HANDOFF §6）。

**验证**

```powershell
curl http://localhost:8055/server/ping          # pong
cd D:\degson-pilot\data; node verify_m1_web.mjs   # 期望 PASS 34 / FAIL 0
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
| 首页 Hero / 信任条 / 应用带 / 产品图 | **站点配置 → 站点设置**、**内容管理 → 首页内容块**（`home_blocks`） | `/[lang]` 读 CMS，空则回退现有展示 |
| 方案 / 服务 / 关于 页头 | **内容管理 → 方案 / 服务 / 关于**（`site_pages`，slug 下拉） | `/solutions` `/services` `/about` |
| 服务里的具体板块 | **内容管理 → 服务板块**（`page_sections` 树） | 目前只渲染 **服务** 页；方案/关于字段预留了「所属页面」 |
| 社交外链 | **站点配置 → 社交外链** | 页头/页脚图标 |
| 语言切换 | — | 页头 `HeaderLangSwitcher`，路径式 `/en` `/zh` |

**服务板块（对齐旧宏瑞：左边树、右边字段）**

- 集合：`page_sections` + `page_sections_translations`。
- 树：上级板块自关联。种子示例：研发技术能力 → 强大的研发能力 / 模拟仿真 / 技术支持 / 专利；另有认证实验室、下载中心、FAQ。
- 每条翻译字段：标题、简介、数据 1 / 介绍、数据 2 / 介绍、介绍 1、介绍 2；主表有图片（`product-media-editor`）、显示顺序、发布状态。
- 多语言用 **list-o2m**（`zh · 标题` / `en · 标题`），不要用 Directus 原生 translations 控件（本项目语言存在翻译表的 `language` 字段，原生控件会显示空下拉）。
- 幂等种子：`node data/seed_page_sections.mjs`。
- 元数据/权限：`apply_directus_admin_ui.mjs`、`apply_content_editor_access.mjs`；校验 `verify_page_sections.mjs`、`verify_directus_admin_ui.mjs`。

**产品图预览（`product-media-editor`）**

- Directus 文件 UUID → `/assets/{id}`。
- 站点 public 路径（如 `/images/marketing/hero-solutions.jpg`）必须走前台 `http://{当前主机}:3000/...`，**不能**当成文件 ID 打 `/assets/...`（会 403，预览白块）。
- 本机 `cms/.env` 的 `CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC` 需含历史 CDN（`enoss.degson.com`）以及本地预览用的 `http:`（局域网 IP 打开 8055 时封面才会显示）。此文件 gitignore，换机器要重配。
- 改了 `cms/extensions/product-media-editor/src/interface.vue` 后必须更新 `dist/index.js` 并 **重启 Directus**。在扩展目录 `pnpm build` 可能误触发 cms 的 `isolated-vm` 重编译（Windows 上 Directus 占用 .node 时会把包拆坏）；优先改 dist 或停掉 Directus 再装依赖。

**第二类目试点**

- 圆形连接器等演示分类/图，优先用本地旧库 `degson_legacy.hr_article.thumb`，不要用网图凑。脚本：`data/seed_demo_circular_category.mjs`。

**尚未按 PRD v3 生产形态完成**

- 独立语言 **域名 + Host rewrite**（当前为 localhost 路径式 + 部分硬编码 `SITE_ORIGIN`）。
- `site_settings` **无翻译表**。
- 列表 **导入导出** 的 PRD 级模板/校验/错误报告/权限追溯（见 §6）。
- **可配置后台菜单**（增删排序/角色可见，且不替代权限）。
- FAQ、认证、附件、Meilisearch、全量迁移与 301。
- 方案/关于尚未做成与「服务板块」相同的树（集合已预留 `page_slug`）。
- Directus 保存后 **按需踢 Next 缓存**（webhook / `revalidateTag`）**未做**。

---

## 6. Excel / 后台试点（已在 master）

> **状态**：已合并 `master`；仍是运营演示级能力，**不等于 PRD 验收**。

### 6.1 Excel 列表导入 / 导出

| 组件 | 路径 | 作用 |
|------|------|------|
| `excel-hook` | `cms/extensions/excel-hook` | Hook：在 admin HTML 注入外链脚本 |
| `excel-tools` | `cms/extensions/excel-tools` | Endpoint：`/excel-tools/xlsx.js`、`/excel-tools/app.js` |

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
- 要「保存立刻变」：Directus hook → Next `/api/revalidate` → `revalidateTag`。**未实现**。现有 tag 是按集合（如整个 `content:product`），不是按单个 SKU 路径；最小可用大约半天，精确 `revalidatePath` 更重。PRD 里的签名队列 / 搜索同步不要为 demo 做。
- 旧站流程（中文后台筛英文 → 英文后台全量生成）在本项目不存在：一个 Directus，同一条 SKU 上改 `en` / `zh` 翻译即可。

## 8. 与 PRD v3 的关系

**架构结论（2026-10 评审）**：**技术栈与分层正确**，不必换 CMS/多套前台。

**待升级的两条线**

1. **路径式本地 demo → 独立语言域名生产形态**（`LanguageSite` 注册表、middleware Host、canonical/hreflang/sitemap 按 origin）。
2. **后台运营试点 → 可验收**（服务端导入导出、菜单配置、权限与错误报告）。

详细分阶段计划曾在对话中给出（阶段 A–F）；实现前仍以业务确认的语言/域名清单为准。

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
│   └── components/ServicesPage.tsx
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
| PRD v3（多语言域名 + 导入导出 + 菜单） | 业务文档，可能在对话/外部 md；与 DeepSeek 版互补 |

---

## 12. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-13 | 初版：Git 无 remote、worktree、Excel 试点范围、PRD 对齐摘要 |
| 2026-10-13 | 更新：已绑定 GitHub `yangkun777/new-official-website` 并推送 master / feat/base-hardening |
| 2026-10-13 | `feat/base-hardening` 已合并进 `master`；根 README 改为当前入口页 |
| 2026-10-16 | 营销页 CMS（`site_pages` / `home_blocks` / `social_links`）；服务板块树 `page_sections`；图片预览修 public 路径；品牌「高松」；缓存策略说明（ISR 60s，hook 未做） |

## 13. 下一步（接手优先看）

未排期，按对话里业务意向大致是：

1. **方案 / 关于** 是否也做成与服务相同的板块树（集合已有 `page_slug`）。
2. 旧宏瑞「服务」里更多板块字段若还要对齐，在 `page_sections_translations` 加字段并改前台，不要再写死页面。
3. Directus 保存后踢缓存：先做粗粒度 `revalidateTag`（见 §7），不要上队列。
4. 全量 1.3 万订货号迁移：仍等业务确认旧分类映射，见 `docs/progress-2026-10-08.md` 迁移审计。
5. PRD v3：独立语言域名、服务端导入导出、可配置菜单、Meilisearch。

本地验证服务页：`http://localhost:3000/zh/services`；后台：`http://localhost:8055/admin/content/page_sections`。
