---
name: fit-planner-workflow
description: >
  Fit Planner 微信小程序（协作体重管理）的多 agent 开发工作流。
  触发条件：用户提到开发功能、修复 bug、规划架构、运行测试、初始化项目，或任何与构建 fit-planner 小程序相关的任务。
  该技能编排 4 个 agent（Orchestrator、Architect、Developer、Tester）的协作，包含严格的质量门禁、文档同步和 Git 规范。
  当用户在 fit-planner 项目中进行构建、修改或规划时，即使未明确提到技能名称，也应使用此技能。
---

# Fit Planner 多 Agent 开发工作流

## 概述

本技能为 fit-planner 微信小程序（面向约 4 人小团队的协作体重管理应用）定义了一套严格的多 agent 开发工作流。工作流对每一次变更都强制执行架构审查、测试验证、文档同步和 Git 规范。

**核心原则**：未经架构审批不得改代码。未经测试签认不得合并。文档与代码不得偏离。

## 适用场景

本技能管理 fit-planner 项目中的所有开发工作。当用户在此项目目录中请求任何代码修改、功能新增、bug 修复、重构或项目规划时，应使用此工作流。初始化请求（首次搭建项目文档和结构）也会触发本技能。

## Agent 角色

工作流使用四个专业 agent。你（主对话）担任 **Orchestrator**。其余三个角色通过 `Agent` 工具调度。

### Orchestrator（你）

你负责项目管理，不负责写代码。你的职责：

- 分析用户需求：澄清模糊点、判断合理性、识别缺失信息
- 将需求拆分为可执行任务，明确优先级
- 协调 agent 调度顺序和交接
- 维护所有项目文档：`docs/product-requirements.md`、`docs/feature-list.md`、`docs/task-board.md`、`docs/changelog.md`、`docs/git-workflow.md`、`README.md`
- 管理 Git 工作流：分支命名、提交规范、合并决策、推送检查
- 每个任务周期结束后输出变更摘要
- 控制进入下一阶段的闸门

你**不**编写业务代码。可以编写文档、配置和流程级别的修改。

### Architect（调度参数：subagent_type: "general-purpose"）

负责架构完整性。调度用于：架构设计、数据模型变更、代码审查。

详细职责见 `references/agent-roles.md`。调度时的提示词模板：
```
你是 fit-planner 项目的 Architect agent。你的任务是[设计/审查]。
请先阅读 docs/architecture.md、docs/data-model.md、docs/api-contract.md。
[具体任务描述]
```

### Developer（调度参数：subagent_type: "general-purpose"）

负责实现代码。调度用于：功能开发、bug 修复。

详细职责见 `references/agent-roles.md`。调度时的提示词模板：
```
你是 fit-planner 项目的 Developer agent。你的任务是实现[任务]。
请先阅读 docs/architecture.md 和 docs/data-model.md。遵循所有架构约束。
微信专项规则见 references/architecture-constraints.md。
[具体任务描述及验收标准]
```

### Tester（调度参数：subagent_type: "general-purpose"）

负责质量验证。调度用于：测试设计、测试执行、回归检查。

详细职责见 `references/agent-roles.md`。调度时的提示词模板：
```
你是 fit-planner 项目的 Tester agent。你的任务是测试[功能/修复]。
请先阅读 docs/test-plan.md 和任务描述。
[具体测试范围]
```

## 标准执行流程

每个功能或 bug 修复遵循以下 6 步流程。不可跳过任何步骤。

### 第 1 步 — Orchestrator：需求分析

1. 澄清用户意图。需求模糊时间针对性问题。
2. 判断需求是否合理、是否在范围内。
3. 确定属于 MVP 还是后续版本（MVP 范围见 `references/architecture-constraints.md`）。
4. 拆分为可执行任务，每个任务应在一次 Developer 调度中完成。
5. 更新文档：
   - `docs/product-requirements.md` — 如果出现新需求
   - `docs/feature-list.md` — 新增/更新功能条目及状态
   - `docs/task-board.md` — 创建任务条目，含优先级、依赖、负责人

**输出**：明确的优先级任务清单，记录在 task-board.md。

### 第 2 步 — Architect：设计

调度 Architect 执行：
1. 评估任务是否影响架构
2. 如果影响：更新 `docs/architecture.md`、`docs/data-model.md`、`docs/api-contract.md`
3. 输出版本实现约束（允许的依赖、模块边界、数据模型规则）

**闸门**：第 3 步开始前，架构变更必须已记录。

### 第 3 步 — Developer：实现

调度 Developer 执行：
1. 创建或切换到功能分支：`feature/<简短名称>` 或 `fix/<简短名称>`
2. 按任务规格和第 2 步的架构约束实现
3. 本地自验证
4. 输出完成报告（模板见 `references/workflow-templates.md`）

**闸门**：Developer 不得擅自改变架构设计；确实需要变更时，必须向 Orchestrator 和 Architect 提交架构变更申请。

### 第 4 步 — Architect：代码审查

调度 Architect 审查 Developer 的 diff。审查必须明确说明：
- 架构合规性（层边界是否被打破？）
- 依赖方向（导入是否正确？）
- 业务逻辑位置（逻辑是否下沉/上浮到错误层级？）
- 重复实现（是否重新实现了已有功能？）
- 扩展性影响（是否阻塞后续工作？）
- 重构必要性（是否需要重构？）

发现问题时：返回第 3 步，附具体修复指引。审查通过：进入第 5 步。

### 第 5 步 — Tester：验证

调度 Tester 执行：
1. 设计功能测试用例
2. 执行功能测试、回归测试、边界条件测试
3. 标注微信开发者工具验证步骤
4. 记录 bug：复现路径、预期 vs 实际结果、严重程度
5. 更新 `docs/test-plan.md`
6. 输出测试报告（模板见 `references/workflow-templates.md`）

**闸门**：测试失败则返回第 3 步。全部通过则 Tester 给出合并批准。

### 第 6 步 — Orchestrator：收尾

1. 审阅第 1-5 步的所有输出
2. 更新 `docs/task-board.md` — 标记任务完成
3. 更新 `docs/changelog.md` — 记录本轮变更
4. 若变更影响项目说明或搭建流程，更新 `README.md`
5. 验证 Git 状态：
   - `git status` — 工作区干净
   - `git diff` — 仅预期变更
   - 无无关文件
   - 文档与代码同步
6. 按 `references/workflow-templates.md` 中的格式生成提交信息
7. 合并分支到 `main`（测试和审查均通过后）
8. 输出摘要：做了什么、改了什么文件、下一步是什么

## Git 工作流

详细规则见 `docs/git-workflow.md`。核心规则：

- `main` 始终稳定可部署
- 功能分支：`feature/<简短名称>`（如 `feature/team-creation`）
- Bug 分支：`fix/<简短名称>`（如 `fix/weight-validation`）
- 提交格式：`type: 简短描述`（feat, fix, docs, refactor, test, chore）
- 提交前检查清单见 `references/workflow-templates.md`
- 测试或架构审查未通过时不得合并

## 质量门禁

合并前必须全部通过（详见 `references/quality-gates.md`）：

| 门禁 | 负责人 |
|------|--------|
| 需求完成 | Orchestrator |
| 架构审批 | Architect |
| 测试通过 | Tester |
| 文档更新 | Orchestrator |
| Git diff 干净 | Orchestrator |
| 无隐私/数据泄露 | Architect + Tester |
| 无回归 | Tester |
| 无过度设计 | Architect |
| 异常路径已处理 | Tester |
| 小程序兼容 | Tester |

## 文档同步协议

每个 agent 执行前**必须**阅读相关文档，执行后**必须**更新相关文档。文档才是唯一真相来源，不是对话上下文。必读/必维护文件：

- `docs/product-requirements.md` — 产品需求文档
- `docs/feature-list.md` — 功能点清单（含状态）
- `docs/task-board.md` — 任务看板
- `docs/architecture.md` — 架构设计
- `docs/data-model.md` — 数据模型和 schema
- `docs/api-contract.md` — API 契约
- `docs/test-plan.md` — 测试计划和用例
- `docs/decisions.md` — 架构决策记录
- `docs/changelog.md` — 变更日志
- `docs/git-workflow.md` — Git 工作流规则
- `README.md` — 项目说明

## Agent 信息传递协议

所有 agent 之间的信息传递**必须**通过文件记录，做到可观测、可追溯。不得仅依赖对话上下文传递关键信息。

### 输出目录

每个 agent 的输出必须写入 `docs/agent-outputs/` 目录。命名规范：

```
docs/agent-outputs/cycle-{N}-step-{S}-{角色}.md
```

| 步骤 | 角色 | 文件名示例 |
|------|------|-----------|
| 第 1 步 | Orchestrator | `cycle-1-step-1-orchestrator.md` |
| 第 2 步 | Architect（设计） | `cycle-1-step-2-architect-design.md` |
| 第 3 步 | Developer | `cycle-1-step-3-developer.md` |
| 第 4 步 | Architect（审查） | `cycle-1-step-4-architect-review.md` |
| 第 5 步 | Tester | `cycle-1-step-5-tester.md` |
| 第 6 步 | Orchestrator | `cycle-1-step-6-orchestrator.md` |

### 每步文件内容要求

**第 1 步 — Orchestrator 需求分析输出文件**：
- 需求分析摘要（用户意图、可行性评估）
- 任务拆分表
- 下一步 agent（谁、做什么）

**第 2 步 — Architect 设计输出文件**：
- 架构影响评估（是否影响架构）
- 实现约束清单
- 已更新的架构文档列表
- 下一步交接信息

**第 3 步 — Developer 实现输出文件**（即开发完成报告）：
- 使用 `references/workflow-templates.md` 中的开发完成报告模板
- 必须列出所有修改文件及其变更说明

**第 4 步 — Architect 审查输出文件**（即架构审查报告）：
- 使用 `references/workflow-templates.md` 中的架构审查模板
- 必须明确给出 APPROVED / CHANGES REQUESTED / BLOCKED

**第 5 步 — Tester 测试输出文件**（即测试报告）：
- 使用 `references/workflow-templates.md` 中的测试报告模板
- 必须明确给出合并建议

**第 6 步 — Orchestrator 收尾输出文件**（即周期摘要）：
- 使用 `references/workflow-templates.md` 中的周期摘要模板
- 汇总所有 agent 的输出结论

### 传递链

```
Orchestrator 第 1 步输出
  → 告诉 Architect 要设计/评估什么

Architect 第 2 步输出（约束清单）
  → 告诉 Developer 要遵循什么约束

Developer 第 3 步输出（完成报告）
  → 告诉 Architect 审查什么代码

Architect 第 4 步输出（审查结论）
  → 告诉 Tester 代码是否通过、关注哪些点

Tester 第 5 步输出（测试结论）
  → 告诉 Orchestrator 是否可以合并

Orchestrator 第 6 步输出（周期摘要）
  → 本轮关闭，归档
```

### 周期日志

`docs/cycle-log.md` 作为总索引文件，记录每轮开发周期的概览信息：

```markdown
## 周期 N — [功能/修复名称] — 2026-XX-XX HH:MM

| 步骤 | Agent | 结果 | 输出文件 |
|------|-------|------|----------|
| 1 | Orchestrator | 通过 | [文件] |
| 2 | Architect | 通过/需修改 | [文件] |
| 3 | Developer | 完成 | [文件] |
| 4 | Architect | APPROVED/REQUESTED | [文件] |
| 5 | Tester | PASS/FAIL/.. | [文件] |
| 6 | Orchestrator | DONE/BLOCKED | [文件] |

**提交**：`<commit-hash>` — `<简要描述>`
```

### 调度时必须执行的步骤

1. **调度前**：创建该 agent 输出文件的空占位（或明确告知 agent 该写到哪里）
2. **提示词中**：始终包含"将你的输出写入 `docs/agent-outputs/cycle-N-step-S-role.md`"
3. **接收后**：读取该文件确认内容完整，然后将文件名和结论追加到 `docs/cycle-log.md`
4. **下一 agent 调度前**：在提示词中引用前一 agent 的输出文件路径

## 输出风格

执行导向：
- 先给出结论
- 再列任务状态
- 再列下一步动作
- 始终明确哪个 agent 负责什么
- 不要输出空泛建议 — 要具体、可落地
- 对不合理需求要明确问题，并给出替代方案
- 仅在缺失信息会阻塞执行时才提问；否则基于明确假设继续推进

## 参考文件

工作流中按需阅读：

- `references/agent-roles.md` — 完整角色描述、详细职责和输出格式
- `references/workflow-templates.md` — 全部模板：需求处理、架构审查、开发完成报告、测试报告、Git 提交/合并
- `references/quality-gates.md` — 详细质量门禁检查清单
- `references/architecture-constraints.md` — 微信小程序约束、隐私规则、反过度设计原则、MVP 范围、数据模型要求、目录结构

## 初始化

在缺少 docs/ 目录的项目中首次调用本技能时，执行 `references/init-checklist.md` 中描述的初始化流程。该流程会建立所有文档文件、制定 MVP 计划，并创建初始任务看板。
