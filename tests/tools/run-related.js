/**
 * 运行与当前变更相关的测试。
 *
 * 基于 git diff 判断变更范围:
 *   - cloudfunctions/* → 运行 Jest 单元测试
 *   - miniprogram/services/* → 运行 Jest 单元测试 (如有)
 *   - miniprogram/pages/*, miniprogram/components/* → 运行结构验证
 *   - 涉及页面/组件/服务/路由 → 必须触发 E2E
 *
 * Usage: node tests/tools/run-related.js
 *   npm run test:related
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function getChangedFiles() {
  try {
    // Try to get changed files from the current branch vs main
    const output = execSync('git diff --name-only main...HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const files = output.trim().split('\n').filter(Boolean);
    if (files.length > 0) return files;
  } catch {
    // main...HEAD might not work if no main branch locally
  }

  try {
    // Fallback: changes since last commit
    const output = execSync('git diff --name-only HEAD~1', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function runCmd(cmd, label) {
  console.log('\n[' + label + '] ' + cmd);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', timeout: 180000 });
    console.log('[PASS] ' + label);
    return true;
  } catch (e) {
    console.error('[FAIL] ' + label + ' (exit code: ' + (e.status || 'unknown') + ')');
    return false;
  }
}

function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('没有检测到最近的变更。运行默认单元测试...');
    runCmd('npx jest --verbose', 'default-unit');
    process.exit(0);
  }

  console.log('变更文件 (' + changedFiles.length + '):');
  changedFiles.forEach(f => console.log('  - ' + f));

  const hasPageChanges = changedFiles.some(f =>
    f.startsWith('miniprogram/pages/') || f.startsWith('miniprogram/components/'));
  const hasServiceChanges = changedFiles.some(f =>
    f.startsWith('miniprogram/services/'));
  const hasCloudFnChanges = changedFiles.some(f =>
    f.startsWith('cloudfunctions/'));
  const hasRouteChanges = changedFiles.some(f =>
    f === 'miniprogram/app.json' || f === 'miniprogram/app.js');
  const isInfraChange = changedFiles.every(f =>
    f.startsWith('tests/') || f.startsWith('docs/') || f.startsWith('.claude/'));

  let allPassed = true;
  const requiresE2E = hasPageChanges || hasServiceChanges || hasRouteChanges;

  // Run unit tests if cloud functions or services changed
  if (hasCloudFnChanges || hasServiceChanges) {
    if (!runCmd('npx jest tests/unit --verbose', 'unit-tests')) {
      allPassed = false;
    }
  }

  // Run structure tests if pages changed
  if (hasPageChanges) {
    if (!runCmd('node tests/tools/run-structure.js', 'structure-tests')) {
      allPassed = false;
    }
  }

  // E2E required for page/component/service/route changes
  if (requiresE2E) {
    console.log('\n[E2E] 检测到页面/组件/服务/路由变更，触发 E2E 验证...');
    if (!runCmd('node tests/e2e/tools/run-all.js', 'e2e-tests')) {
      allPassed = false;
    }
  } else if (isInfraChange) {
    console.log('\n[E2E] 仅测试基础设施变更，跳过 E2E。');
  } else {
    console.log('\n[E2E] 变更不涉及页面/组件/服务/路由，跳过 E2E。');
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log('\n[test:related] 全部通过');
  process.exit(0);
}

main();
