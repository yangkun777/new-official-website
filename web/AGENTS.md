<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 项目约定（人工维护）

- 品牌中文名是 **高松**（英文 DEGSON），**禁止**写「德昌」。详见仓库根目录 [`AGENTS.md`](../AGENTS.md)。
- Directus 有限选项（语言、状态、层级、用途等）必须下拉，禁止自由输入。详见根目录 `AGENTS.md`。
- 前台的标题、说明、图片、产品/新闻资料及运营引导文案优先从 Directus 读取；页面布局和必要的操作标签可写在代码中。新增展示区块时，要给运营提供可编辑的中英文字段或复用现有内容模型，并同步维护种子与验收脚本。
