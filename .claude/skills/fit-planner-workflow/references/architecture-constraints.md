# 架构约束

## 项目类型 — 微信小程序

这是一个微信小程序，**不是** Web 应用。所有设计决策必须考虑：

- **运行环境**：微信 JavaScript 引擎（非浏览器），API 可用性受限
- **包大小限制**：主包 + 分包合计 20MB（建议每分包 2MB 以内）
- **页面限制**：主包默认最多 10 页，分包可容纳更多
- **云能力**：微信云开发提供数据库、存储、云函数，内建微信鉴权
- **无 DOM 访问**：使用 WXML 数据绑定，不可直接操作 DOM
- **无 window/localStorage**：使用 `wx.setStorageSync` / `wx.getStorageSync` 或云数据库
- **网络**：仅 HTTPS，域名需在微信后台加入白名单
- **登录**：`wx.login()` → 云函数获取 `openid`，或使用 CloudBase 内建鉴权

## 技术选型（项目初始化时评估）

初始化时，Orchestrator 必须组织一次技术选型评估，覆盖以下内容：

| 决策 | 选项 | 推荐方向 |
|------|------|----------|
| 原生 vs 跨端框架 | 原生开发 / Taro / uni-app | 原生优先，API 完整，调试简单 |
| 云开发 vs 自建后端 | 微信云开发 / CloudBase / Node.js 后端 | 云开发优先，零运维，内建鉴权 |
| 本地缓存 vs 云数据库 | wx.Storage / 云数据库 | 共享数据用云数据库，偏好设置用本地缓存 |
| 登录方案 | wx.login + openid / CloudBase 鉴权 | CloudBase 鉴权（如用 CloudBase），否则 wx.login |
| 服务端定时任务 | 云函数定时触发器 / 外部 cron | 简单周期性任务用云函数定时器 |
| 消息通知 | 订阅消息 / 短信 / MVP 阶段不启用 | 推迟到后续版本 |
| 权限模型 | 简单角色（admin/member） | MVP 仅需 2 个角色 |

评估结果和决策写入 `docs/decisions.md`。

## MVP 范围

MVP 仅包含：
- 用户登录（wx.login 或 CloudBase 鉴权）
- 创建团队
- 加入团队（通过邀请码）
- 记录体重（含日期、数值）
- 查看个人体重趋势（简单图表）
- 查看团队成员进度概览（距目标的百分比，**非**原始体重值）
- 基础权限控制（admin vs member）
- 基础隐私设置（对团队隐藏原始体重）

非 MVP（推迟）：
- 周报/月报
- 排行榜
- 数据导出
- 订阅消息通知
- 高级图表（BMI、体脂率等）
- 复杂管理员权限（moderator、转让）
- 异常数据审核
- 游戏化/激励机制

## 反过度设计原则

- **目标用户**：约 4 人团队。不要按大型 SaaS 规模设计。
- **不要微服务**：单体仓库加云函数已足够。
- **不要重型权限系统**：Admin + Member 足够了。不要搭建细粒度 RBAC。
- **数据模型要简单**：从最小可行 schema 起步。只在实际需要时才加字段。
- **优先功能闭环**：先交付可工作的完整链路（登录 → 组队 → 记录 → 查看），再做优化。
- **数据模型必须可扩展**：但第一版要简单。添加字段扩展，不要预先设计未来的不确定需求。
- **如果某个功能不能帮助 4 人团队一起管理体重，就不在 MVP 范围内。**

## 隐私与敏感数据约束

体重数据属于敏感个人信息。每次新增功能必须检查：

1. **原始体重暴露**：此功能是否将成员的实际体重值暴露给其他成员？
   - 规则：默认团队成员仅看到进度百分比或变化差值，不看到原始 kg/lb 值。
   - 例外：成员主动在设置中开启"共享体重"。

2. **趋势展示**：优先展示"本周下降 2.3kg"或"距目标还有 65%"，而不是"当前体重：78.5kg"。

3. **团队可见性**：其他成员能看到什么？
   - MVP 规则：个人目标达成百分比、趋势方向、打卡次数。**不是**原始体重。
   - 个人可在隐私设置中切换"共享我的体重"。

4. **管理员边界**：管理员可以：
   - 邀请/移除成员
   - 查看团队级别汇总统计
   - 不能查看个人原始体重（除非成员主动开启共享）
   - 不能编辑其他成员的体重记录

5. **分享链接安全**：若实现小程序分享卡片：
   - 绝不将体重数据放入分享参数
   - 仅包含团队名称和成员数量

6. **数据库权限**：云数据库安全规则必须：
   - 默认只允许读取自己的记录
   - 允许读取团队成员的聚合/脱敏数据
   - 绝不允许写入其他成员的记录
   - 在云函数中验证，而非仅在小程序前端验证

7. **日志**：绝不在日志中记录原始体重值、openid-体重映射、或含体重数据的团队关系。

8. **数据脱敏**：在团队视图中展示体重相关数据时，应用适当的脱敏处理。

## 目录结构

```
miniprogram/
├── pages/            # 页面级组件（每个页面对应一个目录）
│   ├── index/        # 首页 / 仪表盘
│   ├── login/        # 登录页
│   ├── team/         # 团队管理（创建、加入、设置）
│   ├── weight/       # 体重记录和历史
│   └── profile/      # 用户资料和设置
├── components/       # 可复用 UI 组件
│   ├── weight-chart/ # 体重趋势图
│   ├── team-card/    # 团队成员卡片
│   └── ...
├── services/         # 业务逻辑层
│   ├── auth.js       # 登录、会话管理
│   ├── team.js       # 团队 CRUD、成员管理
│   ├── weight.js     # 体重记录 CRUD、统计
│   └── checkin.js    # 打卡逻辑
├── stores/           # 状态管理
│   ├── user.js       # 用户状态
│   └── team.js       # 团队状态
├── utils/            # 纯工具函数
│   ├── date.js       # 日期格式化、解析
│   ├── weight.js     # 单位转换（kg/lb）
│   └── privacy.js    # 数据脱敏、隐私辅助
├── models/           # 数据类型定义 / 验证
│   ├── user.js
│   ├── team.js
│   └── weight.js
├── config/           # 应用配置
│   └── constants.js  # 枚举、限制值、默认值
└── assets/           # 静态资源（图片、图标）

cloudfunctions/
├── auth/             # 登录、token 管理
├── team/             # 团队操作
├── weight/           # 体重记录操作
├── invitation/       # 邀请码生成和验证
└── notification/     # （后续版本）通知

docs/
├── product-requirements.md
├── feature-list.md
├── task-board.md
├── architecture.md
├── data-model.md
├── api-contract.md
├── test-plan.md
├── decisions.md
├── changelog.md
└── git-workflow.md

README.md
```

## 数据模型要求

`docs/data-model.md` 必须至少覆盖以下实体：

### User
- openid（string，主键，来自 wx.login）
- nickName（string）
- avatarUrl（string）
- createdAt（datetime）
- privacySettings { shareWeight: boolean }（object，默认：{ shareWeight: false }）
- defaultUnit（string，'kg' | 'lb'，默认：'kg'）

### Team
- teamId（string，主键）
- name（string，必填）
- inviteCode（string，唯一，自动生成）
- createdBy（string，外键 → User.openid）
- createdAt（datetime）
- memberCount（number，派生）

### TeamMember
- teamId + openid（复合主键）
- role（'admin' | 'member'，默认：'member'）
- joinedAt（datetime）
- goalWeight（number，可空）
- goalDate（datetime，可空）

### WeightRecord
- recordId（string，主键）
- openid（string，外键 → User.openid，需索引）
- weight（number，必填，敏感 — 绝不在日志中记录原始值）
- unit（string，'kg' | 'lb'）
- recordedAt（datetime，需索引）
- note（string，可选，最长 200 字）
- createdAt（datetime）
- createdBy（string，始终等于 openid，服务端验证）

### Goal
- goalId（string，主键）
- openid（string，外键 → User.openid）
- targetWeight（number，必填，敏感）
- startWeight（number，必填，敏感）
- startDate（datetime）
- targetDate（datetime）
- status（'active' | 'achieved' | 'abandoned'）
- createdAt（datetime）

### CheckIn
- checkInId（string，主键）
- openid（string，外键 → User.openid）
- teamId（string，外键 → Team.teamId）
- date（string，YYYY-MM-DD，需索引）
- weight（number，可选，敏感）
- note（string，可选，最长 500 字）
- mood（string，可选：'great' | 'good' | 'ok' | 'struggling'）
- createdAt（datetime）

### Invitation
- inviteCode（string，主键）
- teamId（string，外键 → Team.teamId）
- createdBy（string，外键 → User.openid）
- expiresAt（datetime）
- maxUses（number，默认：10）
- useCount（number，默认：0）
- isActive（boolean，默认：true）
- createdAt（datetime）

每个实体必须标明：字段名、类型、是否必填、默认值、索引建议、权限规则、隐私风险级别、数据生命周期（保留和删除策略）。
