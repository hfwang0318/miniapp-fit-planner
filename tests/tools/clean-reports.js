/**
 * 清理全部测试报告目录。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isFile()) {
        fs.unlinkSync(fp);
      }
    });
    console.log('[clean-reports] Cleaned: ' + path.relative(ROOT, dir));
  }
}

const dirs = [
  path.resolve(__dirname, '../reports'),
  path.resolve(__dirname, '../e2e/reports/latest'),
];

dirs.forEach(cleanDir);

// Also ensure E2E reports directory exists
const e2eReports = path.resolve(__dirname, '../e2e/reports/latest');
fs.mkdirSync(e2eReports, { recursive: true });

console.log('[clean-reports] Done.');
