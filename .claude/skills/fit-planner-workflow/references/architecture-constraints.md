# Architecture Constraints

## Project Type — WeChat Mini Program

This is a WeChat mini program, NOT a web app. All design decisions must account for:

- **Runtime environment**: WeChat's JavaScript engine (not a browser), with specific API availability
- **Package size limit**: Main package + subpackages = 20MB total (2MB per subpackage recommended)
- **Page limit**: 10 pages in main package by default, subpackages can hold more
- **Cloud capabilities**: WeChat Cloud Development provides database, storage, cloud functions, all with built-in WeChat auth
- **No DOM access**: Use WXML data binding, not direct DOM manipulation
- **No window/localStorage**: Use `wx.setStorageSync` / `wx.getStorageSync` or cloud database
- **Network**: Only HTTPS, domains must be whitelisted in WeChat backend
- **Login**: `wx.login()` → cloud function for `openid`, or CloudBase built-in auth

## Technology Selection (to be evaluated at project init)

During initialization, the Orchestrator must organize a technology selection evaluation covering:

| Decision | Options | Recommendation Guidance |
|----------|---------|------------------------|
| Native vs Cross-platform | 原生开发 / Taro / uni-app | Native preferred for simplicity and full API access |
| Cloud vs Self-hosted Backend | 微信云开发 / CloudBase / Node.js backend | Cloud development preferred for zero-ops, built-in auth |
| Local cache vs Cloud DB | wx.Storage / 云数据库 | Cloud DB for shared data, local cache for preferences |
| Login system | wx.login + openid / CloudBase auth | CloudBase auth if using CloudBase, else wx.login |
| Server-side scheduled tasks | 云函数定时触发器 / external cron | Cloud function timer for simple periodic tasks |
| Notifications | 订阅消息 / SMS / none for MVP | Defer to post-MVP |
| Permission model | Simple role-based (admin/member) | Keep 2 roles for MVP |

Write evaluation results and decisions to `docs/decisions.md`.

## MVP Scope

MVP includes ONLY:
- User login (wx.login or CloudBase auth)
- Create team
- Join team (via invitation code)
- Record weight (with date, value)
- View personal weight trend (simple chart)
- View team member progress overview (percentage toward goal, NOT raw weight values)
- Basic permission control (admin vs member)
- Basic privacy setting (hide raw weight from team)

Non-MVP (deferred):
- Weekly/monthly reports
- Leaderboard
- Data export
- Subscribe message notifications
- Advanced charts (BMI, body fat, etc.)
- Complex admin permissions (moderator, owner transfer)
- Abnormal data audit
- Gamification / incentives

## Anti-Overengineering Principles

- **Target**: ~4 person teams. Do NOT design for large SaaS scale.
- **No microservices**: A monorepo with cloud functions is sufficient.
- **No heavy permission system**: Admin + Member is enough. Don't build RBAC with granular permissions.
- **Simple data model**: Start with the minimum viable schema. Add fields only when needed.
- **Function closure first**: Ship a working loop (login → team → record → view) before polishing.
- **Data model must be extensible**: But the first version should be simple. Add fields, don't pre-design for unknowns.
- **If a feature doesn't help a 4-person team manage weight together, it's out of scope for MVP.**

## Privacy & Sensitivity Constraints

Weight data is sensitive personal information. Every feature addition MUST check:

1. **Raw weight exposure**: Does this feature expose a member's actual weight value to other members?
   - Rule: By default, team members see only progress percentage or change delta, not raw kg/lb values.
   - Exception: If the member explicitly opts in to sharing raw values.

2. **Trend display**: Prefer showing "↓ 2.3kg this week" or "65% to goal" over "Current weight: 78.5kg".

3. **Team visibility**: What can other members see?
   - MVP rule: Progress percentage toward personal goal, trend direction, check-in count. NOT raw weight.
   - Individual can toggle "share my weight" in privacy settings.

4. **Admin boundaries**: Admin can:
   - Invite/remove members
   - See team-level aggregate stats
   - Cannot see individual raw weight (unless member opted in)
   - Cannot edit another member's weight records

5. **Share link safety**: If implementing mini program share cards:
   - Never include weight data in share parameters
   - Only include team name and member count

6. **Database permissions**: Cloud database security rules must:
   - Allow read of own records only (by default)
   - Allow read of team members' aggregated/obfuscated data
   - Never allow write to other members' records
   - Validate in cloud functions, not just in mini program frontend

7. **Logging**: Never log raw weight values, openid-to-weight mappings, or team membership with weight data.

8. **Data masking**: When displaying weight-adjacent data in team views, apply appropriate masking.

## Directory Structure

```
miniprogram/
├── pages/            # Page-level components (one dir per page)
│   ├── index/        # Home / dashboard
│   ├── login/        # Login page
│   ├── team/         # Team management (create, join, settings)
│   ├── weight/       # Weight recording and history
│   └── profile/      # User profile and settings
├── components/       # Reusable UI components
│   ├── weight-chart/ # Weight trend chart
│   ├── team-card/    # Team member card
│   └── ...
├── services/         # Business logic layer
│   ├── auth.js       # Login, session management
│   ├── team.js       # Team CRUD, membership
│   ├── weight.js     # Weight record CRUD, stats
│   └── checkin.js    # Check-in logic
├── stores/           # State management
│   ├── user.js       # User state
│   └── team.js       # Team state
├── utils/            # Pure utility functions
│   ├── date.js       # Date formatting, parsing
│   ├── weight.js     # Unit conversion (kg/lb)
│   └── privacy.js    # Data masking, privacy helpers
├── models/           # Data type definitions / validation
│   ├── user.js
│   ├── team.js
│   └── weight.js
├── config/           # App configuration
│   └── constants.js  # Enums, limits, defaults
└── assets/           # Static assets (images, icons)

cloudfunctions/
├── auth/             # Login, token management
├── team/             # Team operations
├── weight/           # Weight record operations
├── invitation/       # Invite code generation and validation
└── notification/     # (post-MVP) notifications

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

## Data Model Requirements

`docs/data-model.md` must cover at minimum:

### User
- openid (string, PK, from wx.login)
- nickName (string)
- avatarUrl (string)
- createdAt (datetime)
- privacySettings { shareWeight: boolean } (object, default: { shareWeight: false })
- defaultUnit (string, 'kg' | 'lb', default: 'kg')

### Team
- teamId (string, PK)
- name (string, required)
- inviteCode (string, unique, generated)
- createdBy (string, FK → User.openid)
- createdAt (datetime)
- memberCount (number, derived)

### TeamMember
- teamId + openid (composite key)
- role ('admin' | 'member', default: 'member')
- joinedAt (datetime)
- goalWeight (number, nullable)
- goalDate (datetime, nullable)

### WeightRecord
- recordId (string, PK)
- openid (string, FK → User.openid, indexed)
- weight (number, required, sensitive — never log raw value)
- unit (string, 'kg' | 'lb')
- recordedAt (datetime, indexed)
- note (string, optional, max 200 chars)
- createdAt (datetime)
- createdBy (string, always = openid, validated server-side)

### Goal
- goalId (string, PK)
- openid (string, FK → User.openid)
- targetWeight (number, required, sensitive)
- startWeight (number, required, sensitive)
- startDate (datetime)
- targetDate (datetime)
- status ('active' | 'achieved' | 'abandoned')
- createdAt (datetime)

### CheckIn
- checkInId (string, PK)
- openid (string, FK → User.openid)
- teamId (string, FK → Team.teamId)
- date (string, YYYY-MM-DD, indexed)
- weight (number, optional, sensitive)
- note (string, optional, max 500 chars)
- mood (string, optional: 'great' | 'good' | 'ok' | 'struggling')
- createdAt (datetime)

### Invitation
- inviteCode (string, PK)
- teamId (string, FK → Team.teamId)
- createdBy (string, FK → User.openid)
- expiresAt (datetime)
- maxUses (number, default: 10)
- useCount (number, default: 0)
- isActive (boolean, default: true)
- createdAt (datetime)

Each entity must specify: field name, type, required/optional, default value, index recommendations, permission rules, privacy risk level, data lifecycle (retention, deletion policy).
