# 初始化检查清单

在缺少 docs/ 目录和结构化工作流文件的项目中首次调用本技能时执行此流程。

## 第 1 步：验证项目状态

- [ ] `git status` — 是 Git 仓库吗？如不是，初始化：`git init`
- [ ] 有 `README.md` 吗？如没有，创建。
- [ ] `docs/` 目录存在吗？如不存在，创建：`mkdir -p docs`
- [ ] 检查现有代码结构：`miniprogram/`、`cloudfunctions/`
- [ ] 检查 `project.config.json` 现有配置

## 第 2 步：技术选型评估

作为 Orchestrator，评估并决定技术选择。记录在 `docs/decisions.md`：

1. **原生 vs 跨端**：评估原生微信小程序 vs Taro/uni-app
2. **云开发 vs 自建后端**：评估微信云开发 vs CloudBase vs 自定义后端
3. **状态管理**：评估全局 store vs 页面级状态
4. **组件库**：评估 TDesign Weixin vs 自定义组件
5. **图表**：评估小程序版 ECharts vs 自定义 Canvas

每项决策按格式写：日期、背景、决策、理由、后果。

## 第 3 步：创建基础文档

创建以下文件并填入初始内容：

### docs/product-requirements.md
```markdown
# 产品需求 — Fit Planner

## 概述
面向小团队（约 4 人）的协作体重管理微信小程序。

## 核心场景
- 成员加入团队
- 记录体重
- 设置个人目标
- 查看个人趋势
- 查看团队进度概览
- 打卡签到
- 互相监督
- 阶段性复盘

## MVP 范围
[完整 MVP 列表见 architecture-constraints.md]

## 后续版本
[推迟功能见 architecture-constraints.md]
```

### docs/feature-list.md
```markdown
# 功能清单

| ID | 功能 | 优先级 | 状态 | 版本 |
|----|------|--------|------|------|
| F-001 | 用户登录 | P0 | Planned | MVP |
| F-002 | 创建团队 | P0 | Planned | MVP |
| F-003 | 加入团队 | P0 | Planned | MVP |
| F-004 | 记录体重 | P0 | Planned | MVP |
| F-005 | 编辑/删除体重记录 | P1 | Planned | MVP |
| F-006 | 设置目标体重 | P0 | Planned | MVP |
| F-007 | 个人体重趋势 | P0 | Planned | MVP |
| F-008 | 团队进度概览 | P0 | Planned | MVP |
| F-009 | 打卡签到 | P0 | Planned | MVP |
| F-010 | 基础隐私设置 | P0 | Planned | MVP |
| F-011 | 邀请成员 | P1 | Planned | Post-MVP |
| F-012 | 周报/月报 | P2 | Planned | Post-MVP |
| F-013 | 排行榜 | P2 | Planned | Post-MVP |
| F-014 | 数据导出 | P2 | Planned | Post-MVP |
| F-015 | 管理员移除成员 | P1 | Planned | Post-MVP |
| F-016 | 成员退出团队 | P1 | Planned | Post-MVP |
| F-017 | 体重单位设置 | P1 | Planned | Post-MVP |
| F-018 | 备注记录 | P1 | Planned | Post-MVP |
| F-019 | 首页总览 | P0 | Planned | MVP |
| F-020 | 分享入口 | P2 | Planned | Post-MVP |
```

### docs/task-board.md
```markdown
# 任务看板

## 待规划
（空 — 随需求进入而填充）

## 就绪
（空）

## 进行中
（空）

## 审查中
（空）

## 测试中
（空）

## 已完成
（空）
```

### docs/architecture.md
```markdown
# 架构设计 — Fit Planner

## 技术栈
[第 2 步评估后填写]

## 分层架构
[描述：页面层 → 服务层 → 数据层]

## 页面路由
[记录所有页面路径及其关系]

## 状态管理
[描述状态管理方案]

## 数据流
[描述页面、服务、云之间的数据流]

## 分包策略
[描述页面如何拆分到分包]
```

### docs/data-model.md
实体定义见 architecture-constraints.md。按其中列出的实体创建。

### docs/api-contract.md
```markdown
# API 契约

## 云函数

### auth
- **login**: POST，输入：{ code }，输出：{ token, user }
- ...

[随功能实现逐步填写]
```

### docs/test-plan.md
```markdown
# 测试计划

## 测试用例

[随功能逐步填写]

## Bug 记录

| ID | 功能 | 严重程度 | 描述 | 状态 | 日期 |
|----|------|----------|------|------|------|
```

### docs/decisions.md
```markdown
# 架构决策记录

## ADR-001: [决策标题]
- **日期**：YYYY-MM-DD
- **背景**：[要解决什么问题]
- **决策**：[决定采用什么方案]
- **理由**：[为什么]
- **后果**：[此决策带来什么，排除什么]
```

### docs/changelog.md
```markdown
# 变更日志

## [未发布]
### 新增
### 变更
### 修复
```

### docs/git-workflow.md
```markdown
# Git 工作流

## 分支
- `main` — 稳定，可部署
- `feature/<名称>` — 新功能
- `fix/<名称>` — bug 修复

## 提交格式
`type: 描述`

类型：feat, fix, docs, refactor, test, chore

## 合并规则
- 架构审查必须通过
- 测试必须通过
- 质量门禁检查清单必须完整
```

### README.md
更新为项目概述（如果是 quickstart 模板 README 则覆盖）：
```markdown
# Fit Planner

面向小团队的协作体重管理微信小程序。

## 技术栈
[待填写]

## 快速开始
1. 在微信开发者工具中打开
2. 配置云环境
3. 部署云函数
4. 编译预览

## 项目结构
[完整结构见 architecture-constraints.md]

## 开发工作流
本项目使用 fit-planner-workflow 技能进行多 agent 开发。
项目文档见 docs/ 目录。
```

## 第 4 步：MVP 冲刺规划

1. 审查 feature-list.md
2. 按依赖关系排列 MVP 功能：
   - 用户登录（无依赖）→ 最先
   - 创建团队（需登录）→ 第二
   - 加入团队（需登录）→ 第三
   - 记录体重（需团队）→ 第四
   - 设置目标（需登录）→ 第五（可与团队功能并行）
   - 个人趋势（需体重记录）→ 第六
   - 团队进度（需团队 + 成员 + 体重记录）→ 第七
   - 打卡签到（需团队 + 登录）→ 第八
   - 隐私设置（需登录）→ 第九
   - 首页总览（需以上全部）→ 第十
3. 将前 2-3 个任务加入 task-board.md 的 Ready 列

## 第 5 步：输出初始化摘要

```
## 初始化完成

### 已创建
- docs/ 目录及所有项目文档文件
- README.md（已更新）

### 技术决策
[第 2 步决策摘要]

### MVP 计划
1. [第一个任务] → Developer
2. [第二个任务] → Developer
3. [第三个任务] → Developer

### 准备开始
项目已就绪，可以开始开发。说"开始开发 [第一个功能]"即可启动首个任务。

推荐首个任务：**用户登录** — 解锁所有后续功能。
```

## 第 6 步：后续动作

初始化完成后：
1. 与用户确认技术决策
2. 从第一个 MVP 任务（用户登录）开始
3. 每功能遵循 6 步工作流
