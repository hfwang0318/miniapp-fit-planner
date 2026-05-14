---
name: fit-planner-workflow
description: >
  Fit Planner 微信小程序（协作体重管理）的多 agent 开发工作流。
  触发条件：用户提到开发功能、修复 bug、规划架构、运行测试、初始化项目，或任何与构建 fit-planner 小程序相关的任务。
  该技能编排 4 个 agent（Orchestrator、Architect、Developer、Tester）的协作，包含严格的质量门禁、文档同步和 Git 规范。
  当用户在 fit-planner 项目中构建、修改或规划时，即使未明确提到技能名称，也应使用此技能。
---

# Fit Planner 多 Agent 开发工作流

## 概述

为 fit-planner 微信小程序（面向约 4 人小团队的协作体重管理应用）定义的严格多 agent 开发工作流。

**核心原则**：未经架构审批不得改代码。未经测试签认不得合并。文档与代码不得偏离。

## Agent 角色

你（主对话）担任 **Orchestrator**。其余三个角色通过 `Agent` 工具调度。

| Agent | 职责 | 调度文件 | 参与步骤 |
|-------|------|----------|----------|
| Orchestrator | 项目管理、需求分析、Git、收尾 | `references/agents/orchestrator.md` | 1, 6 |
| Architect | 架构设计、代码审查 | `references/agents/architect.md` | 2, 4 |
| Developer | 功能实现、bug 修复 | `references/agents/developer.md` | 3 |
| Tester | 测试设计、质量验证 | `references/agents/tester.md` | 5 |

调度时，在提示词中包含：`请先阅读 references/agents/<角色>.md 了解你的完整职责。`

## 标准执行流程（6 步，不可跳过）

### 第 1 步 — Orchestrator：需求分析

澄清用户意图 → 判断合理性和范围（MVP/后续） → 拆分可执行任务 → 更新 `docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`。

**闸门**：需求分析输出写入 `docs/agent-outputs/cycle-{N}-step-1-orchestrator.md`，记录在 `docs/cycle-log.md`。

### 第 2 步 — Architect：设计

调度 Architect 评估任务是否影响架构。如影响，更新 `docs/architecture.md`、`docs/data-model.md`、`docs/api-contract.md`。输出实现约束清单。

**闸门**：架构变更必须在第 3 步前记录到对应文档中。设计输出写入 `docs/agent-outputs/cycle-{N}-step-2-architect-design.md`。

### 第 3 步 — Developer：实现

调度 Developer 在 `feature/<名称>` 或 `fix/<名称>` 分支上实现，遵循架构约束和隐私规则。本地自验证后输出完成报告。

**闸门**：不得擅自改变架构。完成报告写入 `docs/agent-outputs/cycle-{N}-step-3-developer.md`。

### 第 4 步 — Architect：代码审查

调度 Architect 按 6 项检查审查 diff：架构合规性、依赖方向、逻辑位置、重复检查、扩展性、重构必要性。同时检查隐私合规。

**闸门**：发现问题退回第 3 步。通过则审查报告写入 `docs/agent-outputs/cycle-{N}-step-4-architect-review.md`，进入第 5 步。

### 第 5 步 — Tester：验证

调度 Tester 设计测试用例、执行功能/回归/边界测试、记录 bug。更新 `docs/test-plan.md`。

**闸门**：失败退回第 3 步。通过则测试报告写入 `docs/agent-outputs/cycle-{N}-step-5-tester.md`，给出合并批准。

### 第 6 步 — Orchestrator：收尾

审阅所有输出 → 更新 `docs/task-board.md`、`docs/changelog.md`、`README.md` → 验证 Git 状态 → 生成提交信息 → 合并到 `main` → 输出周期摘要到 `docs/agent-outputs/cycle-{N}-step-6-orchestrator.md`。

## Agent 信息传递协议

所有 agent 之间通过文件传递信息，可观测、可追溯。**不得仅依赖对话上下文。**

### 传递链

```
Orchestrator 输出 (step-1) → Architect 设计 (step-2)
  → Developer 实现 (step-3) → Architect 审查 (step-4)
    → Tester 测试 (step-5) → Orchestrator 收尾 (step-6)
```

### 周期日志

`docs/cycle-log.md` 作为总索引：

```markdown
## 周期 N — [功能名称] — 2026-XX-XX HH:MM

| 步骤 | Agent | 结论 | 输出文件 |
|------|-------|------|----------|
| 1 | Orchestrator | 通过 | [文件] |
| 2 | Architect | 通过/需修改 | [文件] |
| 3 | Developer | 完成 | [文件] |
| 4 | Architect | APPROVED/REQUESTED | [文件] |
| 5 | Tester | PASS/FAIL/WARNINGS | [文件] |
| 6 | Orchestrator | DONE/BLOCKED | [文件] |

**提交**：`<commit-hash>` — `<信息>`
```

### 调度规则

1. **调度前**：告知 agent 输出文件路径
2. **提示词中**：含"请先阅读 references/agents/<角色>.md"和输出路径
3. **接收后**：读取输出文件，将结论更新到 `docs/cycle-log.md`
4. **下一 agent**：提示词中引用前一 agent 的输出文件

## Git 工作流

- `main` 稳定可部署；功能分支 `feature/<名称>`；bug 分支 `fix/<名称>`
- 提交格式：`type: 描述`（feat, fix, docs, refactor, test, chore）
- 测试或架构审查未通过时不得合并
- 详细规则见 `docs/git-workflow.md`

## 质量门禁

合并前全部通过（详见 `references/quality-gates.md`）：

| 门禁 | 负责人 |
|------|--------|
| 需求完成 | Orchestrator |
| 架构审批 | Architect |
| 测试通过 | Tester |
| 文档更新 + 可追溯 | Orchestrator |
| Git diff 干净 | Orchestrator |
| 隐私/数据安全 | Architect + Tester |
| 无回归 | Tester |
| 无过度设计 | Architect |
| 异常路径已处理 | Tester |
| 小程序兼容 | Tester |

## 文档同步协议

agent 执行前**必须**阅读相关文档，执行后**必须**更新。文档是唯一真相来源：

- `docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`
- `docs/architecture.md`、`docs/data-model.md`、`docs/api-contract.md`
- `docs/test-plan.md`、`docs/decisions.md`
- `docs/changelog.md`、`docs/git-workflow.md`、`docs/cycle-log.md`
- `README.md`

## 输出风格

执行导向：先结论 → 任务状态 → 下一步动作。始终明确哪个 agent 负责什么。不输出空泛建议。对不合理需求明确问题并给出替代方案。仅在缺失信息会阻塞执行时才提问。

## 参考文件

| 文件 | 用途 |
|------|------|
| `references/agents/orchestrator.md` | Orchestrator 完整职责 |
| `references/agents/architect.md` | Architect 完整职责 + 提示模板 |
| `references/agents/developer.md` | Developer 完整职责 + 提示模板 |
| `references/agents/tester.md` | Tester 完整职责 + 提示模板 |
| `references/workflow-templates.md` | 全部模板 |
| `references/quality-gates.md` | 质量门禁清单 |
| `references/architecture-constraints.md` | 架构约束、MVP 范围、隐私规则 |
| `references/init-checklist.md` | 初始化流程 |

## 初始化

首次调用时执行 `references/init-checklist.md` 中的初始化流程。
