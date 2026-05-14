const authService = require('../../services/auth');

Page({
  data: {
    loading: false
  },

  onLoad() {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/dashboard/index' });
    }
  },

  onLoginTap() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    authService.login().then(result => {
      if (result.success) {
        const app = getApp();
        if (app && typeof app.setUserSession === 'function') {
          app.setUserSession(result.data);
        }
        wx.redirectTo({ url: '/pages/dashboard/index' });
      } else {
        wx.showToast({
          title: result.error && result.error.message || '登录失败，请重试',
          icon: 'none',
          duration: 2000
        });
        this.setData({ loading: false });
      }
    }).catch(() => {
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    });
  }
});
