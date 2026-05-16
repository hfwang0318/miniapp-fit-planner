/**
 * 结构化 E2E 报告生成器。
 * 输出 result.json、summary.md、error.log、commands.log 到指定目录。
 */

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 写入单个 spec 的报告。
 */
function writeSpecReport(dir, specName, results) {
  ensureDir(dir);

  // result.json
  const resultPath = path.join(dir, `result-${specName}.json`);
  fs.writeFileSync(resultPath, JSON.stringify({
    specName,
    timestamp: results.timestamp || new Date().toISOString(),
    passed: results.passed || 0,
    failed: results.failed || 0,
    total: results.total || 0,
    duration: results.duration || '0s',
    failedDetails: results.failedDetails || [],
    commands: results.commands || []
  }, null, 2) + '\n');

  // error.log
  const errorPath = path.join(dir, `error-${specName}.log`);
  const errorLines = (results.failedDetails || [])
    .map(d => `[${d.type || 'UNKNOWN_ERROR'}] ${d.name}: ${d.error}`)
    .join('\n');
  fs.writeFileSync(errorPath, errorLines || '(no errors)\n');
}

/**
 * 写入统一报告 (result.json)。
 */
function writeReport(dir, summary) {
  ensureDir(dir);

  const result = {
    startTime: summary.timestamp || new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMs: 0,
    status: summary.failed > 0 ? 'FAIL' : 'PASS',
    scope: summary.scope || [],
    commands: summary.commands || [],
    passed: summary.results ? summary.results.filter(r => r.status === 'PASS').map(r => r.spec) : [],
    failed: summary.results ? summary.results.filter(r => r.status === 'FAIL').map(r => r.spec) : [],
    skipped: [],
    warnings: summary.warnings || [],
    errors: summary.errors || []
  };

  fs.writeFileSync(
    path.join(dir, 'result.json'),
    JSON.stringify(result, null, 2) + '\n'
  );
}

/**
 * 写入 summary.md 人类可读报告。
 */
function writeSummaryFile(dir, summary) {
  ensureDir(dir);

  const lines = [
    '# E2E 测试报告',
    '',
    '## 概要',
    '',
    `- **时间**: ${summary.timestamp || new Date().toISOString()}`,
    `- **总计**: ${summary.total || 0}`,
    `- **通过**: ${summary.passed || 0}`,
    `- **失败**: ${summary.failed || 0}`,
    `- **耗时**: ${summary.duration || 'N/A'}`,
    '',
    '## 详细结果',
    '',
    '| 规格 | 状态 | 错误 |',
    '|------|------|------|',
  ];

  if (summary.results) {
    for (const r of summary.results) {
      lines.push(`| ${r.spec} | ${r.status} | ${r.error || '-'} |`);
    }
  }

  lines.push('');
  fs.writeFileSync(path.join(dir, 'summary.md'), lines.join('\n') + '\n');
}

/**
 * 写入 commands.log。
 */
function writeCommandsLog(dir, commands) {
  ensureDir(dir);
  const lines = (commands || []).map(c =>
    `[${c.timestamp || ''}] ${c.command || ''}`
  );
  fs.writeFileSync(path.join(dir, 'commands.log'), lines.join('\n') + '\n');
}

/**
 * 追加更新 summary.md（run-spec 单次运行时使用）。
 */
function updateSummary(dir, specResult) {
  ensureDir(dir);
  const summaryPath = path.join(dir, 'summary.md');
  const status = (specResult.failed > 0) ? 'FAIL' : 'PASS';
  const line = `| ${specResult.specName} | ${status} | - |`;
  try {
    if (fs.existsSync(summaryPath)) {
      fs.appendFileSync(summaryPath, line + '\n');
    }
  } catch {
    // summary doesn't exist yet, will be created by writeSummaryFile
  }
}

module.exports = {
  writeSpecReport,
  writeReport,
  writeSummaryFile,
  writeCommandsLog,
  updateSummary
};
