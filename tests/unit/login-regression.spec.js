/**
 * Login regression tests — Bug: "微信一键登录提示失败"
 *
 * Cycle 4 regression suite. Tests edge cases where:
 * 1. authService.login() encounters abnormal cloud function returns
 * 2. Login page onLoginTap() faces null/undefined result.error
 *
 * These tests should be RED (fail) before the fix is applied, and GREEN after.
 */

const path = require('path');

let consoleLogSpy;
let consoleErrorSpy;
let consoleWarnSpy;

/* ------------------------------------------------------------------ */
/*  Shared setup (for auth service tests and login page tests)         */
/* ------------------------------------------------------------------ */
beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

afterEach(() => {
  delete global.wx;
  delete global.getApp;
});

/* ------------------------------------------------------------------ */
/*  Auth Service: abnormal cloud function returns                     */
/* ------------------------------------------------------------------ */
describe('authService.login() — abnormal cloud function results', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();

    global.wx = {
      login: jest.fn().mockResolvedValue(),
      cloud: {
        callFunction: jest.fn()
      }
    };
    global.getApp = jest.fn(() => ({
      setUserSession: jest.fn(),
      globalData: { user: null, isLoggedIn: false }
    }));
  });

  test('TC-REG-SVC-001: cloud function result.result = null', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({ result: null });

    const authService = require('../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
    // Should never expose raw null/undefined as error
    expect(result.error).toBeDefined();
    expect(result.error.message).toBeDefined();
  });

  test('TC-REG-SVC-002: cloud function result has no .result property (SDK error)', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      errMsg: 'cloud.callFunction:fail: Error: test error'
    });

    const authService = require('../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
    expect(result.error.message).toBeDefined();
  });

  test('TC-REG-SVC-003: cloud function result.result = {} (empty object)', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({ result: {} });

    const authService = require('../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
  });

  test('TC-REG-SVC-004: cloud function result.result.error = null', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      result: { success: false, error: null }
    });

    const authService = require('../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
    expect(result.error.message).toBeDefined();
  });

  test('TC-REG-SVC-005: cloud function result.result = { success: false } (no error)', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      result: { success: false }
    });

    const authService = require('../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
    expect(result.error.message).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Login Page: null/undefined result.error handling                  */
/* ------------------------------------------------------------------ */
describe('login page onLoginTap() — null/undefined result.error', () => {
  let pageDefinition;
  let authService;

  beforeAll(() => {
    // Step 1: load and spy on authService BEFORE page module
    authService = require(path.resolve(__dirname, '../../miniprogram/services/auth'));
    jest.spyOn(authService, 'login').mockReturnValue(undefined);

    // Step 2: load the page
    global.Page = jest.fn();
    require(path.resolve(__dirname, '../../miniprogram/pages/login/index'));

    // Step 3: capture page definition
    pageDefinition = global.Page.mock.calls[0][0];
  });

  beforeEach(() => {
    jest.clearAllMocks();

    global.Page = jest.fn();
    global.wx = {
      showToast: jest.fn(),
      redirectTo: jest.fn()
    };
    global.getApp = jest.fn(() => ({
      setUserSession: jest.fn(),
      globalData: { user: null, isLoggedIn: false }
    }));
  });

  afterEach(() => {
    delete global.wx;
    delete global.getApp;
  });

  function createInstance(dataOverrides) {
    const instance = {
      ...pageDefinition,
      data: { ...pageDefinition.data, ...dataOverrides },
      setData: jest.fn(function (newData) {
        Object.assign(this.data, newData);
      })
    };
    Object.keys(pageDefinition).forEach((key) => {
      if (typeof pageDefinition[key] === 'function') {
        instance[key] = pageDefinition[key].bind(instance);
      }
    });
    return instance;
  }

  test('TC-REG-LOGIN-001: result.error=null — console.error should not crash', async () => {
    // Setup: authService returns success=false with null error
    authService.login.mockResolvedValue({
      success: false,
      error: null
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // EXPECTED: console.error should be called with [login] login failed:
    // and a description of the error (even if null). The console.error call
    // in the .then() handler should NOT crash.
    //
    // CURRENT: result.error.message throws TypeError because result.error
    // is null. The crash propagates to .catch(), which logs
    // [login] login exception: instead. No [login] login failed: is logged.
    // This assertion is RED until the fix guards the access.
    const loginFailedCalls = consoleErrorSpy.mock.calls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].includes('[login] login failed:')
    );
    expect(loginFailedCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-REG-LOGIN-002: result.error=undefined — console.error should not crash', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: undefined
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // Same logic as TC-REG-LOGIN-001: result.error.message crashes when
    // result.error is undefined. RED until fix.
    const loginFailedCalls = consoleErrorSpy.mock.calls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].includes('[login] login failed:')
    );
    expect(loginFailedCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-REG-LOGIN-003: result has no error property at all', async () => {
    authService.login.mockResolvedValue({
      success: false
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // result.error is undefined → same crash as TC-REG-LOGIN-002.
    // RED until fix.
    const loginFailedCalls = consoleErrorSpy.mock.calls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].includes('[login] login failed:')
    );
    expect(loginFailedCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-REG-LOGIN-004: result.error.message is empty string', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: { code: 'AUTH_FAILED', message: '' }
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // Current code: result.error.message is '' (falsy), so
    // JSON.stringify(result.error) is used. Works but suboptimal.
    // Toast shows fallback message.
    expect(wx.showToast).toHaveBeenCalledWith({
      title: '登录失败，请重试',
      icon: 'none',
      duration: 2000
    });
    // Check first arg of console.error has [login] login failed: prefix
    const loginFailedCalls = consoleErrorSpy.mock.calls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].includes('[login] login failed:')
    );
    expect(loginFailedCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-REG-LOGIN-005: result.error.message is null', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: { code: 'AUTH_FAILED', message: null }
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // result.error is an object (not null), so result.error.message is null.
    // null || JSON.stringify(result.error) uses stringified object.
    expect(wx.showToast).toHaveBeenCalledWith({
      title: '登录失败，请重试',
      icon: 'none',
      duration: 2000
    });
    const loginFailedCalls = consoleErrorSpy.mock.calls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].includes('[login] login failed:')
    );
    expect(loginFailedCalls.length).toBeGreaterThanOrEqual(1);
  });
});
