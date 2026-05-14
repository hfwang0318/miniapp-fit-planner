# Workflow Templates

## Table of Contents
1. Requirement Processing Template (Orchestrator)
2. Architecture Review Template (Architect)
3. Developer Completion Report (Developer)
4. Test Report Template (Tester)
5. Git Commit & Merge Template (Orchestrator)

---

## 1. Requirement Processing Template

Used by: Orchestrator (Step 1)

```
## Requirement Analysis — [Feature Name]

### User Intent
[1-2 sentences summarizing what the user wants]

### Feasibility Assessment
- Reasonable: [yes / no — if no, explain why]
- Within scope: [MVP / post-MVP / out of scope]
- Missing info: [list only blocking questions; otherwise state assumptions]

### Task Breakdown
| ID | Task | Priority | Depends On | Assignee | Estimate |
|----|------|----------|------------|----------|----------|
| T-001 | [task description] | P0/P1/P2 | — | Developer | S/M/L |

### Documents Updated
- [ ] product-requirements.md
- [ ] feature-list.md
- [ ] task-board.md

### Next Step
Architect design (Step 2) — dispatched to Architect agent
```

---

## 2. Architecture Review Template

Used by: Architect (Step 4)

```
## Architecture Review — [Feature/Fix Name]

### Reviewed Artifacts
- Files changed: [list]
- Architecture docs consulted: [list]

### Review Findings

#### 1. Layer Boundary Compliance
[Pass / Issues Found]
- [specific file:line if issue]

#### 2. Dependency Direction
[Pass / Issues Found]
- [circular deps, wrong import direction, etc.]

#### 3. Business Logic Placement
[Pass / Issues Found]
- [logic in wrong layer, UI logic in service, etc.]

#### 4. Duplication
[Pass / Issues Found]
- [what was reimplemented, where it exists already]

#### 5. Extensibility Impact
[Pass / Concerns]
- [does this block planned work?]

#### 6. Refactor Necessity
[None / Recommended]
- [what should be restructured and why]

### Privacy Check
- [ ] No raw weight exposure between members
- [ ] Cloud DB rules are adequate
- [ ] No sensitive data in logs

### Verdict
**Status**: APPROVED / CHANGES REQUESTED / BLOCKED

[If not approved]:
- Required changes:
  1. [specific instruction]
  2. [specific instruction]
- Return to Developer for fixes
```

---

## 3. Developer Completion Report

Used by: Developer (Step 3 output)

```
## Developer Report — [Feature/Fix Name]

### Branch
`feature/<name>` or `fix/<name>`

### Modified Files
| File | Change | Description |
|------|--------|-------------|
| path/to/file.js | Added/Modified/Deleted | What and why |

### Core Implementation Notes
- [Key design decision 1]
- [Pattern used and why]
- [Assumption made]

### Local Verification
1. [Step to verify in WeChat DevTools]
2. [Expected result]
3. [Screenshots if applicable]

### Self-Check
- [ ] Architecture constraints followed
- [ ] Privacy rules respected (no raw weight exposure)
- [ ] Error paths handled
- [ ] WeChat DevTools build succeeds
- [ ] No console.errors introduced
- [ ] No debug code left in

### Known Risks
- [Edge case not handled: description and why deferred]
- [Assumption that might need validation]

### Impact on Existing Features
- [Yes/No] — [if yes, what and how]
```

---

## 4. Test Report Template

Used by: Tester (Step 5 output)

```
## Test Report — [Feature/Fix Name]

### Test Scope
- Features tested: [list]
- Features NOT tested: [list with reason]
- Regression areas checked: [list]

### Test Cases
| ID | Description | Expected | Actual | Status |
|----|-------------|----------|--------|--------|
| TC-001 | [scenario] | [expected] | [actual] | PASS/FAIL |

### Bugs Found
| Bug ID | Severity | Description | Reproduction | Expected | Actual |
|--------|----------|-------------|-------------|----------|--------|
| B-001 | P0/P1/P2 | [what] | [steps] | [should be] | [is] |

### WeChat DevTools Verification
- [ ] Build: success / fail
- [ ] Page render on iPhone 6/7/8: OK / issues
- [ ] Page render on iPhone X/11/12: OK / issues
- [ ] Console: clean / warnings / errors (specify)
- [ ] Network calls: expected / unexpected (specify)

### Regression Risk Assessment
[Low / Medium / High] — [explanation]

### Verdict
**Status**: PASS / FAIL / PASS WITH WARNINGS

**Merge Recommendation**: APPROVE / BLOCK

[If BLOCK]: List all blocking items with owner assignment.
[If PASS WITH WARNINGS]: List warnings that should be addressed in follow-up.
```

---

## 5. Git Commit & Merge Template

Used by: Orchestrator (Step 6)

### Pre-Commit Checklist
```
- [ ] git status — clean, only expected files modified
- [ ] git diff — reviewed, no unintended changes
- [ ] No unrelated files (other features, debug code, personal config)
- [ ] Docs are synced (all docs listed in Gate 4 checked)
- [ ] Test report is recorded in test-plan.md
- [ ] Architecture review is recorded (if applicable)
```

### Commit Message Format
```
<type>: <short description>

<optional body — what and why>

Ref: <task-id-from-task-board>
```

Types:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — build process, tooling, config changes

Examples:
```
feat: add team creation flow

- Team creation page with name and settings
- Cloud function to create team and assign admin role
- Invite code auto-generation

Ref: T-003
```

```
fix: correct weight record date validation

Allow same-day records, only reject future dates.

Ref: T-012
```

### Merge Steps
1. All quality gates passed (see quality-gates.md)
2. `git checkout main && git pull origin main` (ensure up to date)
3. `git merge feature/<name>` (or `git merge fix/<name>`)
4. Verify merge: `git log --oneline -3`
5. `git push origin main`
6. Delete feature branch: `git branch -d feature/<name>`
7. Update task-board.md: mark merged

### If Merge Conflicts
1. Resolve conflicts manually
2. Notify Architect if conflict touches architecture-sensitive files
3. Re-run Tester on the resolved result if the merge touched business logic
4. Proceed with merge only after re-verification

---

## Cycle Summary Template

Used by: Orchestrator (after Step 6)

```
## Cycle Summary — [Feature Name]

### Result
[DONE / PARTIAL / BLOCKED]

### Changes
| File | Description |
|------|-------------|
| path/to/file | what changed |

### Task Status
| Task ID | Status | Notes |
|---------|--------|-------|
| T-001 | Done | |
| T-002 | Done | |

### Git
- Branch: feature/<name>
- Commits: [list]
- Merged to main: [yes / no / pending reason]

### Next Steps
1. [concrete action] → [agent]
2. [concrete action] → [agent]
```
