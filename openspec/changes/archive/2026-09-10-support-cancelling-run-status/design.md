## Context

See `proposal.md` — Why. Two constraints shape the approach.

**The two list surfaces hold no run rows in React state.** Both are AG Grid infinite-datasource grids:
rows live inside the grid and arrive through `params.successCallback` per scroll block.
`TestSuites/Runs/Runs.tsx` does keep a `runs` state, but only as a page-0 prefetch cache — the live row set
is the grid's, and both the SSE handler (`useRunStatusStream.ts:25-29`) and the existing optimistic cancel
write straight to grid nodes via `node.setData`, bypassing React. `ListView/Evaluation/List.tsx` keeps no
row state at all. So the established poll-while-transitional pattern in `ContainersList.tsx:176-215`, which
derives its poll set from a React array (`containersList.filter(...)` in the effect deps), does not
transfer: there is nothing to put in a deps array. The run detail page is the opposite case —
`selectedRun` *is* React state, so `ContainerView.tsx:214-275` transfers to it directly.

**`CANCELLING` can regress to `RUNNING`.** A cancellation is not guaranteed to take effect, so
`CANCELLING` is not a one-way door to `CANCELLED`. This is what makes the current optimistic
`status = CANCELLED` write wrong rather than merely early, and it adds a third settle outcome that has to
be distinguished (see the spec's "Notification when a cancellation does not take effect").

Both Stop gates are already pure functions of the current status (`actions.tsx:238`, `View.tsx:95`, the
latter inside a `useMemo` keyed on `selectedRun.status`), so regression needs no gating rework — only fresh
status data.

## Goals / Non-Goals

**Goals:**
- One polling trigger condition, expressed in code the way the requirement is worded: *a displayed run is
  `CANCELLING`*. Not "the user pressed Stop", and not a list of ids to keep in sync.
- An exit condition that cannot leak a timer regardless of which status the backend settles on.
- Backward compatibility with a backend that never emits `CANCELLING`: nothing new triggers, and the
  unrecognized-status fallback still fixes the blank-cell defect on its own.

**Non-Goals** (design-level; see `proposal.md` — Non-goals for scope):
- No abstraction covering both the grid surfaces and the detail page. Their state models differ
  (grid nodes vs React state) and a hook parameterized over both would be a wrapper around `setInterval`
  with two adapters.
- No change to how rows arrive (datasource, SSE, or refresh paths).

## Decisions

**Derive the poll set by scanning the grid each tick, rather than mirroring cancelling ids into React
state.**
A single interval per list surface; each tick walks `gridApi.forEachNode`, collects ids whose
`data.status === CANCELLING`, and returns without issuing a request when there are none. The alternative —
holding a `cancellingIds` state array and keying an effect on it, mirroring `ContainersList` — was
rejected because it needs three writers to stay correct: the optimistic cancel, the SSE handler, and
*every* datasource `successCallback` (each scroll block, filter change, and sort re-enters `getRows`).
Missing the third is silent: a `CANCELLING` row simply never polls, which is the same class of quiet
failure this change exists to remove. Scanning also makes the requirement's "already `CANCELLING` when the
surface loads" case fall out for free instead of needing its own wiring, and it avoids holding node
references across ticks — infinite-datasource rows can be recycled between blocks, so a fresh scan is the
only safe read. The cost is an interval alive for the page's lifetime; each idle tick is an
O(loaded rows) walk with no I/O.

**Exit on `status !== CANCELLING`, never on an allowlist of settled statuses.**
A `{CANCELLED, FAILED}` allowlist leaks the timer when a run settles as `COMPLETED` — reachable when a run
finishes naturally in the window between the request and the backend acting on it — and would leak again
for any status the backend adds later. The inverse condition matches
`ContainerView.tsx:229-231`'s `!== PENDING && !== STOPPING` shape.

**Keep the optimistic local write; change its value to `CANCELLING`.**
The alternative is to drop optimism and let the first poll tick discover `CANCELLING`, which is simpler but
leaves the row showing `RUNNING` with a live Stop action for up to the full interval after the user
confirmed. Writing `CANCELLING` immediately is both truthful and what starts the poll, since the trigger is
the status.

**One shared hook for the two grid surfaces; an inline effect on the detail page.**
The two lists are mechanically identical (same grid API, same `forEachNode` read and `node.setData`
write-back), so they share a hook — placed next to the existing cancel UI in
`src/components/Runs/Cancel/`, following how `useRunStatusStream.ts` is co-located with the surface it
serves. The detail page gets its own effect over `selectedRun` rather than joining the hook, because its
read and write are React state, not grid nodes. This lands at two implementations rather than three; the
codebase currently tolerates three copies of the container poller (`ContainersList.tsx:176`,
`ContainerView.tsx:214`, `Images/View/Containers/Containers.tsx:87`), so consolidating the two identical
cases is an improvement without forcing the genuinely different one into the same shape.

The hook takes the `gridApi` and an enabled flag — `ListView/Evaluation/List.tsx` is shared with
TestSuites / Datasets / Metrics and must only poll when `route === ApplicationRoute.Runs`, matching how its
Runs-specific row actions are already gated inline at `List.tsx:295-296`.

**SSE composes rather than competes; `useRunStatusStream.ts` is untouched.**
Because the trigger is the status and not the button, an SSE push of `CANCELLING` starts the poll and a
push of a settled status stops it. Both writers write the backend's authoritative status to the same field,
so the write is idempotent and ordering does not matter. On the Runs tab SSE therefore acts as a latency
accelerator over a 5s floor; the floor is what makes the requirement hold if the stream drops, which this
app has precedent for (`deployment-sse-stream-resilience`).

**Detect regression from the fact that the run was being polled.**
A run is only polled while it is `CANCELLING`, so a tick that reads `RUNNING` for a polled run *is* the
regression — no extra previous-status bookkeeping. The poller owns the error notification, one per
regressing run, and the reappearing Stop action follows from the existing pure gates.

**Replace the `&&`-chain in `RunStatus.tsx` with a status-keyed descriptor plus a default.**
The blank cell has two causes — `getStatusLabel`'s `default: return ''` and the absence of any fallback
branch in the render — and both must be fixed for an unknown status to render. A lookup keyed on status
(indicator kind + label key) with a default branch that renders the raw status value addresses both, and
keeps the component free of the nested conditionals `code-standards.md` rules out. `CANCELLING` joins
`RUNNING` as an in-progress indicator; a small `TRANSITIONAL_RUN_STATUSES` set expresses that, mirroring
`LOADING_STATUSES` in `constants/deployments/images.tsx:111`.

`getStatusLabel`'s parameter widens to accept a value outside the enum, since that is precisely the case it
must now handle — today callers reach the `default` branch only by casting.

**No `aria-live` region for the status change.** The settled status is persistent visible text that
replaces the previous label in place, which `a11y.md` treats as sufficient; the regression case is
announced through `NotificationContext`, already a live region. Adding a second announcer would
double-announce the one case that is covered.

## Risks / Trade-offs

- **[Risk] An interval alive for the whole lifetime of each list page, even with nothing cancelling.** →
  Mitigation: the idle tick issues no requests — it is a walk over loaded rows and an early return. The
  trade is deliberate: the alternative moves the failure mode from "a cheap no-op timer" to "a
  `CANCELLING` row that silently never polls".
- **[Risk] On the Runs tab, SSE and the poller both write the same row, and the detail page's poll runs
  alongside its own optimistic write.** → Mitigation: every writer writes the backend's authoritative
  status to the same field, so writes are idempotent and last-write-wins is correct regardless of order.
- **[Risk] A run wedged in `CANCELLING` polls indefinitely (no ceiling, per the proposal's non-goals).** →
  Mitigation: matches every existing poller in the app; polling stops on unmount, so it is bounded by the
  user keeping the surface open, exactly as a wedged container is today.
- **[Risk] `CANCELLING → RUNNING → CANCELLING` oscillation would show the user a flickering badge and a
  Stop action that appears not to work.** → Mitigation: the regression notification is what makes the
  behavior legible rather than mysterious; whether it can also state *why* depends on an open question
  below. Deliberately not solved by widening the poll to run until terminal — see the proposal's
  non-goals.
- **[Risk] Timer-driven behavior is easy to write flaky tests around.** → Mitigation: specs use fake
  timers and assert on the scan/exit conditions rather than on wall-clock timing; `console.error`/`warn`
  are globally silenced in this repo's tests, so an unawaited state update after unmount would not
  surface as output — the hook must clear its interval on cleanup and tests must cover unmount.

## Migration Plan

No data or API migration. Deployment is order-independent with respect to the backend:

- Shipped **before** the backend emits `CANCELLING`: the unrecognized-status fallback is already the fix
  for the blank cell, and nothing else triggers. This is the safer order, and the fallback is worth
  shipping on its own account.
- Shipped **after** the backend already emits `CANCELLING`: replaces a blank status cell and a false
  "cancelled" claim with the correct display and polling.

Rollback is a plain revert; no persisted state is introduced.

## Open Questions

- Does a failed cancellation populate `Run.errorMessage` / `Run.errorDetails` (both already on the model,
  `run.ts:66-72`)? If it does, the regression notification can state the reason instead of a generic "the
  run was not stopped". Deferrable: the requirement commits only to notifying, so this refines the message
  text without changing the specs, the approach, or the task breakdown.
- Does the backend include `CANCELLING` in the `/test-suite-runs/status-stream` events? If it does, the
  Runs tab settles faster than the 5s floor. Latency only — correctness does not depend on it either way.
