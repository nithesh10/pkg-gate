# PkgGate

Multi-signal npm package safety checker aligned with the NK workspace 7-day release-age policy.

## Signals

| Signal | Source | Key required |
|--------|--------|--------------|
| Release age | npm registry | No |
| CVE / GHSA | OSV API | No |
| npm advisories | registry bulk API | No |
| Licenses / project | deps.dev v3 | No |
| Provenance | npm `dist.attestations` | No |
| OpenSSF Scorecard | scorecard.dev API | No |
| Behavioral | Socket.dev | Optional (`SOCKET_API_TOKEN`) |

## Verdicts

- **Green** — safe to install under current policy
- **Yellow** — review recommended (medium CVEs, missing provenance, low scorecard, etc.)
- **Red / Blocked** — release age &lt; 7 days or high/critical CVEs

Policy thresholds: [`pkg-gate.policy.json`](pkg-gate.policy.json)

## Setup

```powershell
cd f:\pers-projects\pkg-gate
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Apply Supabase migrations in `supabase/migrations/` (watchlist + cache + auth RLS).

Sign in at `/login` to save packages to your watchlist.

## API

```http
GET /api/check?name=lodash
GET /api/check?name=lodash&version=4.17.21
```

Returns `SafetyReport` JSON with `verdict`, `blocked`, `blockedReasons`, and `signals`.

### Watchlist refresh (cron)

```http
GET /api/cron/refresh-watchlist
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` in env. Vercel cron is configured in `vercel.json` (daily 06:00 UTC).

## Scripts

```powershell
npm run typecheck
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run test
npm run build
```

On Windows, Vitest may need extra heap (`NODE_OPTIONS` above). CI sets this automatically.

## When not to use

Use NK `svelte-convex` template instead when live reactive UX is load-bearing — PkgGate is the reference **default-stack** app (Next.js + Supabase).
