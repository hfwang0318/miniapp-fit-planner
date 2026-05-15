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
| TC-AUTH-005 | 服务层 wx.login 调用 | P0 | — | 检查 auth.js login() 代码 | wx.login() 在 cloud.callFunction 之前 | Manual（结构检查） | — | 2026-05-15 |
| TC-AUTH-006 | 未登录访问受保护页面 | P1 | 清除 storage | 直接访问 dashboard | 跳转 login 页面 | Pending（需 miniprogram-automator） | — | 2026-05-15 |

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
| Auth | 3 | 3 | 0 | 6 | 4 | 2 |
| Weight | 4 | 4 | 0 | 8 | 6 | 2 |
| **总计** | **7** | **7** | **0** | **14** | **10** | **4** |
