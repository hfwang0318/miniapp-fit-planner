# Test Plan

## Overview
This document tracks test cases, bug reports, and verification results for the fit-planner mini program. Tests are added per feature and executed by the Tester agent in Step 5 of the development workflow.

## Test Cases

### Auth
| ID | Description | Preconditions | Steps | Expected Result | Status |
|----|-------------|---------------|-------|-----------------|--------|
| TC-AUTH-001 | Login success (first time) | Fresh install, no cached session | 1. Open app 2. Tap "Login" button | Redirect to dashboard, user created in DB | Pending |
| TC-AUTH-002 | Login success (returning user) | Existing user with cached session | 1. Open app | Auto-login, redirect to dashboard | Pending |
| TC-AUTH-003 | Login failure (network error) | Airplane mode | 1. Open app 2. Tap "Login" button | Show error message "网络连接失败，请重试" | Pending |

### Team
| ID | Description | Preconditions | Steps | Expected Result | Status |
|----|-------------|---------------|-------|-----------------|--------|
| TC-TEAM-001 | Create team success | Logged in user | 1. Navigate to create team 2. Enter name 3. Tap create | Team created, user assigned as admin, invite code shown | Pending |
| TC-TEAM-002 | Create team empty name | Logged in user | 1. Navigate to create team 2. Leave name empty 3. Tap create | Show validation error "请输入团队名称" | Pending |
| TC-TEAM-003 | Join team valid code | Logged in user, valid team exists | 1. Navigate to join team 2. Enter valid invite code 3. Tap join | Added to team, redirect to team dashboard | Pending |
| TC-TEAM-004 | Join team invalid code | Logged in user | 1. Enter invalid code 2. Tap join | Show error "邀请码无效" | Pending |
| TC-TEAM-005 | Join team expired code | Logged in user, expired code | 1. Enter expired code 2. Tap join | Show error "邀请码已过期" | Pending |

### Weight
| ID | Description | Preconditions | Steps | Expected Result | Status |
|----|-------------|---------------|-------|-----------------|--------|
| TC-WGT-001 | Record weight success | Logged in, in a team | 1. Navigate to weight page 2. Enter valid weight 3. Save | Record saved, shown in history | Pending |
| TC-WGT-002 | Record weight zero | Logged in | 1. Enter 0 as weight 2. Save | Validation error: "请输入有效体重" | Pending |
| TC-WGT-003 | Record weight negative | Logged in | 1. Enter negative number | Field should not accept negative | Pending |
| TC-WGT-004 | Record weight future date | Logged in | 1. Select future date 2. Save | Validation error: "日期不能是未来日期" | Pending |

## Bug Log

| ID | Feature | Severity | Description | Status | Date |
|----|---------|----------|-------------|--------|------|
