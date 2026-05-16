/**
 * 页面结构验证 (Testing Level 3)。
 *
 * 检查:
 *   1. app.json 中注册的每个页面目录存在
 *   2. 每个页面有完整的 4 文件 (index.js, index.wxml, index.wxss, index.json)
 *
 * Usage: node tests/tools/run-structure.js
 *   npm run test:structure
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const MINIPROGRAM = path.resolve(ROOT, 'miniprogram');
const APP_JSON_PATH = path.resolve(MINIPROGRAM, 'app.json');
const REQUIRED_EXTS = ['js', 'wxml', 'wxss', 'json'];

function main() {
  console.log('\n=== 页面结构验证 (L3) ===\n');

  // Read app.json
  let appJson;
  try {
    appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  } catch (e) {
    console.error('[FAIL] 无法读取 miniprogram/app.json: ' + e.message);
    process.exit(1);
  }

  const pages = appJson.pages || [];
  if (pages.length === 0) {
    console.error('[FAIL] app.json 中未注册任何页面');
    process.exit(1);
  }

  let passCount = 0;
  let failCount = 0;

  for (const pagePath of pages) {
    // pagePath is like "pages/dashboard/index" where "index" is the file basename
    // The actual directory is path.dirname, files are basename.js/.wxml/.wxss/.json
    const dirPart = path.dirname(pagePath);       // "pages/dashboard"
    const basePart = path.basename(pagePath);      // "index"
    const pageDir = path.resolve(MINIPROGRAM, dirPart);

    // Check directory exists
    if (!fs.existsSync(pageDir)) {
      console.log('  [FAIL] 页面目录不存在: ' + dirPart);
      failCount += REQUIRED_EXTS.length;
      continue;
    }

    // Check each required file
    for (const ext of REQUIRED_EXTS) {
      const filePath = path.join(pageDir, basePart + '.' + ext);
      if (fs.existsSync(filePath)) {
        console.log('  [PASS] ' + pagePath + '.' + ext);
        passCount++;
      } else {
        console.log('  [FAIL] MISSING: ' + pagePath + '.' + ext);
        failCount++;
      }
    }
  }

  const total = passCount + failCount;
  console.log('\n结果: ' + passCount + '/' + total + ' 通过');

  if (failCount > 0) {
    console.error('[FAIL] ' + failCount + ' 项未通过');
    process.exit(1);
  }

  console.log('[PASS] 所有页面文件结构完整');
  process.exit(0);
}

main();
