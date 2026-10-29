# 旧站产品模块：本机底料 vs 线上英文库（2026-10-20）

日期：2026-10-20  
范围：本机 `degson_legacy` / `data/01_legacy_subset.sql`、英文 PolarDB、PHP 快照 `E:\degsonen\degsonEn`  
性质：**只读梳理**。未改线上库、未改 PHP、未把凭据写入仓库。

---

## 1. 结论

1. 旧后台「产品认证」第一条 `id=5326376` **在生产英文库里**，不在本机试点底料里。
2. 本机 `01_legacy_subset.sql` 只导了 **en 产品频道（栏目 547–552）+ 全部栏目定义**，没有认证 / 附件 / 下载 / 关联的 `hr_article` 行。
3. 从当前这台开发机 **连不上** 英文 PolarDB 公网：DNS 被代理 Fake-IP 劫持到 `198.18.0.24`，TCP 超时 `10060`。私网地址只能走阿里云 VPC。
4. 旧站这些模块不是 SKU 上的几个字段，而是 **同一张 `hr_article`，用 `catid` 当模块、用订货号 `text` 关联**。
5. 新官网试点不要照抄「一个栏目一张总表、语言当一行」；应用 **一条 SKU 挂子集合**。全量迁移等只读连上生产后再抽样本。

---

## 2. 本机底料实际有什么

来源：生产库只读导出 `@2026-09-23`，文件头写明「en 产品频道 + 全部栏目定义」。

| 项 | 本机 `degson_legacy`（3307） |
|---|---|
| 表 | 只有 `hr_article`、`hr_category` |
| `hr_article` | 17,245 行 |
| `id` 范围 | 最小 231579，**最大 5325666** |
| 最大 id 那条 | `catid=552` SKU `S-ESPP-08-OR-0193-BK-A00A` |
| 查询 `id=5326376` | **空**（比本地最大 id 还大 710） |
| 实际有内容的栏目 | 547–552（分类 / 系列 / SKU / banner 等） |

`hr_category` 里能看到栏目**空壳**（有名字、没有文章）：

| catid | 栏目 |
|---|---|
| 66 | 产品认证库 |
| 555 | 产品认证图片 |
| 557 | 产品认证 |
| 558 | 产品认证 · 内容管理（子行） |
| 559 / 560 | 产品附件 + 子行 |
| 562 / 563 | 产品下载 + 子行 |
| 565 / 566 / 567 | 配套 / 关联 / 近似规格 |

本地查不到 5326376，是因为 **子集没导 557**，不是这条在生产里不存在。

---

## 3. 英文 PolarDB 为什么现在读不到

账号侧（只记录用途，**密码不入库**）：

- 公网：`engaosong.mysql.polardb.rds.aliyuncs.com`
- 私网：`pc-rj9fmo319au3m25fl.mysql.polardb.rds.aliyuncs.com`
- 只读查询应使用只读账号，禁止用 root 改数据

实测（2026-10-20，本机）：

| 目标 | 结果 |
|---|---|
| 公网 PolarDB | DNS → `198.18.0.24`（Clash 等 Fake-IP），`ERROR 2013` / `10060` |
| 私网 PolarDB | 本机进不去 VPC |
| 本机 3306 | 未监听。PHP 快照当前配的是本地 `127.0.0.1` / `db_en_degson`，不是阿里云 |

**不必关整个代理。** 需要让该域名走直连，例如：

- 规则 DIRECT：`engaosong.mysql.polardb.rds.aliyuncs.com` 和 `*.mysql.polardb.rds.aliyuncs.com`
- 或临时关 TUN / 系统代理
- 直连后还要把本机公网 IP 加进 PolarDB 白名单

连上后再用只读账号执行 `SELECT`，确认 `hr_article.id=5326376`。

---

## 4. 旧官网这块怎么串起来的

代码：`E:\degsonen\degsonEn\xhr\Common\common.php`、`xhr\Template\default\category\product_content_lines20.html`、`xhr\Lib\Action\Contents\ContentAction.class.php`。

产品详情页签（订货号 = `hr_article.text`）：

| 页签 | catid | 关联方式 |
|---|---|---|
| 总览里的认证 Logo | 555 + 库 66 | `555.description` 存认证库 id，`\|` 拼接 |
| 认证表格 | 557 父 + 558 子 | 父：`language` + `title` + `text`(订货号)；子：`relationid`=父 id，`title/text3/text4/text5` |
| 附件 | 559 + 560 | 同上父子 |
| 下载 | 562 + 563 | 子行 `file4` 为文件 |
| 技术数据 | 556 | `text`=订货号 |
| 商业数据 | 561 | 同上 |
| 关联 / 配套 / 近似 | 566 / 565 / 567 | `description` 系列码、`description1` 订货号，`\|` 拼接 |

前台认证页签：先 `getAttestationImg`（555→66 画 Logo），再 `getDataAndChildData(557,558,订货号)` 画折叠表。

Excel 导入（557/559/562）按「语言 + 标题 + 订货号」聚合成父行，子行进 558/560/563。

后台列表里「产品认证」第一条 `5326376`，按代码就是 **`catid=557` 的父记录**（排序 `listorder desc, updatetime desc, id desc`）。

---

## 5. 对新官网试点的含义

- **不要**从本机 11MB 子集猜 13k 关联/认证。
- **不要**为每个旧栏目再复制一张「语言当一行」的总表。
- **可以**先做模型试点：1 个 SKU 上挂认证 / 下载 / 关联子表，手工几条即可验证页签和前台。
- **全量**等 PolarDB 只读通了，再按 `catid IN (66,555,557,558,559,560,562,563,565,566,567)` 抽几百条做映射。

---

## 6. 下一步（未做）

1. 代理 DIRECT 或临时关 TUN，确认 DNS 不再是 `198.18.x`。
2. PolarDB 白名单放行本机公网 IP。
3. 只读查询：

```sql
SELECT id, catid, language, title, text, status
FROM hr_article
WHERE id = 5326376;

SELECT catid, COUNT(*) n
FROM hr_article
WHERE catid IN (66,555,556,557,558,559,560,561,562,563,565,566,567)
GROUP BY catid;
```

4. 确认后再决定：抽一小段导入本机，还是先手工种子做 Directus 页签试点。
