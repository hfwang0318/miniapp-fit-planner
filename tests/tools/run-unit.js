/**
 * 运行 Jest 单元测试。
 *
 * Usage: node tests/tools/run-unit.js [test-path]
 *   npm run test:unit                  — 运行 tests/unit/ 全部
 *   npm run test:unit -- tests/unit/cloudfunctions/auth
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function main() {
  const testPath = process.argv[2] || 'tests/unit';
  const cmd = 'npx jest ' + testPath + ' --verbose';

  console.log('[run-unit] ' + cmd + '\n');

  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    console.log('\n[run-unit] PASS');
    process.exit(0);
  } catch (e) {
    console.error('\n[run-unit] FAIL (exit code: ' + (e.status || 'unknown') + ')');
    process.exit(e.status || 1);
  }
}

main();
