# Task Board

## Backlog
(empty — populate as requirements come in)

## Ready
| ID | Title | Priority | Depends On | Description |
|----|-------|----------|------------|-------------|
| T-001 | User Login — wx.login + cloud function auth | P0 | None | Implement WeChat login flow: wx.login() -> cloud function to get openid, store session, redirect to dashboard |
| T-002 | Create Team — team creation page + cloud function | P0 | T-001 | Build team creation UI (name), cloud function to create team doc + assign admin role + generate invite code |
| T-003 | Join Team — invitation code join flow | P0 | T-001, T-002 | Build join team page with invite code input, cloud function to validate code and add member |

## In Progress
(empty)

## Review
(empty)

## Testing
(empty)

## Done
(empty)
