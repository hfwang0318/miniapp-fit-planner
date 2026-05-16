/**
 * 运行全部 E2E spec 文件，生成统一报告。
 *
 * Usage: node tests/e2e/tools/run-all.js
 *   npm run test:e2e
 *
 * Exit codes:
 *   0 = 全部通过
 *   1 = 有失败或 BLOCKED
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const reporter = require('./reporter');

const ROOT = path.resolve(__dirname, '../../..');
const SPECS_DIR = path.resolve(__dirname, '../specs');
const RUN_SPEC = path.resolve(__dirname, 'run-spec.js');
const REPORT_DIR = path.resolve(ROOT, 'tests/e2e/reports/latest');

function main() {
  const startTime = new Date();

  // Clean and recreate report directory
  if (fs.existsSync(REPORT_DIR)) {
    const entries = fs.readdirSync(REPORT_DIR);
    for (const entry of entries) {
      const full = path.join(REPORT_DIR, entry);
      try {
        if (fs.statSync(full).isFile()) fs.unlinkSync(full);
      } catch { /* ignore */ }
    }
  }
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Check specs directory
  if (!fs.existsSync(SPECS_DIR)) {
    console.error('[E2E] Specs 目录不存在: ' + SPECS_DIR);
    console.error('[E2E] 请先创建 E2E spec 文件（smoke, navigation, home）');
    process.exit(1);
  }

  const specFiles = fs.readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.spec.js'))
    .sort();

  if (specFiles.length === 0) {
    console.error('[E2E] 没有找到 .spec.js 文件在 ' + SPECS_DIR);
    console.error('[E2E] 状态: BLOCKED — 需要初始化 spec 文件');
    // Write BLOCKED report
    reporter.writeReport(REPORT_DIR, {
      timestamp: startTime.toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      status: 'BLOCKED',
      duration: '0s',
      results: [],
      commands: [],
      errors: [{
        type: 'E2E_INIT_ERROR',
        message: 'No spec files found in ' + SPECS_DIR,
        evidence: 'Specs directory exists but contains no .spec.js files',
        owner: 'tester'
      }]
    });
    process.exit(1);
  }

  console.log('[E2E] Found ' + specFiles.length + ' spec files to run\n');

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let blocked = false;
  const allCommands = [];

  for (const specFile of specFiles) {
    const specPath = path.join(SPECS_DIR, specFile);
    console.log('--- ' + specFile + ' ---');

    try {
      const output = execSync('node "' + RUN_SPEC + '" "' + specPath + '"', {
        cwd: ROOT,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 180000
      });
      console.log(output);
      // Parse result from output
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      const specPassed = passMatch ? parseInt(passMatch[1], 10) : 0;
      const specFailed = failMatch ? parseInt(failMatch[1], 10) : 0;
      totalPassed += specPassed;
      totalFailed += specFailed;
      results.push({ spec: specFile, status: specFailed > 0 ? 'FAIL' : 'PASS', error: null });
    } catch (e) {
      totalFailed++;
      const stderr = e.stderr ? e.stderr.toString().slice(0, 500) : e.message;
      console.error('[FAIL] ' + specFile + ': ' + stderr);
      results.push({ spec: specFile, status: 'FAIL', error: stderr });

      // Check if this is a BLOCKED-type failure
      if (stderr.includes('BLOCKED') || stderr.includes('E2E_CLI_ERROR') || stderr.includes('E2E_CONFIG_ERROR')) {
        blocked = true;
      }
    }
  }

  const endTime = new Date();
  const elapsed = endTime - startTime;
  const duration = (elapsed / 1000).toFixed(2) + 's';

  // Determine overall status
  let status;
  if (totalFailed === 0) {
    status = 'PASS';
  } else if (blocked) {
    status = 'BLOCKED';
  } else {
    status = 'FAIL';
  }

  // Write unified report
  reporter.writeReport(REPORT_DIR, {
    timestamp: startTime.toISOString(),
    status,
    total: results.length,
    passed: totalPassed,
    failed: totalFailed,
    duration,
    results,
    commands: allCommands,
    errors: results
      .filter(r => r.error)
      .map(r => ({ type: 'ASSERT_ERROR', message: r.error, evidence: r.spec, owner: 'developer' }))
  });

  reporter.writeSummaryFile(REPORT_DIR, {
    timestamp: startTime.toISOString(),
    total: results.length,
    passed: totalPassed,
    failed: totalFailed,
    duration,
    results
  });

  reporter.writeCommandsLog(REPORT_DIR, allCommands);

  // Print summary
  console.log('\n=== E2E Summary ===');
  console.log('Status: ' + status);
  console.log('Total:  ' + results.length);
  console.log('Passed: ' + totalPassed);
  console.log('Failed: ' + totalFailed);
  console.log('Time:   ' + duration);
  console.log('Report: ' + path.relative(ROOT, REPORT_DIR) + '/');

  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
