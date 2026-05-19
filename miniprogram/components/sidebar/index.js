/**
 * Sidebar component
 * Global overlay sidebar showing user info and logout option.
 * Slides in from right side of screen.
 */

Component({
  properties: {
    // Whether sidebar is opened
    isOpened: {
      type: Boolean,
      value: false,
      observer: '_onIsOpenedChange'
    }
  },

  data: {
    user: null
  },

  lifetimes: {
    attached() {
      this._syncUserFromApp();
    }
  },

  pageLifetimes: {
    show() {
      this._syncUserFromApp();
    }
  },

  methods: {
    /**
     * Sync user info from app.globalData
     */
    _syncUserFromApp() {
      const app = getApp();
      if (app.globalData) {
        const user = app.globalData.user;
        const formattedDate = user && user.createdAt
          ? this._formatJoinDate(user.createdAt)
          : '';
        this.setData({
          user,
          _formattedJoinDate: formattedDate
        });
      }
    },

    /**
     * Format join date to YYYY年MM月
     */
    _formatJoinDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}年${month}月`;
    },

    /**
     * Handle isOpened property change
     */
    _onIsOpenedChange(newVal) {
      // Could add animation timing here if needed
    },

    /**
     * Handle menu button tap (open sidebar)
     */
    onMenuTap() {
      const app = getApp();
      if (app.showSidebar) {
        app.showSidebar();
      }
      this.setData({ isOpened: true });
    },

    /**
     * Handle mask tap (close sidebar)
     */
    onMaskTap() {
      const app = getApp();
      if (app.hideSidebar) {
        app.hideSidebar();
      }
      this.setData({ isOpened: false });
    },

    /**
     * Handle logout button tap
     */
    onLogoutTap() {
      const app = getApp();
      wx.showModal({
        title: '确认退出',
        content: '确定要退出当前账号吗？',
        success(res) {
          if (res.confirm) {
            app.clearUserSession();
            wx.redirectTo({ url: '/pages/login/index' });
          }
        }
      });
    }
  }
});