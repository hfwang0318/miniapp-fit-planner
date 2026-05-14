// User model — validation and factory functions

/**
 * Create default user data for a new user.
 * @param {string} openid - WeChat openid
 * @returns {Object} default user document
 */
function createDefault(openid) {
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
 * Validate user data shape (lightweight — only critical field checks).
 * @param {Object} userData
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(userData) {
  const errors = [];
  if (!userData || !userData.openid) {
    errors.push('openid is required');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  createDefault,
  validate
};
