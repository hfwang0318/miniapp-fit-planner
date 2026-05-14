# Test Plan

## Overview
This document tracks test cases, bug reports, and verification results for the fit-planner mini program. Tests are added per feature and executed by the Tester agent in Step 5 of the development workflow.

## Cycle 1: Basic Weight Management — Test Results

**Date**: 2026-05-14
**Tester**: Agent
**Verdict**: PASS WITH WARNINGS
**Merge**: APPROVED

### Test Cases

| ID | Description | Expected | Result |
|----|-------------|----------|--------|
| TC-001 | Login flow (no session) | Redirect to login, tap login, auth cloud function, redirect dashboard | PASS |
| TC-002 | Login flow (existing session) | Skip login, go directly to dashboard | PASS |
| TC-003 | Create weight record | Form validates, cloud function validates, success, list refreshes | PASS |
| TC-004 | Create weight record (invalid weight) | Show validation error toast | PASS |
| TC-005 | Create weight record (future date) | Show "不能记录未来的日期" | PASS |
| TC-006 | View weight history | List shows records, ordered by date desc | PASS |
| TC-007 | Edit weight record | Form pre-fills, update, success, list refreshes | PASS |
| TC-008 | Delete weight record | Confirm modal, delete, success, removed from list | PASS |
| TC-009 | Pagination (reach bottom) | Load more records when scrolling to bottom | PASS |
| TC-010 | Empty state (no records) | Show empty state text | PASS |
| TC-011 | Chart (0 records) | Show "暂无数据" | PASS |
| TC-012 | Chart (1 record) | Show "需要至少2条记录" | PASS |
| TC-013 | Chart (2+ records) | Show line chart with grid, labels, data points | PASS |
| TC-014 | Dashboard (no records) | Show CTA "开始记录体重", empty state | PASS |
| TC-015 | Dashboard (with records) | Show stats cards, chart, recent entries | PASS |
| TC-016 | Double-tap prevention | Button disabled while submitting | PASS |

### Bugs Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| B-001 | P2 | Cloud function catch handler logged raw error objects | Fixed (log only .message) |

### Architecture Compliance

| Check | Result |
|-------|--------|
| Pages call only services (no direct cloud function or DB access) | PASS |
| All async operations have error handling | PASS |
| Loading states for async operations | PASS |
| Empty states for list views | PASS |
| Form validation before submission | PASS |
| No unsupported Web APIs | PASS |
| No debug code left in | PASS |
| No references to deleted demo code | PASS |

### Privacy Compliance

| Check | Result |
|-------|--------|
| Cloud functions use cloud.getWXContext().OPENID | PASS |
| Ownership verified server-side (update/delete) | PASS |
| No raw weight in console.log | PASS |
| Weight display uses formatWeight() | PASS |

---

## Test Cases (Pending — Future Features)

### Auth
| ID | Description | Preconditions | Steps | Expected Result | Status |
|----|-------------|---------------|-------|-----------------|--------|
| TC-AUTH-001 | Login success (first time) | Fresh install | Open app, tap Login | Redirect to dashboard, user created | Done |
| TC-AUTH-002 | Login success (returning user) | Existing session cached | Open app | Auto-login, redirect to dashboard | Done |

### Team
| ID | Description | Preconditions | Steps | Expected Result | Status |
|----|-------------|---------------|-------|-----------------|--------|
| TC-TEAM-001 | Create team success | Logged in | Enter team name, tap create | Team created, admin role, invite code shown | Pending |
| TC-TEAM-002 | Create team empty name | Logged in | Leave name empty, tap create | Show validation error | Pending |
| TC-TEAM-003 | Join team valid code | Logged in, valid code | Enter code, tap join | Join success, redirect to team | Pending |
| TC-TEAM-004 | Join team invalid code | Logged in | Enter invalid code | Show error | Pending |

## Bug Log

| ID | Feature | Severity | Description | Status | Date |
|----|---------|----------|-------------|--------|------|
| B-001 | Weight cloud function | P2 | Error catch handler logged raw error objects | Fixed | 2026-05-14 |
