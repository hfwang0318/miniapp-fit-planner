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
   * 1. Call wx.login() to get a code (fatal if fails — returns LOGIN_FAILED)
   * 2. Call auth cloud function with the code
   * 3. Store user session in global app state
   *
   * @returns {Promise<{ success: boolean, data?: { openid: string, isNewUser: boolean }, error?: Object }>}
   */
  async login() {
    try {
      // Step 1: Establish WeChat client session (required for cloud.getWXContext().OPENID)
      // NOTE: wx.login() failure is fatal — without a valid session the cloud function
      // cannot resolve OPENID, so we return early with LOGIN_FAILED
      try {
        await wx.login();
        console.log('[auth] wx.login() succeeded');
      } catch (loginErr) {
        console.warn('[auth] wx.login() failed, returning LOGIN_FAILED', loginErr.message || JSON.stringify(loginErr));
        return { success: false, error: { code: 'LOGIN_FAILED', message: '微信登录失败，请重试' } };
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

      // Cloud function returned an error — log full response for diagnosis
      const errorCode = (result.result && result.result.error && result.result.error.code)
        ? result.result.error.code
        : 'AUTH_FAILED';
      const errorMsg = result.result && result.result.error && result.result.error.message;
      console.error('[auth] cloud function returned error:', errorCode, '| message:', errorMsg || '(none)');
      console.error('[auth] full cloud response:', JSON.stringify(result.result));
      return {
        success: false,
        error: { code: errorCode, message: ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.AUTH_FAILED }
      };
    } catch (err) {
      const rawMsg = err.errMsg || err.message || JSON.stringify(err);
      console.error('[auth] cloud.callFunction exception:', rawMsg);

      // Distinguish "function not deployed" from genuine network errors
      if (rawMsg.includes('function not found') || rawMsg.includes('not found')) {
        console.error('[auth] Cloud function "auth" is NOT deployed!');
        console.error('[auth] Action: 右键 cloudfunctions/auth → 上传并部署：云端安装依赖');
        return {
          success: false,
          error: { code: 'FUNC_NOT_DEPLOYED', message: ERROR_MESSAGES.FUNC_NOT_DEPLOYED }
        };
      }

      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR }
      };
    }
  }
};

module.exports = authService;
