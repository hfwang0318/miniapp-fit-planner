const authService = require('../../services/auth');

const DEFAULT_NICKNAME = 'WeChat User';

Page({
  data: {
    loading: false,
    showNicknameModal: false,
    nicknameInput: '',
    useWechatAvatar: false,
    modalLoading: false
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
        const userData = result.data;
        const isNewUserNeedingProfile = userData.isNewUser && (!userData.nickName || userData.nickName === DEFAULT_NICKNAME);

        if (isNewUserNeedingProfile) {
          // Show nickname modal instead of redirecting
          this.setData({
            loading: false,
            showNicknameModal: true,
            nicknameInput: ''
          });
        } else {
          wx.redirectTo({ url: '/pages/dashboard/index' });
        }
      } else {
        console.error('[login] login failed:', result.error && result.error.message || JSON.stringify(result.error));
        wx.showToast({
          title: result.error && result.error.message || '登录失败，请重试',
          icon: 'none',
          duration: 2000
        });
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('[login] login exception:', err.message || JSON.stringify(err));
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    });
  },

  onUseWechatProfile() {
    if (this.data.modalLoading) return;
    this.setData({ modalLoading: true });

    wx.getUserProfile({
      desc: '获取头像和昵称',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        this.updateProfileAndNavigate(nickName, avatarUrl);
      },
      fail: (err) => {
        console.error('[login] wx.getUserProfile failed:', err.errMsg || JSON.stringify(err));
        wx.showToast({
          title: '获取失败，请重试',
          icon: 'none',
          duration: 2000
        });
        this.setData({ modalLoading: false });
      }
    });
  },

  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value });
  },

  onAvatarCheckboxChange(e) {
    this.setData({ useWechatAvatar: e.detail.value.length > 0 });
  },

  onConfirmNickname() {
    const { nicknameInput, useWechatAvatar, modalLoading } = this.data;
    if (modalLoading) return;

    // Validate: non-empty, max 30 chars
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      wx.showToast({ title: '请输入昵称', icon: 'none', duration: 2000 });
      return;
    }
    if (trimmed.length > 30) {
      wx.showToast({ title: '昵称最多30字符', icon: 'none', duration: 2000 });
      return;
    }

    if (useWechatAvatar) {
      this.setData({ modalLoading: true });
      wx.getUserProfile({
        desc: '获取头像',
        success: (res) => {
          const { avatarUrl } = res.userInfo;
          this.updateProfileAndNavigate(trimmed, avatarUrl);
        },
        fail: (err) => {
          console.error('[login] wx.getUserProfile failed:', err.errMsg || JSON.stringify(err));
          wx.showToast({ title: '获取头像失败', icon: 'none', duration: 2000 });
          this.setData({ modalLoading: false });
        }
      });
    } else {
      this.updateProfileAndNavigate(trimmed, '');
    }
  },

  updateProfileAndNavigate(nickName, avatarUrl) {
    authService.updateProfile(nickName, avatarUrl).then(result => {
      if (result.success) {
        this.setData({ modalLoading: false, showNicknameModal: false });
        wx.redirectTo({
          url: '/pages/dashboard/index',
          fail: () => {
            this.setData({ modalLoading: false });
            wx.showToast({ title: '跳转失败，请重试', icon: 'none', duration: 2000 });
          }
        });
      } else {
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none',
          duration: 2000
        });
        this.setData({ modalLoading: false });
      }
    }).catch(err => {
      console.error('[login] updateProfile exception:', err.message || JSON.stringify(err));
      wx.showToast({ title: '设置失败，请重试', icon: 'none', duration: 2000 });
      this.setData({ modalLoading: false });
    });
  }
});