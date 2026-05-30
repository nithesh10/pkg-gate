# Security Review

OWASP-oriented diff scan before merge. Run on every PR.

## Steps

1. Scan the diff for secrets: API keys, tokens, passwords, private keys, `.env` values.
2. Check auth boundaries: unauthenticated access to protected routes/handlers.
3. Check input validation on user-controlled data (SQL injection via Supabase RPC, XSS in rendered HTML, SSRF in fetch calls).
4. Verify no service-role keys or admin credentials reach client bundles.
5. Confirm new dependencies respect 7-day minimum release age (`.npmrc`).
6. Flag high-risk MCP or script additions.

## Output format

```
## Security Review
- [PASS|FAIL] Secrets scan
- [PASS|FAIL] Auth boundaries
- [PASS|FAIL] Input validation
- [PASS|FAIL] Client bundle exposure
- [PASS|FAIL] Dependency age

Issues: (list or "none")
```

Fix FAIL items before requesting Greptile/CodeRabbit review.
