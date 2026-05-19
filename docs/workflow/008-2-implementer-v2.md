# 实现报告 — `008-2-implementer-v2`

## 修复概要

本次修复了 Reviewer 在 `008-3-reviewer-v1.md` 中指出的 2 个 P0 必须修复项和 2 个 P1 强烈建议项。

---

## P0 修复

### P0-1: 云函数删除错误的 require（第1行已自行修复）

**状态**: 已确认干净 — 云函数 `cloudfunctions/auth/index.js` 第1行无 `require('../../services/auth')`。该问题在上轮修复中已处理。

**验证**: `cloudfunctions/auth/index.js` 仅 require `wx-server-sdk`，层边界正确。

---

### P0-2: `handleUpdateProfile` 添加服务端参数校验

**文件**: `cloudfunctions/auth/index.js:65-68`

**修复前**:
```js
async function handleUpdateProfile(openid, nickName, avatarUrl) {
  const updateData = { nickName };
```

**修复后**:
```js
async function handleUpdateProfile(openid, nickName, avatarUrl) {
  if (!nickName || typeof nickName !== 'string' || nickName.length > 30) {
    return { success: false, error: { code: 'INVALID_PARAMS', message: '昵称无效' } };
  }
  const updateData = { nickName };
```

**验证**: TC-AUTH-010（空昵称）和 TC-AUTH-011（超长昵称）均 PASS。

---

## P1 修复

### P1-3: 补充测试覆盖

新增以下测试用例：

| 测试文件 | 用例 | 描述 |
|---|---|---|
| `tests/unit/cloudfunctions/auth.test.js` | TC-AUTH-009 | `handleUpdateProfile` 更新成功 |
| `tests/unit/cloudfunctions/auth.test.js` | TC-AUTH-010 | 空 `nickName` 返回 `INVALID_PARAMS` |
| `tests/unit/cloudfunctions/auth.test.js` | TC-AUTH-011 | 超长 `nickName`（31字符）返回 `INVALID_PARAMS` |
| `tests/unit/services/auth.test.js` | TC-AUTH-SVC-009 | `updateProfile()` 调用成功 |
| `tests/unit/pages/login.test.js` | TC-LOGIN-009 | 新用户 `onLoginTap` 显示昵称弹窗 |
| `tests/unit/pages/login.test.js` | TC-LOGIN-010 | 弹窗 `onConfirmNickname` 空输入校验 |
| `tests/unit/pages/login.test.js` | TC-LOGIN-011 | 弹窗 `onConfirmNickname` 超长输入校验 |

**附带的测试基础设施修复**:
- `tests/__mocks__/wx-server-sdk.js`: `where()` 返回的对象补充了 `update()` 方法（之前缺失，导致云函数 `handleUpdateProfile` 中的 `db.collection().where().update()` 无法工作）

---

### P1-4: `wx.redirectTo` 添加 fail 回调

**文件**: `miniprogram/pages/login/index.js:129-135`

**修复前**:
```js
wx.redirectTo({ url: '/pages/dashboard/index' });
```

**修复后**:
```js
wx.redirectTo({
  url: '/pages/dashboard/index',
  fail: () => {
    this.setData({ modalLoading: false });
    wx.showToast({ title: '跳转失败，请重试', icon: 'none', duration: 2000 });
  }
});
```

---

## 测试结果

```
Tests:       44 passed, 44 total (unit)
```

增量测试（新增 7 个用例全部 GREEN）：
- TC-AUTH-009, TC-AUTH-010, TC-AUTH-011
- TC-AUTH-SVC-009
- TC-LOGIN-009, TC-LOGIN-010, TC-LOGIN-011

无新增 failures。

---

## 约束合规清单（修复后确认）

- [x] 层边界遵守（pages → services → cloudfunctions）
- [x] 无循环依赖
- [x] 业务逻辑在正确层级（云函数不依赖 service 层）
- [x] 隐私规则遵守（无原始体重暴露）
- [x] 所有 wx API 调用有错误回调（`wx.redirectTo` 已添加 fail）
- [x] 无调试代码残留（console.log 等 — 原有日志均为业务日志）
- [x] 无推测性设计（YAGNI）
- [x] 服务端参数校验（P0-2 已修复）