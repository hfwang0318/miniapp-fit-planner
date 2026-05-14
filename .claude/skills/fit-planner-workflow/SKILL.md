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

**核心原则**：未经架构审批不得改代码。未经测试签认不得合并。代码不合格必须打回重改。文档与代码不得偏离。**每步开始前必须加载对应技能。**

## Agent 角色

你（主对话）担任 **Orchestrator**。其余三个角色通过 `Agent` 工具调度。

| Agent | 职责 | 调度文件 | 参与步骤 |
|-------|------|----------|----------|
| Orchestrator | 项目管理、需求分析、Git、收尾 | `references/agents/orchestrator.md` | 1, 6 |
| Architect | 架构设计、代码审查 | `references/agents/architect.md` | 2, 4 |
| Developer | 功能实现、bug 修复 | `references/agents/developer.md` | 3 |
| Tester | 测试设计、运行时质量验证 | `references/agents/tester.md` | 5 |

调度时，在提示词中包含：`请先阅读 references/agents/<角色>.md 了解你的完整职责。开始工作前使用 Skill 工具加载你文件中列出的强制技能。`

## 技能加载规则

**Orchestrator 必须**在进入每个步骤前，先使用 Skill 工具加载对应 agent 文件中"强制加载的技能"表所列的技能。加载后才能开始执行该步骤或调度 agent。

## 标准执行流程

每个功能或 bug 修复遵循以下流程。步骤 3-4-5 构成**迭代循环**，不合格即打回重改。

```
步骤 1：需求分析 (Orchestrator) — 加载 brainstorming + writing-plans
  ↓
步骤 2：架构设计 (Architect)
  ↓
步骤 3：代码实现 (Developer)  ←────────┐
  ↓                                    │
步骤 4：架构审查 (Architect)            │
  ├─ APPROVED → 继续                   │
  └─ CHANGES REQUESTED / BLOCKED ──────┘
  ↓
步骤 5：测试验证 (Tester)               │
  ├─ PASS → 继续                        │
  └─ FAIL / BLOCKED ───────────────────┘
  ↓
步骤 6：收尾合并 (Orchestrator) — 加载 finishing-a-development-branch
```

### 第 1 步 — Orchestrator：需求分析

加载 `superpowers:brainstorming` + `superpowers:writing-plans`。澄清用户意图 → 判断合理性和范围 → 拆分可执行任务 → 更新 `docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`。

**输出**：`docs/agent-outputs/cycle-{N}/step-1-orchestrator.md`，记录在 `docs/cycle-log.md`。

### 第 2 步 — Architect：设计

调度 Architect 评估架构影响。如影响架构，更新架构文档。输出实现约束。

**输出**：`docs/agent-outputs/cycle-{N}/step-2-architect-design.md`。

### 步骤 3-4-5：实现 → 审查 → 测试（迭代循环）

每次被打回，版本号递增。文件命名：`docs/agent-outputs/cycle-{N}/step-{S}-{角色}-v{迭代}.md`。

**迭代上限**：连续打回超过 3 次，Orchestrator 介入评估。

#### 第 3 步 — Developer：实现

在 `feature/<名称>` 或 `fix/<名称>` 分支实现。首次加载 `superpowers:test-driven-development`。打回重交时加载 `superpowers:receiving-code-review`。遇到 bug 加载 `superpowers:systematic-debugging`。提交前加载 `superpowers:verification-before-completion`。

**闸门**：不得擅自改变架构。

#### 第 4 步 — Architect：代码审查

审查 diff，按 6 项检查逐一评估（设计时加载 `superpowers:writing-plans`，审查时加载 `simplify`）。

**闸门**：APPROVED → 进入第 5 步。CHANGES REQUESTED / BLOCKED → 打回第 3 步。

#### 第 5 步 — Tester：运行时验证

**Tester 必须执行实际运行时验证，不得仅做静态代码分析。** 必须运行验证命令、检查实际输出。加载 `superpowers:verification-before-completion`。设计测试用例、执行功能/回归/边界测试、记录 bug。更新 `docs/test-plan.md`。

**闸门**：PASS / PASS WITH WARNINGS → 进入第 6 步。FAIL / BLOCKED → 打回第 3 步。

### 第 6 步 — Orchestrator：收尾

加载 `superpowers:finishing-a-development-branch`。审阅所有输出 → 更新文档 → 验证 Git 状态 → 生成提交信息 → 合并到 `main`。

## Agent 信息传递协议

### 传递链

```
Orchestrator (step-1) → Architect 设计 (step-2)
  ↓
Developer → Architect 审查 → Tester（可打回迭代）
  ↓
Orchestrator 收尾 (step-6)
```

### 输出目录结构

```
docs/agent-outputs/
├── cycle-1/
│   ├── step-1-orchestrator.md
│   ├── step-3-developer-v1.md
│   └── ...
├── cycle-2/
│   └── ...
```

每 cycle 一个子目录。命名：`cycle-{N}/step-{S}-{角色}-v{V}.md`。

### 周期日志

```markdown
## 周期 N — [功能名称] — YYYY-MM-DD HH:MM
<!-- 时间通过 git log -1 --format="%ad" --date=format:"%Y-%m-%d %H:%M" 获取，禁止编造 -->

| 步骤 | 版本 | Agent | 结论 | 输出文件 |
|------|------|-------|------|----------|
| 1 | — | Orchestrator | 通过 | [文件] |
| 3 | v1 | Developer | 完成 | [文件] |
| 4 | v1 | Architect | APPROVED | [文件] |
| 5 | v1 | Tester | PASS | [文件] |
| 6 | — | Orchestrator | DONE | [文件] |

**提交**：`<commit-hash>` — `<信息>`
```

### 调度规则

1. **调度前**：确定版本号，告知 agent 输出文件路径
2. **提示词中**：含 agent 职责文件、输出路径、强制技能加载指令
3. **打回时**：附加上一轮审查/测试报告路径和问题清单
4. **接收后**：读取输出文件，更新 cycle-log.md
5. **时间戳**：记录时间必须通过 `git log` 或 `date "+%Y-%m-%d %H:%M"` 获取，**禁止编造或估算**

## Git 工作流

- `main` 稳定可部署；功能分支 `feature/<名称>`；bug 分支 `fix/<名称>`
- 提交格式：`type: 描述`（feat, fix, docs, refactor, test, chore）
- 测试或架构审查未通过时不得合并

## 质量门禁

合并前全部通过（详见 `references/quality-gates.md`）：

| 门禁 | 负责人 |
|------|--------|
| 需求完成 | Orchestrator |
| 架构审批 | Architect |
| 测试通过（含运行时验证） | Tester |
| 文档更新 + 可追溯 | Orchestrator |
| Git diff 干净 | Orchestrator |
| 隐私/数据安全 | Architect + Tester |
| 无回归 | Tester |
| 无过度设计 | Architect |
| 异常路径已处理 | Tester |
| 小程序兼容 | Tester |
| 所有迭代记录完整 | Orchestrator |
| 每步强制技能已加载 | Orchestrator |
| 时间戳通过命令获取非编造 | Orchestrator |

## 文档同步协议

agent 执行前**必须**阅读相关文档，执行后**必须**更新：

- `docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`
- `docs/architecture.md`、`docs/data-model.md`、`docs/api-contract.md`
- `docs/test-plan.md`、`docs/decisions.md`
- `docs/changelog.md`、`docs/git-workflow.md`、`docs/cycle-log.md`
- `README.md`

## 参考文件

| 文件 | 用途 |
|------|------|
| `references/agents/orchestrator.md` | Orchestrator 完整职责 |
| `references/agents/architect.md` | Architect 完整职责 + 提示模板 |
| `references/agents/developer.md` | Developer 完整职责 + 提示模板 |
| `references/agents/tester.md` | Tester 完整职责 + 提示模板 |
| `references/workflow-templates.md` | 全部模板 |
| `references/quality-gates.md` | 质量门禁清单 |
| `references/architecture-constraints.md` | 架构约束、MVP、隐私规则 |
| `references/init-checklist.md` | 初始化流程 |

## 初始化

首次调用时执行 `references/init-checklist.md` 中的初始化流程。
