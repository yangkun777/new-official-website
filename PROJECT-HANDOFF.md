# DEGSON 新官网项目 · 交接文档（给 AI 模型 / 新接手开发者）

> **本文档的目的**：让任何模型或开发者在 5 分钟内理解「这个项目要做什么、现在做到哪、下一步做什么、有哪些坑不能踩」。
> **最后更新**：2026-09-24（M1 前台改造完成）
> **如果你只读一段**：读 §1 和 §9。

---

## 1. 一句话现状

**要重建 DEGSON 官网**（旧站是 PHP 5.6 + 自研 CMS，多语言靠复制 13 套代码与数据）。

**当前进度：M0.3 底座 + M1 前台已打通。三个服务能同时起来，分类 → 系列 → 产品 与新闻的中英双语链路端到端可用。**

```
MySQL 3307 ✅   Directus 11 @8055 ✅   Next 前台 @3000 ✅
M0.3 底座：删库可重建（已验收）
M1 前台：新模型适配 + 路径式多语言 + SEO/GEO 基建（34/34 自动验收通过）
```

**下一步**：M2 —— 全量页型、Meilisearch、全量数据迁移演练、CI/CD。

---

## 2. 目录角色（先搞清楚哪个是哪个）

| 路径 | 角色 | 状态 |
|---|---|---|
| **`D:\degson-pilot`** | **★ 项目主轴**：Directus 后台 + MySQL + Next.js 前台的完整底座 | **活跃开发** |
| `D:\degson-pilot\cms` | Directus 11.17.4 后台 | 活跃 |
| `D:\degson-pilot\web` | Next.js 前台（**M1 已按新模型改造**） | 活跃 |
| `D:\degson-pilot\data` | 建模脚本 + 种子 SQL + 验证脚本 | 活跃 |
| `D:\degson-pilot\docs` | PRD + 重建手册 | 活跃 |
| **`D:\degson-web`** | Next.js **直连旧库**的早期原型 | **已归档，不要演进**（生产库凭据已中和；`PROJECT-HANDOFF.md` 只留了一个指向本文的跳转） |
| `D:\DEGSON-GEO-Workspace` | GEO/SEO 分析产出、架构方案、旧站实测报告 | 参考资料 |
| `D:\dev-tools` | 旧站 Schema 整改、DLP 解密工具、DB 结构摘录 | 参考资料 |
| `E:\degsonen\degsonEn` | 旧英文站代码（PHP 5.6 树，含 `xhr/` 框架） | 只读参考 |
| `E:\workbuddy\...\audit\` | 旧站审计脚本（只读账号，可复跑） | 只读参考 |

**为什么 `degson-web` 归档**：它用 `mysql2` **直连生产库**，违反 PRD §5.2「前台不直连数据库」硬性约束，且把前端绑死在旧库 schema 上。它的价值已交付——**证明了旧库取数语义**（catid 547/548/549/550/552、`text`=订货号、`text1`=间距、`text2`=极数）。**其技术路线不得带入新代码库。**

---

## 3. 项目目标（摘自 PRD）

| # | 目标 | 要点 |
|---|---|---|
| **G1** | **多语言真实可用（第一痛点）** | 一套代码跑全语言；内容**一次创建**、翻译在同一编辑页语言页签完成；新增语言**零 schema 变更** |
| G2 | 内容运营自助 | 后台改内容/建栏目/上产品/改 SEO，无需开发介入；**新增字段不改数据库结构** |
| G3 | GEO 能力从"项目"变"系统能力" | SEO/结构化数据由代码生成、运营自助配置 |
| G4 | 数据资产化 | 分类→系列→订货号→变体 成为有唯一约束的结构化资产 |
| G5 | 自主可控 | 代码进自有 Git；**后台可仅凭仓库重建** |

**旧站痛点（实测，为什么必须重建）**：
- 每个语言站是**独立 PHP 项目**，同一功能写 N 遍
- 运营发一条内容要**按语言上传 13 次**；外语站产品描述 **96.9–97.7% 是英文逐字副本**（假翻译）
- 加一个后台字段 → `hr_category` 表**加 16 个语言列**（膨胀到 158 列），且实测**其余语言填充率 0/183**
- 页面取数逻辑存在**数据库里的 109 条片段**（含 SQL + HTML），无版本控制、无 diff
- PHP 5.6 已 EOL；代码树含 root 级库凭据明文 + 网站根目录改名 Adminer

---

## 4. 技术栈（已定，**不要随意改**）

| 层 | 选型 | 为什么 |
|---|---|---|
| 内容后台 | **Directus 11**（锁定 `11.17.4`） | **不选 12**：12 引入**主动许可执行**，超 Core 额度且宽限期结束后会**阻断 `/items` API、关闭 GraphQL、禁止非管理员登录**——生产站有被锁死风险。本项目集合数（含 translations、junction）必然超额度，且 DEGSON 不符免费商用条件（要求年营收 <$5M 且 <50 人） |
| 数据库 | **MySQL 8.0**（生产最终 PolarDB MySQL 8） | 同方言搬运 439 万行；参数是关系树不需要 JSONB |
| 前台 | **Next.js 15 App Router + TS + ISR** | 按需 revalidate 替代旧站"人工重生成十几万静态页" |
| 搜索 | **Meilisearch**（未开始） | 多语言分词 + 毫秒级筛选 |
| 部署 | 阿里云 ECS + CDN（未开始） | 延续现有云资产 |

**运行时要求**：**Node 22.23.2**（不是 24）。原因：`isolated-vm` 在 Node 24 无预编译二进制，本机无 C++ 工具链。

---

## 5. 数据模型（当前基线，M1 未改动模型）

```
主表（语言无关）              翻译表（每语言一行，用 O2M 别名 translations 关联）
category        9 字段  ──→  category_translations  12
series          9 字段  ──→  series_translations    12
product        11 字段  ──→  product_translations   12
news            8 字段  ──→  news_translations      12
site_settings   9 字段（单例，⚠️ 无翻译表，见 §9.6）
languages       6 字段  ← 语言单一来源（en / zh）
```

**四个翻译表用完全相同的字段模板**（故意如此，运营心智只有一套）：
```
language / name / slug / seo_title / seo_description / h1 / short_description / description
```

**注意 `product` 主表同时保留 `title` 与 `combined_title`**：`title` 是订货号级显示名，变体表格仍直接读主表，**不需要翻译**。

**关键字段语义（来自旧库实测）**：
| 概念 | 新模型字段 | 旧库来源 |
|---|---|---|
| 系列码 | `series.matecode` | catid=550 的 `matecode` |
| 订货号 | `product.order_no`（唯一） | catid=552 的 `text` |
| 型号 | `product.title` | catid=552 的 `title` |
| 极数 | `product.poles` | `text2` |
| 间距 | `product.pitch` | `text1` |

**语言码统一为两位短码 `en` / `zh`**（不是 `en-US`/`zh-CN`）。它会同时出现在 URL、数据、hreflang、slug 唯一性 scope——**必须单一来源**。前台的单一来源是 `web/src/lib/lang.ts`。

**当前数据量**：category 5 / series 60 / product **378**（订货号 378 唯一）/ news 1（en+zh 两条翻译）/ languages 2。
**注意**：`product_translations` **只播了 en(378)，zh 故意留空** —— 这是用来验证"缺翻译回退 en"机制的，不是漏播。

---

## 6. 怎么启动（本机 · 三个服务）

### 6.1 一键启动（推荐）

```powershell
D:\degson-pilot\start-all.ps1            # 生产模式（必要时自动 build）
D:\degson-pilot\start-all.ps1 -Dev       # 前台 dev 模式（改后台立即反映）
D:\degson-pilot\start-all.ps1 -SkipBuild # 复用已有 .next，不重新构建
```

脚本幂等：已在监听的端口会跳过。启动后自动做端口与 `ping` 校验，并打印入口地址。

### 6.2 手工启动（脚本坏了时的备用路径）

```powershell
# ① MySQL（端口 3307）★ 配置文件在 config/，不在 mysql/，见 §7 坑14
#    MySQL 不会自动创建 log-error 目录，先确保 D:\degson-pilot\logs 存在
D:\degson-pilot\mysql\bin\mysqld.exe --defaults-file="D:\degson-pilot\config\mysql\my.ini"

# ② Directus 11（端口 8055）★ PATH 顺序很关键，见 §7 坑1
$env:PATH = "C:\Users\admin\AppData\Roaming\npm;C:\nvm\v22.23.2;" + $env:PATH
cd D:\degson-pilot\cms
.\node_modules\.bin\directus.CMD start

# ③ 前台（端口 3000）
$env:PATH = "C:\Users\admin\AppData\Roaming\npm;C:\nvm\v22.23.2;" + $env:PATH
cd D:\degson-pilot\web
.\node_modules\.bin\next.CMD build
.\node_modules\.bin\next.CMD start -p 3000
```

> **`--defaults-file` 必须是 mysqld 的第一个参数**，否则会被忽略。
> **不要用 `-h127.0.0.1` 这种紧贴写法调 mysql 客户端**（PowerShell 5.1 会把参数拆坏，
> 报 `Unknown MySQL server host '127'`），一律用 `--host=127.0.0.1 --port=3307`。

**入口**：

| 地址 | 说明 |
|---|---|
| http://localhost:3000 | 根路径，307 → `/en` |
| http://localhost:3000/en · `/zh` | 中英文首页 |
| http://localhost:8055/admin | Directus 后台 |

**凭据位置**（本文档不写值）：`cms/.env`（DB + SECRET/KEY + 管理员）、`web/.env.local`（前台只读凭据）、根目录 `.admin_token` / `.web_token`（脚本用）。

**验证服务是否正常**：
```powershell
curl http://localhost:8055/server/ping      # 期望 pong
cd D:\degson-pilot\data; node verify_m1_web.mjs   # 期望 PASS 34 / FAIL 0
```

> ⚠️ 三个服务必须**同时**在跑。前台能起来但页面报错，九成是 Directus 或 MySQL 没起（前台只认 API，不直连库）。

---

## 7. 已知的坑（全部实测踩过，**不要再踩**）

| # | 坑 | 正确做法 |
|---|---|---|
| **1** | `C:\nvm\v22.23.2\node_modules\pnpm\bin\pnpm.cjs` 是 **DLP 密文**（`88 7D 1C` 开头），Node 读出来是乱码 | **PATH 把全局 npm 目录排在 Node 22 目录前面**：`$env:PATH = "C:\Users\admin\AppData\Roaming\npm;C:\nvm\v22.23.2;" + $env:PATH` |
| **2** | pnpm 12 忽略 `package.json` 里的 `pnpm.onlyBuiltDependencies` | 构建设置写进 **`cms/pnpm-workspace.yaml`** 的 `allowBuilds` |
| **3** | `$env:DB_DATABASE` 对 Directus CLI **不生效**（dotenv 覆盖进程环境变量） | 要指向别的库必须**临时改 `.env`**，并用 try/finally 保证还原 |
| **4** | 端口 8055 被旧进程占用时，`ping`/`login` 会**打到旧服务**上 | 启动前先确认端口空闲，`Get-NetTCPConnection -LocalPort 8055` |
| **5** | **`PATCH /relations/<collection>/<field>` 会让 Directus 11.17.4 崩溃**（`RelationsService.alterType` 读 undefined，服务直接退出） | 建关系只用 `POST /relations`；改 `one_field` **停服务后直接写 `directus_relations` 表**再重启 |
| **6** | **别用 PowerShell `Invoke-WebRequest` 测 Directus REST**——URL 里的 `[` `]` 会被当**通配符**，导致假的 403/连接错误 | 测 API 一律用 **Node `fetch`**（见 `data/probe_api.mjs`）。M0.2 README 里"深层 filter 报 403"的结论就是这么来的，**不成立** |
| **7** | 旧库 `hr_article` 字符集是 `utf8mb3`，`ALTER TABLE ... CONVERT` 会报 `ERROR 1071`（复合索引超 3072 字节） | **不要动旧库的索引**。MySQL 8 跨库比较会自动转换，不影响使用 |
| **8** | 中文写入：用 PowerShell `ConvertTo-Json` 拼中文会存成 `????` | 中文内容走 **UTF-8 SQL 文件**或直接在 Directus 界面操作 |
| **9** | **Next 15 默认开启「流式 metadata」**：只有命中内置机器人名单的 UA 才拿到写在 `<head>` 里的 metadata，其余被推迟到 body 靠脚本搬回去。**实测 Googlebot / GPTBot / ClaudeBot / PerplexityBot / Bytespider 全部漏网**（只有 Bingbot 命中）→ 不执行 JS 的爬虫读原始 HTML 看不到 title/canonical/hreflang，**GEO 硬伤** | `web/next.config.ts` 设 **顶层** `htmlLimitedBots: /.*/`。**注意语义**：匹配的 UA 才走「阻塞渲染」（源码里变量叫 `blockingMetadataUARegex`，官方注释把它写反了）。不要用「扩充机器人名单」的方案——AI 爬虫层出不穷，名单长期必漏 |
| **10** | `next.config.ts` 里块注释写 `/.*/` 会在注释中途闭合，报 `Unexpected token UA` | 注释里不要出现 `*/` 序列，改写措辞 |
| **11** | PowerShell `New-Item` **没有 `-LiteralPath` 参数**；而 `[lang]` 这类路径会被 `-Path` 当通配符 | 建目录用 `New-Item -Path`（不存在的路径不做通配展开）；**删除/读取一律 `-LiteralPath`** |
| **12** | 改了路由结构后跑 `tsc --noEmit` 会报一堆 `Cannot find module '../../../src/app/layout.js'` | 那是 `.next/types/**` 里上一次构建的残留。**先删 `.next` 再检查** |
| **13** | `.next` 正在被 `next start` 读取时执行 `next build` 会写坏产物 | 改完先停服务再 build，再 start |
| **14** | **`mysql/my.ini` 从来不存在** —— 便携版 MySQL 当初是用命令行参数起的，而 `mysql/` 整个目录被 gitignore，配置放里面等于不可复现 | 配置文件放**会被跟踪**的 `config/mysql/my.ini`（`datadir` 仍指向 gitignore 的 `mysql/data`）。`--defaults-file` 必须是 mysqld **第一个**参数 |
| **15** | **本机只有 Windows PowerShell 5.1，没有 PowerShell 7** | ① `pwsh` 命令不存在，脚本里 spawn 子进程要用 `powershell`（`start-all.ps1` 已自适应）；② PS 5.1 **没有 `New-Item -LiteralPath`**（那是 PS 7 的参数）——建目录用 `-Path`，删除/读取用 `-LiteralPath` |
| **16** | **PS 5.1 按系统 ANSI（GBK）读 `.ps1`**，无 BOM 的 UTF-8 脚本里中文会乱码并撑破字符串解析（报 `Unexpected token`） | 含中文的 `.ps1` 必须存成 **UTF-8 with BOM**。⚠️ **`edit` 工具改完会抹掉 BOM**，每次编辑后要补：`[System.IO.File]::WriteAllText($p, (Get-Content -Raw -Encoding UTF8 $p), (New-Object System.Text.UTF8Encoding($true)))` |
| **17** | PS 5.1 调原生 exe 时，`-h127.0.0.1` 这类**紧贴参数**会被拆坏（`Unknown MySQL server host '127'`） | 一律用 `--host=127.0.0.1 --port=3307 --user=root --password=...` 的等号长参数形式 |
| **18** | 本机**另有一个无关的 MySQL 5.7**（`E:\googledownload\guanwangcn\server\mysql57`）常驻占用 **3306** | 我们的实例一律用 **3307**。排查"库怎么连不上"时先用 `Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'"` 看命令行，别误判 |

---

## 8. 关键决策记录（为什么这么做）

| 决策 | 结论 | 理由 |
|---|---|---|
| 后台选 Directus 11 还是 12 | **11** | 12 的主动许可执行会在超额度时锁死生产站（见 §4） |
| 前台直连数据库还是走 CMS | **走 CMS API** | 直连（`degson-web` 的做法）会绑死旧 schema、绕过权限与发布流 |
| 取数用 REST 还是 GraphQL | **REST** | 实测 REST 完全支持嵌套展开、关系过滤、**嵌套 deep 过滤**、遍历翻译行；**不需要"两次查询+应用层 join"** |
| 翻译建模方式 | **主表 + `*_translations` + O2M 别名** | 缺 O2M 别名会导致 GraphQL 报错、Directus 语言页签无法工作 |
| 语言码 | **`en` / `zh`** 两位短码 | 单一来源，避免 URL/数据/hreflang 三处不一致 |
| 旧库底料放哪 | **独立库 `degson_legacy`** | 与新模型分库，避免"哪张表是新的"混淆 |
| **语言 URL 形态（D2）** | **路径式 `/{lang}/...`** | 单域/单证书/单 CDN 规则；hreflang 与 canonical 更难写错。现网"主域 `?lang=` + 子域"混用状态混乱，路径式一次收敛。**将来若要改子域，只需改 `web/src/lib/site.ts` 的 `localePath()` + `middleware.ts`，页面不用动** |
| **详情页跨语言重复内容** | **canonical 收敛**：slug 属于哪条翻译行，就 307 到那个语言的 URL | 分类/新闻的 slug 是**每语言各自一份**；系的 `matecode` 与语言无关但翻译可能缺失。不收敛就会出现 `/zh/…` 与 `/en/…` 同一内容，且违反 PRD §6.4「未翻译不生成对应语言页」 |
| 列表页缺翻译怎么办 | **回退 en 显示，并标 `EN` 徽标**，卡片链接直接指向 en 页 | 列表不留空位，也不把用户送进空壳页 |
| **metadata 是否流式** | **全部阻塞渲染**（`htmlLimitedBots: /.*/`） | 见 §7 坑9。GEO 是硬指标，宁可首字节多等一次查询 |

---

## 9. 未来要做的事

### 9.1 M1 已完成的内容（2026-09-24）

**前台从 M0.2 旧模型迁到 M0.3 新模型，并补上多语言路由与 SEO 基建。**

新增/重写的文件：

| 文件 | 作用 |
|---|---|
| `web/src/lib/lang.ts` | **语言单一来源**：`LANGS`/`DEFAULT_LANG`/`pickTranslation()`（含 en 回退）/`htmlLang()` |
| `web/src/lib/repo.ts` | 适配层：把「主表 + `*_translations`」拍平成页面视图；页面完全不感知 translations 结构 |
| `web/src/lib/site.ts` | `localePath()`（语言路径唯一拼接点）、`hreflangMap()`、`absUrl()` |
| `web/src/middleware.ts` | 无语言前缀 → 307 到 `/en/...` |
| `web/src/app/[lang]/**` | 路由迁到路径式语言段；`layout.tsx` 即根布局（含 `<html lang>`） |
| `web/src/types/*.ts` | 视图类型，列表条目带 `lang`（该条内容实际所属语言） |
| `web/next.config.ts` | 加 `htmlLimitedBots: /.*/`（见 §7 坑9） |

**取数写法（实测可用，可直接抄）**：
```
# 列表：一次取回「请求语言 + en」，应用层挑
fields=id,level,image,translations.name,translations.slug,translations.short_description
deep[translations][_filter][language][_in]=zh,en

# 详情（分类/新闻）：slug 定位到某条翻译行
filter[translations][slug][_eq]=<slug>          # 不加语言过滤，拿到全部翻译行
fields=id,level,image,translations.name,translations.slug,translations.short_description,translations.description,
       parent_id.id,parent_id.level,parent_id.translations.name,parent_id.translations.slug
deep[parent_id.translations][_filter][language][_in]=zh,en
```

**字段改名对照**（翻译行统一模板）：
```
title  → name
summary → short_description
body   → description
slug   → 从主表移入翻译行
product.title / order_no / poles / pitch → 留在主表，变体表不用改
```

**验收**：`node data/verify_m1_web.mjs` → **PASS 34 / FAIL 0**，覆盖语言入口与 middleware、三级分类链、系列详情与语言收敛、中英新闻、404、以及 5 个主流爬虫的 metadata 是否落在 `<head>`。

### 9.2 还没拍板的决策

| # | 决策 | 建议 | 影响 |
|---|---|---|---|
| D1 | 语言/站点减法 | en+zh 必保；de/es/fr 按 GA 流量裁决；cs（sitemap 为空）建议停用 301 到 en | 每保留一个语言 = 整条迁移×翻译链路 |
| D3 | 旧域名策略 | `degson.com` / `degson.cn` 双主域 vs 收敛单域 | M2 启动前 |
| D4 | 询盘流向 | 仅邮件 vs 同步 CRM | M2 中期 |
| D5 | 站点归属 | 新站是否接管旧站全部栏目 | M2 中期 |

### 9.3 M2 地基（下一个里程碑，按优先级）

1. **补齐 SEO 基建剩余部分**：`sitemap`（**>5 万 URL 自动分片**）、`robots.txt`、`llms.txt`、`og:*`、x-default 已就位但需随语言扩展复核
2. **Meilisearch**：多语言分词 + 极数/间距/连接方式筛选
3. **读只读凭据的自动化**：现在靠 `data/make_web_token.mjs` 手工建，应纳入初始化脚本
4. **CI/CD**：Git 已就位，缺自动构建部署
5. **迁移演练**：产品目录全量（系列 3,614 / 订货号 13,098 / 全语言变体 **147,250 行**）在 staging 跑一遍
6. **轮换已泄漏的生产凭据**（PRD 风险 R6）

### 9.4 M3 铺开 / 切换

- M3：全部页型、`hr_tags` 109 条片段逆向、二批语言、媒体迁移、OSS 对接
- M4：全量迁移、301 上线、双跑对照、按页型灰度、旧站只读归档

**总周期估算：8–12 个月（语言减法后可 7–9 个月）**

### 9.5 开工时最容易忽略的三件事

1. **`web/` 已不再读旧模型** —— 如果你看到谁在写 `category.name`（主表）那是**错的**，`name` 在翻译表（见 §9.1 映射表）。
2. **前台凭据与新库绑定** —— `web/.env.local` 的 `DIRECTUS_TOKEN` 是 `data/make_web_token.mjs` 建出来的只读 token，**删库重建后必须重跑该脚本**并更新 `.env.local`，否则前台全站 401。
3. **PRD §7.2 第 9 条要求"GEO 改版成果继承"** —— 但**现网 GEO 产出实测有 4 类硬伤**（canonical 指向 404、新闻页挂错文章 Schema、hreflang 指向错误站点、产品页值错误）。**继承前必须先修正，不能直接照搬现网值。**

### 9.6 已知缺口（M1 明确没做，别误以为已覆盖）

| 缺口 | 说明 |
|---|---|
| `site_settings` 无翻译表 | 现在 `hero_title` / `footer_text` 等对所有语言同一份。**首页副标题实测已是英文**，中文站会显示英文。补法：加 `site_settings_translations`，需走 §11 模型变更流程 |
| 无 `sitemap.xml` / `robots.txt` / `llms.txt` | M1 只做了 `canonical` + `hreflang` + `<html lang>` + JSON-LD |
| 无 `og:*` / Twitter Card | metadata 未配 `openGraph` |
| 分类/系列页 JSON-LD 仍是 `CollectionPage` | 未加 `ItemList`，产品页 `Product` 未加 `offers`（无价格，需按 PRD §8.1.1 决定） |
| 无 `data/99_verify.sql` 更新 | 字段已变，该脚本仍按旧模型写，**跑之前要先改** |
| 无 301 重定向表 | 旧站 `details_552_*` → 新 URL 的映射未建 |
| **响应式未达标（PRD §7.4 要求 3/4，验收级）** | `SiteHeader` 无移动端导航形态；`VariantTable` 仅有 `overflow-x-auto` 横向滚动，未做移动端卡片形态。M1 静态盘点：**48 处断点类 / 11/18 文件含断点**，卡片栅格与容器留白已适配，`viewport` meta 由 Next 默认注入；但**从未按视口实测**（要求 2 未验证）。PRD §7.4 要求六个视口宽度 × 五类页型 + iOS/Android 真机各一轮 |

---

## 10. 文档索引（按需深入）

| 文档 | 内容 |
|---|---|
| `D:\degson-pilot\docs\DEGSON新官网项目需求文档-DeepSeek版.md` | **需求基线（v2.0-DeepSeek）**，含相对旧版的所有修订与依据 |
| `D:\degson-pilot\docs\M0.3-底座重建手册.md` | **从零重建的完整步骤 + 坑 + 模型变更流程** |
| `D:\degson-pilot\README.md` | M0.2 试点的历史记录（部分已被 M0.3/M1 修正，注意甄别） |
| `D:\DEGSON-GEO-Workspace\旧站架构实测报告.md` | 旧站代码与数据库的实测证据（15 个生产库、两代架构） |
| `D:\DEGSON-GEO-Workspace\新官网架构方案-v2.md` | 架构与后台建设方案 |
| `D:\dev-tools\geo-score\deliver\新闻页Schema-最终版.md` | 结构化数据写法（可直接给供应商） |

**给模型的建议阅读顺序**：本文档 → `docs/M0.3-底座重建手册.md` → `docs/DEGSON新官网项目需求文档-DeepSeek版.md`（重点 §5、§6、§7.2）→ 动手前先跑 `data/probe_api.mjs` 确认 API 正常。

---

## 11. 可复跑的验证脚本

| 脚本 | 用途 |
|---|---|
| `data/build_model.mjs` | **幂等建模**（建集合/字段/关系/别名/语言），可重复执行 |
| `data/add_translations_alias.mjs` | 为父表建 `translations` O2M 别名 |
| `data/make_web_token.mjs` | **建前台只读 policy/role/user + 静态 token**（删库重建后必跑） |
| `data/probe_api.mjs` | 探测 REST/GraphQL 可用性（用 Node，别用 PowerShell） |
| `data/probe_m1.mjs` | 探测 M1 用到的全部查询形状（deep 翻译过滤、多级父链、语言回退） |
| `data/probe_bots.mjs` | **测各爬虫 UA 下 metadata 是否在 `<head>`**（坑9 的验证器） |
| `data/verify_alias.mjs` | 验证翻译行可遍历 |
| `data/verify_m1_web.mjs` | **前台端到端验收（34 项）**，改前台后必跑 |
| `data/03_seed.sql` | 从旧库底料 `degson_legacy` 生成业务数据 |
| `data/99_verify.sql` | 数据自检（**字段已变，跑之前先按新模型更新**） |

**模型变更的唯一正确流程**：
```
1. 改 Directus 界面（或 build_model.mjs）
2. cd cms && .\node_modules\.bin\directus.CMD schema snapshot --yes .\snapshot.yaml
3. git diff cms/snapshot.yaml        ← 这一步是关键 review
4. 提交
```
> **禁止只改界面不导快照** —— 那正是 M0.2 的状态：界面点出来的模型仓库里毫无记录，无法重建。

---

## 12. 底座验收标准（唯一一条）

> **把 `degson_pilot` 整个删掉，能不能只靠仓库里的东西把它一模一样地重建出来？**

**M0.3 已达标**（实测：重建库与主库 `directus_fields` 96/96、`directus_collections` 10/10、`directus_relations` 7/7，10 张业务表列数逐表一致）。

**这条是后续所有开发的底线**：任何改动之后仍须满足。

**配套的前台验收**：三个服务同时起来后，`node data/verify_m1_web.mjs` 必须 **PASS 34 / FAIL 0**。
