# Git Workflow

## Branches
- `main` — stable, deployable. Protected. No direct commits.
- `feature/<short-name>` — new features (e.g., `feature/user-login`, `feature/team-creation`)
- `fix/<short-name>` — bug fixes (e.g., `fix/weight-validation`)

## Commit Format
```
<type>: <short description>

<optional body — what and why>

Ref: <task-id-from-task-board>
```

### Types
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — build process, tooling, config changes

### Examples
```
feat: add team creation flow

- Team creation page with name input and validation
- Cloud function to create team and assign admin role
- Invite code auto-generation

Ref: T-002
```

```
fix: correct weight record date validation

Allow same-day records, only reject future dates.

Ref: T-012
```

## Pre-Commit Checklist
- [ ] `git status` — clean, only expected files modified
- [ ] `git diff` — reviewed, no unintended changes
- [ ] No unrelated files (other features, debug code, personal config)
- [ ] Docs are synced (all docs listed in quality gates checked)
- [ ] Test report is recorded in test-plan.md
- [ ] Architecture review is recorded (if applicable)

## Merge Rules
1. All quality gates must pass (see `docs/quality-gates.md`)
2. `git checkout main && git pull origin main`
3. `git merge feature/<name>` (or `fix/<name>`)
4. Verify merge: `git log --oneline -3`
5. `git push origin main`
6. Delete feature branch: `git branch -d feature/<name>`
7. Update task-board.md: mark merged

## If Merge Conflicts
1. Resolve conflicts manually
2. Notify Architect if conflict touches architecture-sensitive files
3. Re-run Tester on the resolved result if the merge touched business logic
4. Proceed with merge only after re-verification
