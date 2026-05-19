---
name: fit-planner-workflow
description: >
  Fit Planner 微信小程序（协作体重管理）的多 agent 开发工作流。
  触发条件：用户提到开发功能、修复 bug、规划架构、运行测试，或任何与构建 fit-planner 小程序相关的任务。
  该工作流：主对话做需求澄清（grill-me），3 个 agent（Implementer、Reviewer、Validator）依次实现、审查、验证。
  当用户在 fit-planner 项目中构建、修改或规划时，即使未明确提到技能名称，也应使用此技能。
---

# Fit Planner 多 Agent 开发工作流

## 当前状态
- Cycle: {N} | Step: {M} | Version: v{V}
- 分支: {branch_name}
- 本阶段门禁: [ ] 通过

## 概述

为 fit-planner 微信小程序（面向约 4 人小团队的协作体重管理应用）定义的多 agent 开发工作流。

**核心原则**：先澄清需求再动手。先追踪代码链再修改。审查不通过必须打回。验证不做纯 mock 报告。

## 角色

| 角色 | 执行者 | 职责 | 技能 | 参考文件 |
|------|--------|------|------|---------|
| 需求澄清 + 路由 + 收尾 | **主对话（你）** | grill-me 澄清需求、范围定义、路由调度、收尾合并 | `grill-me` | 本文件 |
| Implementer | Agent | 代码链追踪 + 实现 + 增量测试 | `tdd` | `references/agents/implementer.md` |
| Reviewer | Agent | 代码质量闸门（7 项审查） | `simplify` | `references/agents/reviewer.md` |
| Validator | Agent | 真实环境验证（禁止纯 mock） | — | `references/agents/validator.md` |

## 工作流

```
主对话: grill-me 需求澄清 → 输出需求 spec
  ↓
Implementer: 代码链追踪 + 实现 → 增量测试 → 输出实现报告
  ↓
Reviewer: 代码审查 → PASS/BLOCKED ←── 打回循环(≤3次) ──┐
  ↓                                                        │
Validator: 真实环境验证 → PASS/FAIL ←──────────────────────┘
  ↓
主对话: 收尾 (changelog + git)
```

---

## 阶段 1 — 主对话：需求澄清

1. 使用 Skill 工具加载 `grill-me`
2. 与用户深入对话，穷尽决策树：
   - 想要解决什么问题？为什么现在解决？
   - 影响范围是什么？有哪些边界条件？
   - 成功的验收标准是什么？
3. 检查项目中是否有陈旧文档（与代码不一致的文档）→ 如有，标记为修复项
4. 输出需求 spec（写入 `docs/workflow/{cycle}-1-spec.md`），包含：
   - 问题/需求描述
   - 验收标准
   - 范围边界（不做什么）
   - 陈旧文档修复项（如有）
   - 推荐分支名（`feature/<名称>` 或 `fix/<名称>`）

---

## 阶段 2 — Implementer：代码实现

调度 Implementer agent：

```
请先阅读 references/agents/implementer.md 了解你的完整职责。
开始工作前使用 Skill 工具加载 tdd。
需求 spec 在 {spec_path}。
架构约束在 references/architecture-constraints.md。
请在 {branch_name} 分支上实现。
输出实现报告到 docs/workflow/{cycle}-2-implementer-v{V}.md。
```

**Implementer 门禁**（完成后逐项确认，未通过打回 Implementer）：
- [ ] 代码链追踪完整（有证据，有文件:行号）
- [ ] 增量测试全部通过（`npm run test:unit -- --testPathPattern="{相关文件}"` + `npm run test:integration -- --testPathPattern="{相关文件}"`）
- [ ] 约束合规清单全部确认（见 implementer.md）
- [ ] 实现报告已输出

---

## 阶段 3 — Reviewer：代码审查

调度 Reviewer agent：

```
请先阅读 references/agents/reviewer.md 了解你的完整职责。
开始工作前使用 Skill 工具加载 simplify。
Implementer 报告在 {implementer_report_path}。
严重性标准在 references/severity-rubric.md。
输出审查报告到 docs/workflow/{cycle}-3-reviewer-v{V}.md。
```

**Reviewer 门禁**（完成后逐项确认）：
- [ ] 7 项审查清单全部评估
- [ ] 严重性按 rubric 正确分级
- [ ] 无 P0/P1 未解决问题

**结论**：
- PASS → 阶段 4
- BLOCKED → 打回阶段 2（v{V+1}）。调度 Implementer 时额外提供 Reviewer 报告路径。

---

## 阶段 4 — Validator：真实环境验证

调度 Validator agent：

```
请先阅读 references/agents/validator.md 了解你的完整职责。
需求 spec 在 {spec_path}。
Implementer 报告在 {implementer_report_path}。
Reviewer 报告在 {reviewer_report_path}（如有）。
严重性标准在 references/severity-rubric.md。
输出验证报告到 docs/workflow/{cycle}-4-validator-v{V}.md。
```

**Validator 门禁**（完成后逐项确认）：
- [ ] 增量回归测试无新增 RED（`npm test` 确认无新增失败）
- [ ] 至少一项非 mock 验证已完成
- [ ] 目标 E2E spec 通过（`npm run test:e2e:run -- tests/e2e/specs/{相关spec}.spec.js`）
- [ ] 陈旧文档修复项全部确认

**结论**：
- PASS → 阶段 5
- FAIL → 打回阶段 2（v{V+1}）。调度 Implementer 时额外提供 Validator 报告路径。

---

## 阶段 5 — 主对话：收尾

1. 更新 `docs/changelog.md`（追加周期条目）
2. 检查 `git status` — 确认工作区干净
3. 生成提交信息（格式：`type: 描述`）
4. 合并到 `main` 或推送 PR
5. **不清理本地开发分支**

---

## 迭代管理

- 阶段 2 ↔ 3 或 2 ↔ 4 之间最多 **3 次**迭代
- 超过 3 次 → 回到阶段 1 重新 grill-me
- 版本号：v1, v2, v3
- Changelog 中每次迭代递增一行

---

## 输出目录

```
docs/workflow/
├── {cycle}-1-spec.md              # 主对话需求 spec
├── {cycle}-2-implementer-v1.md    # Implementer v1
├── {cycle}-2-implementer-v2.md    # Implementer v2（如有打回）
├── {cycle}-3-reviewer-v1.md       # Reviewer
├── {cycle}-4-validator-v1.md      # Validator
└── ...
```

---

## Changelog 条目模板

```
## 周期 {cycle} — {名称} — {YYYY-MM-DD}
**类型**：feature/fix | **结果**：DONE | **分支**：{名称} | **迭代**：{N}

| 步骤 | 版本 | 角色 | 状态 | 报告 |
|------|------|------|------|------|
| 1 | — | 主对话 | DONE | [spec](workflow/{cycle}-1-spec.md) |
| 2 | v1 | Implementer | DONE | [report](workflow/{cycle}-2-implementer-v1.md) |
| 3 | v1 | Reviewer | PASS | [report](workflow/{cycle}-3-reviewer-v1.md) |
| 4 | v1 | Validator | PASS | [report](workflow/{cycle}-4-validator-v1.md) |

### 变更
- {file}: {what changed}
```

---

## 参考文件

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `references/agents/implementer.md` | Implementer 完整职责 | 阶段 2 调度时 |
| `references/agents/reviewer.md` | Reviewer 完整职责 | 阶段 3 调度时 |
| `references/agents/validator.md` | Validator 完整职责 | 阶段 4 调度时 |
| `references/severity-rubric.md` | 严重性标准 | Reviewer/Validator |
| `references/architecture-constraints.md` | 架构约束、隐私规则 | 阶段 2、3、4 |