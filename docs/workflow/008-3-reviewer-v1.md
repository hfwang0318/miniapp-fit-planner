# Reviewer Report: 登录昵称设置弹窗

**分支**: `feature/login-nickname-modal`
**日期**: 2026-05-19
**审查者**: Reviewer Agent
**结论**: **BLOCKED** — 2 个 P0 + 1 个 P1 未解决

---

## 总体评估

功能基本正确实现，弹窗 UI 和交互逻辑覆盖了 spec 的核心路径。关键路径存在 2 个 P0 缺陷（服务端参数校验缺失 + 错误的层级依赖），必须修复后才能合并。

---

## 7 项审查清单

### 1. 功能正确性 — PASS (有 P0 待修复)

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 新用户显示弹窗 | PASS | `isNewUser && (!nickName \|\| nickName === DEFAULT_NICKNAME)` 正确触发 |
| 弹窗不可关闭 | PASS | 无关闭按钮、无遮罩 catchtap、wxml 无关闭逻辑 |
| "使用微信昵称" 按钮 | PASS | 调用 `wx.getUserProfile` + `updateProfileAndNavigate` |
| 自定义输入校验 | PASS | 非空、最多 30 字符，校验在 `onConfirmNickname` 中正确实现 |
| 头像勾选功能 | PASS | `useWechatAvatar` 状态正确，`wx.getUserProfile` 在勾选时调用 |
| 老用户直接进 dashboard | PASS | `isNewUser && (!nickName \|\| ...)` 为 false 时直接 redirect |
| 输入允许 emoji | PASS | `input type="text"` + `maxlength="30"` 组合支持 emoji（WeChat 以 UTF-16 code unit 计数，emoji 计 2） |

**待修复问题**: 服务端 `handleUpdateProfile` 无参数校验（P0-2）

---

### 2. 代码复用 — PASS

- `authService.updateProfile` 封装了云函数调用，符合服务层规范
- `app.updateUserProfile` 与现有 `setUserSession` 模式一致
- `DEFAULT_NICKNAME` 在 login/page 和 cloud function 中各自定义（无实际复用需求，字符串常量固化为字面量可接受）
- 无发现重复的工具函数或可抽取逻辑

---

### 3. 代码质量 — PASS (有 Observation)

**无冗余状态**: `modalLoading` 控制弹窗内按钮加载态，与 `loading` 分离，职责清晰。

**无 copy-paste**: `updateProfileAndNavigate` 和 `onConfirmNickname` 中均有 `fail` 回调处理，模式一致但非重复代码。

**无参数 sprawl**: 新增方法签名简洁，`updateProfile(nickName, avatarUrl)` 符合单一职责。

**Observation**: `cloudfunctions/auth/index.js` 第 1 行存在无效的 `require`:
```js
const authService = require('../../services/auth');
```
该模块（frontend service 层）在云函数中既未被引入也未被调用，为死代码。建议移除，但不影响功能。

---

### 4. 效率 — PASS

- 无重复网络调用：每个用户操作只产生一次 `wx.cloud.callFunction`
- 无内存泄漏：Page 实例无定时器或事件监听器泄漏
- 无 N+1 查询：云函数单次 DB 操作完成
- 弹窗使用 `wx:if` 而非 `hidden`，条件为 false 时不渲染，效率合理

---

### 5. 测试覆盖 — INSUFFICIENT (P1-3)

现有测试覆盖了 `login()` 和 `onLoginTap()` 核心路径，但以下关键路径**完全没有测试**：

| 测试缺失 | 影响 |
|----------|------|
| `handleUpdateProfile` 云函数 | 无法验证 `updateProfile` 类型处理 |
| `authService.updateProfile()` | 无法验证服务层调用 |
| `app.updateUserProfile()` | 无法验证本地会话更新 |
| 昵称弹窗完整流程（`showNicknameModal → onConfirmNickname → redirectTo`） | 新用户路径未覆盖 |
| `onUseWechatProfile` 路径 | 微信头像路径未覆盖 |
| `handleUpdateProfile` 并发竞态（两个请求同时发出） | 未覆盖 |

**覆盖率评估**: `cloudfunctions/auth/index.js` 新增代码 (`handleUpdateProfile`) 测试覆盖率为 0 / 100。

---

### 6. 隐私合规 — PASS

- 功能涉及 `nickName` 和 `avatarUrl`，与体重数据无关
- 无日志输出原始体重值
- `cloudfunctions/auth/index.js` 中的 `console.error` 用于诊断登录/更新失败，不涉及体重
- 团队视图不受此功能影响

---

### 7. 微信小程序约束 — PASS (有 P1-4)

所有 `wx` API 调用均有错误回调，符合规范：

| 调用位置 | API | fail 回调 |
|----------|-----|-----------|
| `authService.login()` | `wx.login()` | 有 |
| `authService.login()` | `wx.cloud.callFunction()` | 有（通过 catch） |
| `authService.updateProfile()` | `wx.cloud.callFunction()` | 有（通过 catch） |
| `onLoginTap()` | `wx.showToast()` | N/A（同步 API） |
| `onUseWechatProfile()` | `wx.getUserProfile()` | 有 |
| `onConfirmNickname()` | `wx.getUserProfile()` | 有 |

**P1-4**: `updateProfileAndNavigate` 中 `wx.redirectTo` 无 fail 回调：
```js
// miniprogram/pages/login/index.js:128
wx.redirectTo({ url: '/pages/dashboard/index' });
```
若页面栈已满或导航失败，弹窗保持显示，用户无感知。`fail` 回调应至少 `this.setData({ modalLoading: false })` 并提示错误。

---

## 缺陷清单

### P0 — 必须修复（BLOCKED）

#### P0-1: 云函数存在错误的层级依赖（死 require）

**文件**: `cloudfunctions/auth/index.js:1`

```js
const authService = require('../../services/auth');
```

- **问题**: `authService` 是 `miniprogram/services/auth.js`（前端 service 层），不应被云函数 require 或使用。该 require 在当前文件中完全未被调用（`authService` 无任何使用处）。
- **影响**: 错误的层间依赖，引入死代码，破坏架构清晰度。
- **修复**: 删除该行。

---

#### P0-2: `handleUpdateProfile` 无服务端参数校验

**文件**: `cloudfunctions/auth/index.js:65-77`

```js
async function handleUpdateProfile(openid, nickName, avatarUrl) {
  const updateData = { nickName };  // nickName 可为空字符串、超长字符串
  if (avatarUrl !== undefined) {
    updateData.avatarUrl = avatarUrl;
  }
  await db.collection('User').where({ openid }).update({ data: updateData });
  // ...
}
```

- **问题**: `nickName` 无非空校验、无长度校验。虽然前端 `onConfirmNickname` 有校验，但**服务端必须作为最终防线**，恶意客户端可直接调用云函数绕过前端校验。
- **影响**: 可写入空字符串、超长字符串到数据库，影响数据完整性。
- **修复**: 在 `handleUpdateProfile` 开头添加：
```js
if (!nickName || typeof nickName !== 'string' || nickName.length > 30) {
  return { success: false, error: { code: 'INVALID_PARAMS', message: '昵称无效' } };
}
```

---

### P1 — 强烈建议（BLOCKED）

#### P1-3: 新增代码路径测试覆盖率为零

**缺失覆盖**:
- `cloudfunctions/auth/index.js`: `handleUpdateProfile`（TC-AUTH-009 应覆盖）
- `miniprogram/services/auth.js`: `updateProfile`（TC-AUTH-SVC-009 应覆盖）
- `miniprogram/app.js`: `updateUserProfile`
- `miniprogram/pages/login/index.js`: 昵称弹窗交互（`showNicknameModal`, `onConfirmNickname`, `onUseWechatProfile`, `updateProfileAndNavigate`）

**影响**: 新增功能完全未经测试即合并，回归风险高。
**修复**: 补充至少以下测试用例：
- `TC-AUTH-009`: `handleUpdateProfile` 更新成功
- `TC-AUTH-010`: `handleUpdateProfile` 传入空 nickName 返回错误
- `TC-AUTH-011`: `handleUpdateProfile` 传入超长 nickName 返回错误
- `TC-AUTH-SVC-009`: `updateProfile()` 调用成功
- `TC-LOGIN-009`: 新用户 `onLoginTap` 显示弹窗（`showNicknameModal === true`）
- `TC-LOGIN-010`: 弹窗 `onConfirmNickname` 校验空输入
- `TC-LOGIN-011`: 弹窗 `onConfirmNickname` 校验超长输入

---

#### P1-4: `wx.redirectTo` 无 fail 回调

**文件**: `miniprogram/pages/login/index.js:128`

```js
wx.redirectTo({ url: '/pages/dashboard/index' });
```

- **问题**: 导航失败时（如页面栈满），用户停留在弹窗状态，无任何反馈。
- **修复**:
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

## 已验证通过的方面

- 弹窗 UI 和交互完整，符合 spec 设计
- 输入校验（非空、最多 30 字符）正确实现
- 所有 `wx` API 调用有完整的 `fail` 回调（P1-4 除外）
- 服务层 `updateProfile` 返回格式符合 `{ success, data?, error? }` 规范
- 本地会话更新逻辑（`app.updateUserProfile`）正确实现
- 隐私合规：功能与体重数据完全无关
- 无循环依赖
- 层边界基本遵守（P0-1 除外）

---

## 结论

**BLOCKED** — 存在 2 个 P0 + 1 个 P1 必须修复。

| 严重性 | 数量 | 状态 |
|--------|------|------|
| P0 | 2 | 必须修复 |
| P1 | 2 | 强烈建议修复 |
| P2 | 0 | — |
| Observation | 1 | 建议修复（可选） |

修复 P0-1、P0-2、P1-3（测试）、P1-4 后重新提交审查。
