/**
 * Navigation E2E spec — 验证所有 app.json 注册页面可导航。
 *
 * 验证:
 *   1. 读取 miniprogram/app.json 中的 pages 列表
 *   2. 对每个页面执行 navigateTo
 *   3. 检查每次导航是否有运行时错误
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../../..');
const APP_JSON_PATH = path.resolve(ROOT, 'miniprogram/app.json');

async function run(harness) {
  // Read pages from app.json
  let pages;
  try {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    pages = appJson.pages;
    if (!pages || pages.length === 0) {
      harness.fail('read-app-json', new Error('app.json 中 pages 为空'));
      return;
    }
    harness.pass('read-app-json: 找到 ' + pages.length + ' 个页面: ' + pages.join(', '));
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
    // First, reLaunch to first page to establish the app context
    await auto.miniProgram.reLaunch('/' + pages[0]);
    await auto.wait(1000);

    for (const pagePath of pages) {
      const url = '/' + pagePath;

      // Navigate to page (use reLaunch for reliable navigation)
      try {
        const page = await auto.miniProgram.reLaunch(url);
        await auto.wait(1500);
        if (page) {
          harness.pass('navigate: ' + pagePath + ' — 页面加载成功');
        } else {
          const err = new Error('页面实例为 null');
          err.type = 'NAVIGATION_ERROR';
          harness.fail('navigate: ' + pagePath, err);
        }
      } catch (e) {
        e.type = e.type || 'NAVIGATION_ERROR';
        harness.fail('navigate: ' + pagePath + ' — 导航失败', e);
      }

      // Check runtime errors
      const errors = auto.collectRuntimeErrors();
      if (errors.length > 0) {
        harness.fail('runtime-errors: ' + pagePath,
          new Error('导航到 ' + pagePath + ' 时发现 ' + errors.length + ' 个错误: ' +
            JSON.stringify(errors.slice(0, 3))));
      } else {
        harness.pass('runtime-errors: ' + pagePath + ' — 无错误');
      }
    }

  } catch (e) {
    harness.fail('navigation-unexpected: ' + e.message, e);
  } finally {
    await auto.close();
  }
}

module.exports = { run };
