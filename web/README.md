# DEGSON 官网基座 Demo 前台

这是当前基座 Demo 的 Next.js 前台。页面只通过 Directus REST API 读取数据，不直连 MySQL。

## 本地启动

启动顺序：MySQL 3307 → Directus 8055 → Next.js 3000。

### 1. 配置环境变量

```powershell
Copy-Item .env.example .env.local
```

按本机环境填写 `DIRECTUS_TOKEN`。`.env.local` 只保存在本地，不能提交到 Git。

默认 Demo URL 规则：

```text
http://localhost:3000/en/
http://localhost:3000/zh/
```

生产环境 URL 规则：

```text
SITE_MODE=production
SITE_ORIGIN=https://www.degson.com
CN_SITE_ORIGIN=https://www.degson.com.cn
```

生产英文站使用主域根路径（`/`），中文站使用 `CN_SITE_ORIGIN` 根路径；应用内部仍通过
`/[lang]` 路由渲染。不要把生产环境的 `/en`、`/zh` 前缀 URL 当作 canonical 地址。

### 2. 启动前台

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

生产构建检查：

```powershell
corepack pnpm exec tsc --noEmit
corepack pnpm exec next build
```

## 基座验证

在仓库根目录执行：

```powershell
node data/verify_base.mjs
node data/verify_m1_web.mjs
```

数据库约束和数据自检：

```powershell
# 先在本地 Demo 数据库执行幂等约束
Get-Content .\data\04_constraints.sql -Raw | mysql --host=127.0.0.1 --port=3307 --user=root --password degson_pilot

# 再执行模型与数据自检
Get-Content .\data\99_verify.sql -Raw | mysql --host=127.0.0.1 --port=3307 --user=root --password degson_pilot
```

## 当前边界

当前 Demo 已覆盖首页、分类、系列、新闻列表和新闻详情的中英链路，以及 URL、SEO、富文本安全、媒体来源和缓存 tag 基座。

以下内容不属于当前 Demo：产品详情、产品参数、搜索、下载权限、会员、询盘、全量迁移、生产部署和 CI/CD。

生产 URL 规则以仓库根目录的 `docs/新官网基座优化版PRD_2026-10-08.md` 为准；本地 `/en`、`/zh` 只是开发兼容路径。
