# Data Model — Fit Planner

## Collections

### User
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| openid | string | PK | — | From wx.login, primary key |
| nickName | string | No | 'WeChat User' | From WeChat user info |
| avatarUrl | string | No | — | From WeChat user info |
| createdAt | datetime | Yes | server date | — |
| privacySettings | object | No | { shareWeight: false } | shareWeight: opt-in to show raw weight to team |
| defaultUnit | string | No | 'kg' | 'kg' or 'lb' |

**Indexes**: openid (unique)
**Privacy Risk**: LOW — no weight data in this collection
**Retention**: Keep until user deletes account

### Team
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| teamId | string | PK | auto-generated | — |
| name | string | Yes | — | Team display name |
| inviteCode | string | Yes | auto-generated | Unique, 6-char alphanumeric |
| createdBy | string | Yes | — | FK -> User.openid |
| createdAt | datetime | Yes | server date | — |
| memberCount | number | No | 0 | Denormalized, updated on member join/leave |

**Indexes**: teamId (unique), inviteCode (unique)
**Privacy Risk**: LOW
**Retention**: Keep until admin deletes team

### TeamMember
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| teamId | string | Yes (composite PK) | — | FK -> Team.teamId |
| openid | string | Yes (composite PK) | — | FK -> User.openid |
| role | string | No | 'member' | 'admin' or 'member' |
| joinedAt | datetime | Yes | server date | — |
| goalWeight | number | No | null | Target weight in kg |
| goalDate | datetime | No | null | Target date to reach goal |

**Indexes**: teamId+openid (composite unique)
**Privacy Risk**: LOW (goal weight is non-sensitive)
**Retention**: Keep until member leaves team

### WeightRecord
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| recordId | string | PK | auto-generated | — |
| openid | string | Yes | — | FK -> User.openid, indexed |
| weight | number | Yes | — | Raw weight value — SENSITIVE, never log |
| unit | string | No | 'kg' | 'kg' or 'lb' |
| recordedAt | datetime | Yes | — | Date of measurement (not creation date) |
| note | string | No | '' | Optional remark, max 200 chars |
| createdAt | datetime | Yes | server date | — |
| createdBy | string | Yes | — | Always = openid, validated server-side |

**Indexes**: recordId (unique), openid+recordedAt (compound for time-series queries)
**Privacy Risk**: HIGH — contains raw weight. Never expose to other members without explicit opt-in.
**Permission Rules**: Owner can read/write own records only. No other member can read or write.
**Retention**: Keep until user deletes account

### Goal
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| goalId | string | PK | auto-generated | — |
| openid | string | Yes | — | FK -> User.openid |
| targetWeight | number | Yes | — | Target weight — SENSITIVE |
| startWeight | number | Yes | — | Starting weight — SENSITIVE |
| startDate | datetime | Yes | — | When goal was started |
| targetDate | datetime | No | null | When goal should be achieved |
| status | string | No | 'active' | 'active', 'achieved', 'abandoned' |
| createdAt | datetime | Yes | server date | — |

**Indexes**: goalId (unique), openid (for user's goals)
**Privacy Risk**: MEDIUM — contains weight data. Exposed as percentage to team, not raw values.
**Retention**: Keep for history

### CheckIn
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| checkInId | string | PK | auto-generated | — |
| openid | string | Yes | — | FK -> User.openid |
| teamId | string | Yes | — | FK -> Team.teamId |
| date | string | Yes | — | YYYY-MM-DD, one check-in per day per member |
| weight | number | No | null | Optional weight — SENSITIVE if present |
| note | string | No | '' | Max 500 chars |
| mood | string | No | null | 'great', 'good', 'ok', 'struggling' |
| createdAt | datetime | Yes | server date | — |

**Indexes**: checkInId (unique), openid+teamId+date (unique compound for daily check-in constraint)
**Privacy Risk**: MEDIUM — mood/note are low risk, weight is high risk
**Retention**: Keep for 1 year, then archive

### Invitation
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| inviteCode | string | PK | auto-generated | 6-char alphanumeric |
| teamId | string | Yes | — | FK -> Team.teamId |
| createdBy | string | Yes | — | FK -> User.openid |
| expiresAt | datetime | Yes | 7 days | Auto-expiration |
| maxUses | number | No | 10 | Max number of uses |
| useCount | number | No | 0 | Current usage count |
| isActive | boolean | No | true | Can be deactivated by admin |
| createdAt | datetime | Yes | server date | — |

**Indexes**: inviteCode (unique), teamId (for finding team's invites)
**Privacy Risk**: LOW
**Retention**: Keep for 30 days after expiration, then delete
