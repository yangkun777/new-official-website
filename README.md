# DEGSON 全栈试点

> 当前基座加固基线：[`docs/新官网基座优化版PRD_2026-10-08.md`](docs/新官网基座优化版PRD_2026-10-08.md)。本文其余 M0.2 内容为历史记录，请以新版 PRD 和 `PROJECT-HANDOFF.md` 为准。

> ## ⚠️ 先读这个
>
> **本文档是 M0.2 的历史记录，部分内容已被 M0.3 / M1 修正**（例如"深层 filter 报 403"的结论不成立）。
>
> - **项目交接文档（给 AI 模型 / 新接手者）**：`PROJECT-HANDOFF.md` ← **从这里开始读**
> - **需求基线**：`docs/DEGSON新官网项目需求文档-DeepSeek版.md`
> - **从零重建步骤 + 坑**：`docs/M0.3-底座重建手册.md`
>
> **当前状态**：M0.3 底座（Directus 11.17.4 / 10 集合 / 96 字段 / 378 产品）+ **M1 前台**均已打通。
> 三个服务同时起来后，`node data/verify_m1_web.mjs` 应输出 **PASS 34 / FAIL 0**。
> 下一步 M2：sitemap/robots/llms.txt、Meilisearch、CI/CD、全量迁移演练。

---

# M0.2 试点原始记录（历史）

Directus 后台 + MySQL 8.0 + Next.js 闭环：**运营在后台改内容 → 存进 MySQL → 前台页面跟着变**（已验证）。

## 结构
- `mysql/`     便携 MySQL 8.0.28（解压即用，不入注册表）
- `data/`      SQL：`01_legacy_subset.sql`(底料) / `02_schema_clean.sql`(建表) / `03_seed.sql`(播种，已修正 series_id) / `99_verify.sql`(自检)
- `cms/`       Directus 12.3.1 项目（`cms/.env` 配置）
- `web/`       Next.js 15.5.25 前台（App Router + TS + Tailwind 4，数据只走 Directus API）

## 服务与端口
| 服务 | 端口 | 启动 |
|---|---|---|
| MySQL 8.0.28 | 3307 | `mysqld --port=3307 ...`（已在后台运行） |
| Directus 12 | 8055 | `cd cms && pnpm exec directus start` |
| Next.js 前台 | 3000 | `cd web && pnpm dev` |

## 本地凭据（勿外传）
- MySQL root：`degson_dev_2026` @ `127.0.0.1:3307` / 库 `degson_pilot`
- Directus 管理员：`admin@degson.dev` / `degson1234`（后台 http://localhost:8055/admin）
- 前台只读 token：见 `web/.env.local`（`DIRECTUS_TOKEN`）

## 数据自检
```bash
mysql -h127.0.0.1 -P3307 -uroot -pdegson_dev_2026 degson_pilot < data/99_verify.sql
```
期望并实测：category **5** / series **60** / product **378** / site_settings **1**；变体 1–18 平均 6.3；订货号 378/378 唯一。

## 闭环演示（已验证）
后台（:8055）改 `site_settings.footer_text` 或某 `product.poles` → 前台（:3000）相应位置**立即**变化。
- 场景1：改页脚文案 → 所有页面页脚同步
- 场景3：改产品极数（如 10020002889 poles 14P→99P）→ 对应系列页变体表那一行同步
- dev 下 `fetch` 用 `no-store`（立即反映）；prod 用 ISR 60s（`next.revalidate`）兜底。

## 新闻模块（多语言 translations，已验证）
- **数据**：`news`（共享：slug/cover_image/publish_date/status）+ `news_translations`（每语言一行：language/title/summary/body）+ `directus_languages`（zh-CN/en-US）。
- **前台**：`/news` 列表 + `/news/[slug]` 详情，`?lang=en-US|zh-CN` 切换中英文（页面右上角语言切换器）。
- **后台**：news 集合 translations 字段（语言切换编辑）；种子 1 条新闻（中英各一）。
- **取数注意**：本 Directus 12.3.1 实例对「深层 filter（`filter[rel][field]`）」与「M2O 字段展开（`news_id.*`）」均不可靠（分别报 403 / 返回空）。新闻取数用「两次 root 查询 + 应用层 join」（filter 只用各表自身字段 language/slug/news_id/id）。
- ⚠️ **中文编码坑**：用 PowerShell `ConvertTo-Json` PATCH 含中文的内容会存成乱码（`????`）。**改中文请在 Directus 界面操作，或用 UTF-8 SQL 文件**（`--default-character-set=utf8mb4`），勿用 PowerShell JSON 拼中文。

## 本机部署时的卡点与决策（供 Phase 1 校正）
1. **虚拟化未启用** → 弃 Docker，改用便携 MySQL 8.0.28 zip（解压→`mysqld --initialize-insecure`→后台起服务）。
2. **Directus 12 需先 `directus bootstrap`**（建系统表+管理员），`start` 不自动装表；`migrate` 命令在 12.3.1 不存在，但 `start` 会自行补齐 schema。
3. **isolated-vm 5.0.3 无 Node 24 预编译二进制**（ABI 137），且 GitHub 镜像下载超时、本机无 C++ 工具 → 用 JS stub（`isolated-vm/out/isolated_vm.js` = `{ ivm: {} }`）绕开。M0 不用 Flows 脚本沙箱；**正式部署应在有 C++/可用二进制的环境，或用 Node 22（ABI 127 有 prebuilt）**。
4. **pnpm 12 默认拦截 build scripts**（`ERR_PNPM_IGNORED_BUILDS`），isolated-vm 原生模块无法自动编译——stub 方案的根本原因。
5. **pnpm install `-h127.0.0.1` 短选项被 PowerShell 误解析**，mysql 命令统一用 `--host=127.0.0.1` 长选项 + SQL 文件重定向。
6. **`03_seed.sql` 产品段 bug**：`series_id` 误用 `a.matecode`（11 位，超 `INT UNSIGNED` 上限）→ 已修正为 `s.id`（已同步到 `data/03_seed.sql`）。
7. **前台 `fetch revalidate:60` 导致闭环"不跟"**（PRD §9 坑位10）→ dev 改 `no-store`。
8. **Directus 12 权限模型是 Role→Policy→Permission + Access 关联**（非直接 role-permission）：`POST /policies` 建只读 policy、`POST /permissions {policy,...}` 建权限、`POST /access {role|user, policy}` 关联。已用 API 自动化（web-read 角色 + web-bot 用户 + 只读 token，DELETE 返回 403）。

## 数据瑕疵（§3.5，全量迁移前必须裁决）
- 3 例重复订货号（text）、3 例同分类重复系列码（matecode）。播种已去重，种子集（378）无重复。

## 后续（PRD §7 路线）
M1：Directus 深度建模（translations + 工作流）+ 垂直切片；M2 多语言 + Meilisearch；M3 全量迁移 + 301。
