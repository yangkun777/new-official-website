# DEGSON 新官网（degson-pilot）

一套前台 + 一个后台 + 一个数据库，重建 DEGSON 多语言官网基座。

| 层 | 技术 | 说明 |
|---|---|---|
| 前台 | Next.js 15（App Router） | 只走 Directus API，不直连数据库 |
| 后台 | **Directus 11.17.4** | **不要升 12**（许可锁死风险） |
| 数据库 | MySQL 8（本机 3307） | 主数据 + `*_translations` |
| 运行时 | Node 22 + pnpm 12 | 勿用 Node 24 |

远程仓库：https://github.com/yangkun777/new-official-website  
默认分支：`master`（`feat/base-hardening` 已于 2026-10-13 合并）

---

## 当前状态

- **已打通**：分类 → 系列 → SKU、新闻中英路径式多语言（`/en`、`/zh`）、SEO/GEO 基建、后台图片上传预览、产品/分类/系列列表顶栏 Excel 导入导出（试点）
- **种子规模**：分类 5 / 系列 60 / 产品 378 / 新闻 1
- **待建设**：独立语言域名生产形态、PRD 级导入导出（模板/校验/错误报告）、可配置后台菜单、FAQ/搜索/全量迁移等

更细的真实状态与 AI 接手说明见 [`docs/AI-项目总况.md`](docs/AI-项目总况.md)。

---

## 本地启动

**推荐一键：**

```powershell
.\start-all.ps1          # 生产模式前台
.\start-all.ps1 -Dev     # 前台 dev（改后台立即反映）
```

| 服务 | 地址 |
|---|---|
| 前台 | http://localhost:3000 （根路径会进 `/en`） |
| 后台 | http://localhost:8055/admin |
| MySQL | `127.0.0.1:3307` / 库 `degson_pilot` |

**手工启动要点**（脚本异常时）：

```powershell
# PATH：全局 npm 目录要排在 Node 前面（见 PROJECT-HANDOFF）
$env:PATH = "C:\Users\admin\AppData\Roaming\npm;C:\nvm\v22.23.2;" + $env:PATH

# MySQL → Directus → 前台
# cms/.env、web/.env.local 需事先配好（勿提交进 Git）
cd cms; pnpm exec directus start
cd web; pnpm dev
```

前台环境变量模板：[`web/.env.example`](web/.env.example)。  
删库重建后需重跑 `data/make_web_token.mjs` 并更新 `web/.env.local`。

**自检：**

```powershell
curl http://localhost:8055/server/ping
cd data; node verify_m1_web.mjs    # 期望 PASS 34 / FAIL 0
```

---

## 目录

```text
cms/          Directus 11 + extensions（excel-hook / excel-tools / product-media-editor）
web/          Next.js 前台
data/         SQL、建模与验证脚本
docs/         PRD、手册、项目总况
config/       MySQL 等可跟踪配置
start-all.ps1 一键启动
```

---

## 文档

| 文档 | 用途 |
|---|---|
| [`docs/AI-项目总况.md`](docs/AI-项目总况.md) | **当前真实状态**（Git、试点范围、PRD 差距） |
| [`PROJECT-HANDOFF.md`](PROJECT-HANDOFF.md) | 交接、坑位清单、启动细节 |
| [`docs/M0.3-底座重建手册.md`](docs/M0.3-底座重建手册.md) | 从零重建 |
| [`docs/新官网基座优化版PRD_2026-10-08.md`](docs/新官网基座优化版PRD_2026-10-08.md) | 基座加固 PRD |
| [`docs/DEGSON新官网项目需求文档-DeepSeek版.md`](docs/DEGSON新官网项目需求文档-DeepSeek版.md) | 需求基线 |

业务侧还有 **PRD v3**（独立语言域名 + 运营导入导出 + 菜单配置）。架构结论：技术栈不用换，要补的是域名层与后台可验收能力——见总况文档。

---

## 约定（简）

- 语言码统一 **`en` / `zh`**，不混用 `en-US` / `zh-CN`
- 前台禁止直连 MySQL；旧原型 `degson-web` 已归档，勿带回本仓库
- 勿提交 `cms/.env`、`web/.env.local`、`*_token`
- Excel 导入导出目前是运营试点：仅 `product` / `category` / `series` 列表顶栏；正式验收能力仍待按 PRD 升级

坑位与完整决策记录见 [`PROJECT-HANDOFF.md`](PROJECT-HANDOFF.md)。
