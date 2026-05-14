# Git 工作流

## 分支

- `main` — 稳定，可部署。受保护。禁止直接提交。
- `feature/<简短名称>` — 新功能（如 `feature/user-login`、`feature/team-creation`）
- `fix/<简短名称>` — bug 修复（如 `fix/weight-validation`）

## 提交格式

```
<type>: <简短描述>

<可选正文 — 做了什么、为什么>

Ref: <任务看板任务 ID>
```

### 类型

- `feat:` — 新功能
- `fix:` — bug 修复
- `docs:` — 纯文档变更
- `refactor:` — 既非修复 bug 也非新增功能的代码改动
- `test:` — 新增或更新测试
- `chore:` — 构建流程、工具、配置变更

### 示例

```
feat: 添加团队创建流程

- 团队创建页面，含名称输入及校验
- 云函数创建团队并分配管理员角色
- 邀请码自动生成

Ref: T-002
```

```
fix: 修正体重记录日期校验逻辑

允许同日多次记录，仅拒绝未来日期。

Ref: T-012
```

## 提交前检查清单

- [ ] `git status` — 干净，仅预期文件有变更
- [ ] `git diff` — 已审查，无意外修改
- [ ] 无无关文件（其他功能、调试代码、个人配置）
- [ ] 文档已同步（质量门禁中列出的所有文档已更新）
- [ ] 测试结果已记录在 test-plan.md
- [ ] 架构审查已记录（如适用）

## 合并规则

1. 所有质量门禁必须通过（见 `docs/quality-gates.md`）
2. `git checkout main && git pull origin main`
3. `git merge feature/<名称>`（或 `fix/<名称>`）
4. 验证合并：`git log --oneline -3`
5. `git push origin main`
6. 删除功能分支：`git branch -d feature/<名称>`
7. 更新 task-board.md：标注已合并

## 合并冲突处理

1. 手动解决冲突
2. 若冲突涉及架构敏感文件，通知 Architect
3. 若合并涉及业务逻辑变更，Tester 需对合并结果重新验证
4. 重新验证通过后再执行合并
