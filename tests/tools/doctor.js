/**
 * 全量测试环境诊断。
 *
 * 检查: Node.js、npm、Jest、project.config.json、miniprogram/app.json、
 *       npm 测试脚本完整性、E2E 环境。
 *
 * Usage: node tests/tools/doctor.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const RESULTS = { passed: [], warnings: [], errors: [] };

function pass(msg) { RESULTS.passed.push(msg); console.log('  [PASS] ' + msg); }
function warn(msg) { RESULTS.warnings.push(msg); console.log('  [WARN] ' + msg); }
function fail(msg) { RESULTS.errors.push(msg); console.log('  [FAIL] ' + msg); }

function checkFile(filePath, label) {
  if (fs.existsSync(filePath)) {
    pass(label + ' 存在');
    return true;
  }
  fail(label + ' 不存在');
  return false;
}

function main() {
  console.log('\n=== 全量测试环境诊断 ===\n');

  // [1] Basic environment
  console.log('[1] 基础环境');
  pass('Node.js ' + process.version);

  try {
    const npmVer = execSync('npm --version', { encoding: 'utf8' }).trim();
    pass('npm ' + npmVer);
  } catch {
    fail('npm 不可用');
  }

  // [2] Jest
  console.log('\n[2] Jest');
  try {
    require.resolve('jest', { paths: [ROOT] });
    pass('jest 已安装');
  } catch {
    fail('jest 未安装 — 请运行 npm install');
  }

  // [3] Project configs
  console.log('\n[3] 项目配置文件');
  const projConfigPath = path.resolve(ROOT, 'project.config.json');
  if (fs.existsSync(projConfigPath)) {
    try {
      const pj = JSON.parse(fs.readFileSync(projConfigPath, 'utf8'));
      if (pj.appid) pass('appid 已配置: ' + pj.appid);
      else warn('appid 为空');
      if (pj.miniprogramRoot) pass('miniprogramRoot: ' + pj.miniprogramRoot);
    } catch (e) {
      fail('project.config.json 解析失败: ' + e.message);
    }
  } else {
    fail('project.config.json 不存在');
  }

  const appJsonPath = path.resolve(ROOT, 'miniprogram/app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const app = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      if (app.pages && app.pages.length > 0) {
        pass('miniprogram/app.json 页面注册: ' + app.pages.length + ' 页');
      } else {
        fail('miniprogram/app.json 中 pages 为空');
      }
    } catch (e) {
      fail('miniprogram/app.json 解析失败: ' + e.message);
    }
  } else {
    fail('miniprogram/app.json 不存在');
  }

  // [4] npm test scripts
  console.log('\n[4] npm 测试脚本');
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'package.json'), 'utf8'));
    const expectedScripts = [
      'test:doctor', 'test:scan', 'test:unit', 'test:structure',
      'test:e2e', 'test:e2e:doctor', 'test:e2e:run', 'test:e2e:clean',
      'test:related', 'test:all', 'test:clean'
    ];
    const scripts = pkg.scripts || {};
    const existing = expectedScripts.filter(s => scripts[s]);
    const missing = expectedScripts.filter(s => !scripts[s]);

    if (missing.length === 0) {
      pass('所有 ' + expectedScripts.length + ' 个测试脚本已注册');
    } else {
      warn('缺少 ' + missing.length + ' 个脚本: ' + missing.join(', '));
    }
  } catch (e) {
    fail('package.json 读取失败: ' + e.message);
  }

  // [5] E2E environment
  console.log('\n[5] E2E 环境');
  const e2eDoctorPath = path.resolve(ROOT, 'tests/e2e/tools/doctor.js');
  if (fs.existsSync(e2eDoctorPath)) {
    try {
      execSync('node "' + e2eDoctorPath + '"', {
        cwd: ROOT,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 30000
      });
      pass('E2E 环境诊断通过');
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      if (e.status === 2) {
        fail('E2E 环境诊断有阻塞问题');
      } else if (e.status === 1) {
        warn('E2E 环境诊断有警告');
      }
      // doctor.js already printed its own details
    }
  } else {
    fail('E2E doctor 脚本不存在: tests/e2e/tools/doctor.js');
  }

  // Summary
  console.log('\n=== 诊断总结 ===');
  console.log('  通过: ' + RESULTS.passed.length);
  console.log('  警告: ' + RESULTS.warnings.length);
  console.log('  错误: ' + RESULTS.errors.length);

  if (RESULTS.errors.length > 0) {
    console.log('\n阻塞问题:');
    RESULTS.errors.forEach(e => console.log('  - ' + e));
    process.exit(2);
  }
  if (RESULTS.warnings.length > 0) {
    console.log('\n非阻塞警告:');
    RESULTS.warnings.forEach(w => console.log('  - ' + w));
    process.exit(1);
  }
  process.exit(0);
}

main();
