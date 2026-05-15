/**
 * Login page unit tests — pages/login/index.js
 *
 * Tests the onLoginTap page method which orchestrates the login flow.
 *
 * Strategy: spy on authService.login after loading the module (before
 * the page), so the page's closure captures the spy. Then control
 * mock behavior in each test via mockResolvedValue/mockRejectedValue.
 *
 * NOTE on microtasks: onLoginTap is NOT async — it fires a promise chain
 * and returns undefined. When authService.login() rejects, the .catch()
 * handler fires after TWO microtask ticks (one for P1→P2 rejection,
 * one for P2→handler2). We add extra await Promise.resolve() flushes
 * in tests that exercise the rejection (.catch) path.
 */

const path = require('path');

let consoleErrorSpy;
let pageDefinition;
let authService;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Step 1: load and spy on authService BEFORE page module
  authService = require(path.resolve(__dirname, '../../../miniprogram/services/auth'));
  jest.spyOn(authService, 'login').mockReturnValue(undefined);

  // Step 2: load the page module — its closure captures the spied authService
  global.Page = jest.fn();
  require(path.resolve(__dirname, '../../../miniprogram/pages/login/index'));

  // Step 3: capture page definition
  pageDefinition = global.Page.mock.calls[0][0];
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

beforeEach(() => {
  // clearAllMocks resets call tracking but preserves mock implementations
  jest.clearAllMocks();

  // Re-establish globals
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

/**
 * Create a mock page instance from the captured page definition,
 * with proper this binding for all methods.
 */
function createInstance(dataOverrides) {
  const instance = {
    ...pageDefinition,
    data: { ...pageDefinition.data, ...dataOverrides },
    setData: jest.fn(function (newData) {
      Object.assign(this.data, newData);
    })
  };
  // Bind all page methods to the instance
  Object.keys(pageDefinition).forEach((key) => {
    if (typeof pageDefinition[key] === 'function') {
      instance[key] = pageDefinition[key].bind(instance);
    }
  });
  return instance;
}

describe('login page onLoginTap()', () => {
  test('TC-LOGIN-001: successful login redirects to dashboard', async () => {
    authService.login.mockResolvedValue({ success: true, data: { openid: 'test' } });

    const instance = createInstance();
    await instance.onLoginTap();

    expect(wx.redirectTo).toHaveBeenCalledWith({ url: '/pages/dashboard/index' });
  });

  test('TC-LOGIN-002: failed login shows toast with error message', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: { code: 'AUTH_FAILED', message: '登录失败，请重试' }
    });

    const instance = createInstance();
    await instance.onLoginTap();

    expect(wx.showToast).toHaveBeenCalledWith({
      title: '登录失败，请重试',
      icon: 'none',
      duration: 2000
    });
  });

  test('TC-LOGIN-003: double-tap protection prevents concurrent calls', async () => {
    // Simulate loading state (already-in-flight login)
    const instance = createInstance({ loading: true });

    await instance.onLoginTap();

    expect(authService.login).not.toHaveBeenCalled();
  });

  test('TC-LOGIN-004: catch path shows default toast', async () => {
    authService.login.mockRejectedValue(new Error('Unexpected error'));

    const instance = createInstance();
    await instance.onLoginTap();

    // .catch() fires after 2 microtask ticks (P1→P2 then P2→handler2)
    await Promise.resolve();

    expect(wx.showToast).toHaveBeenCalledWith({
      title: '登录失败，请重试',
      icon: 'none',
      duration: 2000
    });
  });

  test('TC-LOGIN-005: catch path logs console.error', async () => {
    const testError = new Error('Unexpected network error');
    authService.login.mockRejectedValue(testError);

    const instance = createInstance();
    await instance.onLoginTap();

    // .catch() fires after 2 microtask ticks
    await Promise.resolve();

    // This test should FAIL with the current code because .catch() doesn't log.
    // After the fix, console.error should be called with the error.
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('TC-LOGIN-006: login failure logs console.error', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: { code: 'AUTH_FAILED', message: '登录失败，请重试' }
    });

    const instance = createInstance();
    await instance.onLoginTap();

    // This test should FAIL with the current code because the else branch
    // doesn't log. After the fix, console.error should be called.
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('TC-LOGIN-007: setData loading is set to true on login tap', async () => {
    // Keep promise pending to check loading state mid-flight
    authService.login.mockReturnValue(new Promise(() => {}));

    const instance = createInstance();
    instance.onLoginTap();

    expect(instance.setData).toHaveBeenCalledWith({ loading: true });
  });

  test('TC-LOGIN-008: onLoad redirects to dashboard if already logged in', () => {
    global.getApp = jest.fn(() => ({
      globalData: { isLoggedIn: true }
    }));

    // Reset wx mock to track fresh calls
    jest.clearAllMocks();
    global.wx.redirectTo = jest.fn();

    const instance = createInstance();
    instance.onLoad();

    expect(wx.redirectTo).toHaveBeenCalledWith({ url: '/pages/dashboard/index' });
  });
});
