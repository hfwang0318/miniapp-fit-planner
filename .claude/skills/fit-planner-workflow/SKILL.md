---
name: fit-planner-workflow
description: >
  Multi-agent development workflow for the fit-planner WeChat mini program (collaborative weight management).
  TRIGGER when: user mentions developing features for this project, fixing bugs, planning architecture,
  running tests, initializing the project, or any task related to building the fit-planner mini program.
  This skill orchestrates a 4-agent workflow (Orchestrator, Architect, Developer, Tester) with strict
  quality gates, documentation sync, and Git discipline. Use whenever the user wants to build, modify,
  or plan anything in the fit-planner project, even if they don't explicitly name the skill.
---

# Fit Planner Multi-Agent Development Workflow

## Overview

This skill defines a disciplined multi-agent workflow for developing the fit-planner WeChat mini program — a collaborative weight management app for small teams (~4 people). The workflow enforces architecture review, testing, documentation sync, and Git discipline on every change.

**Core principle**: No code changes without architecture approval. No merge without test sign-off. No drift between docs and code.

## When This Skill Applies

This skill governs ALL development work in the fit-planner project. If the user is working in this project directory and asks for any code change, feature addition, bug fix, refactor, or project planning — use this workflow. The skill is also triggered by initialization requests (setting up the project docs and structure for the first time).

## Agent Roles

The workflow uses four specialized agents. You (the main conversation) act as the **Orchestrator**. The other three roles are dispatched via the `Agent` tool.

### Orchestrator (you)

You own project management, not code. Your responsibilities:

- Analyze user requirements: clarify ambiguity, judge reasonableness, identify missing info
- Split requirements into executable tasks with clear priorities
- Coordinate agent dispatch order and handoffs
- Maintain all project docs: `docs/product-requirements.md`, `docs/feature-list.md`, `docs/task-board.md`, `docs/changelog.md`, `docs/git-workflow.md`, `README.md`
- Own Git workflow: branch naming, commit discipline, merge decisions, push verification
- After each task cycle, produce a summary of changes
- Gate progression to next phase

You do NOT write business code. You may write docs, config, and process-level changes.

### Architect (subagent_type: "general-purpose")

Owns architecture integrity. Dispatched for: architecture design, schema changes, code review.

Read `references/agent-roles.md` for the full Architect brief. Dispatch with the prompt:
```
You are the Architect agent for the fit-planner project. Your job is to [design/review].
Read docs/architecture.md, docs/data-model.md, docs/api-contract.md first.
[Specific task description]
```

### Developer (subagent_type: "general-purpose")

Owns implementation. Dispatched for: feature development, bug fixes.

Read `references/agent-roles.md` for the full Developer brief. Dispatch with:
```
You are the Developer agent for the fit-planner project. Your job is to implement [task].
Read docs/architecture.md and docs/data-model.md first. Follow all architecture constraints.
Use references/architecture-constraints.md for WeChat-specific rules.
[Specific task description with acceptance criteria]
```

### Tester (subagent_type: "general-purpose")

Owns quality verification. Dispatched for: test design, test execution, regression checks.

Read `references/agent-roles.md` for the full Tester brief. Dispatch with:
```
You are the Tester agent for the fit-planner project. Your job is to test [feature/fix].
Read docs/test-plan.md and the task description first.
[Specific test scope]
```

## Standard Execution Flow

Every feature or bug fix follows this 6-step pipeline. Do not skip steps.

### Step 1 — Orchestrator: Requirement Analysis

1. Clarify the user's intent. If requirements are vague, ask targeted questions.
2. Judge whether the requirement is reasonable and within scope.
3. Determine if it belongs to MVP or a later phase (see `references/architecture-constraints.md` for MVP scope).
4. Split into executable tasks. Each task should be completable in one Developer dispatch.
5. Update these docs:
   - `docs/product-requirements.md` — if new requirements emerged
   - `docs/feature-list.md` — add/update feature entries with status
   - `docs/task-board.md` — create task entries with priority, dependencies, assignee

**Output**: A clear task list with priorities, documented in task-board.md.

### Step 2 — Architect: Design

Dispatch the Architect to:
1. Assess whether the task affects architecture
2. If yes: update `docs/architecture.md`, `docs/data-model.md`, `docs/api-contract.md`
3. Output implementation constraints for the Developer (allowed dependencies, module boundaries, schema rules)

**Gate**: If architecture changes are needed, they must be documented before Step 3 begins.

### Step 3 — Developer: Implementation

Dispatch the Developer to:
1. Create or switch to a feature branch: `feature/<short-name>` or `fix/<short-name>`
2. Implement according to the task spec and architecture constraints from Step 2
3. Self-verify locally
4. Output a completion report (see template in `references/workflow-templates.md`)

**Gate**: Developer must not change architecture without filing an architecture change request to the Orchestrator and Architect.

### Step 4 — Architect: Code Review

Dispatch the Architect to review the Developer's diff. The review must explicitly address:
- Architecture compliance (did they break layer boundaries?)
- Dependency direction (are imports correct?)
- Business logic placement (did logic sink to the wrong layer?)
- Duplicate implementation (does something already exist?)
- Extensibility impact (does this block future work?)
- Refactor necessity (should this be restructured?)

If issues found: return to Step 3 with specific fix instructions. If clean: proceed to Step 5.

### Step 5 — Tester: Verification

Dispatch the Tester to:
1. Design test cases for the feature
2. Execute functional tests, regression tests, boundary tests
3. Note WeChat DevTools verification steps
4. Record bugs with reproduction path, expected vs actual, severity
5. Update `docs/test-plan.md`
6. Output a test report (see template in `references/workflow-templates.md`)

**Gate**: If tests fail, return to Step 3. If all pass, Tester gives merge approval.

### Step 6 — Orchestrator: Wrap-up

1. Review all outputs from Steps 1-5
2. Update `docs/task-board.md` — mark tasks complete
3. Update `docs/changelog.md` — record this change
4. Update `README.md` if the change affects project description or setup
5. Verify Git state:
   - `git status` — clean working tree
   - `git diff` — expected changes only
   - No unrelated files
   - Docs synced with code
6. Generate commit message following the format in `references/workflow-templates.md`
7. Merge branch to `main` (if tests and review passed)
8. Output a summary: what was done, which files changed, what's next

## Git Workflow

Defined in `docs/git-workflow.md`. Core rules:

- `main` is always stable and deployable
- Feature branches: `feature/<short-name>` (e.g., `feature/team-creation`)
- Bug branches: `fix/<short-name>` (e.g., `fix/weight-validation`)
- Commit format: `type: description` (feat, fix, docs, refactor, test, chore)
- Pre-commit checklist in `references/workflow-templates.md`
- No merge if tests fail or architecture review is not passed

## Quality Gates

Before any merge, all of these must pass (see `references/quality-gates.md` for details):

| Gate | Owner |
|------|-------|
| Requirements complete | Orchestrator |
| Architecture approved | Architect |
| Tests passed | Tester |
| Docs updated | Orchestrator |
| Git diff clean | Orchestrator |
| No privacy/data leak | Architect + Tester |
| No regression | Tester |
| No over-engineering | Architect |
| Error paths handled | Tester |
| Mini program compatibility | Tester |

## Documentation Sync Protocol

Every agent MUST read relevant docs before acting and update them after acting. The docs are the source of truth — not conversation context. Required files:

- `docs/product-requirements.md` — product requirements document
- `docs/feature-list.md` — feature checklist with status
- `docs/task-board.md` — task Kanban
- `docs/architecture.md` — architecture design
- `docs/data-model.md` — data model and schema
- `docs/api-contract.md` — API contract
- `docs/test-plan.md` — test plan and cases
- `docs/decisions.md` — architecture decision records
- `docs/changelog.md` — change log
- `docs/git-workflow.md` — Git workflow rules
- `README.md` — project overview

## Output Style

Be execution-oriented:
- Lead with the conclusion
- Then task status
- Then next actions
- Always specify which agent is responsible
- No vague suggestions — be concrete and actionable
- Push back on unreasonable requirements with specific problems and alternatives
- Only ask questions when missing information blocks execution; otherwise proceed with explicit assumptions

## Reference Files

Read these as needed during the workflow:

- `references/agent-roles.md` — Full role descriptions with detailed responsibilities and output formats
- `references/workflow-templates.md` — All templates: requirement processing, architecture review, developer completion report, test report, Git commit/merge
- `references/quality-gates.md` — Detailed quality gate checklist
- `references/architecture-constraints.md` — WeChat mini program constraints, privacy rules, anti-overengineering principles, MVP scope, data model requirements, directory structure

## Initialization

When first invoked in a project without docs, run the initialization workflow described in `references/init-checklist.md`. This sets up all documentation files, establishes the MVP plan, and creates the first task board.
