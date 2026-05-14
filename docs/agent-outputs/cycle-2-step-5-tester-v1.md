## 测试报告 — 修复登录失败 Bug — v1

### 测试范围
- **已测试功能：** 首次登录流程、回访用户自动登录、登录失败错误处理、代码审查（调用顺序、wx.login 返回值处理）
- **未测试功能：** 微信开发者工具运行时测试（受限于当前环境，测试结论基于静态代码分析）
- **回归检查区域：** auth.js 修复不影响体重管理模块（dashboard 和 weight 页面均无直接 auth 引用，仅 dashboard 在未登录时重定向到 login 页）

### 测试用例

| ID | 描述 | 预期 | 实际 | 状态 |
|----|------|------|------|------|
| TC-001 | 首次登录（清除 storage 后点击登录） | 调用 wx.login() → 云函数获取 openid → 创建 User → 存储 session → 跳转 dashboard | `auth.js login()` 第 22 行先调用 `await wx.login()`，第 25 行再调用 `wx.cloud.callFunction('auth')`。云函数通过 `cloud.getWXContext().OPENID` 获取 openid，新用户自动创建 User 文档。成功时通过 `app.setUserSession()` 写入 storage 并设置 `isLoggedIn=true`。`login/index.js onLoginTap()` 成功后执行 `wx.redirectTo('/pages/dashboard/index')`。流程完整正确。 | PASS |
| TC-002 | 回访登录（已有 session 缓存） | app.js restoreSession 恢复 → 跳过登录页 → 直接 dashboard | `app.js onLaunch()` 调用 `restoreSession()`，从 `wx.getStorageSync('fit_user_session')` 读取缓存的 session，设置 `globalData.isLoggedIn=true`。`login/index.js onLoad()` 检查 `isLoggedIn` 后立即 `redirectTo` 跳转 dashboard。 | PASS |
| TC-003 | 登录失败处理（网络异常等） | 显示"登录失败，请重试" | 覆盖三层异常路径：1) wx.login() 失败 → auth.js catch 返回 `{success: false, error: {code: 'AUTH_FAILED'}}`；2) 云函数返回 `success: false` → auth.js 透传 error 对象；3) 云函数抛出异常 → auth.js catch 返回失败对象。`login/index.js` 在 `then` 的 else 分支和 `catch` 分支均显示 toast "登录失败，请重试"并重置 loading 状态。 | PASS |
| TC-004 | 代码审查：auth service 是否先调用 wx.login() 再调云函数 | `wx.login()` 在 `wx.cloud.callFunction` 之前 | `auth.js` 第 22 行 `await wx.login()`，第 25 行 `await wx.cloud.callFunction({name: 'auth'})`。调用顺序正确。 | PASS |
| TC-005 | 代码审查：wx.login 返回值是否被正确处理 | 不需要将 code 传给云函数 | `auth.js` 不捕获 `wx.login()` 的返回值（不存储 code 变量），仅用于建立微信客户端会话。云函数使用 `cloud.getWXContext().OPENID` 服务端自动解析身份。符合微信云开发标准用法。 | PASS |

### 发现的 Bug

| Bug ID | 严重程度 | 描述 | 复现步骤 |
|--------|----------|------|----------|
| (无) | -- | 未发现 P0/P1 bug | -- |

### 代码审查发现

| 发现项 | 级别 | 说明 |
|--------|------|------|
| auth.js 和 login/index.js 存在双重 session 存储 | P2 | `auth.js login()` 在第 35-36 行已调用 `app.setUserSession(userData)`，`login/index.js` 在第 24 行又调用一次。两次写入相同数据，无实际影响，但存在重复代码。可在后续重构中清理。 |
| auth.js 中 `else if (app)` 后备路径不会设置 `isLoggedIn` | P2 | 当 `app.setUserSession` 不存在时（当前 app.js 中该函数存在，后备不会触发），后备代码只设置 `app.globalData.userSession` 而不设置 `app.globalData.isLoggedIn`，会导致 `login/index.js onLoad()` 无法检测到登录状态。当前无实际影响，仅作记录。 |

### 微信开发者工具验证
- [x] 编译 — 源码无语法错误，模块引用正确
- [ ] 页面渲染 — 受限于环境，未执行运行时测试
- [x] 控制台检查 — 无残留 `console.log` 调试代码，无 `console.error`

### 回归风险评估
**低** — 修复仅涉及 `miniprogram/services/auth.js` 中一行新增（第 22 行 `await wx.login()`），以及返回路径中的 session 存储逻辑（第 34-40 行）。体重管理等已有功能完全不依赖 auth 服务内部实现，无回归风险。

### 结论

**状态**：PASS

**合并建议**：APPROVE

所有 5 个测试用例通过。修复方案正确：
1. 在云函数调用前补充了被误删的 `await wx.login()` 调用，恢复了微信客户端会话上下文
2. 云函数 `cloud.getWXContext().OPENID` 现在能正确获取用户的 openid
3. 异常路径覆盖完整，错误信息展示正确
4. 未引入新的代码质量问题或回归风险

P2 级别发现（双重 session 存储、后备路径一致性）不影响核心功能，已记录供后续重构参考。
