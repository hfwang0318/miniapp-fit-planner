## 需求分析 — 修复登录失败 Bug

### 用户意图
点击"微信一键登录"按钮后提示"登录失败，请重试"，需要修复。

### 可行性评估
- 合理性：是（核心功能阻塞性 bug）
- 范围归属：MVP（F-001 用户登录）
- 严重程度：P0（功能不可用）

### 根因分析
`services/auth.js` 的 `login()` 方法直接调用 `wx.cloud.callFunction({ name: 'auth' })`，但**未先调用 `wx.login()`**。

在微信云开发中，`cloud.getWXContext().OPENID` 依赖客户端的微信登录会话。虽然 code 本身不需要传给云函数，但必须先执行 `wx.login()` 来建立会话上下文。缺失此调用导致 `OPENID` 为 undefined，鉴权失败。

### 任务拆分
| ID | 任务 | 优先级 | 依赖 | 负责人 |
|----|------|--------|------|--------|
| T-010 | 修复 services/auth.js 缺少 wx.login() 调用 | P0 | 无 | Developer |

### 已更新文档
- [x] task-board.md（T-010）
- [ ] feature-list.md（无需变更）

### 下一步
Architect 设计（第 2 步）— 此修复不涉及架构变更，直接进入第 3 步
