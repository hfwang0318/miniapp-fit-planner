# Changelog

## [Unreleased]

### Added
- **Basic weight management** (first feature implementation)
  - User login via wx.login + cloud function (auth cloud function)
  - Weight recording: create, edit, delete with validation
  - Weight history: paginated list with stats
  - Weight trend chart: custom Canvas 2D line chart (no third-party libs)
  - Dashboard: stats cards, chart preview, quick action button
  - Login page: minimal WeChat authentication flow

### Changed
- Removed all WeChat CloudBase QuickStart demo code (46+ files)
- Rewrote app.js: session management with globalData + local storage
- Rewrote app.json: updated page routes (dashboard, login, weight)
- Rewrote app.wxss: global brand styles, utility classes
- Updated project.config.json: project name to "fit-planner"

### Fixed
- Models/user.js nickName default aligned with cloud function
- Removed unused sanitizeForLogging import in services/weight.js
- Removed dead wx.login() code in services/auth.js
- Added auth guard in dashboard page onLoad
- Fixed weight cloud function error logging (only log message, not raw error object)
- Cleaned stale databaseGuide condition in project.config.json

## [Initialization]

### Added
- Project initialization: documentation structure, architecture decisions, feature list, task board
- docs/ directory with all project documentation files
- Architecture Decision Records (ADR-001 through ADR-006)
- Data model definitions for all entities (User, Team, TeamMember, WeightRecord, Goal, CheckIn, Invitation)
- API contract for cloud functions (auth, team, weight, goal, checkin)
- Feature list with 20 planned features (MVP + post-MVP)
- Initial task board with sprint-ready tasks (T-001 through T-003)
- Test plan with initial test cases for auth, team, and weight features
