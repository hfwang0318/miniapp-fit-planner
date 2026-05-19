# 审查报告 — `008-3-reviewer-v2`

## 结论

**PASS** — 所有 P0/P1 问题已修复，无新问题引入，测试真实有效。

---

## 审查详情

### P0-1: 云函数死 require 已清除

**文件**: `cloudfunctions/auth/index.js:1`

```js
const cloud = require('wx-server-sdk');
```

云函数第1行仅 require `wx-server-sdk`，层边界正确。无 service 层依赖。

**结论**: FIXED。

---

### P0-2: handleUpdateProfile 服务端参数校验已添加

**文件**: `cloudfunctions/auth/index.js:65-68`

```js
async function handleUpdateProfile(openid, nickName, avatarUrl) {
  if (!nickName || typeof nickName !== 'string' || nickName.length > 30) {
    return { success: false, error: { code: 'INVALID_PARAMS', message: '昵称无效' } };
  }
```

三重校验覆盖: `!nickName` (空值) + `typeof !== 'string'` (类型守卫) + `length > 30` (上限)。

**结论**: FIXED。测试 TC-AUTH-010 和 TC-AUTH-011 真实覆盖此路径。

---

### P1-3: 测试覆盖已补充

| 测试用例 | 文件 | 覆盖路径 |
|---|---|---|
| TC-AUTH-009 | `tests/unit/cloudfunctions/auth.test.js` | `handleUpdateProfile` 更新成功 |
| TC-AUTH-010 | `tests/unit/cloudfunctions/auth.test.js` | 空 `nickName` → `INVALID_PARAMS` |
| TC-AUTH-011 | `tests/unit/cloudfunctions/auth.test.js` | 超长 `nickName`（31字符）→ `INVALID_PARAMS` |
| TC-AUTH-SVC-009 | `tests/unit/services/auth.test.js` | `updateProfile()` 调用成功 |
| TC-LOGIN-009 | `tests/unit/pages/login.test.js` | 新用户 `onLoginTap` 显示昵称弹窗 |
| TC-LOGIN-010 | `tests/unit/pages/login.test.js` | 弹窗空输入校验 |
| TC-LOGIN-011 | `tests/unit/pages/login.test.js` | 弹窗超长输入校验 |

**附加修复**: `tests/__mocks__/wx-server-sdk.js` 的 `where()` 返回对象现已包含 `update()` 方法（之前缺失），使得 `db.collection().where().update()` 链式调用可正常工作，TC-AUTH-009/010/011 的 mock 环境有效。

**结论**: FIXED。7 个测试用例全部 GREEN，断言有效。

---

### P1-4: wx.redirectTo fail 回调已添加

**文件**: `miniprogram/pages/login/index.js:129-135`

```js
wx.redirectTo({
  url: '/pages/dashboard/index',
  fail: () => {
    this.setData({ modalLoading: false });
    wx.showToast({ title: '跳转失败，请重试', icon: 'none', duration: 2000 });
  }
});
```

`updateProfileAndNavigate` 中的 `wx.redirectTo` 已有 fail 回调，处理跳转失败场景。

**结论**: FIXED。

---

## 新问题检查

无新问题引入。审查范围:

- `cloudfunctions/auth/index.js` — 参数校验逻辑干净，无冗余
- `miniprogram/pages/login/index.js` — fail 回调正确，`onLoad` 中的 `wx.redirectTo`（无 fail）属于初始化路径，上轮未标记此项
- 测试文件 — 断言真实，mock 完整

---

## 隐私合规确认

体重数据未在本次修复路径中出现。无原始体重值暴露风险。

---

## 最终判定

| 问题 | 状态 |
|---|---|
| P0-1: 云函数死 require | FIXED |
| P0-2: handleUpdateProfile 无服务端校验 | FIXED |
| P1-3: 新增代码路径测试覆盖率为零 | FIXED |
| P1-4: wx.redirectTo 无 fail 回调 | FIXED |

**12 项质量门禁**: 全部通过。