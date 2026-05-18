/**
 * Auth service unit tests — services/auth.js
 *
 * Tests the front-end auth service layer which calls wx.login() and
 * wx.cloud.callFunction(). Mocks the WeChat environment (wx, getApp).
 */

let consoleLogSpy;
let consoleErrorSpy;
let consoleWarnSpy;

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

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();

  // Set up WeChat globals
  global.wx = {
    login: jest.fn().mockResolvedValue(),
    cloud: {
      callFunction: jest.fn().mockResolvedValue({
        result: { success: true, data: { openid: 'test-openid-123', isNewUser: true } }
      })
    }
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

describe('authService.login()', () => {
  test('TC-AUTH-SVC-001: successful login returns success with user data', async () => {
    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(true);
    expect(result.data.openid).toBe('test-openid-123');
    expect(result.data.isNewUser).toBe(true);
  });

  test('TC-AUTH-SVC-002: cloud function returns error code', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      result: { success: false, error: { code: 'UNAUTHORIZED' } }
    });

    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  test('TC-AUTH-SVC-003: cloud function throws returns NETWORK_ERROR', async () => {
    global.wx.cloud.callFunction.mockRejectedValue(new Error('Network error'));

    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NETWORK_ERROR');
  });

  test('TC-AUTH-SVC-004: login stores session in app global state', async () => {
    const mockSetUserSession = jest.fn();
    global.getApp = jest.fn(() => ({
      setUserSession: mockSetUserSession,
      globalData: { user: null, isLoggedIn: false }
    }));

    const authService = require('../../../miniprogram/services/auth');
    await authService.login();

    expect(mockSetUserSession).toHaveBeenCalledWith(
      expect.objectContaining({ openid: 'test-openid-123' })
    );
  });

  test('TC-AUTH-SVC-005: wx.login() failure returns LOGIN_FAILED', async () => {
    // wx.login() rejects — without a valid session the cloud function cannot
    // resolve OPENID, so the service returns early with LOGIN_FAILED
    global.wx.login.mockRejectedValue(new Error('login:fail'));

    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    // wx.login() failure should interrupt the flow — cloud function is NOT called
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('LOGIN_FAILED');
    expect(global.wx.cloud.callFunction).not.toHaveBeenCalled();
  });

  test('TC-AUTH-SVC-006: cloud function error without .error.code falls back to AUTH_FAILED', async () => {
    // result.result.error is present but has no .code
    global.wx.cloud.callFunction.mockResolvedValue({
      result: { success: false, error: {} }
    });

    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    // This test should FAIL with the current code if accessing result.result.error.code
    // crashes or returns undefined. After the fix it should return AUTH_FAILED.
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('AUTH_FAILED');
  });

  test('TC-AUTH-SVC-007: console.log/error/warn are emitted with [auth] prefix on key paths', async () => {
    // Successful login path
    const authService = require('../../../miniprogram/services/auth');
    await authService.login();

    // At minimum, console.log or console.error should have been called with [auth] prefix
    const allConsoleCalls = [
      ...consoleLogSpy.mock.calls,
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls
    ];
    const authPrefixedCalls = allConsoleCalls.filter(
      args => args[0] && typeof args[0] === 'string' && args[0].startsWith('[auth]')
    );

    expect(authPrefixedCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-AUTH-SVC-008: getApp() returns null handles gracefully', async () => {
    global.getApp = jest.fn(() => null);

    const authService = require('../../../miniprogram/services/auth');
    const result = await authService.login();

    // Should still return success even if app reference is null
    expect(result.success).toBe(true);
    expect(result.data.openid).toBe('test-openid-123');
  });
});
