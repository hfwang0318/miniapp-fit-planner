const weightService = require('../../services/weight');
const { formatWeight } = require('../../utils/weight');

Page({
  data: {
    records: [],
    latestWeight: null,
    latestFormatted: '--',
    recordCount: 0,
    trend: null,
    trendSymbol: '',
    trendDelta: 0,
    loading: true,
    recentEntries: []
  },

  onLoad() {
    if (!this.checkAuth()) return;
    this.loadRecentRecords();
  },

  onShow() {
    if (!this.checkAuth()) return;
    // Refresh data when returning from weight page
    if (!this.data.loading) {
      this.loadRecentRecords();
    }
  },

  checkAuth() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/index' });
      return false;
    }
    return true;
  },

  loadRecentRecords() {
    this.setData({ loading: true });

    weightService.getWeights({ limit: 10 }).then(result => {
      if (result.success) {
        const records = result.data.records || [];
        const stats = weightService.getStats(records);
        const recentEntries = records.slice(0, 5).map(r => ({
          ...r,
          _formattedWeight: formatWeight(r.weight, r.unit)
        }));

        const trend = stats.trend || { direction: 'stable', delta: 0 };
        let trendSymbol = '→';
        if (trend.direction === 'up') trendSymbol = '↑';
        else if (trend.direction === 'down') trendSymbol = '↓';

        this.setData({
          records,
          recentEntries,
          recordCount: stats.count,
          latestWeight: stats.latest,
          latestFormatted: stats.latest
            ? formatWeight(stats.latest.weight, stats.latest.unit)
            : '--',
          trend: trend.direction,
          trendSymbol,
          trendDelta: trend.delta,
          loading: false
        });
      } else {
        wx.showToast({
          title: result.error && result.error.message || '加载失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    }).catch(() => {
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    });
  },

  onRecordWeightTap() {
    wx.navigateTo({ url: '/pages/weight/index' });
  }
});
