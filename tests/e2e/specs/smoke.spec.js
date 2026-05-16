/**
 * Smoke E2E spec — 最简启动验证。
 *
 * 验证:
 *   1. 小程序可以启动（getApp 不报错）
 *   2. 首页可以打开（从 miniprogram/app.json 读取 pages[0]）
 *   3. 无运行时错误
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../../..');
const APP_JSON_PATH = path.resolve(ROOT, 'miniprogram/app.json');

async function run(harness) {
  // Read app.json to get the default home page
  let homePagePath;
  try {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    if (!appJson.pages || appJson.pages.length === 0) {
      harness.fail('read-app-json', new Error('app.json 中 pages 为空'));
      return;
    }
    homePagePath = appJson.pages[0];
    harness.pass('read-app-json: 首页路径=' + homePagePath);
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
    // Test 1: Mini program launches and reLaunches to home page
    let page;
    const homeUrl = '/' + homePagePath;
    try {
      page = await auto.miniProgram.reLaunch(homeUrl);
      harness.pass('app-launch: reLaunch ' + homeUrl + ' 成功');
    } catch (e) {
      e.type = 'NAVIGATION_ERROR';
      harness.fail('app-launch: reLaunch 失败', e);
      return;
    }

    // Test 2: A page was returned (may redirect due to auth, but must not crash)
    if (page) {
      harness.pass('page-instance: 页面实例存在');
    } else {
      harness.fail('page-instance', new Error('页面实例为 null'));
    }

    // Test 3: Current page path exists (accept redirect — e.g. dashboard→login for unauth)
    try {
      const currentPage = await auto.getCurrentPage();
      if (currentPage && currentPage.path) {
        harness.pass('page-path: 页面已加载 (' + currentPage.path + ')');
      } else {
        harness.fail('page-path', new Error('无法获取当前页面路径'));
      }
    } catch (e) {
      harness.fail('page-path: 无法获取当前页面路径', e);
    }

    // Test 5: No runtime errors
    await auto.wait(2000);
    const errors = auto.collectRuntimeErrors();
    if (errors.length === 0) {
      harness.pass('runtime-errors: 无运行时错误');
    } else {
      harness.fail('runtime-errors',
        new Error('发现 ' + errors.length + ' 个运行时错误: ' +
          JSON.stringify(errors.slice(0, 3))));
    }

  } catch (e) {
    harness.fail('smoke-unexpected: ' + e.message, e);
  } finally {
    await auto.close();
  }
}

module.exports = { run };
