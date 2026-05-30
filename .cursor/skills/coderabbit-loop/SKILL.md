# CodeRabbit Review Loop

Parallel independent review alongside Greptile.

## Prerequisites

- CodeRabbit enabled on GitHub repo (coderabbit.ai)
- PR open with descriptive title and test plan

## Loop

1. CodeRabbit auto-reviews on PR open/update.
2. Read CodeRabbit summary and inline comments.
3. Address **actionable** findings: bugs, security, missing error handling.
4. Skip pure style preferences unless they match project conventions.
5. Push fixes; CodeRabbit re-reviews automatically.
6. Repeat until no actionable items remain.

## Parallel with Greptile

- Run both reviewers on the same PR — do not wait for one to finish.
- Fix each real issue once regardless of which reviewer found it.
- See `playbooks/review-dedupe.md` for conflict resolution.

## Exit

When both Greptile (5/5 or max iter) and CodeRabbit are clean, merge or run Bugbot Autofix.
