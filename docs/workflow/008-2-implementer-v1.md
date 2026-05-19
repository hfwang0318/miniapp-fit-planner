# Implementer Report: 登录昵称设置弹窗

**分支**: `feature/login-nickname-modal`
**日期**: 2026-05-19
**实现者**: Claude Code (Implementer Agent)

## 实现概述

成功实现了强制性的昵称设置弹窗功能，新用户首次登录后必须设置昵称/头像才能进入 dashboard。

## 变更清单

### 1. cloudfunctions/auth/index.js
- **handleLogin**: 新增返回 `nickName` 和 `avatarUrl` 字段（老用户返回实际值，新用户返回默认值）
- **handleUpdateProfile**: 新增 `updateProfile` 类型处理，更新 User 文档的 `nickName` 和 `avatarUrl`
- **exports.main**: 新增 `updateProfile` case 分支

### 2. miniprogram/services/auth.js
- 新增 `updateProfile(nickName, avatarUrl)` 方法，调用云函数更新用户资料

### 3. miniprogram/app.js
- 新增 `updateUserProfile(profileData)` 方法，用于更新本地会话中的用户信息

### 4. miniprogram/pages/login/index.js
- 新增 `DEFAULT_NICKNAME` 常量
- `data` 新增: `showNicknameModal`, `nicknameInput`, `useWechatAvatar`, `modalLoading`
- `onLoginTap`: 登录成功后检查 `isNewUser && (!nickName || nickName === DEFAULT_NICKNAME)`，需要设置昵称则显示弹窗，否则跳转 dashboard
- `onUseWechatProfile`: 调用 `wx.getUserProfile` 获取微信昵称头像，然后 `updateProfileAndNavigate`
- `onNicknameInput`: 双向绑定昵称输入
- `onAvatarCheckboxChange`: 双向绑定头像勾选状态
- `onConfirmNickname`: 校验（非空、最多30字符），如勾选头像则调用 `wx.getUserProfile`，然后 `updateProfileAndNavigate`
- `updateProfileAndNavigate`: 调用 `authService.updateProfile` 成功后关闭弹窗并跳转 dashboard

### 5. miniprogram/pages/login/index.wxml
- 新增昵称设置弹窗 UI（modal-overlay 遮罩 + modal-content 内容区）
- 弹窗包含：标题、"使用微信昵称和头像"按钮、分隔栏、输入框、勾选框、"确认"按钮
- 弹窗不可关闭（无关闭按钮）

### 6. miniprogram/pages/login/index.wxss
- 新增弹窗样式：遮罩层（rgba(0,0,0,0.6)）、居中内容卡片、按钮样式、输入框样式、勾选框样式

## 约束合规清单

- [x] 层边界遵守（pages → services → cloudfunctions）
- [x] 无循环依赖
- [x] 业务逻辑在正确层级（页面处理 UI，服务处理调用，云函数处理数据）
- [x] 隐私规则遵守（无原始体重暴露，新增功能与体重无关）
- [x] 所有 wx API 调用有错误回调（`wx.getUserProfile` 全部有 `fail` 回调）
- [x] 无调试代码残留（无 console.log 等）
- [x] 无推测性设计（YAGNI）
- [x] 输入校验：非空、最多 30 字符、允许 emoji（input type="text" 支持 emoji）

## 测试结果

```
单元测试: 37 passed, 0 failed
  - tests/unit/services/auth.test.js: 8 passed
  - tests/unit/cloudfunctions/auth.test.js: 4 passed
  - tests/unit/pages/login.test.js: 8 passed
  - 其他: 17 passed

集成测试: 12 passed, 0 failed
  - tests/integration/ 相关: 12 passed
```

增量回归: 0 new failures

## 用户流程（实现后）

```
用户点击"微信一键登录"
    ↓
authService.login() → 云函数创建/获取 User 文档，返回 { openid, isNewUser, nickName, avatarUrl }
    ↓
isNewUser && (nickName === 'WeChat User' 或 nickName 为空)?
    ↓ [是] 显示昵称设置弹窗（阻塞 dashboard 跳转）
    ↓
用户选择:
  A) "使用微信昵称和头像" → wx.getUserProfile → updateProfileAndNavigate
  B) 自定义输入 + [确认] → 校验 → updateProfileAndNavigate
  C) 自定义输入 + 勾选"同时设置微信头像" + [确认] → wx.getUserProfile → updateProfileAndNavigate
    ↓
updateProfileAndNavigate → authService.updateProfile → 云函数更新 User 文档
    ↓
wx.redirectTo({ url: '/pages/dashboard/index' })
```

## 技术细节

- **弹窗不可关闭**: 弹窗没有关闭按钮，没有 catchtap 阻止冒泡，无法通过遮罩层点击关闭
- **头像获取**: 使用 `wx.getUserProfile({ desc: '获取头像和昵称' })` 和 `wx.getUserProfile({ desc: '获取头像' })` 两次调用获取用户信息
- **昵称校验**: `trimmed.length > 30` 防止超过限制，`!trimmed` 防止空昵称
- **会话更新**: 云函数更新完成后，通过 `app.updateUserProfile()` 同步更新本地 globalData 和 Storage