# Graphify Reference Analysis

Read architecture reports before planning features modeled on a reference app.

## When to use

- Building a feature similar to a project in `references/`
- Need blast-radius or impact analysis before a large change
- Onboarding to an unfamiliar reference codebase

## Steps

1. Ensure reference exists: `references/<name>/`
2. Index if stale or missing:
   ```bash
   node scripts/index-reference.mjs <name>
   ```
3. Read `references/<name>/.graphify/GRAPH_REPORT.md` fully before writing a plan.
4. For impact questions, query GitNexus on the same reference path.
5. Cite specific modules from the report in your plan — not generic architecture guesses.

## Do not

- Skip Graphify when explicitly modeling on a reference project.
- Treat Graphify/GitNexus as runtime dependencies of generated apps — analysis only.
