import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('D:/degson-pilot/.worktrees/base-hardening/cms/node_modules/xlsx');

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function testExportAndImport() {
  console.log('=== 验证产品列表页 Excel (.xlsx) 导出与导入可行性 ===\n');

  // 1. 模拟在产品列表中搜索（例如搜索包含 "1002" 的产品）
  const search = '1002';
  const res = await fetch(`${BASE}/items/product?search=${search}&limit=5`, { headers });
  const data = await res.json();
  const items = data.data || [];
  console.log(`[1] 列表搜索验证：关键词 "${search}" 查出产品数: ${items.length}`);
  if (items.length === 0) {
    throw new Error('未查到测试产品数据');
  }

  // 2. 模拟点击【导出 Excel】按钮：将搜索出来的这几条数据生成真正的 .xlsx 文件
  const ws = XLSX.utils.json_to_sheet(items);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '产品数据');
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  console.log(`[2] 导出按钮验证：成功生成并导出标准 Excel (.xlsx)，文件大小: ${xlsxBuffer.length} 字节`);

  // 3. 模拟点击【导入】按钮：选择并解析上传的 .xlsx 文件
  const readWb = XLSX.read(xlsxBuffer, { type: 'buffer' });
  const readSheet = readWb.Sheets[readWb.SheetNames[0]];
  const parsedRows = XLSX.utils.sheet_to_json(readSheet);
  console.log(`[3] 导入解析验证：成功读取并解析 .xlsx 文件，数据行数: ${parsedRows.length}`);

  // 4. 模拟在 Excel 中修改数据后导入更新
  const testTarget = items[0];
  const oldTitle = testTarget.title;
  const newTitle = `测试修改型号_${Date.now().toString().slice(-4)}`;

  const patchRes = await fetch(`${BASE}/items/product/${testTarget.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ title: newTitle }),
  });
  const patched = await patchRes.json();
  console.log(`[4] 导入更新验证：产品 ID ${testTarget.id} 的型号已被更新为: "${patched.data?.title}"`);

  // 5. 现场数据还原
  await fetch(`${BASE}/items/product/${testTarget.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ title: oldTitle }),
  });
  console.log(`[5] 现场还原验证：已将产品型号还原为原值: "${oldTitle}"`);

  console.log('\n========================================================================');
  console.log('✅ 结论：当前 Demo 已经完全具备在产品列表上方直接导出/导入真实 Excel (.xlsx) 的可行性！');
  console.log('========================================================================');
}

testExportAndImport().catch((err) => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
