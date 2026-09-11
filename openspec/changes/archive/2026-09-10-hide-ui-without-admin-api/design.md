## Context

The admin backend (`ai-dial-admin-backend`) is being retired incrementally; prior changes
(`migrate-publications-to-core-api`, `unlink-app-runner-assets-from-admin-be`) moved individual API
calls off it. This change is the first UI-visibility step: deployments that stop configuring
`DIAL_ADMIN_API_URL` still have every admin-backend-bound page, menu entry, and Footer poll wired up,
so they render error states or 500s instead of a clean, reduced surface. `model-servings-visibility`
already established the flag → menu filter → route redirect pattern for a single route; this change
applies the same shape across the larger, still-admin-backend-bound surface (Entities, Builders, Access
Management, Audit, Import/Export config, Footer).

## Goals / Non-Goals

**Goals:**

- One flag (`featureFlags.adminApiEnabled`), computed once in the root layout from
  `DIAL_ADMIN_API_URL`, drives every hide/redirect decision in this change.
- Reuse the existing `MENU_CONFIGURATION` filter-and-return pattern and the existing
  `if (!flag) redirect(ApplicationRoute.Home)` route-guard pattern verbatim — no new mechanism.
- Every route whose entire group/action is hidden also redirects server-side, so a bookmarked or
  typed URL can't reach a dead page.

**Non-Goals:**

- Removing any admin-backend API call, class, or server action. Pages still call the same actions when
  the flag is `true`; this change only decides whether the page is reachable and rendered at all.
- Touching Catalog, Assets, Deployments, Evaluation, Approvals, or Analytics — none of them depend
  exclusively on `DIAL_ADMIN_API_URL` today (Assets/Approvals/Catalog already read Core; Deployments
  and Evaluation have their own flags).
- Changing `DISABLE_MENU_ITEMS` behavior — it keeps working as an independent, manual override, same as
  it does today for Deployments/Evaluation.

## Decisions

**Flag shape mirrors `evaluationEnabled`.** `adminApiEnabled: process.env.DIAL_ADMIN_API_URL != null`
in `[lang]/layout.tsx`, added to `FeatureFlags`. No `isValueTruthy` needed — this is a URL, not a
boolean toggle, so presence is the signal (same reasoning as `evaluationEnabled` on
`DIAL_EVAL_API_URL`).

**Menu filtering happens inside `MENU_CONFIGURATION`, not via `DISABLE_MENU_ITEMS`.** The four groups —
Entities, Builders, Access Management, and Audit (hidden in full, not item-by-item) — are filtered by
key in the same `result = result.filter(...)` chain already used for Deployments/Evaluation/Analytics,
rather than folding into `getActualMenuItems`'s string-list mechanism. Keeping it there means the
composition guarantee already tested by `menu-group-visibility` (each group's own flag, independent of
the others) extends mechanically to the new groups.

**Menu actions gate in `MenuContent`, not a new component.** `MenuContent` already reads
`featureFlags` via `useAppContext()` for other decisions; the two action buttons (Import/Export) become
conditional on `featureFlags.adminApiEnabled` in both `MenuActionsBar` (expanded) and the
`MenuActions`/collapsed bar. `System properties` is untouched — it does not depend on the admin
backend.

**`Content` gates rendering and polling with a single check.** `Content` is a client component with
`featureFlags` available via `useAppContext()`. The `Footer` JSX and the two `useEffect` blocks that
start `checkAppStatus`/`checkCoreVersion` polling are both wrapped by the same
`featureFlags.adminApiEnabled` condition, so the admin-backend calls are never issued when the flag is
`false` — not merely deferred.

**Route guards are added per-page, not via middleware.** Following `model-servings/page.tsx`, each
affected `page.tsx` gets `if (!process.env.DIAL_ADMIN_API_URL) redirect(ApplicationRoute.Home);` as the
first statement, before any data fetch. A shared Next.js middleware was considered and rejected: this
repo has no route-guard middleware today, path matching for `[id]`/`[id]/[subId]` dynamic segments
would need its own list to maintain anyway, and the per-page guard keeps each route's behavior visible
at the point that renders it — consistent with how `model-servings-visibility` already does this for a
single route.

**Redirect predicate reads `process.env.DIAL_ADMIN_API_URL` directly in each page**, not
`featureFlags.adminApiEnabled` — pages are independent server components and don't receive
`featureFlags` as a prop (it's constructed once in the layout and handed to `AppContextProvider` for
client consumption). Reading the env var directly in the page is exactly what `model-servings/page.tsx`
does for its own flags today.

## Risks / Trade-offs

- **Repetitive guard across ~30 files** (15 route roots × up to `page.tsx` + `[id]/page.tsx` +
  `[id]/[subId]/page.tsx` — `dashboard` and `usage-log` only have a single `page.tsx` each) →
  Mitigated by copying one exact one-line pattern per file (tasks.md lists every file); no shared
  helper is introduced because the guard is a single `if` statement and a shared helper would hide the
  redirect from a reader scanning the page file, the opposite of the existing convention.
- **A future fifth group/action gated by the same flag is easy to miss** → Mitigated by the
  `admin-api-availability` spec's requirement scope being explicit about which routes it covers, so
  adding a new one is a spec change, not a silent omission.

## Open Questions

None — the flag semantics, filtering pattern, and redirect pattern all already exist in the codebase
for equivalent cases.
