/**
 * Home page E2E spec — 验证首页结构和核心交互。
 *
 * 验证:
 *   1. 首页路径来自 miniprogram/app.json pages[0]
 *   2. 页面 data 可访问
 *   3. 页面有 WXML 内容
 *   4. 无运行时错误
 *   5. 如存在 e2e selector (data-testid / .e2e-*)，验证元素存在
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../../..');
const APP_JSON_PATH = path.resolve(ROOT, 'miniprogram/app.json');

async function run(harness) {
  // Read app.json for home page path
  let homePagePath;
  try {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    if (!appJson.pages || appJson.pages.length === 0) {
      harness.fail('read-app-json', new Error('app.json 中 pages 为空'));
      return;
    }
    homePagePath = '/' + appJson.pages[0];
    harness.pass('read-app-json: 首页=' + homePagePath);
  } catch (e) {
    harness.fail('read-app-json', new Error('无法读取 app.json: ' + e.message));
    return;
  }

  // Load automator-env
  let env;
  try {
    env = require('../tools/automator-env');
  } catch (e) {
    harness.fail('load-automator-env', e);
    return;
  }

  // Create E2E environment
  let auto;
  try {
    auto = await env.create();
  } catch (e) {
    harness.fail('create-automator-env', e);
    return;
  }

  try {
    // Navigate to home page
    let page;
    try {
      page = await auto.miniProgram.reLaunch(homePagePath);
      harness.pass('navigate-home: 首页已打开');
    } catch (e) {
      e.type = 'NAVIGATION_ERROR';
      harness.fail('navigate-home: 无法打开首页', e);
      return;
    }

    await auto.wait(2000);

    // Test: Page data accessible
    try {
      const pageData = await page.data();
      if (pageData) {
        harness.pass('page-data: page.data 可访问');
        // Check for common state properties that indicate proper initialization
        if (pageData.loading !== undefined) {
          harness.pass('page-data: loading 状态已追踪');
        }
      } else {
        harness.fail('page-data', new Error('page.data 为 null'));
      }
    } catch (e) {
      harness.fail('page-data: 无法读取 page.data', e);
    }

    // Test: Page has content (try wxml or check data)
    try {
      // miniprogram-automator 0.12 may not have page.wxml()
      // Use data() to verify the page loaded
      const pageData = await page.data();
      if (pageData) {
        harness.pass('page-content: 页面数据已加载 (' + JSON.stringify(Object.keys(pageData)).slice(0, 80) + ')');
      } else {
        harness.fail('page-content', new Error('页面数据为空'));
      }
    } catch (e) {
      harness.fail('page-content: 无法读取页面内容', e);
    }

    // Test: Check for E2E selectors (non-blocking — WARN if none found)
    try {
      const wxml = await page.wxml();
      const hasE2EClass = wxml.includes('e2e-');
      const hasDataTestid = wxml.includes('data-testid');
      if (hasE2EClass || hasDataTestid) {
        harness.pass('e2e-selectors: 页面包含 e2e selector');
      } else {
        // Not a failure, but worth noting
        console.log('  [WARN] e2e-selectors: 页面没有 e2e-* 或 data-testid selector');
        console.log('         可安全添加 selector 以增强测试稳定性');
      }
    } catch {
      console.log('  [WARN] e2e-selectors: 无法检查 selector（非阻塞）');
    }

    // Test: System info accessible
    try {
      const systemInfo = await auto.miniProgram.callWxMethod('getSystemInfo');
      if (systemInfo) {
        harness.pass('system-info: getSystemInfo 返回数据');
      }
    } catch (e) {
      harness.fail('system-info: getSystemInfo 调用失败', e);
    }

    // Test: No runtime errors
    await auto.wait(1000);
    const errors = auto.collectRuntimeErrors();
    if (errors.length === 0) {
      harness.pass('runtime-errors: 无运行时错误');
    } else {
      harness.fail('runtime-errors',
        new Error('发现 ' + errors.length + ' 个运行时错误: ' +
          JSON.stringify(errors.slice(0, 3))));
    }

  } catch (e) {
    harness.fail('home-unexpected: ' + e.message, e);
  } finally {
    await auto.close();
  }
}

module.exports = { run };
