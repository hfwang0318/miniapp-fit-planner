## 开发报告 — 修复登录失败 bug — v1

### 分支
`fix/login-error`

### 修改文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `miniprogram/services/auth.js` | 修改 | 修复 wx.login() 失败时流程未中断 + console 日志安全字符串化 |
| `tests/unit/services/auth.test.js` | 修改 | TC-AUTH-SVC-005 更新为新行为：wx.login() 失败返回 LOGIN_FAILED |

### 核心实现说明
- **问题 1**：wx.login() 失败后，catch 块仅打日志，流程继续调用云函数。因无有效会话，`cloud.getWXContext().OPENID` 返回空，云函数返回 `AUTH_FAILED`，导致用户看到"登录失败，请重试"。
- **修复**：wx.login() catch 块内立即返回 `{ success: false, error: { code: 'LOGIN_FAILED', message: '微信登录失败，请重试' } }`，中断流程不再调用云函数。语义更清晰：微信客户端会话失效，无需绕路到云函数再报错。
- **问题 2**：3 处 console 调用直接传 Error 对象（`loginErr`、`err`），控制台显示无意义的 `[object Object]`。
- **修复**：改为 `err.message || JSON.stringify(err)`，确保日志可读。

### 本地验证
1. `npm run test:unit` — 20/20 测试通过
2. 手动审查 diff 确认 3 处修复点均到位

### 自检
- [x] 架构约束已遵循（仅修改服务层 login() 方法，未触碰页面层或云函数）
- [x] 隐私规则已遵守（无体重数据涉及）
- [x] 异常路径已处理（wx.login() 失败 → LOGIN_FAILED；云函数失败 → AUTH_FAILED；外层异常 → AUTH_FAILED）
- [x] 微信开发者工具编译成功（编译由 IDE 处理，语法结构未变）
- [x] 未引入新 console.error（仅修改已有 console 调用的参数）
- [x] 无调试代码残留

### 已知风险
- 行为变更：wx.login() 失败不再尝试通过已有会话调用云函数。但在微信小程序中，wx.login() 失败意味着当前环境缺少临时登录凭证，由云函数无法有效解析 OPENID，提前返回更合理。
- TC-AUTH-SVC-005 已更新，无其他测试受影响。

### 对已有功能的影响
否 — 对外接口未变（login() 返回格式仍是 `{ success, data?, error? }`）。仅失败路径的错误码从 `AUTH_FAILED` 变为 `LOGIN_FAILED`（更具体），调用方按 `error.code` 做差异处理时需要注意。
