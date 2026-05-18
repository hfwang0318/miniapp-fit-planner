# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指引。

## 项目概述

Fit Planner 是一款微信小程序，用于小团队（约 4 人）的协作体重管理。使用原生 WXML/WXSS/JavaScript 开发，后端采用微信云开发（云函数 + 云数据库）。通过 `wx.login()` → 云函数解析 OPENID 完成身份认证。

## 常用命令

```bash
npm test                  # 运行全部 Jest 测试
npm run test:unit         # 仅运行单元测试（tests/unit/）
npm run test:integration  # 仅运行集成测试（tests/integration/）
```

本项目无构建步骤，编译完全由微信开发者工具 IDE 处理。

## 架构设计

**分层架构** — 严格的依赖方向：

```
页面层（miniprogram/pages/）          ← WXML/WXSS/Page JS，仅负责 UI
  → 服务层（miniprogram/services/）   ← 业务逻辑，调用云函数
    → 云函数（cloudfunctions/）       ← 服务端：鉴权、校验、数据库操作
      → 云数据库
```

**核心规则：**
- 页面**禁止**直接访问云数据库 — 必须通过服务层
- 服务层封装 `wx.cloud.callFunction()`，统一返回 `{ success, data?, error? }` 格式
- 云函数采用命令分发模式：通过 `event.type` 路由到对应的处理函数
- 鉴权以服务端为准 — `cloud.getWXContext().OPENID`，绝不信任客户端传入的 openid
- 任何更新/删除操作前，必须在服务端验证数据所有权

**状态管理：** 刻意保持极简。`app.globalData` 仅存放用户会话。页面级 `data` 管理 UI 状态。不使用 flux/redux/mobx。会话通过 `wx.setStorageSync('fit_user_session')` 持久化。

**当前页面：** `dashboard/index`、`login/index`、`weight/index`（在 `app.json` 中注册）。
**当前云函数：** `auth`、`weight`。

## 平台约束

这是一个微信小程序，**不是** Web 应用：
- 无 DOM API（`window`、`document`、`localStorage` 均不存在）
- 使用 `wx.setStorageSync` / `wx.getStorageSync` 进行本地持久化
- 仅支持 HTTPS，域名需在微信后台加入白名单
- 包大小限制：每个分包 2MB（合计 20MB）
- 通过 WXML 数据绑定更新 UI，不直接操作 DOM
- 所有 `wx` API 调用必须有错误回调（不能只有成功回调）

## 隐私与体重数据

体重数据属于敏感个人信息，必须遵守以下规则：
- **绝不在**云函数日志、控制台输出或错误信息中记录原始体重值
- 团队视图仅展示进度百分比和趋势，**不展示**原始体重值（除非成员主动开启共享）
- 管理员在未经明确授权的情况下无法查看他人的原始体重
- 云数据库安全规则：用户只能读写自己的记录
- 在适当位置使用 `maskWeight()` 和 `sanitizeForLogging()` 工具函数
- 分享链接/卡片参数中不得包含体重数据

## 多 Agent 开发工作流

开发功能或修复 bug 时，调用 `fit-planner-workflow` 技能。它编排 6 步流水线：

1. **Orchestrator** — 需求分析、任务管理
2. **Architect** — 架构设计、输出约束清单（无架构影响的变更可跳过）
3. **Developer** — 在 `feature/<名称>` 或 `fix/<名称>` 分支上实现
4. **Reviewer** — 代码审查（7 项检查 + 隐私审查）
5. **Tester** — 4 个测试级别的运行时验证
6. **Orchestrator** — 12 项质量门禁全部通过后合并到 `main`

步骤 3-5 被拒绝时会迭代循环（最多连续 3 次拒绝，之后由 Orchestrator 介入）。每步输出到 `docs/agent-outputs/cycle-{N}/`。

## Git 规范

- **分支命名：** `feature/<名称>` 或 `fix/<名称>`
- **提交格式：** `type: 简短描述`（类型：`feat`、`fix`、`docs`、`refactor`、`test`、`chore`）
- 禁止直接向 `main` 提交

## 反过度设计

目标用户是 4 人团队，不是企业级 SaaS：
- 不要微服务，不要重型权限系统（admin + member 已足够）
- 不要为"将来可能需要"做推测性设计
- 先交付完整的功能闭环，再做优化
- 如果某个功能不能帮助 4 人团队一起管理体重，就不在 MVP 范围内

## Agent skills

### Issue tracker

GitHub Issues on `hfwang0318/miniapp-fit-planner`. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: CONTEXT.md + docs/adr/ at repo root. See `docs/agents/domain.md`.
