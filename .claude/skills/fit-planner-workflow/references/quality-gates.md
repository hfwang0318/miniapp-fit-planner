# Quality Gates Checklist

Before any merge to `main`, ALL gates must be explicitly checked and passed. No exceptions.

## Gate 1: Requirements Completeness
**Owner**: Orchestrator

- [ ] All tasks in this cycle are marked Done in task-board.md
- [ ] User acceptance criteria are met
- [ ] No scope creep — only planned tasks were implemented
- [ ] Any discovered follow-up work is captured as new tasks (not blockers)

## Gate 2: Architecture Approval
**Owner**: Architect

- [ ] Layer boundaries are respected (pages → services → utils)
- [ ] No circular dependencies
- [ ] Business logic is in the correct layer
- [ ] No duplication of existing functionality
- [ ] New modules/entities are documented in architecture.md and data-model.md
- [ ] API contracts (cloud functions) are documented in api-contract.md
- [ ] Architecture Decision Records added for any significant design choice

## Gate 3: Test Results
**Owner**: Tester

- [ ] All planned test cases pass
- [ ] Regression tests pass (no previously working feature is broken)
- [ ] Edge cases are covered
- [ ] Error states are handled (network failure, invalid input, auth failure)
- [ ] WeChat DevTools verification is done (at minimum: build succeeds, pages render)
- [ ] All P0 and P1 bugs are fixed
- [ ] P2 bugs are documented with follow-up tasks

## Gate 4: Documentation Sync
**Owner**: Orchestrator

- [ ] feature-list.md reflects current status
- [ ] task-board.md is updated
- [ ] changelog.md has an entry for this cycle
- [ ] README.md is updated if project-level changes occurred
- [ ] architecture.md is updated if design changed
- [ ] data-model.md is updated if schema changed
- [ ] api-contract.md is updated if API changed
- [ ] test-plan.md is updated with new test cases

## Gate 5: Git State
**Owner**: Orchestrator

- [ ] `git status` shows clean working tree (no untracked or modified files unrelated to the change)
- [ ] `git diff main...feature-branch` shows only intended changes
- [ ] No debug code, console.log spam, or commented-out code
- [ ] No `.env`, credentials, or private config files (project.private.config.json in .gitignore)
- [ ] Commit messages follow format: `type: description`

## Gate 6: Privacy & Data Safety
**Owner**: Architect + Tester

- [ ] No raw weight values exposed to other team members (unless opted in)
- [ ] Team views show only progress %, trend, or check-in status
- [ ] Cloud database permission rules are restrictive (own data write, team aggregate read)
- [ ] Cloud functions validate ownership before writing weight records
- [ ] Share/share card parameters contain no weight data
- [ ] No sensitive data in logs or console output
- [ ] Data masking is applied where appropriate
- [ ] Admin cannot read individual raw weight values (without explicit opt-in)

## Gate 7: No Regression
**Owner**: Tester

- [ ] Previously working features still function
- [ ] No new console errors in WeChat DevTools
- [ ] No performance degradation (app launch, page navigation, data loading)
- [ ] Existing cloud functions still deploy and run

## Gate 8: Anti-Overengineering
**Owner**: Architect

- [ ] No abstraction that serves only one use case (rule of three)
- [ ] No speculation-driven design ("we might need this later")
- [ ] No complex patterns for simple problems (e.g., no pub/sub for a single event handler)
- [ ] Appropriate for a 4-person team app — if it smells like enterprise SaaS, it's wrong

## Gate 9: Error Handling
**Owner**: Tester

- [ ] Network failure shows user-friendly message (not a crash)
- [ ] Invalid user input shows validation error (not a crash)
- [ ] Auth failure redirects to login (not a blank page)
- [ ] Empty states are handled (e.g., "No weight records yet" instead of blank screen)
- [ ] Cloud function errors are caught and return structured error responses

## Gate 10: Mini Program Compatibility
**Owner**: Tester

- [ ] App builds without errors in WeChat DevTools
- [ ] All pages render correctly on iPhone 6/7/8 screen size (375×667)
- [ ] All pages render correctly on iPhone X/11/12 screen size (375×812)
- [ ] Package size is within limits (check in DevTools → 详情 → 代码依赖分析)
- [ ] Subpackage configuration is correct (if using subpackages)
- [ ] No usage of unsupported Web APIs (window, document, localStorage, etc.)
- [ ] All wx API calls have error callbacks (not just success)

## Final Decision

All gates passed → **APPROVE MERGE**
Any gate failed → **BLOCK**, with specific reason and owner assigned to resolve
