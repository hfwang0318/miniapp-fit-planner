/**
 * miniprogram-automator 统一封装。
 *
 * 所有 E2E spec 必须通过本文件启动和访问 miniProgram，不得在 spec 中手写 automator.launch。
 *
 * 导出:
 *   create()          — 创建环境实例，返回 { automator, miniProgram, config, close, reLaunch, ... }
 *   loadConfig()      — 读取并验证 local.config.json
 */

const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.resolve(__dirname, '../config/local.config.json');

let automatorModule = null;
let miniProgram = null;
let currentPage = null;
const runtimeErrors = [];

/**
 * 读取并验证 local.config.json。
 * 失败时抛出 E2E_CONFIG_ERROR 或 E2E_CLI_ERROR。
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const err = new Error('E2E 配置文件不存在: ' + path.relative(path.resolve(__dirname, '../../..'), CONFIG_PATH));
    err.type = 'E2E_CONFIG_ERROR';
    throw err;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    const err = new Error('E2E 配置文件解析失败: ' + e.message);
    err.type = 'E2E_CONFIG_ERROR';
    throw err;
  }

  if (!config.cliPath) {
    const err = new Error('local.config.json 中缺少 cliPath 字段');
    err.type = 'E2E_CONFIG_ERROR';
    throw err;
  }

  if (!fs.existsSync(config.cliPath)) {
    const err = new Error('微信开发者工具 CLI 不存在: ' + config.cliPath + ' (E2E_CLI_ERROR)');
    err.type = 'E2E_CLI_ERROR';
    throw err;
  }

  config.defaultTimeout = config.defaultTimeout || 30000;
  config.headless = config.headless !== false;
  return config;
}

/**
 * 创建 E2E 环境实例。
 * 返回包含 miniProgram、page 操作和错误收集的对象。
 */
async function create() {
  const config = loadConfig();
  const ROOT = path.resolve(__dirname, '../../..');
  const projectPath = path.resolve(ROOT, config.projectPath || 'miniprogram');

  // Load miniprogram-automator
  try {
    automatorModule = require('miniprogram-automator');
  } catch (e) {
    const err = new Error('miniprogram-automator 未安装，请运行: npm install --save-dev miniprogram-automator');
    err.type = 'E2E_DEPENDENCY_ERROR';
    throw err;
  }

  // Launch IDE
  try {
    miniProgram = await automatorModule.launch({
      cliPath: config.cliPath,
      projectPath: projectPath,
    });
  } catch (e) {
    const err = new Error('无法启动微信开发者工具: ' + e.message + ' (E2E_RUNTIME_ERROR)');
    err.type = 'E2E_RUNTIME_ERROR';
    err.originalError = e;
    throw err;
  }

  // Set default timeout
  if (miniProgram.defaultTimeout !== undefined) {
    miniProgram.defaultTimeout = config.defaultTimeout;
  }

  // Collect runtime errors from console
  if (typeof miniProgram.on === 'function') {
    miniProgram.on('error', (err) => {
      runtimeErrors.push({
        type: 'runtime',
        message: err.message || String(err),
        stack: err.stack || '',
        pagePath: currentPage ? currentPage.path : 'unknown',
        timestamp: new Date().toISOString()
      });
    });
    miniProgram.on('console', (msg) => {
      if (msg && (msg.type === 'error' || msg.type === 'warn')) {
        runtimeErrors.push({
          type: msg.type,
          message: msg.text || (msg.args ? msg.args.join(' ') : '') || String(msg),
          stack: msg.stack || '',
          pagePath: currentPage ? currentPage.path : 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  const env = {
    automator: automatorModule,
    miniProgram,
    config,

    /** 关闭 IDE 连接。关闭失败记录 warning 不吞掉错误。 */
    close: async function () {
      try {
        if (miniProgram) {
          await miniProgram.close();
          miniProgram = null;
        }
      } catch (e) {
        console.warn('[automator-env] close warning: ' + e.message);
      }
      try {
        if (automatorModule && typeof automatorModule.stop === 'function') {
          automatorModule.stop();
          automatorModule = null;
        }
      } catch (e) {
        console.warn('[automator-env] automator.stop warning: ' + e.message);
      }
    },

    /** reLaunch 到指定页面路径 */
    reLaunch: async function (url) {
      if (!miniProgram) throw new Error('MiniProgram 未连接');
      const page = await miniProgram.reLaunch(url);
      currentPage = page;
      return page;
    },

    /** navigateTo 导航到指定页面 */
    navigateTo: async function (url) {
      if (!miniProgram) throw new Error('MiniProgram 未连接');
      const page = await miniProgram.navigateTo(url);
      currentPage = page;
      return page;
    },

    /** 获取当前页面实例 */
    getCurrentPage: async function () {
      if (!miniProgram) throw new Error('MiniProgram 未连接');
      currentPage = await miniProgram.currentPage();
      return currentPage;
    },

    /** 等待指定毫秒 */
    wait: function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /** 等待匹配 URL 模式的页面出现 */
    waitForPage: async function (urlPattern, timeout) {
      if (!miniProgram) throw new Error('MiniProgram 未连接');
      return miniProgram.waitForPage(urlPattern, timeout || config.defaultTimeout);
    },

    /** 收集并清空 runtime errors */
    collectRuntimeErrors: function () {
      const errors = [...runtimeErrors];
      runtimeErrors.length = 0;
      return errors;
    },

    /** 获取 runtime errors 但不清理 */
    getRuntimeErrors: function () {
      return [...runtimeErrors];
    },

    /** 清理 runtime errors */
    clearRuntimeErrors: function () {
      runtimeErrors.length = 0;
    },

    /** 截图 */
    screenshot: async function () {
      if (!miniProgram) throw new Error('MiniProgram 未连接');
      return miniProgram.screenshot();
    },

    /** 获取上次访问的页面 */
    getPage: function () {
      return currentPage;
    }
  };

  return env;
}

module.exports = { create, loadConfig };
