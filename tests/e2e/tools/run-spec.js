/**
 * 运行单个 E2E spec 文件。
 *
 * Usage: node tests/e2e/tools/run-spec.js tests/e2e/specs/smoke.spec.js
 *   npm run test:e2e:run -- tests/e2e/specs/smoke.spec.js
 *
 * Exit codes:
 *   0 = 全部通过
 *   1 = 有失败或 BLOCKED
 */

const path = require('path');
const fs = require('fs');
const reporter = require('./reporter');

const ROOT = path.resolve(__dirname, '../../..');

async function main() {
  const specArg = process.argv[2];
  if (!specArg) {
    console.error('用法: node tests/e2e/tools/run-spec.js <spec-file>');
    console.error('示例: node tests/e2e/tools/run-spec.js tests/e2e/specs/smoke.spec.js');
    process.exit(1);
  }

  const specPath = path.resolve(ROOT, specArg);
  if (!fs.existsSync(specPath)) {
    console.error('Spec 文件不存在: ' + specPath);
    process.exit(1);
  }

  const specName = path.basename(specPath, '.spec.js');
  const startTime = new Date();
  const commands = [{
    timestamp: startTime.toISOString(),
    command: 'node ' + process.argv.slice(1).join(' ')
  }];

  console.log('\n[E2E] Running spec: ' + specName);
  console.log('[E2E] File: ' + path.relative(ROOT, specPath) + '\n');

  let passed = 0;
  let failed = 0;
  const failedDetails = [];

  try {
    const spec = require(specPath);

    if (typeof spec.run !== 'function') {
      console.error('Spec 文件必须导出 run(context) 函数: ' + specPath);
      process.exit(1);
    }

    const harness = {
      pass: (name) => {
        passed++;
        console.log('  [PASS] ' + name);
        commands.push({
          timestamp: new Date().toISOString(),
          command: 'PASS: ' + name
        });
      },
      fail: (name, error) => {
        failed++;
        const detail = {
          name: name,
          error: error ? error.message : 'Unknown error',
          type: (error && error.type) ? error.type : 'UNKNOWN_ERROR'
        };
        failedDetails.push(detail);
        console.log('  [FAIL] ' + name + ': ' + detail.error);
        commands.push({
          timestamp: new Date().toISOString(),
          command: 'FAIL: ' + name + ': ' + detail.error
        });
      }
    };

    await spec.run(harness);

  } catch (e) {
    failed++;
    failedDetails.push({
      name: 'spec-load',
      error: e.message,
      type: e.type || 'E2E_RUNTIME_ERROR'
    });
    console.log('  [CRASH] ' + e.message);
    commands.push({
      timestamp: new Date().toISOString(),
      command: 'CRASH: ' + e.message
    });
  }

  const endTime = new Date();
  const elapsed = endTime - startTime;
  const duration = (elapsed / 1000).toFixed(2) + 's';

  console.log('\n[E2E] ' + specName + ': ' + passed + ' passed, ' + failed + ' failed (' + duration + ')');

  // Write per-spec report
  const reportDir = path.resolve(ROOT, 'tests/e2e/reports/latest');
  reporter.writeSpecReport(reportDir, specName, {
    timestamp: startTime.toISOString(),
    passed,
    failed,
    total: passed + failed,
    duration,
    failedDetails,
    commands
  });
  reporter.updateSummary(reportDir, { specName, passed, failed, total: passed + failed });

  // Exit with failure if any test failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('[E2E] Fatal error:', e);
  process.exit(1);
});
