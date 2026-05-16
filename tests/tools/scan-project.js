/**
 * 项目结构扫描器。
 * 读取 project.config.json 和 miniprogram/app.json，
 * 枚举 pages、components、cloudfunctions、services、models、utils。
 *
 * Usage: node tests/tools/scan-project.js [--json]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const MINIPROGRAM = path.resolve(ROOT, 'miniprogram');
const CLOUD_FUNCTIONS = path.resolve(ROOT, 'cloudfunctions');

function scan(dir, ext) {
  const results = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d);
    for (const entry of entries) {
      const full = path.join(d, entry);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && !entry.startsWith('.')) {
          walk(full);
        }
      } else if (!ext || entry.endsWith(ext)) {
        results.push(path.relative(ROOT, full));
      }
    }
  }
  walk(dir);
  return results;
}

function main() {
  const errors = [];

  // Read project.config.json
  let projectConfig = {};
  const projectConfigPath = path.resolve(ROOT, 'project.config.json');
  try {
    projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
  } catch (e) {
    errors.push('Cannot read project.config.json: ' + e.message);
  }

  // Read miniprogram/app.json
  let appJson = { pages: [] };
  const appJsonPath = path.resolve(MINIPROGRAM, 'app.json');
  try {
    appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  } catch (e) {
    errors.push('Cannot read miniprogram/app.json: ' + e.message);
  }

  // Enumerate cloud functions
  let cloudFns = [];
  if (fs.existsSync(CLOUD_FUNCTIONS)) {
    cloudFns = fs.readdirSync(CLOUD_FUNCTIONS).filter(f => {
      const fp = path.join(CLOUD_FUNCTIONS, f);
      try {
        return fs.statSync(fp).isDirectory();
      } catch {
        return false;
      }
    });
  }

  const scanResult = {
    pages: appJson.pages || [],
    components: scan(path.resolve(MINIPROGRAM, 'components'), '.js'),
    cloudFunctions: cloudFns,
    services: scan(path.resolve(MINIPROGRAM, 'services'), '.js'),
    models: scan(path.resolve(MINIPROGRAM, 'models'), '.js'),
    utils: scan(path.resolve(MINIPROGRAM, 'utils'), '.js'),
    projectConfig: {
      miniprogramRoot: projectConfig.miniprogramRoot || '',
      cloudfunctionRoot: projectConfig.cloudfunctionRoot || '',
      appid: projectConfig.appid || ''
    },
    errors: errors
  };

  const useJson = process.argv.includes('--json');
  if (useJson) {
    console.log(JSON.stringify(scanResult, null, 2));
  } else {
    console.log('=== Project Scan ===');
    console.log('appid: ' + (scanResult.projectConfig.appid || '(none)'));
    console.log('miniprogramRoot: ' + (scanResult.projectConfig.miniprogramRoot || '(none)'));
    console.log('');
    console.log('Pages (' + scanResult.pages.length + '):');
    scanResult.pages.forEach(p => console.log('  - ' + p));
    console.log('');
    console.log('Components (' + scanResult.components.length + '):');
    scanResult.components.forEach(c => console.log('  - ' + c));
    console.log('');
    console.log('Cloud Functions: ' + (scanResult.cloudFunctions.join(', ') || '(none)'));
    console.log('Services: ' + scanResult.services.length + ' file(s)');
    scanResult.services.forEach(s => console.log('  - ' + s));
    console.log('Models: ' + scanResult.models.length + ' file(s)');
    console.log('Utils: ' + scanResult.utils.length + ' file(s)');

    if (errors.length > 0) {
      console.log('');
      console.log('Errors:');
      errors.forEach(e => console.log('  - ' + e));
    }
  }

  return scanResult;
}

if (require.main === module) {
  const result = main();
  if (result.errors && result.errors.length > 0) {
    process.exit(1);
  }
}

module.exports = { main, scan };
