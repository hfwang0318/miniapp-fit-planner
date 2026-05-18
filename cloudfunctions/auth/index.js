// Cloud function: auth
// Provides login authentication using WeChat's built-in auth via OPENID.
// NEVER trust client-supplied openid — always use cloud.getWXContext().OPENID.

const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-d5gl9zvald3fd7fab' });
const db = cloud.database();

/**
 * Create default user document for a new user.
 * Mirrors the logic in miniprogram/models/user.js createDefault().
 * @param {string} openid
 * @returns {Object}
 */
function createDefaultUser(openid) {
  return {
    openid: openid,
    nickName: 'WeChat User',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    privacySettings: {
      shareWeight: false
    },
    defaultUnit: 'kg'
  };
}

/**
 * Handle login operation.
 * Query user by openid; if not found, create a default user document.
 * @param {string} openid
 * @returns {Object} { success, data: { openid, isNewUser } }
 */
async function handleLogin(openid) {
  const userResult = await db.collection('User')
    .where({ openid })
    .get();

  const isNewUser = userResult.data.length === 0;

  if (isNewUser) {
    const defaultUser = createDefaultUser(openid);
    await db.collection('User').add({ data: defaultUser });
  }

  return {
    success: true,
    data: { openid, isNewUser }
  };
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();

    if (!OPENID) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: '请先登录' }
      };
    }

    switch (event.type) {
      case 'login':
        return await handleLogin(OPENID);
      default:
        return {
          success: false,
          error: { code: 'INVALID_TYPE', message: '无效的操作类型' }
        };
    }
  } catch (err) {
    return {
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误，请稍后重试' }
    };
  }
};
