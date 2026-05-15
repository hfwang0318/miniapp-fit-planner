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
   * 1. Call wx.login() to get a code (non-fatal if fails)
   * 2. Call auth cloud function with the code
   * 3. Store user session in global app state
   *
   * @returns {Promise<{ success: boolean, data?: { openid: string, isNewUser: boolean }, error?: Object }>}
   */
  async login() {
    try {
      // Step 1: Establish WeChat client session (required for cloud.getWXContext().OPENID)
      // NOTE: wx.login() failure is non-fatal — the cloud function may still resolve OPENID
      // from an existing session
      try {
        await wx.login();
        console.log('[auth] wx.login() succeeded');
      } catch (loginErr) {
        console.warn('[auth] wx.login() failed, continuing with cloud function call', loginErr);
      }

      // Step 2: Call auth cloud function (identity resolved server-side via cloud.getWXContext())
      console.log('[auth] calling auth cloud function');
      const result = await wx.cloud.callFunction({
        name: 'auth',
        data: { type: 'login' }
      });

      if (result.result && result.result.success) {
        const userData = result.result.data;
        console.log('[auth] login successful, openid:', userData.openid);

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
      const errorCode = (result.result && result.result.error && result.result.error.code)
        ? result.result.error.code
        : 'AUTH_FAILED';
      console.error('[auth] cloud function returned error:', errorCode);
      return {
        success: false,
        error: { code: errorCode, message: ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.AUTH_FAILED }
      };
    } catch (err) {
      console.error('[auth] login exception:', err);
      return {
        success: false,
        error: { code: 'AUTH_FAILED', message: ERROR_MESSAGES.AUTH_FAILED }
      };
    }
  }
};

module.exports = authService;
