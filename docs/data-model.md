# 数据模型 — Fit Planner

## 集合

### User
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| openid | string | PK | — | 来自 wx.login，主键 |
| nickName | string | 否 | 'WeChat User' | 微信用户信息 |
| avatarUrl | string | 否 | — | 微信用户头像 |
| createdAt | datetime | 是 | 服务器时间 | — |
| privacySettings | object | 否 | { shareWeight: false } | shareWeight：主动开启后向团队展示原始体重 |
| defaultUnit | string | 否 | 'kg' | 'kg' 或 'lb' |

**索引**：openid（唯一）
**隐私风险**：低 — 本集合不含体重数据
**保留策略**：用户删除账户前保留

### Team
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| teamId | string | PK | 自动生成 | — |
| name | string | 是 | — | 团队显示名称 |
| inviteCode | string | 是 | 自动生成 | 唯一，6 位字母数字 |
| createdBy | string | 是 | — | 外键 → User.openid |
| createdAt | datetime | 是 | 服务器时间 | — |
| memberCount | number | 否 | 0 | 冗余字段，成员加入/退出时更新 |

**索引**：teamId（唯一）、inviteCode（唯一）
**隐私风险**：低
**保留策略**：管理员删除团队前保留

### TeamMember
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| teamId | string | 是（复合 PK） | — | 外键 → Team.teamId |
| openid | string | 是（复合 PK） | — | 外键 → User.openid |
| role | string | 否 | 'member' | 'admin' 或 'member' |
| joinedAt | datetime | 是 | 服务器时间 | — |
| goalWeight | number | 否 | null | 目标体重（kg） |
| goalDate | datetime | 否 | null | 目标达成日期 |

**索引**：teamId+openid（复合唯一）
**隐私风险**：低（目标体重不敏感）
**保留策略**：成员退出团队前保留

### WeightRecord
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| recordId | string | PK | 自动生成 | — |
| openid | string | 是 | — | 外键 → User.openid，需索引 |
| weight | number | 是 | — | 原始体重值 — 敏感，绝不在日志中记录 |
| unit | string | 否 | 'kg' | 'kg' 或 'lb' |
| recordedAt | datetime | 是 | — | 测量日期（非创建日期） |
| note | string | 否 | '' | 可选备注，最长 200 字 |
| createdAt | datetime | 是 | 服务器时间 | — |
| createdBy | string | 是 | — | 始终等于 openid，服务端验证 |

**索引**：recordId（唯一）、openid+recordedAt（复合索引，用于时序查询）
**隐私风险**：高 — 含原始体重。未经明确授权绝不向其他成员暴露。
**权限规则**：仅本人可读写自己的记录。其他成员不可读不可写。
**保留策略**：用户删除账户前保留

### Goal
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| goalId | string | PK | 自动生成 | — |
| openid | string | 是 | — | 外键 → User.openid |
| targetWeight | number | 是 | — | 目标体重 — 敏感 |
| startWeight | number | 是 | — | 起始体重 — 敏感 |
| startDate | datetime | 是 | — | 目标开始日期 |
| targetDate | datetime | 否 | null | 目标达成日期 |
| status | string | 否 | 'active' | 'active'、'achieved'、'abandoned' |
| createdAt | datetime | 是 | 服务器时间 | — |

**索引**：goalId（唯一）、openid（用户目标查询）
**隐私风险**：中 — 含体重数据。向团队仅暴露百分比，不暴露原始值。
**保留策略**：保留作历史记录

### CheckIn
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| checkInId | string | PK | 自动生成 | — |
| openid | string | 是 | — | 外键 → User.openid |
| teamId | string | 是 | — | 外键 → Team.teamId |
| date | string | 是 | — | YYYY-MM-DD，每成员每日一次 |
| weight | number | 否 | null | 可选体重 — 如有则敏感 |
| note | string | 否 | '' | 最长 500 字 |
| mood | string | 否 | null | 'great'、'good'、'ok'、'struggling' |
| createdAt | datetime | 是 | 服务器时间 | — |

**索引**：checkInId（唯一）、openid+teamId+date（复合唯一，约束每日一次打卡）
**隐私风险**：中 — 心情/备注风险低，体重风险高
**保留策略**：保留 1 年后归档

### Invitation
| 字段 | 类型 | 必填 | 默认值 | 备注 |
|------|------|------|--------|------|
| inviteCode | string | PK | 自动生成 | 6 位字母数字 |
| teamId | string | 是 | — | 外键 → Team.teamId |
| createdBy | string | 是 | — | 外键 → User.openid |
| expiresAt | datetime | 是 | 7 天 | 自动过期 |
| maxUses | number | 否 | 10 | 最大使用次数 |
| useCount | number | 否 | 0 | 当前使用次数 |
| isActive | boolean | 否 | true | 管理员可停用 |
| createdAt | datetime | 是 | 服务器时间 | — |

**索引**：inviteCode（唯一）、teamId（查找团队邀请）
**隐私风险**：低
**保留策略**：过期后 30 天删除
