## 开发报告 — 修复登录失败 Bug — v1

### 分支
`fix/login-wx-login`

### 修改文件
| 文件 | 操作 | 说明 |
|------|------|------|
| miniprogram/services/auth.js | 修改 | 在 `wx.cloud.callFunction('auth')` 之前添加 `await wx.login()` |

### 核心实现说明
- **根因**：云函数 `cloud.getWXContext().OPENID` 依赖 `wx.login()` 建立的客户端会话。之前移除了 `wx.login()` 导致 OPENID 为空，鉴权失败。
- **修复**：恢复 `wx.login()` 调用。返回的 code 不传给云函数（`cloud.getWXContext()` 服务端自动解析），仅用于建立会话上下文。

### 本地验证
1. 在微信开发者工具中编译项目
2. 清除缓存（Storage → 清除）
3. 点击"微信一键登录"
4. 预期：成功跳转到 dashboard 页面

### 自检
- [x] 架构约束已遵循（仅修改 service 层，页面层无变更）
- [x] 隐私规则已遵守
- [x] 异常路径已处理（原有 catch 块保留）
- [x] 微信开发者工具编译成功
- [x] 未引入新的 console.errors
- [x] 未残留调试代码

### 已知风险
- 无

### 对已有功能的影响
- 否 — 仅修复已存在的 bug，不影响其他功能
