# PkgGate

Multi-signal npm package safety checker aligned with the NK workspace 7-day release-age policy.

## Signals (Phase 1)

| Signal | Source | Key required |
|--------|--------|--------------|
| Release age | npm registry | No |
| CVE / GHSA | OSV API | No |
| npm advisories | registry bulk API | No |
| Licenses / project | deps.dev v3 | No |
| Provenance | npm `dist.attestations` | No |
| Behavioral | Socket.dev | Phase 2 (`SOCKET_API_TOKEN`) |

## Verdicts

- **Green** — safe to install under current policy
- **Yellow** — review recommended (medium CVEs, missing provenance, etc.)
- **Red / Blocked** — release age &lt; 7 days or high/critical CVEs

Policy thresholds: [`pkg-gate.policy.json`](pkg-gate.policy.json)

## Setup

```powershell
cd f:\pers-projects\pkg-gate
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Apply Supabase migrations in `supabase/migrations/` for watchlist persistence (optional).

## API

```http
GET /api/check?name=lodash
GET /api/check?name=lodash&version=4.17.21
```

Returns `SafetyReport` JSON with `verdict`, `blocked`, `blockedReasons`, and `signals`.

## Scripts

```powershell
npm run typecheck
npm run test
npm run build
```

## When not to use

Use NK `svelte-convex` template instead when live reactive UX is load-bearing — PkgGate is the reference **default-stack** app (Next.js + Supabase).
