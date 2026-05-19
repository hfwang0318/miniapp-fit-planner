App({
  globalData: {
    user: null,
    isLoggedIn: false,
    sidebarOpen: false
  },

  /**
   * Show global sidebar
   */
  showSidebar() {
    this.globalData.sidebarOpen = true;
  },

  /**
   * Hide global sidebar
   */
  hideSidebar() {
    this.globalData.sidebarOpen = false;
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('Please upgrade WeChat base library to 2.2.3 or above');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-d5gl9zvald3fd7fab',
      traceUser: true
    });
    this.restoreSession();
  },

  /**
   * Restore user session from local storage.
   */
  restoreSession() {
    try {
      const saved = wx.getStorageSync('fit_user_session');
      if (saved && saved.openid) {
        this.globalData.user = saved;
        this.globalData.isLoggedIn = true;
      }
    } catch (e) {
      // Session storage unavailable — user will need to login again
    }
  },

  /**
   * Set user session data after successful login.
   * @param {Object} userData - { openid, nickName?, avatarUrl? }
   */
  setUserSession(userData) {
    this.globalData.user = userData;
    this.globalData.isLoggedIn = true;
    try {
      wx.setStorageSync('fit_user_session', userData);
    } catch (e) {
      // Storage full or unavailable — session is still valid in memory
    }
  },

  /**
   * Clear user session on logout.
   */
  clearUserSession() {
    this.globalData.user = null;
    this.globalData.isLoggedIn = false;
    try {
      wx.removeStorageSync('fit_user_session');
    } catch (e) {
      // Ignore storage errors
    }
  },

  /**
   * Update user profile fields in session after profile update.
   * @param {Object} profileData - { nickName, avatarUrl }
   */
  updateUserProfile(profileData) {
    if (this.globalData.user) {
      this.globalData.user = { ...this.globalData.user, ...profileData };
      try {
        wx.setStorageSync('fit_user_session', this.globalData.user);
      } catch (e) {
        // Storage full or unavailable
      }
    }
  }
});
