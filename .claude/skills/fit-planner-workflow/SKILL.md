---
name: fit-planner-workflow
description: >
  Fit Planner 微信小程序（协作体重管理）的多 agent 开发工作流。
  触发条件：用户提到开发功能、修复 bug、规划架构、运行测试、初始化项目，或任何与构建 fit-planner 小程序相关的任务。
  该技能编排 5 个 agent（Orchestrator、Architect、Developer、Reviewer、Tester）的协作，包含严格的质量门禁、文档同步和 Git 规范。
  当用户在 fit-planner 项目中构建、修改或规划时，即使未明确提到技能名称，也应使用此技能。
---

# Fit Planner 多 Agent 开发工作流

## 概述

为 fit-planner 微信小程序（面向约 4 人小团队的协作体重管理应用）定义的严格多 agent 开发工作流。

**核心原则**：未经架构审批不得设计。未经代码审查不得合并。未经测试签认不得合并。代码不合格必须打回重改。文档与代码不得偏离。每步开始前必须加载对应技能。

## Agent 角色

你（主对话）担任 **Orchestrator**。其余四个角色通过 `Agent` 工具调度。

| Agent | 职责 | 调度文件 | 参与步骤 |
|-------|------|----------|----------|
| Orchestrator | 项目管理、需求分析、Git、收尾 | `references/agents/orchestrator.md` | 1, 6 |
| Architect | 架构设计（只设计不审查） | `references/agents/architect.md` | 2 |
| Developer | 功能实现、bug 修复 | `references/agents/developer.md` | 3 |
| Reviewer | 独立代码审查（代码质量+架构合规） | `references/agents/reviewer.md` | 4 |
| Tester | 测试设计、运行时质量验证 | `references/agents/tester.md` | 5 |

调度时在提示词中包含：`请先阅读 references/agents/<角色>.md 了解你的完整职责。开始工作前使用 Skill 工具加载你文件中列出的强制技能。`

## 技能加载规则

**Orchestrator 必须**在进入每个步骤前，先使用 Skill 工具加载对应 agent 文件中"强制加载的技能"表所列的技能。加载后才能开始执行该步骤或调度 agent。

## 标准执行流程

每个功能或 bug 修复遵循以下流程。步骤 3-4-5 构成**迭代循环**，不合格即打回重改。

```
步骤 1：需求分析 (Orchestrator) — 加载 brainstorming + writing-plans
  ↓
步骤 2：架构设计 (Architect) — 加载 writing-plans（无架构变更可跳过）
  ↓
步骤 3：代码实现 (Developer)  ←────────────────┐
  ↓                                              │
步骤 4：代码审查 (Reviewer) — 加载 simplify     │
  ├─ APPROVED → 步骤 5                          │
  └─ CHANGES / BLOCKED → 打回步骤 3 ────────────┘
  ↓
步骤 5：测试验证 (Tester)  — 加载 verification  │
  ├─ PASS → 步骤 6                              │
  └─ FAIL / BLOCKED → 打回步骤 3 ───────────────┘
  ↓
步骤 6：收尾合并 (Orchestrator) — 加载 finishing-a-development-branch
```

### 步骤 1 — Orchestrator：需求分析

加载 `superpowers:brainstorming` + `superpowers:writing-plans`。澄清用户意图 → 判断合理性和范围 → 拆分可执行任务 → 更新 `docs/requirements.md`、`docs/task-board.md`。输出按 orchestrator.md 中的模板。

### 步骤 2 — Architect：架构设计

调度 Architect 评估架构影响。如影响架构，更新架构文档并输出实现约束清单。**无架构影响的修复可跳过此步骤**（由 Orchestrator 在步骤 1 判断）。输出按 architect.md 中的模板。

### 步骤 3 — Developer：代码实现

在 `feature/<名称>` 或 `fix/<名称>` 分支实现。首次加载 `superpowers:test-driven-development`；打回重交时加载 `superpowers:receiving-code-review`；遇到 bug 加载 `superpowers:systematic-debugging`；提交报告前加载 `superpowers:verification-before-completion`。输出按 developer.md 中的模板。

**闸门**：不得擅自改变架构。需变更时通过 Orchestrator 提交架构变更申请。

### 步骤 4 — Reviewer：代码审查

调度 Reviewer 独立审查代码质量和架构合规。加载 `simplify`。按 7 项清单逐项评估。输出按 reviewer.md 中的模板。

**闸门**：APPROVED → 步骤 5。CHANGES REQUESTED / BLOCKED → 打回步骤 3。

### 步骤 5 — Tester：运行时验证

调度 Tester 执行实际运行时验证（**不得仅做静态代码分析**）。加载 `superpowers:verification-before-completion`。按 7 步功能测试流程或 5 步 Bug 测试流程执行。输出按 tester.md 中的模板。

**闸门**：PASS / PASS WITH WARNINGS → 步骤 6。FAIL / BLOCKED → 打回步骤 3。

### 步骤 6 — Orchestrator：收尾

加载 `superpowers:finishing-a-development-branch`。审阅所有输出 → 更新 `docs/changelog.md` → 验证 Git 状态（详见 `references/quality-gates.md`）→ 生成提交信息 → 合并到 `main` / 推送 PR。

**PR 创建后必须清理本地分支**：
1. `git checkout main` 切回主分支
2. `git branch -d feature/<名称>` 删除本地开发分支（PR 已推送远端，本地不再需要）
3. 如果 feature 分支未合并（有 PR 但未 merge），使用 `git branch -D` 强制删除

输出按 orchestrator.md 中的模板。

## 调度规则

1. 调度前确定版本号，告知 agent 输出文件路径
2. 提示词中要求 agent 先读职责文件、加载强制技能
3. 打回时直接转发审查/测试报告（报告本身已包含完整问题清单和修复建议，Orchestrator 只做转发和跟踪，无需提取和重新格式化）
4. 接收输出后读取确认，更新 changelog.md

## 迭代管理

每次打回版本号递增。文件命名：`docs/agent-outputs/cycle-{N}/step-{S}-{角色}-v{V}.md`。

审查和测试报告是**自包含**的——Developer 直接阅读报告即可开始修复，不依赖 Orchestrator 的中间解读。连续打回超过 3 次，Orchestrator 介入评估是否需重新设计或缩小范围。

## 质量门禁

合并前所有门禁必须通过。详见 `references/quality-gates.md`。

## 文档同步

每步完成后相关 agent 更新其维护的文档。文档归属和更新方式见各 agent 文件中的"维护文档"表。

## 输出目录

```
docs/agent-outputs/
├── cycle-N/          ← 最近 3 个 cycle 保留
├── cycle-N-1/
├── cycle-N-2/
└── archive/          ← 更早的 cycle 移入
```

## 参考文件

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `references/agents/orchestrator.md` | Orchestrator 完整职责 | 始终（主对话） |
| `references/agents/architect.md` | Architect 完整职责 | 步骤 2 调度时 |
| `references/agents/developer.md` | Developer 完整职责 | 步骤 3 调度时 |
| `references/agents/reviewer.md` | Reviewer 完整职责 | 步骤 4 调度时 |
| `references/agents/tester.md` | Tester 完整职责 | 步骤 5 调度时 |
| `references/quality-gates.md` | 质量门禁清单 | 步骤 6 合并前 |
| `references/architecture-constraints.md` | 架构约束、MVP、隐私规则 | 步骤 2、3、4 |
| `references/testing-guide.md` | 测试工具链和方法 | 步骤 5 |
| `references/init-checklist.md` | 初始化流程 | 首次调用时 |

## 初始化

首次调用时执行 `references/init-checklist.md` 中的初始化流程。
