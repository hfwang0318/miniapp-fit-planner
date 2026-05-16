# 测试用例归档

## 格式

| Case ID | 模块 | 标题 | 优先级 | 前置条件 | 步骤 | 预期结果 | 自动化 | 关联文件 | 维护时间 |
|---------|------|------|--------|----------|------|----------|--------|----------|----------|

---

## Auth 模块

| Case ID | 标题 | 优先级 | 前置条件 | 步骤 | 预期结果 | 自动化 | 关联文件 | 维护时间 |
|---------|------|--------|----------|------|----------|--------|----------|----------|
| TC-AUTH-001 | 首次登录 | P0 | 云函数已部署，User 集合存在 | 调用 auth 云函数 type=login | 返回 openid，isNewUser=true，User 文档创建 | Automated | tests/unit/cloudfunctions/auth.test.js | 2026-05-15 |
| TC-AUTH-002 | 回访用户登录 | P0 | User 已存在 | 再次调用 login | 返回 openid，isNewUser=false | Automated | tests/unit/cloudfunctions/auth.test.js | 2026-05-15 |
| TC-AUTH-003 | 无效 type | P1 | — | 传 type=invalid | 返回 error code=INVALID_TYPE | Automated | tests/unit/cloudfunctions/auth.test.js | 2026-05-15 |
| TC-AUTH-004 | 缺失 OPENID | P1 | — | mock OPENID 为 undefined | 返回 error code=AUTH_FAILED | Automated | tests/unit/cloudfunctions/auth.test.js | 2026-05-15 |
| TC-AUTH-005 | 服务层 wx.login 调用 | P0 | — | 检查 auth.js login() 代码 | wx.login() 在 cloud.callFunction 之前 | Manual（结构检查） | — | 2026-05-16 |
| TC-AUTH-006 | 未登录访问受保护页面 | P1 | 清除 storage | 直接访问 dashboard | 跳转 login 页面 | Pending（需 miniprogram-automator） | — | 2026-05-15 |
| TC-AUTH-SVC-001 | 服务层成功登录 | P0 | wx.login+cloud.callFunction 成功 | authService.login() | 返回 success=true, data.openid, data.isNewUser | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-002 | 云函数返回错误码 | P1 | cloud.callFunction 返回 error | authService.login() | 返回 success=false, error.code=UNAUTHORIZED | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-003 | 云函数抛出异常 | P0 | cloud.callFunction 抛出 | authService.login() | 返回 success=false, error.code=AUTH_FAILED | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-004 | 登录后存储 session | P0 | 登录成功 | authService.login() | 调用 app.setUserSession 含 openid | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-005 | wx.login 失败立即返回 | P0 | wx.login 失败 | authService.login() | 返回 success=false, error.code=LOGIN_FAILED，不调用云函数 | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-006 | error.code 缺失回退 | P1 | error 对象无 code 属性 | authService.login() | 回退为 AUTH_FAILED（不崩溃） | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-007 | 结构化日志 | P1 | 成功路径 | authService.login() | console 调用含 [auth] 前缀 | Automated | tests/unit/services/auth.test.js | 2026-05-16 |
| TC-AUTH-SVC-008 | getApp 为 null 的容错 | P1 | getApp 返回 null | authService.login() | 不影响登录返回值 | Automated | tests/unit/services/auth.test.js | 2026-05-16 |

## Login 页面模块

| Case ID | 标题 | 优先级 | 前置条件 | 步骤 | 预期结果 | 自动化 | 关联文件 | 维护时间 |
|---------|------|--------|----------|------|----------|--------|----------|----------|
| TC-LOGIN-001 | 成功登录跳转 dashboard | P0 | authService.login 返回 success | onLoginTap | wx.redirectTo dashboard | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-002 | 登录失败显示 toast | P0 | authService.login 返回 error | onLoginTap | wx.showToast 显示错误信息 | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-003 | 双击保护 | P1 | loading=true | onLoginTap | 不重复调用 authService.login | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-004 | catch 路径显示默认 toast | P0 | authService.login 抛出异常 | onLoginTap | wx.showToast 显示默认提示 | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-005 | catch 路径记录错误日志 | P1 | authService.login 抛出异常 | onLoginTap | console.error 被调用 | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-006 | 登录失败记录错误日志 | P1 | authService.login 返回 error | onLoginTap | console.error 被调用 | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-007 | loading 状态设置 | P1 | 开始登录 | onLoginTap | setData({loading: true}) 被调用 | Automated | tests/unit/pages/login.test.js | 2026-05-16 |
| TC-LOGIN-008 | 已登录跳转 | P1 | isLoggedIn=true | onLoad | wx.redirectTo dashboard | Automated | tests/unit/pages/login.test.js | 2026-05-16 |

## Weight 模块

| Case ID | 标题 | 优先级 | 前置条件 | 步骤 | 预期结果 | 自动化 | 关联文件 | 维护时间 |
|---------|------|--------|----------|------|----------|--------|----------|----------|
| TC-WEIGHT-001 | 创建体重记录 | P0 | 云函数已部署 | 调用 create，weight=75, unit=kg | 返回 recordId | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-002 | 无效体重值 | P1 | — | 传 weight=0 | 返回 INVALID_WEIGHT | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-003 | 未来日期 | P1 | — | 传 recordedAt=2099-01-01 | 返回 FUTURE_DATE | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-004 | 查询自己记录 | P0 | 已有记录 | 调用 list | 返回自己的记录，不包含他人记录 | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-005 | 更新他人记录 | P0 | 记录不属于调用者 | 调用 update | 返回 NOT_OWNER | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-006 | 删除他人记录 | P0 | 记录不属于调用者 | 调用 delete | 返回 NOT_OWNER | Automated | tests/unit/cloudfunctions/weight.test.js | 2026-05-15 |
| TC-WEIGHT-007 | 体重页面表单校验 | P1 | — | 输入无效值 → 提交 | 显示校验错误 | Pending（需 miniprogram-automator） | — | 2026-05-15 |
| TC-WEIGHT-008 | 空记录状态 | P1 | 无记录 | 访问体重页面 | 显示"还没有体重记录" | Pending（需 miniprogram-automator） | — | 2026-05-15 |

## 统计

| 模块 | P0 | P1 | P2 | 总计 | 已自动化 | Pending |
|------|----|----|----|------|----------|---------|
| Auth | 7 | 7 | 0 | 14 | 12 | 2 |
| Login | 3 | 5 | 0 | 8 | 8 | 0 |
| Weight | 4 | 4 | 0 | 8 | 6 | 2 |
| **总计** | **14** | **16** | **0** | **30** | **26** | **4** |

## Login 页面 E2E 回归用例

| Case ID | 标题 | 优先级 | 前置条件 | 步骤 | 预期结果 | 自动化 | 关联文件 | 维护时间 |
|---------|------|--------|----------|------|----------|--------|----------|----------|
| TC-LOGIN-E2E-001 | 登录按钮存在且可点击 | P0 | E2E 环境就绪 | 导航到登录页 → 查找 `[data-testid="login-btn"]` | 按钮元素存在 | Automated (E2E) | tests/e2e/specs/login.spec.js | 2026-05-16 v2 验证通过 |
| TC-LOGIN-E2E-002 | 登录按钮点击后 loading 正确变化 | P0 | 已打开登录页 | 点击登录按钮 → 等待 → 检查 page.data.loading | loading 先 true 后 false | Automated (E2E) | tests/e2e/specs/login.spec.js | 2026-05-16 v2 验证通过 |
| TC-LOGIN-E2E-003 | 登录流程无 [object Object] 运行时错误 | P0 | 已打开登录页 | 点击登录按钮 → 检查运行时错误 | 无 [object Object] 错误 | Automated (E2E) | tests/e2e/specs/login.spec.js | 2026-05-16 v2 验证通过 |
| TC-LOGIN-E2E-004 | 登录失败页面不崩溃 | P0 | 已打开登录页 | 点击登录按钮 → 等待 → 检查页面存活 | 页面停留在 login 或跳转 | Automated (E2E) | tests/e2e/specs/login.spec.js | 2026-05-16 v2 验证通过 |

---

## Bug 回归用例

Bug 修复后建立的回归用例，与功能用例统一管理。

| Bug ID | 标题 | 影响模块 | 复现步骤 | 根因 | 修复 | 回归测试 | 自动化 | 验证时间 |
|--------|------|----------|----------|------|------|----------|--------|----------|
| BUG-AUTH-001 | 点击登录提示"登录失败" | Auth 服务层 + Login 页面 | 点击"微信一键登录" → 提示"登录失败" | wx.login() 失败后流程未中断，云函数 AUTH_FAILED；console 传入 Error 对象 | 1) wx.login() 失败改为致命（立即返回 LOGIN_FAILED）；2) 修复 auth.js 中 3 处 Error 对象日志 | TC-AUTH-SVC-001 ~ TC-AUTH-SVC-008, TC-LOGIN-001 ~ TC-LOGIN-008 | Automated | 2026-05-16 |
| BUG-LOGIN-002 | 登录页面 console.error 传入 Error 对象 | Login 页面 | 在线登录页面点击"微信一键登录" → 登录失败 | pages/login/index.js:25 直接传入 result.error（对象） | 改为 `result.error.message || JSON.stringify(result.error)` | TC-LOGIN-E2E-003 | Automated (E2E) | 2026-05-16 v2 验证通过 |
| BUG-LOGIN-003 | 登录页面 catch 路径 console.error 传入 Error 对象 | Login 页面 | 登录抛出异常 | pages/login/index.js:34 直接传入 err（Error 对象） | 改为 `err.message || JSON.stringify(err)` | TC-LOGIN-E2E-003 | Automated (E2E) | 2026-05-16 v2 验证通过 |
| BUG-WEIGHT-001 | 体重页面导航时出现 `[WEIGHT_RECORD] getWeights error` 运行时错误 | Weight 页面 | 导航到体重页面 | weight 页面 onLoad 时调用 getWeights 云函数失败 | 待确认根因 | navigation.spec.js runtime-errors | Automated (E2E) | 2026-05-16 v2 验证 — 遗留问题 |
