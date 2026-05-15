# 初始化检查清单

在缺少 `docs/` 目录和结构化工作流文件的项目中首次调用本技能时执行此流程。

## 第 1 步：验证项目状态

- [ ] `git status` — 是 Git 仓库吗？如不是则 `git init`
- [ ] 有 `README.md` 吗？如没有则创建
- [ ] `docs/` 目录存在吗？如不存在则 `mkdir -p docs`
- [ ] 检查现有代码结构：`miniprogram/`、`cloudfunctions/`
- [ ] 检查 `project.config.json`

## 第 2 步：技术选型评估

评估技术选择，记录在 `docs/decisions.md`。评估项和推荐方向见 `references/architecture-constraints.md` 的技术选型表（原生优先、云开发优先）。每项决策按 ADR 格式写：日期、背景、决策、理由、后果。

## 第 3 步：创建项目文档

### 3a. 创建目录结构

```bash
mkdir -p docs/testing
mkdir -p docs/agent-outputs && touch docs/agent-outputs/.gitkeep
mkdir -p docs/agent-outputs/archive
mkdir -p tests/{unit,integration,e2e,fixtures,helpers,mocks,reports}
```

### 3b. 创建文档文件

按以下引用创建各文档的初始内容：

| 文档 | 初始内容参考 |
|------|-------------|
| docs/requirements.md | `references/architecture-constraints.md` 的 MVP 范围和功能清单 |
| docs/task-board.md | 创建 Backlog / Ready / In Progress / Review / Testing / Done 六列空看板 |
| docs/changelog.md | 创建标题和格式说明，内容见 orchestrator.md 中的 Changelog 条目模板 |
| docs/architecture.md | 填写技术栈（第 2 步结果）、分层架构、页面路由、状态管理、数据流、分包策略 |
| docs/data-model.md | 按 `references/architecture-constraints.md` 数据模型要求，为 7 个实体创建初始 schema |
| docs/api-contract.md | 列出云函数入口（auth、team、weight、goal、checkin、invitation），随实现逐步填写 |
| docs/decisions.md | 写入第 2 步的技术评估结果（ADR 格式） |
| docs/git-workflow.md | 写入分支规范、提交格式、合并规则（参照 SKILL.md 的 Git 工作流部分） |
| docs/testing/test-strategy.md | 写入测试策略，参考 `references/testing-guide.md` 的 4 级测试方法 |
| docs/testing/test-cases.md | 创建空用例注册表，格式参考 Tester agent 文件 |
| docs/testing/test-runs.md | 创建空执行历史 |

### 3c. 更新 README.md

写入项目概述（技术栈、快速开始、项目结构、开发工作流引用）。

## 第 4 步：MVP 冲刺规划

1. 审查 `docs/requirements.md`
2. 按依赖关系排列 MVP 功能：
   - 用户登录 → 创建团队 → 加入团队 → 记录体重 → 设置目标 → 个人趋势 → 团队进度 → 打卡 → 隐私设置 → 首页总览
3. 将前 2-3 个任务写入 `docs/task-board.md` 的 Ready 列

## 第 5 步：输出初始化摘要

```
## 初始化完成

### 已创建
- docs/ 目录及全部项目文档文件
- tests/ 目录结构
- README.md（已更新）

### 技术决策
[第 2 步决策摘要]

### MVP 就绪任务
1. [第一个任务] → Developer
2. [第二个任务] → Developer

### 准备开始
项目已就绪。推荐首个任务：**用户登录**（无依赖，解锁所有后续功能）。
```

## 第 6 步：后续动作

1. 与用户确认技术决策
2. 从第一个 MVP 任务开始，每功能遵循本技能的 6 步工作流
