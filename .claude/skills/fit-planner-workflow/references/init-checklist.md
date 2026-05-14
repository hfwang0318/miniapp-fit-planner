# Initialization Checklist

Run this when the skill is first invoked in a project that lacks the docs/ directory and structured workflow files.

## Step 1: Verify Project State

- [ ] `git status` — is this a Git repository? If not, initialize: `git init`
- [ ] Is there a `README.md`? If not, create one.
- [ ] Does `docs/` directory exist? If not, create it: `mkdir -p docs`
- [ ] Check existing code structure: `miniprogram/`, `cloudfunctions/`
- [ ] Check `project.config.json` for existing configuration

## Step 2: Technology Selection Evaluation

As Orchestrator, evaluate and decide on technology choices. Document in `docs/decisions.md`:

1. **Native vs Cross-platform**: Evaluate native WeChat mini program vs Taro/uni-app
2. **Cloud vs Self-hosted**: Evaluate 微信云开发 vs CloudBase vs custom backend
3. **State management**: Evaluate global store vs page-level state
4. **Component library**: Evaluate TDesign Weixin vs custom components
5. **Charts**: Evaluate ECharts for mini program vs custom canvas

Write decisions with: Date, Context, Decision, Rationale, Consequences.

## Step 3: Create Foundation Docs

Create these files with initial content:

### docs/product-requirements.md
```markdown
# Product Requirements — Fit Planner

## Overview
A WeChat mini program for small teams (~4 people) to manage weight collaboratively.

## Core Scenarios
- Member joins team
- Record weight
- Set personal goal
- View personal trend
- View team progress overview
- Check-in
- Mutual accountability
- Periodic review

## MVP Scope
[See architecture-constraints.md for full MVP list]

## Post-MVP
[See architecture-constraints.md for deferred features]
```

### docs/feature-list.md
```markdown
# Feature List

| ID | Feature | Priority | Status | Version |
|----|---------|----------|--------|---------|
| F-001 | User login | P0 | Planned | MVP |
| F-002 | Create team | P0 | Planned | MVP |
| F-003 | Join team | P0 | Planned | MVP |
| F-004 | Record weight | P0 | Planned | MVP |
| F-005 | Edit/delete weight record | P1 | Planned | MVP |
| F-006 | Set goal weight | P0 | Planned | MVP |
| F-007 | Personal weight trend | P0 | Planned | MVP |
| F-008 | Team progress overview | P0 | Planned | MVP |
| F-009 | Check-in | P0 | Planned | MVP |
| F-010 | Basic privacy settings | P0 | Planned | MVP |
| F-011 | Invite member | P1 | Planned | Post-MVP |
| F-012 | Weekly/monthly report | P2 | Planned | Post-MVP |
| F-013 | Leaderboard | P2 | Planned | Post-MVP |
| F-014 | Data export | P2 | Planned | Post-MVP |
| F-015 | Admin remove member | P1 | Planned | Post-MVP |
| F-016 | Member leave team | P1 | Planned | Post-MVP |
| F-017 | Weight unit setting | P1 | Planned | Post-MVP |
| F-018 | Note/remark | P1 | Planned | Post-MVP |
| F-019 | Dashboard homepage | P0 | Planned | MVP |
| F-020 | Share entry | P2 | Planned | Post-MVP |
```

### docs/task-board.md
```markdown
# Task Board

## Backlog
(empty — populate as requirements come in)

## Ready
(empty)

## In Progress
(empty)

## Review
(empty)

## Testing
(empty)

## Done
(empty)
```

### docs/architecture.md
```markdown
# Architecture Design — Fit Planner

## Technology Stack
[To be filled after Step 2 evaluation]

## Layer Architecture
[Describe: Page Layer → Service Layer → Data Layer]

## Page Routes
[Document all page paths and their relationships]

## State Management
[Describe state management approach]

## Data Flow
[Describe data flow between pages, services, and cloud]

## Subpackage Strategy
[Describe how pages are split into subpackages]
```

### docs/data-model.md
See architecture-constraints.md for full entity definitions. Create with the entities listed there.

### docs/api-contract.md
```markdown
# API Contract

## Cloud Functions

### auth
- **login**: POST, input: { code }, output: { token, user }
- ...

[To be filled as features are implemented]
```

### docs/test-plan.md
```markdown
# Test Plan

## Test Cases

[To be filled per feature]

## Bug Log

| ID | Feature | Severity | Description | Status | Date |
|----|---------|----------|-------------|--------|------|
```

### docs/decisions.md
```markdown
# Architecture Decision Records

## ADR-001: [Decision title]
- **Date**: YYYY-MM-DD
- **Context**: [what problem are we solving]
- **Decision**: [what we decided]
- **Rationale**: [why]
- **Consequences**: [what this enables, what it precludes]
```

### docs/changelog.md
```markdown
# Changelog

## [Unreleased]
### Added
### Changed
### Fixed
```

### docs/git-workflow.md
```markdown
# Git Workflow

## Branches
- `main` — stable, deployable
- `feature/<name>` — new features
- `fix/<name>` — bug fixes

## Commit Format
`type: description`

Types: feat, fix, docs, refactor, test, chore

## Merge Rules
- Architecture review must pass
- Tests must pass
- Quality gates checklist must be complete
```

### README.md
Update with project overview (overwrite the template README if it's the quickstart one):
```markdown
# Fit Planner

A WeChat mini program for collaborative weight management in small teams.

## Tech Stack
[To be filled]

## Getting Started
1. Open in WeChat DevTools
2. Configure cloud environment
3. Deploy cloud functions
4. Compile and preview

## Project Structure
[See architecture-constraints.md for full structure]

## Development Workflow
This project uses the fit-planner-workflow skill for multi-agent development.
See docs/ for all project documentation.
```

## Step 4: MVP Sprint Planning

1. Review feature-list.md
2. Order MVP features by dependency:
   - User login (no deps) → first
   - Create team (needs login) → second
   - Join team (needs login) → third
   - Record weight (needs team) → fourth
   - Set goal (needs login) → fifth (can parallel with team features)
   - Personal trend (needs weight records) → sixth
   - Team progress (needs team + members + weight records) → seventh
   - Check-in (needs team + login) → eighth
   - Privacy settings (needs login) → ninth
   - Dashboard (needs all above) → tenth
3. Add the first 2-3 tasks to Ready column in task-board.md

## Step 5: Output Initialization Summary

```
## Initialization Complete

### Created
- docs/ directory with all project documentation files
- README.md (updated)

### Technology Decisions
[Summary of decisions made in Step 2]

### MVP Plan
1. [First task] → Developer
2. [Second task] → Developer
3. [Third task] → Developer

### Ready to Start
The project is ready for development. Say "开始开发 [first feature]" to kick off the first task.

Recommended first task: **User Login** — unblocks all other features.
```

## Step 6: Next Actions

After initialization:
1. Confirm the technology decisions with the user
2. Start with the first MVP task (user login)
3. Follow the 6-step workflow for each feature
