# Label reference

Loaded on demand by the `create-ticket` skill at Steps 5 and 8.

Exact label names as configured in `epam/ai-dial-admin-frontend` (verified via `gh label list`).
When in doubt, run `gh label list --limit 300` to confirm before applying — creation fails hard on an
unknown label.

| Label | Applied When |
|---|---|
| `bug` | Type = Bug |
| `enhancement` | Type = Feature |
| `to-be-documented` | Type = Feature (always) |
| `ops-request` | Type = Task AND infra signals detected (keywords: env var, secret, config change, deployment, prod/uat, `LOG_LEVEL`, etc.) OR user invoked `/create-ticket infra: …` OR user confirms "Yes, infra" in Step 3. (Infra/ops work; this repo has no dedicated infra label, so `ops-request` is the equivalent.) |
| `P1 – Critical` | User selects Critical priority |
| `P2 – High` | User selects High priority |
| `P3 – Medium` | User selects Medium priority |
| `P4 – Low` | User selects Low priority |
| `Severity-Low` | Bug — user selects Low |
| `Severity-Minor` | Bug — user selects Minor |
| `Severity-Major` | Bug — user selects Major |
| `Severity-Critical` | Bug — user selects Critical |
| `Design Required` | Auto or asked — see Step 5 |
| `analytics-2.0` / `eval` / `cli` / `ui-kit` | Optional area label — apply when the issue clearly belongs to that area (see Step 5) |

Note: this repo has **no** `SIA-*` labels — capture security impact in the body, not a label (see Step 5).
