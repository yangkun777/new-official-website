# Directus 原生导入导出操作手册

本手册适用于当前 Directus 11.17.4 后台和 `Content Editor` 角色。当前基座使用 Directus 原生 CSV 导入导出，不包含 XLSX、自定义导入界面、按业务键自动关联或逐行中文错误报告。

## 首次恢复权限

角色与权限不在 schema snapshot 中。新环境完成 schema 恢复后，用管理员凭据执行：

```powershell
node data/apply_content_editor_access.mjs
```

脚本会幂等创建或复用同名 policy、role 和关联，并恢复业务集合的 `read/create/update` 权限以及文件库导出所需的 `read/create` 权限。脚本不创建永久用户，也不保存或输出静态 token。

## 后台入口

1. 使用绑定了 `Content Editor` 角色的账号登录 Directus。
2. 在左侧“内容”中进入目标集合，例如“产品”“产品系列”或“新闻”。
3. 在集合列表右上角操作菜单中选择“导出项目”或“导入项目”。
4. 导入和导出统一使用 UTF-8 编码的 `.csv` 文件。

若后台菜单名称因浏览器语言不同而显示英文，对应功能为 `Import Items` 和 `Export Items`。

## 推荐操作流程

1. 先在列表页设置筛选条件，只保留确实要修改的记录。
2. 导出当前筛选结果为 CSV，不要直接导出全库后无差别修改。
3. 保留导出文件中的 `id` 列，在 Excel、WPS 或文本编辑器中批量修改。
4. 另存为 CSV UTF-8；不要另存为 XLSX。
5. 先只选少量 `draft` 数据导入，回到后台核对字段和关系。
6. 小批量验证无误后，再处理其余数据。

更新现有记录时必须保留原 `id`。没有 `id` 的行会按新增记录处理；`order_no`、`matecode` 或 `slug` 不会被原生导入器当作自动 upsert 业务键。

## 关系字段与空值风险

当前关系字段必须填写 Directus 内部 ID：

- `category.parent_id`：上级分类的 `category.id`
- `series.category_id`：分类的 `category.id`
- `product.series_id`：系列的 `series.id`，当前允许留空
- `category_translations.category_id`：分类的 `category.id`
- `series_translations.series_id`：系列的 `series.id`
- `product_translations.product_id`：产品的 `product.id`
- `news_translations.news_id`：新闻的 `news.id`

当前不支持按 `order_no`、`matecode`、名称或 slug 自动解析关系。应先导出父集合取得内部 ID，再填写子集合 CSV。

导入文件中存在但值为空的列，可能把数据库原值覆盖为空。只更新少数字段时，应删除不需要修改的列，而不是保留空单元格。必填字段、唯一字段和关系约束仍由 Directus 校验；原生错误信息不保证逐行中文说明。

## 空模板

`docs/import-templates/` 提供八个仅含表头的 UTF-8 CSV 模板。表头均为 Directus 实际字段名；没有示例业务数据，避免误导入。

- `category.csv`：`id`、层级 `level`、父分类 `parent_id`、图片 `image`、排序 `sort`、状态 `status`
- `category_translations.csv`：`id`、语言 `language`、父记录 `category_id`，以及名称、slug、SEO 和正文相关字段
- `series.csv`：`id`、系列码 `matecode`、分类 `category_id`、图片、排序和状态
- `series_translations.csv`：`id`、语言、父记录 `series_id`，以及名称、slug、SEO 和正文相关字段
- `product.csv`：`id`、订货号 `order_no`、型号 `title`、系列 `series_id`、极数、节距、组合标题和状态
- `product_translations.csv`：`id`、语言、父记录 `product_id`，以及名称、slug、SEO 和正文相关字段
- `news.csv`：`id`、封面 `cover_image`、发布日期 `publish_date`、排序和状态
- `news_translations.csv`：`id`、语言、父记录 `news_id`，以及名称、slug、SEO 和正文相关字段

模板没有列出 `created_at`、`updated_at` 等系统维护字段。需要批量更新时，优先从后台筛选导出实际记录，以导出文件为修改底稿；空模板主要用于新增或人工准备最小字段集。

## 原生能力边界

当前原生支持：

- CSV UTF-8 新增记录
- 带内部 `id` 的 CSV 更新现有记录
- 根据列表筛选条件导出 CSV 到 Directus 文件库
- 内容编辑角色读取、新增和更新指定业务集合

当前原生不支持：

- XLSX 直接导入
- 自定义导入 UI
- 按业务键自动关联或自动查找关系
- 逐行中文错误报告
- 内容编辑角色删除业务记录或文件

导出的文件由 Directus 写入文件库。`Content Editor` 只有读取和创建文件的权限，没有删除权限；需要清理文件时由管理员按运维流程处理。

## 备份与回滚

批量操作前应备份数据库，并保留未经修改的原始导出 CSV。Directus 原生导入没有“一键撤销”：

- 更新回滚：用原始导出文件保留的 `id` 和旧值重新导入。
- 新增回滚：先用唯一前缀或明确筛选条件核对新增记录，再由有删除权限的管理员删除。
- 关系字段误填：先停止继续导入，依据原始导出恢复内部 ID。

不要在没有备份的情况下进行全量导入。

## 验证命令

静态基座验证不依赖正在运行的 Directus：

```powershell
node data/verify_base.mjs
```

真实 API 验收要求 Directus 正常运行，并需要管理员 token 和现有 Web 只读 token：

```powershell
node data/verify_native_import_export.mjs
```

真实 API 脚本会临时创建 `Content Editor` 用户，验证 CSV 新增、带 `id` 更新、筛选导出、文件读取及 Web token 导入返回 403，并在 `finally` 中清理测试产品、导出文件和临时用户。脚本不打印任何 token。
