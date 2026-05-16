/**
 * E2E 环境诊断工具。
 *
 * 检查:
 *   1. miniprogram-automator 是否安装
 *   2. local.config.json 是否存在
 *   3. cliPath 是否配置且文件存在
 *   4. projectPath 是否配置且目录存在
 *   5. specs 目录是否存在且包含 spec 文件
 *
 * Usage: node tests/e2e/tools/doctor.js [--init]
 *   --init  尝试从 project.config.json 自动生成 local.config.json
 *
 * Exit codes:
 *   0 = 全部通过
 *   1 = 有警告（非阻塞）
 *   2 = 有错误（阻塞）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const CONFIG_PATH = path.resolve(__dirname, '../config/local.config.json');
const EXAMPLE_CONFIG_PATH = path.resolve(__dirname, '../config/local.config.example.json');
const SPECS_DIR = path.resolve(__dirname, '../specs');
const PROJECT_CONFIG_PATH = path.resolve(ROOT, 'project.config.json');

const RESULTS = { passed: [], warnings: [], errors: [] };

function pass(msg) { RESULTS.passed.push(msg); console.log('  [PASS] ' + msg); }
function warn(msg) { RESULTS.warnings.push(msg); console.log('  [WARN] ' + msg); }
function fail(msg) { RESULTS.errors.push(msg); console.log('  [FAIL] ' + msg); }

function checkFile(filePath, label) {
  if (fs.existsSync(filePath)) {
    pass(label + ' 存在: ' + path.relative(ROOT, filePath));
    return true;
  }
  fail(label + ' 不存在: ' + path.relative(ROOT, filePath));
  return false;
}

function checkDir(dirPath, label) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    pass(label + ' 目录存在: ' + path.relative(ROOT, dirPath));
    return true;
  }
  fail(label + ' 目录不存在: ' + path.relative(ROOT, dirPath));
  return false;
}

function main() {
  const args = process.argv.slice(2);
  const doInit = args.includes('--init');

  console.log('\n=== E2E 环境诊断 ===\n');

  // [1] Check miniprogram-automator
  console.log('[1] npm 依赖检查');
  try {
    require.resolve('miniprogram-automator', { paths: [ROOT] });
    pass('miniprogram-automator 已安装');
  } catch {
    fail('miniprogram-automator 未安装 — ENV_ERROR');
    console.log('    修复: npm install --save-dev miniprogram-automator');
  }

  // [2] Check config files
  console.log('\n[2] E2E 配置文件检查');
  const configExists = checkFile(CONFIG_PATH, 'E2E 配置文件 (local.config.json)');
  checkFile(EXAMPLE_CONFIG_PATH, 'E2E 配置模板 (local.config.example.json)');

  // [3] Check cliPath
  console.log('\n[3] 微信开发者工具 CLI 检查');
  if (configExists) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (config.cliPath) {
        if (fs.existsSync(config.cliPath)) {
          pass('CLI 路径存在: ' + config.cliPath);
        } else {
          fail('CLI 路径不存在: ' + config.cliPath + ' — E2E_CLI_ERROR');
          console.log('    修复: 安装微信开发者工具，或修改 tests/e2e/config/local.config.json 中的 cliPath');
        }
      } else {
        fail('local.config.json 中缺少 cliPath 字段 — E2E_CONFIG_ERROR');
      }
    } catch (e) {
      fail('配置文件解析失败: ' + e.message + ' — E2E_CONFIG_ERROR');
    }
  } else if (doInit) {
    // Auto-generate config from project state
    console.log('\n[init] 正在从 project.config.json 生成 local.config.json...');
    try {
      let projectPath = 'miniprogram';
      if (fs.existsSync(PROJECT_CONFIG_PATH)) {
        const projConf = JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8'));
        projectPath = projConf.miniprogramRoot || 'miniprogram';
      }
      const defaultConfig = {
        "_note": "请确认 cliPath 指向正确的微信开发者工具 CLI",
        "cliPath": "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
        "projectPath": projectPath,
        "defaultTimeout": 30000,
        "headless": true,
        "env": { "NODE_ENV": "test" }
      };
      fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2) + '\n');
      pass('已自动生成 local.config.json (projectPath=' + projectPath + ')');
      warn('请手动确认 cliPath 是否正确');
    } catch (e) {
      fail('自动生成配置失败: ' + e.message + ' — E2E_CONFIG_ERROR');
    }
  }

  // [4] Check project path
  console.log('\n[4] 项目路径检查');
  if (configExists) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      const projectPath = path.resolve(ROOT, config.projectPath || 'miniprogram');
      if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
        pass('项目路径存在: ' + config.projectPath);
      } else {
        fail('项目路径不存在: ' + projectPath + ' — E2E_CONFIG_ERROR');
      }
    } catch (e) {
      fail('项目路径检查失败: ' + e.message);
    }
  }

  // [5] Check spec directory
  console.log('\n[5] E2E 规格文件检查');
  if (checkDir(SPECS_DIR, 'E2E 规格目录')) {
    const specFiles = fs.readdirSync(SPECS_DIR).filter(f => f.endsWith('.spec.js'));
    if (specFiles.length === 0) {
      fail('规格目录中没有 .spec.js 文件 — 需要至少创建 smoke.spec.js');
    } else {
      pass('找到 ' + specFiles.length + ' 个规格文件: ' + specFiles.join(', '));
      const required = ['smoke.spec.js', 'navigation.spec.js', 'home.spec.js'];
      const missing = required.filter(r => !specFiles.includes(r));
      if (missing.length > 0) {
        warn('缺少推荐规格文件: ' + missing.join(', '));
      }
    }
  }

  // [6] Check project.config.json
  console.log('\n[6] 项目配置文件');
  checkFile(PROJECT_CONFIG_PATH, 'project.config.json');

  // Summary
  console.log('\n=== 诊断总结 ===');
  console.log('  通过: ' + RESULTS.passed.length);
  console.log('  警告: ' + RESULTS.warnings.length);
  console.log('  错误: ' + RESULTS.errors.length);

  if (RESULTS.errors.length > 0) {
    console.log('\n[E2E Doctor] Failed');
    console.log('阻塞问题:');
    RESULTS.errors.forEach(e => console.log('  - ' + e));

    // Write BLOCKED report
    const reportDir = path.resolve(ROOT, 'tests/e2e/reports/latest');
    fs.mkdirSync(reportDir, { recursive: true });
    const report = {
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: 0,
      status: 'BLOCKED',
      scope: ['e2e-doctor'],
      errors: RESULTS.errors.map(e => ({ type: 'E2E_CONFIG_ERROR', message: e, evidence: '', owner: 'user' }))
    };
    fs.writeFileSync(path.join(reportDir, 'result.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(reportDir, 'summary.md'),
      '# E2E Doctor — BLOCKED\n\n' +
      '## 阻塞问题\n\n' +
      RESULTS.errors.map(e => '- ' + e).join('\n') + '\n'
    );

    process.exit(2);
  }

  if (RESULTS.warnings.length > 0) {
    console.log('\n非阻塞警告:');
    RESULTS.warnings.forEach(w => console.log('  - ' + w));
    process.exit(1);
  }

  console.log('\n[E2E Doctor] Passed');
  process.exit(0);
}

main();
