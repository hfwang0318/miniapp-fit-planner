/**
 * 清理 E2E 报告目录。
 * 删除 tests/e2e/reports/latest/ 下所有文件，然后重新创建目录。
 * 不得删除 specs、fixtures、config、tools。
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.resolve(__dirname, '../reports/latest');

if (fs.existsSync(REPORT_DIR)) {
  const entries = fs.readdirSync(REPORT_DIR);
  for (const entry of entries) {
    const full = path.join(REPORT_DIR, entry);
    if (fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
    }
  }
  console.log('[clean-reports] Cleaned E2E reports: ' + REPORT_DIR);
} else {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  console.log('[clean-reports] Created E2E reports directory: ' + REPORT_DIR);
}

// Ensure directory exists after cleaning
fs.mkdirSync(REPORT_DIR, { recursive: true });
