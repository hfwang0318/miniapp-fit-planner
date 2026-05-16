/**
 * 运行全部测试（test:all）。
 *
 * 顺序:
 *   1. test:clean   — 清理旧报告
 *   2. test:doctor  — 诊断环境
 *   3. test:scan    — 扫描项目结构
 *   4. test:unit    — 运行单元测试
 *   5. test:structure — 页面结构验证
 *   6. test:e2e     — E2E 测试（强制阶段）
 *
 * E2E 是强制阶段。外部环境缺失时标记 BLOCKED，不静默跳过。
 *
 * Usage: node tests/tools/run-all.js
 *   npm run test:all
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');

const STEPS = [
  {
    name: 'Clean reports',
    cmd: 'node tests/tools/clean-reports.js',
    required: false,
    timeout: 30000
  },
  {
    name: 'Doctor',
    cmd: 'node tests/tools/doctor.js',
    required: true,
    timeout: 60000
  },
  {
    name: 'Scan project',
    cmd: 'node tests/tools/scan-project.js',
    required: true,
    timeout: 30000
  },
  {
    name: 'Unit tests',
    cmd: 'npx jest tests/unit --verbose',
    required: true,
    timeout: 120000
  },
  {
    name: 'Structure tests',
    cmd: 'node tests/tools/run-structure.js',
    required: true,
    timeout: 30000
  },
  {
    name: 'E2E tests',
    cmd: 'node tests/e2e/tools/run-all.js',
    required: true,
    timeout: 300000
  }
];

function main() {
  const startTime = new Date();
  const results = [];
  let failures = 0;
  let blocked = false;

  console.log('========================================');
  console.log('  test:all — 全量测试');
  console.log('  开始时间: ' + startTime.toISOString());
  console.log('========================================');

  for (const step of STEPS) {
    console.log('\n========================================');
    console.log('STEP: ' + step.name);
    console.log('CMD:  ' + step.cmd);
    console.log('========================================');

    try {
      execSync(step.cmd, {
        cwd: ROOT,
        stdio: 'inherit',
        timeout: step.timeout
      });
      console.log('[PASS] ' + step.name);
      results.push({ step: step.name, status: 'PASS' });
    } catch (e) {
      const exitCode = e.status || 'unknown';
      const isRequired = step.required;

      // E2E step: check if BLOCKED or FAIL
      if (step.name === 'E2E tests') {
        // Try to determine if it's BLOCKED vs FAIL from the E2E report
        const e2eReportPath = path.resolve(ROOT, 'tests/e2e/reports/latest/result.json');
        let e2eStatus = 'FAIL';
        try {
          if (fs.existsSync(e2eReportPath)) {
            const report = JSON.parse(fs.readFileSync(e2eReportPath, 'utf8'));
            e2eStatus = report.status || 'FAIL';
          }
        } catch {
          // Can't read report, assume FAIL
        }

        if (e2eStatus === 'BLOCKED') {
          blocked = true;
          console.error('[BLOCKED] E2E tests — 外部环境缺失');
          results.push({ step: step.name, status: 'BLOCKED' });
        } else {
          failures++;
          console.error('[FAIL] ' + step.name + ' (exit code: ' + exitCode + ')');
          results.push({ step: step.name, status: 'FAIL' });
        }
      } else if (isRequired) {
        failures++;
        console.error('[FAIL] ' + step.name + ' (exit code: ' + exitCode + ')');
        results.push({ step: step.name, status: 'FAIL' });
      } else {
        console.error('[WARN] ' + step.name + ' (exit code: ' + exitCode + ', 非强制)');
        results.push({ step: step.name, status: 'WARN' });
      }
    }
  }

  const endTime = new Date();
  const elapsed = ((endTime - startTime) / 1000).toFixed(2) + 's';

  // Determine overall status
  let overallStatus;
  if (failures === 0 && !blocked) {
    overallStatus = 'PASS';
  } else if (blocked && failures === 0) {
    overallStatus = 'BLOCKED';
  } else {
    overallStatus = 'FAIL';
  }

  console.log('\n========================================');
  console.log('  最终结果');
  console.log('========================================');
  console.log('状态: ' + overallStatus);
  console.log('耗时: ' + elapsed);
  console.log('');

  for (const r of results) {
    const icon = r.status === 'PASS' ? '[PASS]' :
                 r.status === 'BLOCKED' ? '[BLOCKED]' :
                 r.status === 'WARN' ? '[WARN]' : '[FAIL]';
    console.log('  ' + icon + ' ' + r.step);
  }

  // Ensure the E2E reports directory has a final report
  const e2eReportDir = path.resolve(ROOT, 'tests/e2e/reports/latest');
  fs.mkdirSync(e2eReportDir, { recursive: true });
  fs.writeFileSync(
    path.join(e2eReportDir, 'result.json'),
    JSON.stringify({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs: endTime - startTime,
      status: overallStatus,
      steps: results
    }, null, 2) + '\n'
  );

  if (overallStatus === 'PASS') {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
