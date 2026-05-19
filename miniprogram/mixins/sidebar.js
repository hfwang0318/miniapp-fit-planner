/**
 * Sidebar behavior
 * Provides shared sidebar state management for pages.
 */

module.exports = Behavior({
  data: {
    sidebarOpen: false
  },

  methods: {
    /**
     * Sync sidebar state from app.globalData
     */
    syncSidebarState() {
      const app = getApp();
      this.setData({ sidebarOpen: app.globalData.sidebarOpen || false });
    },

    /**
     * Handle menu button tap - open sidebar
     */
    onMenuTap() {
      const app = getApp();
      app.showSidebar();
      this.setData({ sidebarOpen: true });
    }
  }
});