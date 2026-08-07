## Context

`QueryBuilder.tsx` is the orchestrator: it owns `QueryBuilderState`, the view (`Form` / `Json` / `Sql` /
`Ai`), the SQL and JSON buffers, the schema-loading lifecycle, the result and its `ExecutedQueryMeta`, and
— through `useTimeFilter()` — the toolbar time filter. Everything a saved query has to capture is in that
one component, with one exception: the Table ⇄ Chart selection and the `ChartConfig` live in
`ResultArea`'s local state, below the orchestrator and out of its reach.

ADAS's `saved-queries` capability is shipped and frozen (`openspec/specs/saved-queries/spec.md` on
`worktree-saved-queries`). It decides far more than storage: the body is validated by the same translation
its execute endpoint would run, so an unrunnable query cannot be saved; a literal bound to a `sensitive`
column is refused outright with no in-place remedy; `source` is derived server-side; and the server-assigned
fields are *rejected* rather than ignored when sent back. The client's job is to adapt, not to negotiate.

Three constraints shape everything below.

1. **`buildQuery(state, timeBound)` injects the toolbar range** as a `ge`/`le` pair on the timestamp
   column. Serializing what the JSON view shows would freeze "Last 2d" into two instants.
2. **The list response is complete.** Every entry is byte-for-byte the single `GET`, bodies included,
   most recently updated first. Selecting a row needs no request.
3. **`isFullAdmin` already exists** on `AppContext` and already collapses auth-off into full admin.
   `isEnableAuth` sits beside it and is the only way to tell "FULL_ADMIN" from "authentication is off".

Two things the shipped design document assumes but the codebase does not yet have, both of which this
change must build rather than reuse:

- **There is no unavailable-field state today.** `SelectProjection`, `FilterGroup`, and `SortKeys` render
  whatever names are in `QueryBuilderState`, whether or not those names are in `state.fields`. The design
  calls this "the same treatment schema drift already gets" — that treatment does not exist. It is new work.
- **There is no `⋯` overflow menu** on the Query Builder toolbar, and no keyboard-shortcut handling on the
  page.

## Goals / Non-Goals

**Goals:**

- Round-trip the *whole* authored state — mode, projection, filter, having, group-by, aggregates, sort,
  paging, result view, chart — so a reopened query is the query, not a fragment of it.
- Store the time **intent**, so a relative period reopens as a relative period and moves with the calendar.
- Keep catalog data out of the payload, so a saved query cannot freeze one caller's field view, mask schema
  drift, or carry restricted column names to a reader.
- Give each documented failure code its own message and its own next step.
- Make the two blocking failures (`bad_request`, `sensitive_literal_not_allowed`) rare by construction —
  Save is disabled while the query is not runnable.
- Add no role plumbing: every permission decision reads `isFullAdmin` and `scope`.

**Non-Goals:**

- Parameters in any form. See the proposal's non-goals — the rule is absolute and has no UI affordance.
- Concurrency control. Last-write-wins on a `common` query is accepted for this revision.
- Deep links. No URL parameter is read or written.
- Client-side re-sorting or paging of the list.
- Any change to how a query *runs*. Execution stays on `/v1/queries/execute` and `/execute-sql`, posting
  the stored body unchanged.

## Decisions

### D1 — The payload mapping is pure functions, not component logic

Two functions in `src/components/Analytics/QueryBuilder/utils/saved-query.ts`:

```
toSavedQueryRequest(input: SavedQueryCaptureInput): SavedQueryRequest
toBuilderRestore(saved: SavedQuery, functions, fields): SavedQueryRestore
```

`SavedQueryCaptureInput` carries everything by value — `state`, `sqlText` (or null), the form fields
(name / description / tag / scope), `timePeriod` / `isCustom` / `timeRange`, `captureTime: boolean`,
`resultView`, and `chartConfig`. No hooks, no clock reads, no `getCurrentTimeRange()` call inside; the
caller resolves the range and passes it. That satisfies `utils.md` (pure, deterministic, testable) and it
is what makes the mapping unit-testable in both directions without mounting a component.

**Alternative rejected**: mapping inline in `QueryBuilder.tsx`. It is the single highest-risk logic in the
change (two traps, both silent when wrong) and the one thing that most needs tests. Burying it in a
component that needs a full render tree to exercise would have made those tests expensive enough to skip.

### D2 — The request is built from the nine fields, never from the response

`SavedQueryRequest` is a distinct type from `SavedQuery`, not a `Pick<>` or an `Omit<>` of it. Sending any
of `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params` is a
`422` — rejected, not ignored — so an overwrite rebuilds the body from current state and the form rather
than mutating and re-posting the object it loaded. Two nominal types make the mistake unrepresentable
instead of merely discouraged.

Optional members are typed optional (`tag?: string`) and omitted from the payload when absent, matching
the "null members are omitted, not emitted as `null`" rule on the read side. No `=== null` checks anywhere
against a response.

**Exception, deliberate:** `chart.x_field` and `chart.y_field` are `string | null` and **are** sent as
explicit `null`. `null` there is meaningful — it is "the user never picked, re-derive on open", which is
exactly the property in `ResultChart` (`config.xField ?? xOptions[0]`) that stops a saved axis dangling.
Omitting them would lose the distinction between "not picked" and "not present".

### D3 — Time intent: the trap, and where it is disarmed

The `query` sent to ADAS is `buildQuery(state, null)`. The toolbar range never enters it. The user's intent
travels in `time`:

| Toolbar | `time` |
|---|---|
| checkbox off | omitted — "use whatever the toolbar has on open" |
| `!isCustom` | `{ mode: 'relative', period: timePeriod }` |
| `isCustom` | `{ mode: 'absolute', from, to }` from `timeRange`, `from ≤ to` |

Every id in `timePeriodOptionsConfig` — `15m`, `30m`, `1h`, `3h`, `6h`, `12h`, `24h`, `2d`, `7d`, `30d` —
already satisfies the backend's `^[a-z0-9_]{1,32}$`. Verified against
`src/constants/global-time-filter.ts`; a test pins it so a future option with an uppercase letter or a
hyphen fails here rather than as a `422` in someone's face.

On restore: relative → `onTimePeriodChange(period)`; absolute → `onTimeRangeChange(range, true)`; absent →
the toolbar is left exactly as it is. A relative period is **never** materialised into instants at save or
at load — that is the whole point, and it is the one behaviour that fails silently and invisibly if it
regresses (the query keeps working; it just reports the week it was authored, forever).

**An unrecognised period token** — a row saved by another client, or a deployment where
`telemetryMaxRangeMs` has since narrowed the option list — is not an error the user can act on. The
toolbar is left alone and the load proceeds. Rejecting the load over a time preset would be
disproportionate; silently substituting the default would misreport the query's intent.

### D4 — Result view and chart config become controlled, with one exception to the reset

`ResultArea` today owns `view` and `chartConfig`, and resets `chartConfig` to `DEFAULT_CHART_CONFIG` on
every new `result` — correct, because axis picks belong to one result. Both move up to `QueryBuilder` and
arrive as props (`view` / `onChangeView` / `chartConfig` / `onChangeChartConfig`); `ResultArea` keeps no
local copy.

The reset rule moves with them, plus one carve-out. Loading a saved query with a `chart` sets the config
*and* raises a one-shot flag; the next result consumes the flag instead of resetting. Every result after
that resets as before. Without the carve-out a loaded chart would be destroyed by the first Run — which is
the only way to ever see it, since `ChartConfig` needs `ExecutedQueryMeta` and that only exists after a
run. A saved chart is a preference applied to the next result, not a picture on open.

**Alternative rejected**: leaving the state in `ResultArea` and reaching it through a ref or a callback
registration. It inverts the data flow for no benefit and leaves two components disagreeing about who owns
the value.

### D5 — Dirty state is a payload comparison, not a field-by-field diff

On a successful load or save, `QueryBuilder` stores a baseline: the serialized `SavedQueryRequest` that a
Save would send at that instant. Dirty is `JSON.stringify(current) !== baseline`. Both sides come out of
`toSavedQueryRequest`, so key order is deterministic and the comparison is sound.

This gets the sort, the paging, the chart, and the time capture for free — the exact set of things whose
silent loss the whole change exists to prevent — and it cannot drift out of sync with what is actually
saved, because it *is* what is actually saved.

Whether the toolbar counts as a change follows from the loaded query: if it stored a `time`, the checkbox
state rides along in the baseline and a period change marks the query dirty; if it stored none, the
toolbar is not part of the query and moving it does not.

The unsaved-changes bar renders only when a query is loaded. An unnamed scratch query has no baseline and
no bar — there is nothing it could have diverged from.

**Alternative rejected**: a `hasUnsavedChanges` boolean flipped by every mutating handler. There are dozens
of them across the rail, and the failure mode is silent: one handler nobody remembers to flag, and the bar
lies.

### D6 — Failure branching reads the machine code that is already there

`ErrorView` is `{status, error, message, path, method}` where `error` is the stable machine code. The
existing `BaseApi.handleResponse` maps it through `getError()` into `ServerActionResponse.errorHeader`, and
`message` into `errorMessage`. So the codes this change needs — `bad_request`,
`sensitive_literal_not_allowed`, `validation_error`, `forbidden`, `not_found`, `principal_unavailable` —
already reach the client on the existing envelope. No change to `BaseApi`, `ServerActionResponse`, or the
error utils.

A `SavedQueryErrorCode` enum plus one resolver maps `(status, errorHeader)` to the copy. Note that
`getError()` substitutes the literal `'Request error'` when the body has no `error` member, so the resolver
matches on known codes and falls through to a generic message rather than trusting `errorHeader` to be a
code. Per-code handling:

| Code | Treatment |
|---|---|
| `bad_request` | Keep the dialog filled and surface the **server's own message** — the fix is in the query, not the form. Made rare: Save is disabled while `runDisabled`. |
| `sensitive_literal_not_allowed` | Blocking. Name the column from the server message and give the only real next step: run it from the builder without saving. No parameter offer, no "save anyway". |
| `validation_error` | Field-level where attributable (blank name), dialog-level otherwise. |
| `forbidden` | Prevented by gating the scope control on `isFullAdmin`; still handled, since a role can change between page load and save. Offers Save as new into personal. |
| `not_found` | Treat as gone: close, refresh the list, do not retry. Covers both an unknown id and someone else's personal row — indistinguishable by design. |
| `principal_unavailable` | Not the user's fault and not fixable by retrying. Say it is a configuration problem and to contact an administrator; do not offer a retry. |

### D7 — The library is a dialog whose footer becomes its own confirmation

`DialPopup` at ~800×540, `DialTabs` for My queries / Common, `DialSearch`, then the list grouped by `tag`,
with a preview pane on the right rendered from the row already in hand. Clicking previews; opening is the
footer button or a double-click.

With unsaved changes the footer swaps to *Keep editing* / *Discard and open*. It does **not** mount
`DiscardQueryPopup` — that popup is `createPortal`'d to `document.body` and would stack a modal on a modal,
with two focus traps fighting. The existing popup keeps its existing job (guarding a written-mode → Builder
switch) untouched.

Grouping by tag reorders rows into groups but never within one: server order is update order, and it is the
only ordering signal the response carries.

### D8 — List fetching: personal on mount, common on demand

The badge needs a count and the dialog needs rows, and both come from the same full-bodied response. So:
`personal` is fetched once when the builder mounts; `common` on first open of its tab; both refreshed after
any write and after a `404`. Selecting a row issues nothing.

The cost is one mount-time request carrying full query bodies for a number in a badge. That is the trade
the shipped API prescribes — the spec is explicit that the list is deliberately *not* projected, because a
projection would cost a round trip per selected row and withhold nothing. Fetching `common` lazily keeps
the mount cost to the caller's own rows.

### D9 — The unavailable-field state is new, and has exactly one wording

After a load resolves the schema for the query's entity, every field name the state references — `select`,
`filter`, `having`, `sort`, group-by columns and function arguments — is checked against `state.fields`.
Unresolvable names are marked in place on their chip or row, and Run is disabled until they are gone.

One message, one icon, one repair, whatever the cause: **"`x` isn't a field in `<source>`"**. A caller who
cannot resolve a column because it is restricted and a caller whose column was dropped last week must not
be able to tell which happened — if the wording forks, it discloses which columns exist, which is precisely
the invariant ADAS's sensitive-column rule spends its complexity defending. The word "restricted", and
anything meaning "no access", appears nowhere in this feature.

The load itself always succeeds. A query its own owner cannot open is a query they cannot repair.

### D10 — Scope, permission, and the auth-off case

Ownership and permission read `isFullAdmin` and `scope`. `owner_email` is rendered and never compared:
it is a snapshot taken at creation, absent whenever there is no email claim, and reassignable to a
different person.

- **Save to** offers Common only when `isFullAdmin`; changing `scope` on a PUT is a move needing write
  permission on both sides, so a non-admin never sees the control that would earn them a `403`.
- Editing a `common` query without `FULL_ADMIN`: Save is replaced by **Save as new**, which lands a copy in
  personal and leaves the original as its author left it.
- **Attribution**: under `personal`, no "Saved by" row at all — it is always you. Under `common` with no
  `owner_email`, a neutral placeholder rather than a guess or a blank.
- **`none` mode**: `isFullAdmin` is true because authentication is off, not because of a role, and
  `owner_id` is absent. The "Only you see it" copy under My queries is therefore gated on `isEnableAuth` —
  claiming privacy on a service with security switched off would be a lie.

### D11 — Which editor a saved query opens in is derived, never stored

`sql` set → the SQL view, seeded with the stored text and marked user-edited so it is never re-seeded over.
Otherwise `isBuilderRepresentable(query)` decides Builder against JSON. The same derivation feeds the row
chip in the library, so the chip and the behaviour cannot disagree — and the user knows before clicking.

Nothing about the editor is persisted; a stored `editor` field would be a second source of truth able to
contradict the body it describes.

## Risks / Trade-offs

**[A relative period silently freezing into instants]** → The single worst failure here: nothing breaks,
the query just quietly reports the wrong week forever. Disarmed at the source (`buildQuery(state, null)`),
pinned by unit tests asserting the built body carries no `ge`/`le` pair on the timestamp column, and
confirmed in acceptance by saving, moving the clock a day, and checking the range moved.

**[Last-write-wins on a common query]** → Accepted for this revision, by decision. Two admins editing one
row silently lose one edit. `generation` is returned and bumped but the API will not accept it back, so the
only real fix is `If-Match` on the backend. Revisit if it bites.

**[Lifting result-view state changes a component with no saved-query involvement]** → `ResultArea` becomes
controlled and its reset carve-out is subtle. Mitigated by keeping the behaviour identical in the absence
of a load, and by covering the carve-out (load a chart, run, chart survives; run again, chart resets) in
component tests.

**[The dirty comparison is stringify-order dependent]** → Both sides are produced by one function, so
order is deterministic. It would break if some future call path built a request body by hand. Mitigated by
`toSavedQueryRequest` being the only producer of `SavedQueryRequest` and the type being nominal enough that
hand-building one is conspicuous in review.

**[The unavailable-field state has to be built, not reused]** → It was scoped as reuse of an existing
schema-drift treatment that does not exist. It is real work — a check plus in-place markers across
`SelectProjection`, `FilterGroup`, `SortKeys`, and the group-by/aggregate rows — and it is what makes a
`common` query safe for a reader who is not its author, so it is not droppable. Sized accordingly in tasks.

**[A full-bodied list fetched on mount]** → Bandwidth for a badge. Bounded by the per-row body cap times
the caller's own row count, and reduced by fetching `common` lazily. Revisit if personal libraries grow
past the point where that is comfortable; the spec's stated remedy is paging, never field projection.

**[Free-text names travel with a shared query]** → A `common` query's title is as visible as its body, and
nothing filters a string someone typed. Out of scope here and noted in the proposal's deferred list.

## Migration Plan

Purely additive; no data migration and no backend change. The one refactor with a blast radius outside the
feature — lifting `view` and `chartConfig` out of `ResultArea` — is behaviour-preserving on its own and
lands first, so a regression there is attributable before any saved-query UI exists.

Rollback is removal: nothing in the Query Builder depends on saved queries existing, no persisted client
state is introduced, and rows already written to ADAS are inert if the UI that reads them goes away.

## Open Questions

- **The count badge before first open.** Resolved as "fetch personal on mount" (D8), which costs a
  full-bodied request for a digit. If that measures badly against a large personal library, the fallback is
  to show the badge only once the library has been opened in this session.
- **Tag vocabulary.** ADAS stores `tag` as free text with at most one per query. The save dialog offers a
  single-select built from tags already present at that scope, plus free entry. Whether personal and common
  vocabularies should stay separate (the design argues they should, so one person's habits do not leak into
  everyone's list) is settled for v1 by scope-scoped suggestion lists, but nothing enforces it server-side.
- **Name collisions.** Two saved queries may share a name under one tag; the id is the identity. The design
  proposes an inline non-blocking warning. Included as a nicety, first to cut if it complicates the save
  dialog's validation flow.
