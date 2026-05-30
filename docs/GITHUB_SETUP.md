# GitHub setup — PkgGate stacked PRs

## 1. Create repo (one-time)

```powershell
gh auth login
gh repo create nithesh10/pkg-gate --public --description "Multi-signal npm package safety gate"
git push -u origin main
git push origin pr/1-scaffold pr/2-safety pr/3-providers pr/4-api pr/5-ui
```

## 2. Open tiny stacked PRs

| PR | Branch | Base | Scope |
|----|--------|------|-------|
| 1 | `pr/1-scaffold` | `main` | Next.js + Supabase template scaffold |
| 2 | `pr/2-safety` | `pr/1-scaffold` | Types, aggregator, policy, unit tests |
| 3 | `pr/3-providers` | `pr/2-safety` | OSV, npm advisories, deps.dev, npm registry |
| 4 | `pr/4-api` | `pr/3-providers` | Safety orchestrator + `/api/check` |
| 5 | `pr/5-ui` | `pr/4-api` | Traffic-light UI + watchlist v2 |

```powershell
gh pr create --base main --head pr/1-scaffold --title "chore: pkg-gate scaffold" --body "NK next-supabase template baseline."
gh pr create --base pr/1-scaffold --head pr/2-safety --title "feat(safety): aggregator and policy" --body "SafetyReport types, verdict logic, pkg-gate.policy.json, unit tests."
gh pr create --base pr/2-safety --head pr/3-providers --title "feat(providers): OSV and deps.dev" --body "External API providers with fixture tests."
gh pr create --base pr/3-providers --head pr/4-api --title "feat(api): safety orchestrator" --body "Parallel provider fetch, 24h cache, SafetyReport JSON."
gh pr create --base pr/4-api --head pr/5-ui --title "feat(ui): traffic-light report" --body "Multi-signal UI, watchlist v2 migration, README."
```

## 3. Review loop (Greptile + CodeRabbit)

1. Connect [Greptile](https://greptile.com) and [CodeRabbit](https://coderabbit.ai) to `nithesh10/pkg-gate`.
2. Enable Cursor Bugbot Autofix if using Cursor.
3. On each PR, run the **grep-loop-review-workflow** skill until 5/5 or clean.
4. Dedupe Greptile vs CodeRabbit per NK `playbooks/review-dedupe.md`.

## 4. CI

GitHub Actions runs on push: lint, typecheck, test, build (see `.github/workflows/ci.yml`).

## 5. Verify locally

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run typecheck
npm run test
npm run build
npm run dev
# curl http://localhost:3000/api/check?name=lodash
```
