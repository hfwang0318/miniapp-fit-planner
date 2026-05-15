# 变更日志

每轮开发周期追加一条记录，含开发追溯信息。

> **时间戳规则**：所有时间通过 `git log` 或 `date "+%Y-%m-%d %H:%M"` 获取，禁止编造。

## 格式

```
## Cycle N — [功能/修复名称] — YYYY-MM-DD HH:MM
**结果**：[DONE/PARTIAL/BLOCKED] | **分支**：[分支名] | **提交**：[hash] | **迭代**：[N] 轮
[步骤追溯表]
### 新增 / 变更 / 修复
```

---

---

## Cycle 3 — 修复微信一键登录报错 — 2026-05-16 00:03

**结果**：DONE | **分支**：`fix/login-error` | **提交**：待提交 | **迭代**：1 轮

| 步骤 | 版本 | Agent | 结论 | 输出 |
|------|------|-------|------|------|
| 1 | — | Orchestrator | P0 bug，登录 toast 错误 | [step-1](agent-outputs/cycle-1/step-1-orchestrator.md) |
| 2 | — | — | 跳过（无架构影响） | — |
| 3 | v1 | Developer | 完成（日志+容错+安全访问） | [step-3](agent-outputs/cycle-1/step-3-developer-v1.md) |
| 4 | v1 | Reviewer | APPROVED | [step-4](agent-outputs/cycle-1/step-4-reviewer-v1.md) |
| 5 | v1 | Tester | PASS（含运行时验证） | [step-5](agent-outputs/cycle-1/step-5-tester-v1.md) |
| 6 | — | Orchestrator | DONE | [step-6](agent-outputs/cycle-1/step-6-orchestrator.md) |

### 修复
- `services/auth.js` login() 中 `wx.login()` 改为非致命调用，失败后仍尝试云函数；添加 `[auth]` 前缀结构化日志覆盖全部执行路径；安全化 `result.result.error.code` 属性访问防止 TypeError
- `pages/login/index.js` 移除重复的 `app.setUserSession()` 调用；`.catch()` 和 `else` 分支添加 `console.error` 日志
- 新增 16 个测试用例（auth service 8 个 + login page 8 个），全量 20 个测试通过

## Cycle 2 — 修复登录失败 Bug — 2026-05-15 00:20

**结果**：DONE | **分支**：fix/missing-wx-login | **提交**：c7f5b60 | **迭代**：1 轮

| 步骤 | 版本 | Agent | 结论 | 输出 |
|------|------|-------|------|------|
| 1 | — | Orchestrator | P0 bug，缺 wx.login() | [step-1](agent-outputs/cycle-2/step-1-orchestrator.md) |
| 3 | v1 | Developer | 完成（1 行修复） | [step-3](agent-outputs/cycle-2/step-3-developer-v1.md) |
| 4 | v1 | Architect | APPROVED | [step-4](agent-outputs/cycle-2/step-4-architect-review-v1.md) |
| 5 | v1 | Tester | PASS（仅静态分析） | [step-5](agent-outputs/cycle-2/step-5-tester-v1.md) |
| 6 | — | Orchestrator | DONE | [step-6](agent-outputs/cycle-2/step-6-orchestrator.md) |

**备注**：步骤 5 测试存在缺陷（仅静态分析），通过后续技能修复。

### 修复
- `services/auth.js` 中 `login()` 缺少 `wx.login()` 调用，导致 `cloud.getWXContext().OPENID` 为 undefined。在 `wx.cloud.callFunction('auth')` 之前添加 `await wx.login()`

---

## Cycle 1 — 项目初始化 & 基础体重管理 — 2026-05-14

**结果**：DONE | **分支**：main | **迭代**：1 轮

### 新增
- 项目初始化：文档结构、架构决策、功能清单、任务看板
- 用户登录：wx.login + 云函数鉴权（auth 云函数）
- 体重记录：新增、编辑、删除，含表单校验
- 体重历史：分页列表，含统计信息
- 体重趋势图：自定义 Canvas 2D 折线图
- 仪表盘：统计卡片、图表预览、快捷操作
- 登录页：最小化微信鉴权流程
- 架构决策记录（ADR-001 至 ADR-006）
- 全部实体的数据模型（User、Team、TeamMember、WeightRecord、Goal、CheckIn、Invitation）
- 云函数 API 契约（auth、team、weight、goal、checkin）

### 变更
- 删除全部微信云开发 QuickStart 演示代码（46+ 个文件）
- 重写 app.js：基于 globalData + 本地存储的会话管理
- 重写 app.json：更新页面路由
- 重写 app.wxss：全局品牌样式、工具类
- 更新 project.config.json：项目名称改为"fit-planner"

### 修复
- models/user.js 中 nickName 默认值与云函数对齐
- 移除 services/weight.js 中未使用的 sanitizeForLogging 导入
- 移除 services/auth.js 中冗余的 wx.login() 调用
- dashboard 页面 onLoad 增加登录态守卫
- 修复 weight 云函数异常日志（仅记录 error.message）
- 清理 project.config.json 中残留的 databaseGuide 条件项
