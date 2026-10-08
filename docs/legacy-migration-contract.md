# 旧库迁移契约（第一批：分类、系列、SKU）

状态：已实现样本契约，尚未连接生产旧库。

## 目标

旧数据库只作为只读迁移源，新官网运行时不直连旧库。所有抽取器都应把源数据转换成统一的中间结构，再由新模型导入。

当前实现：`data/migration/legacyContract.mjs`。

```text
只读导出 / 数据库查询
  → mapLegacyBatch()
  → validateMigrationBatch()
  → 迁移报告
  → 新库导入
```

## 第一批字段映射

| 旧数据 | 新模型 | 清洗规则 |
|---|---|---|
| `hr_category.catid` | `category.legacy_id` | 保留源 ID，作为迁移追踪字段 |
| `hr_category.parentid` | `category.parent_legacy_id` | 空值或 0 表示根节点 |
| `hr_category.engname / en_catname / catname` | `category_translations.name` | 按语言选择字段，去除首尾空格 |
| `hr_category.image` | `category.image` | 空字符串转 null |
| `hr_article.classify`（catid=550） | `series.category_legacy_id` | 旧库中该字段是分类 ID，不是系列名称 |
| `hr_article.matecode` | `series.matecode` | 去除首尾空格，禁止空值和重复 |
| `hr_article.title`（catid=550） | `series_translations.name` | 去除首尾空格，空值回退系列码并告警 |
| `hr_article.text` | `product.order_no` | 去除首尾空格，禁止空值和重复 |
| `hr_article.matecode` | `product.series_matecode` | 必须能关联到已导入系列 |
| `hr_article.title` | `product.title` | 去除首尾空格，空值告警 |
| `hr_article.text1` | `product.pitch` | 保留业务字符串，如 `3.5`、`4C`、`1NO` |
| `hr_article.text2` | `product.poles` | 保留业务字符串，如 `24P`、`1A`、`2C/O` |
| `hr_article.thumb` | `product.image` | 空字符串转 null |
| `hr_article.description` | `product.description` | 去除首尾空格，后续进入富文本净化 |

## 当前校验规则

硬错误：

- 空 `product.order_no`。
- 空 `product.series_matecode`。
- 空 `series.matecode`。
- 重复 `product.order_no`。
- 重复 `series.matecode`。
- 产品引用不存在的系列码。
- 必须做数值计算的字段无法从业务字符串中解析时，进入后续参数裁决；本契约不把 `pitch`/`poles` 强制转成数字。

告警：

- 系列名称为空。
- 产品标题为空。

硬错误禁止进入导入；告警必须进入迁移报告，由业务负责人裁决后才能发布。

## 使用方式

```js
import { mapLegacyBatch, validateMigrationBatch } from "./migration/legacyContract.mjs";

const batch = mapLegacyBatch({
  language: "en",
  categories: legacyCategories,
  series: legacySeries,
  products: legacyProducts,
});

const report = validateMigrationBatch(batch);
if (report.errors.length > 0) {
  throw new Error(report.errors.join("\n"));
}
```

样本回归：

```powershell
node data/verify_migration_contract.mjs
```

真实旧库只读抽取预览：

```powershell
$env:MYSQL_PWD = "本机只读密码"
node data/migration/extractLegacyBatch.mjs --product-limit=500
node data/migration/buildAdjudicationReport.mjs
```

后一个命令生成重复系列码、重复订货号和孤儿系列引用的 CSV/Markdown 裁决清单。清单生成在 `data/migration/reports/`，默认不入 Git。

旧 URL 迁移预览：

```powershell
$env:MYSQL_PWD = "本机只读密码"
node data/migration/buildUrlRedirectPreview.mjs
```

该预览按分类、系列、SKU 生成候选新 URL，并对重复订货号标记 `REVIEW_DUPLICATE_ORDER_NO`。它不是可直接上线的 301 配置，必须经过 URL 总账和人工复核。

## 全量只读 dry-run 分层

`data/migration/runLegacyDryRun.mjs` 会读取快照中的全部系列和 SKU（默认最多 20,000 条 SKU），但只在内存中映射和分层，不向旧库或新库写入。输出分为：

- `READY`：身份、关联和必填字段满足当前导入门槛。
- `REVIEW`：需要业务裁决后才能导入，例如重复系列码、重复订货号、系列分类缺失或孤儿系列引用。
- `REJECT`：当前批次结构不满足最低数据契约，例如分类没有旧 ID 或名称。

```powershell
$env:MYSQL_PWD = "本机只读密码"
node data/migration/runLegacyDryRun.mjs --product-limit=20000
node data/verify_migration_partition.mjs
```

本次快照的结果记录在 `docs/legacy-dry-run-2026-10-08.md`。特别注意：快照中的系列 `classify` 值（如 `231914`）不在当前 `hr_category` 有效分类表中，不能在导入时擅自创建或猜测分类；这部分必须补齐旧分类来源、建立分类映射，或由业务确认新的分类归属。

如果已经有经过确认的旧分类到新分类映射，可以只在 dry-run 中预演，不会写库：

```json
{
  "231582": { "target_id": "new-category-connectors" },
  "231583": { "target_id": "new-category-terminal-blocks" }
}
```

保存为本地忽略文件后执行：

```powershell
node data/migration/runLegacyDryRun.mjs `
  --product-limit=20000 `
  --category-map=data/migration/reports/category-map.preview.json
```

映射只会影响 `READY/REVIEW` 预演和分类缺口统计；它不是正式导入配置，也不会自动创建分类、修改旧库或修改新库。

## 后续接入旧库前必须补充

1. 明确只读导出方式和批次边界，不在迁移脚本中写入旧库。
2. 建立旧语言来源到新语言码的映射，不能默认把所有外语副本当成真实翻译。
3. 增加媒体、PDF、分类树、新闻、参数、会员和旧 URL 的独立映射契约。
4. 每个批次输出源行数、目标行数、丢弃行数、告警、错误和人工裁决记录。
5. 迁移完成后执行新库约束 SQL、孤儿检查、媒体可达性检查和 301 覆盖率检查。

本契约不负责连接生产数据库、不负责自动覆盖重复数据，也不负责绕过人工裁决。
