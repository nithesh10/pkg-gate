# Claude Code — PkgGate (Next.js + Supabase)

Match `.cursor/rules/`. Non-obvious conventions only.

## App

Multi-signal npm safety gate: release age (7-day rule), OSV, npm advisories, deps.dev, provenance.
Optional watchlist stores full `SafetyReport` snapshots in `watched_packages`.

**v1:** No auth — open RLS on watchlist for demo. **Follow-up:** Supabase Auth + per-user RLS.

## Stack

- Next.js 15 App Router, TypeScript strict, Tailwind v4
- Supabase Postgres (watchlist v2 columns: `verdict`, `signals_json`, `blocked`)
- Policy: `pkg-gate.policy.json`

## Layout

- `src/lib/services/safety-orchestrator.ts` — parallel provider fetch + verdict
- `src/lib/services/providers/` — npm, OSV, npm-advisories, deps.dev
- `src/lib/services/safety/` — types, aggregator, release-age
- `src/app/api/check/` — returns `SafetyReport`
- `src/components/safety-report.tsx` — traffic-light UI

## Post-feature

1. **code-structure-cleanup** skill → `src/lib/services/`
2. **security-review** on diff
3. **grep-loop-review-workflow** + **coderabbit-loop**; dedupe per NK playbooks

## Security

- `.npmrc` minimum-release-age (7 days)
- Never commit `.env.local`
- External APIs: OSV, deps.dev, npm registry — no secrets in Phase 1

## When not to use this template

Use SvelteKit + Convex when live subscriptions or reactive backend is load-bearing.
