/**
 * Auth service — login and session management.
 *
 * Layer boundary: service layer only, calls cloud functions.
 * No direct cloud database access.
 */

const { ERROR_MESSAGES } = require('../config/constants');

const authService = {
  /**
   * Login with WeChat auth.
   * 1. Call wx.login() to get a code
   * 2. Call auth cloud function with the code
   * 3. Store user session in global app state
   *
   * @returns {Promise<{ success: boolean, data?: { openid: string, isNewUser: boolean }, error?: Object }>}
   */
  async login() {
    try {
      // WeChat Cloud Development resolves identity via cloud.getWXContext() automatically.
      // The wx.login() call establishes the client session, but we don't need to pass the code.
      const result = await wx.cloud.callFunction({
        name: 'auth',
        data: { type: 'login' }
      });

      if (result.result && result.result.success) {
        const userData = result.result.data;

        // Store user session in app global state
        const app = getApp();
        if (app && typeof app.setUserSession === 'function') {
          app.setUserSession(userData);
        } else if (app) {
          app.globalData = app.globalData || {};
          app.globalData.userSession = userData;
        }

        return { success: true, data: userData };
      }

      // Cloud function returned an error
      const errorCode = result.result ? result.result.error.code : 'AUTH_FAILED';
      return {
        success: false,
        error: { code: errorCode, message: ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.AUTH_FAILED }
      };
    } catch (err) {
      return {
        success: false,
        error: { code: 'AUTH_FAILED', message: ERROR_MESSAGES.AUTH_FAILED }
      };
    }
  }
};

module.exports = authService;
