/**
 * Sidebar component unit tests — miniprogram/components/sidebar/index.js
 *
 * Tests the sidebar component behavior:
 * - Opens and closes via app globalData
 * - Displays user info (nickName, avatarUrl, createdAt)
 * - Logout button shows confirmation modal
 */

const path = require('path');

let consoleErrorSpy;
let sidebarDefinition;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();

  global.Component = jest.fn();
  global.wx = {
    showModal: jest.fn(),
    redirectTo: jest.fn()
  };
  global.getApp = jest.fn(() => ({
    showSidebar: jest.fn(),
    hideSidebar: jest.fn(),
    clearUserSession: jest.fn(),
    globalData: {
      user: {
        openid: 'test-openid',
        nickName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        createdAt: '2024-01-15T10:00:00Z'
      },
      isLoggedIn: true,
      sidebarOpen: false
    }
  }));
});

afterEach(() => {
  delete global.wx;
  delete global.getApp;
  delete global.Component;
});

function createInstance() {
  // Load sidebar component module
  require(path.resolve(__dirname, '../../../miniprogram/components/sidebar/index'));

  // Get the component definition from Component.mock.calls
  const calls = global.Component.mock.calls;
  if (!calls || calls.length === 0) {
    throw new Error('Component was not registered');
  }

  const definition = calls[0][0];

  // Create a mock component instance
  const instance = {
    ...definition,
    data: { ...definition.data },
    setData: jest.fn(function (newData) {
      Object.assign(this.data, newData);
    }),
    triggerEvent: jest.fn(function (name, detail) {
      // fire custom event
    })
  };

  // Bind all methods from definition.methods (微信 component methods are nested)
  if (definition.methods) {
    Object.keys(definition.methods).forEach((key) => {
      if (typeof definition.methods[key] === 'function') {
        instance[key] = definition.methods[key].bind(instance);
      }
    });
  }

  // Call attached if exists
  if (instance.lifetimes && instance.lifetimes.attached) {
    instance.lifetimes.attached.call(instance);
  }

  return instance;
}

describe('sidebar component', () => {
  describe('initial state', () => {
    test('TC-SIDEBAR-001: initial data has correct default values', () => {
      const instance = createInstance();

      // isOpened property default value is false (verified via properties descriptor)
      expect(instance.properties.isOpened.value).toBe(false);
      // user is synced from app.globalData in attached() - should be set after createInstance
      expect(instance.data.user).toBeDefined();
    });
  });

  describe('open/close behavior', () => {
    test('TC-SIDEBAR-002: onMenuTap opens sidebar (sets isOpened to true)', () => {
      const instance = createInstance();

      instance.onMenuTap();

      expect(instance.data.isOpened).toBe(true);
    });

    test('TC-SIDEBAR-003: onMaskTap closes sidebar (sets isOpened to false)', () => {
      const instance = createInstance();

      // Open first
      instance.setData({ isOpened: true });
      instance.onMaskTap();

      expect(instance.data.isOpened).toBe(false);
    });
  });

  describe('user info display', () => {
    test('TC-SIDEBAR-004: component reads user info from app.globalData', () => {
      const instance = createInstance();

      expect(instance.data.user).toEqual(expect.objectContaining({
        openid: 'test-openid',
        nickName: 'Test User'
      }));
    });
  });

  describe('logout', () => {
    test('TC-SIDEBAR-005: onLogoutTap shows confirmation modal', () => {
      const instance = createInstance();

      instance.onLogoutTap();

      expect(wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认退出',
          content: '确定要退出当前账号吗？'
        })
      );
    });

    test('TC-SIDEBAR-006: confirm logout clears session and redirects to login', () => {
      const mockClearUserSession = jest.fn();
      global.getApp = jest.fn(() => ({
        clearUserSession: mockClearUserSession,
        globalData: { user: null, isLoggedIn: false }
      }));

      const instance = createInstance();
      instance.onLogoutTap();

      // Simulate user confirming
      const modalCall = wx.showModal.mock.calls[0][0];
      modalCall.success({ confirm: true });

      expect(mockClearUserSession).toHaveBeenCalled();
      expect(wx.redirectTo).toHaveBeenCalledWith({ url: '/pages/login/index' });
    });

    test('TC-SIDEBAR-007: cancel logout does not clear session', () => {
      const mockClearUserSession = jest.fn();
      global.getApp = jest.fn(() => ({
        clearUserSession: mockClearUserSession,
        globalData: { user: null, isLoggedIn: false }
      }));

      const instance = createInstance();
      instance.onLogoutTap();

      // Simulate user canceling
      const modalCall = wx.showModal.mock.calls[0][0];
      modalCall.success({ confirm: false });

      expect(mockClearUserSession).not.toHaveBeenCalled();
      expect(wx.redirectTo).not.toHaveBeenCalled();
    });
  });
});