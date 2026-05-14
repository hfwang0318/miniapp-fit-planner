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

**核心原则**：未经架构审批不得改代码。未经测试签认不得合并。代码不合格必须打回重改。文档与代码不得偏离。

## Agent 角色

你（主对话）担任 **Orchestrator**。其余三个角色通过 `Agent` 工具调度。

| Agent | 职责 | 调度文件 | 参与步骤 |
|-------|------|----------|----------|
| Orchestrator | 项目管理、需求分析、Git、收尾 | `references/agents/orchestrator.md` | 1, 6 |
| Architect | 架构设计、代码审查 | `references/agents/architect.md` | 2, 4 |
| Developer | 功能实现、bug 修复 | `references/agents/developer.md` | 3 |
| Tester | 测试设计、质量验证 | `references/agents/tester.md` | 5 |

调度时，在提示词中包含：`请先阅读 references/agents/<角色>.md 了解你的完整职责。`

每个 agent 文件中定义了"推荐加载的技能"表，agent 开始工作前应先加载对应技能。

## 标准执行流程

每个功能或 bug 修复遵循以下流程。步骤 3-4-5 构成**迭代循环**，不合格即打回重改。

```
步骤 1：需求分析 (Orchestrator)
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
步骤 6：收尾合并 (Orchestrator)
```

### 第 1 步 — Orchestrator：需求分析

澄清用户意图 → 判断合理性和范围（MVP/后续） → 拆分可执行任务 → 更新 `docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`。

**输出**：`docs/agent-outputs/cycle-{N}-step-1-orchestrator.md`，记录在 `docs/cycle-log.md`。

### 第 2 步 — Architect：设计

调度 Architect 评估任务是否影响架构。如影响，更新架构文档。输出实现约束清单。

**输出**：`docs/agent-outputs/cycle-{N}-step-2-architect-design.md`。

### 步骤 3-4-5：实现 → 审查 → 测试（迭代循环）

这是工作流核心。Developer、Architect、Tester 之间通过迭代循环确保代码质量。每次被打回重改后，Developer 必须修复所有标注问题，递增迭代版本号重新提交。

**文件命名**：每次迭代版本号递增：
- 首次：`cycle-{N}-step-3-developer-v1.md`
- 首次打回后重交：`cycle-{N}-step-3-developer-v2.md`
- 以此类推

**迭代上限**：连续打回超过 3 次时，Orchestrator 必须介入评估是否需要重新设计或缩小任务范围。

#### 第 3 步 — Developer：实现

调度 Developer 在 `feature/<名称>` 或 `fix/<名称>` 分支上实现。

首次调度提示词需包含：
- 任务描述 + 第 2 步的实现约束
- 输出路径：`docs/agent-outputs/cycle-{N}-step-3-developer-v1.md`

重新调度（打回后）提示词需额外包含：
- 上一轮 Architect/Tester 的审查结果文件路径
- 本次迭代需要修复的问题清单
- 输出路径：`docs/agent-outputs/cycle-{N}-step-3-developer-v{新版本号}.md`

**闸门**：不得擅自改变架构。完成报告必须列出本次修改文件及与上一版本的差异。

#### 第 4 步 — Architect：代码审查

调度 Architect 审查 Developer 的实现，按 6 项检查逐一评估。必须阅读当前迭代的 Developer 报告和（如有）上一轮审查记录。

**闸门**：
- **APPROVED**：审查通过，输出写入 `docs/agent-outputs/cycle-{N}-step-4-architect-review-v{版本号}.md`，进入第 5 步。
- **CHANGES REQUESTED**：存在问题但可修复。输出写入文件，明确列出需修复项和文件行号。Orchestrator 调度 Developer 重新执行第 3 步（版本号 +1）。
- **BLOCKED**：存在严重架构违规。输出写入文件，详细说明问题。Orchestrator 必须介入决策：是否需要架构重新设计（回到第 2 步），还是缩小范围。

#### 第 5 步 — Tester：验证

调度 Tester 执行测试。必须阅读当前迭代的 Developer 报告和 Architect 审查结论。

**闸门**：
- **PASS / PASS WITH WARNINGS**：通过。输出写入 `docs/agent-outputs/cycle-{N}-step-5-tester-v{版本号}.md`。如有 P2 级别 bug 记录在 test-plan.md 作为后续任务。进入第 6 步。
- **FAIL**：存在 P0/P1 级别 bug。输出写入文件，明确列出所有未通过的测试用例和 bug 详情。Orchestrator 调度 Developer 重新执行第 3 步（版本号 +1）。
- **BLOCKED**：测试发现严重隐私或数据安全问题。立即通知 Orchestrator，不得继续。

### 第 6 步 — Orchestrator：收尾

确认步骤 4 和 5 均通过后：
审阅所有输出版本 → 更新 `docs/task-board.md`、`docs/changelog.md` → 验证 Git 状态 → 生成提交信息 → 合并到 `main` → 输出周期摘要到 `docs/agent-outputs/cycle-{N}-step-6-orchestrator.md`。

周期摘要中必须列出所有迭代记录。

## Agent 信息传递协议

### 传递链（含迭代）

```
Orchestrator (step-1) → Architect 设计 (step-2)
  ↓
Developer v1 (step-3) → Architect 审查 (step-4)
  ├─ APPROVED → Tester (step-5)
  │   ├─ PASS → Orchestrator (step-6)
  │   └─ FAIL → Developer v2 → (重复 step-3-4-5)
  └─ CHANGES REQUESTED → Developer v2 → (重复 step-3-4-5)
```

### 输出文件命名

```
docs/agent-outputs/cycle-{N}-step-{S}-{角色}-v{迭代}.md
```

- 步骤 1、2、6：固定为 v1（不涉及代码迭代）
- 步骤 3、4、5：每次打回版本号 +1

### 周期日志格式

```markdown
## 周期 N — [功能名称] — 2026-XX-XX HH:MM

| 步骤 | 版本 | Agent | 结论 | 输出文件 |
|------|------|-------|------|----------|
| 1 | — | Orchestrator | 通过 | [文件] |
| 2 | — | Architect | 通过 | [文件] |
| 3 | v1 | Developer | 完成 | [文件] |
| 4 | v1 | Architect | CHANGES REQUESTED | [文件] |
| 3 | v2 | Developer | 完成 | [文件] |
| 4 | v2 | Architect | APPROVED | [文件] |
| 5 | v2 | Tester | PASS | [文件] |
| 6 | — | Orchestrator | DONE | [文件] |

**迭代次数**：2 轮
**提交**：`<commit-hash>` — `<信息>`
```

### 调度规则

1. **调度前**：确定当前迭代版本号，告知 agent 输出文件路径
2. **提示词中**：含"请先阅读 references/agents/<角色>.md"、前一 agent 的输出文件、输出路径
3. **打回时**：提示词中必须包含上一轮的完整审查/测试报告文件路径和问题清单
4. **接收后**：读取输出文件，将结论和版本号更新到 `docs/cycle-log.md`
5. **连续打回超过 3 次**：Orchestrator 必须暂停，评估是否需要重新设计或缩小范围

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
| 架构审批（最终版本） | Architect |
| 测试通过（最终版本） | Tester |
| 文档更新 + 可追溯 | Orchestrator |
| Git diff 干净 | Orchestrator |
| 隐私/数据安全 | Architect + Tester |
| 无回归 | Tester |
| 无过度设计 | Architect |
| 异常路径已处理 | Tester |
| 小程序兼容 | Tester |
| 所有迭代记录完整 | Orchestrator |

## 文档同步协议

agent 执行前**必须**阅读相关文档，执行后**必须**更新：

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
