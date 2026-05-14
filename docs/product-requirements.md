# Product Requirements — Fit Planner

## Overview
A WeChat mini program for small teams (~4 people) to manage weight collaboratively. Members join a team, record their weight, set personal goals, view personal trends, and track team progress toward mutual accountability.

## Core Scenarios
- Member joins team (via invitation code)
- Record weight (with date, value, optional note)
- Set personal goal weight and target date
- View personal weight trend (simple chart)
- View team progress overview (percentage toward goal, NOT raw weight)
- Daily check-in with mood and optional weight
- Mutual accountability through team visibility
- Periodic review of team progress

## MVP Scope
See `references/architecture-constraints.md` for full MVP list. MVP includes:
- User login
- Create team
- Join team (via invitation code)
- Record weight (with date, value)
- Edit/delete weight record
- View personal weight trend (simple chart)
- View team member progress overview (percentage toward goal)
- Basic permission control (admin vs member)
- Basic privacy setting (hide raw weight from team)
- Check-in
- Dashboard homepage

## Post-MVP
Features deferred to post-MVP:
- Weekly/monthly reports
- Leaderboard
- Data export
- Subscribe message notifications
- Advanced charts (BMI, body fat, etc.)
- Complex admin permissions (moderator, owner transfer)
- Abnormal data audit
- Gamification / incentives
- Invite member (deferred beyond invitation code)
- Weight unit setting
- Note/remark on records
- Share entry

## Non-Goals
- Social network features (friend lists, feeds, comments)
- Integration with external fitness devices or apps
- Large-scale team management (>20 members)
- Medical-grade weight tracking or health advice
- Cross-platform support (iOS/Android only via WeChat)
