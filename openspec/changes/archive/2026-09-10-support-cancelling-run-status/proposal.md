## Why

The Eval backend now reports a transitional `CANCELLING` status for a test suite run between the moment
a cancellation is accepted and the moment the run actually stops. The Admin UI does not model it, and
two things break as a result:

- **A blank status cell, shipping ahead of any feature work.** `getStatusLabel` returns `''` for an
  unrecognized status and `RunStatus.tsx` is a chain of `status === X &&` blocks with no fallback branch,
  so a `CANCELLING` run renders an empty cell — no dot, no spinner, no text. Combined with the Stop
  action hiding itself for any non-`RUNNING` status, pressing Stop makes the row appear to go blank. This
  happens with zero frontend changes deployed, as soon as the backend emits the new value.
- **The UI reports an outcome that has not happened.** All three cancel surfaces optimistically write
  `RunStatus.CANCELLED` locally on a successful request (`Runs/View/View.tsx:54-59`,
  `ListView/Evaluation/List.tsx:212-222`, `TestSuites/Runs/Runs.tsx:177-190`). The run is still winding
  down, and — because `CANCELLING` can regress back to `RUNNING` when a cancellation does not take
  effect — it may never reach `CANCELLED` at all.

The archived `cancel-test-suite-run` change predicted this exact branch in its Risks section and left the
mitigation open ("if the backend's actual cancel endpoint returns an intermediate state before settling,
that should surface during implementation ... and be folded in before this change is archived"). It was
archived without folding it in. This change folds it in.

## What Changes

- Add `CANCELLING` to the `RunStatus` enum, its label, and its badge rendering (spinner treatment,
  matching how `RUNNING` renders and how `CONTAINER_STATUS.STOPPING` is treated via `LOADING_STATUSES`).
- Give `RunStatus.tsx` / `getStatusLabel` a fallback for an unrecognized status, so the next backend
  status value degrades to the raw status text rather than an empty cell.
- Stop the optimistic lie: after a successful cancellation request each surface displays `CANCELLING`,
  not `CANCELLED`.
- Poll the run's status every 5s **while any visible row is `CANCELLING`**, and stop polling that run once
  its status leaves `CANCELLING`. The trigger is the status itself, not the button press, so a row that
  arrives already `CANCELLING` (cancelled by another user, or by this user before a reload) polls the same
  way as one this user just cancelled. Follows the established poll-while-transitional pattern
  (`ContainerView.tsx:214-275`, `ContainersList.tsx:176-215`, `ImageView.tsx:101-122`).
- Notify the user when a cancellation **fails to take effect** — the `CANCELLING → RUNNING` regression.
  Today's single toast fires on request acceptance, which in that branch tells the user the run was
  cancelled when it was not.
- Keep the existing Stop-action gating shape unchanged. Both gates are already pure functions of the
  current status (`actions.tsx:238`, `View.tsx:95`), so Stop hides during `CANCELLING` and reappears on
  its own if the status regresses to `RUNNING` — no predicate rework needed, only fresh status data,
  which the poll supplies.
- No change to `useRunStatusStream.ts` or the SSE route. Because the poll is status-triggered, an SSE
  push of `CANCELLING` starts the poll instead of racing it, and an SSE push of a settled status stops it.

## Capabilities

### New Capabilities

- `run-status-display`: how a run's status is rendered wherever a run appears (the per-status badge,
  including the new `CANCELLING` spinner treatment, and the fallback for a status value the UI does not
  recognize). Currently unspecified — `cancel-test-suite-run` documents the cancel *action* but nothing
  documents status rendering, which is why the blank-cell defect had no requirement to violate.

### Modified Capabilities

- `cancel-test-suite-run`: the two requirements that assume a cancellation settles immediately —
  "Cancellation request and status update" (the acting surface now shows `CANCELLING`, and must keep
  polling until the status settles) and its "Cancellation request fails" scenario (which names
  `CANCELLED` as the status that must not be shown). Adds requirements for the polling behavior, the
  Stop-action gating during `CANCELLING`, and the failed-cancellation notification.

## Impact

**Models and shared display**
- `apps/ai-dial-admin/src/models/evaluation/run.ts` — add `CANCELLING` to `RunStatus`.
- `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx` — `CANCELLING` branch + fallback.
- `apps/ai-dial-admin/src/components/Common/RunStatus/utils.ts` — `CANCELLING` label; non-empty default.
- `apps/ai-dial-admin/src/constants/i18n.ts`, `src/locales/en.ts` — `Runs.Status.Cancelling` and the
  failed-cancellation notification strings.
- `apps/ai-dial-admin/src/constants/runs.ts` (new) — the poll interval constant. `IMAGE_BUILD_POLL_INTERVAL`
  already happens to be 5000ms but belongs to image builds; runs get their own named constant.

**Cancellation surfaces**
- `apps/ai-dial-admin/src/components/Runs/View/View.tsx` — optimistic write becomes `CANCELLING`; adds the
  detail-page poll effect over `selectedRun`.
- `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` — optimistic write becomes `CANCELLING`;
  adds poll wiring, gated to `route === ApplicationRoute.Runs` since this component also serves
  TestSuites / Datasets / Metrics.
- `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` — same, for the per-test-suite Runs tab.
- `apps/ai-dial-admin/src/components/Runs/Cancel/` — new hook holding the grid-polling loop shared by the
  two list surfaces (exact name and placement settled in design.md).

**Unchanged, deliberately**
- `apps/ai-dial-admin/src/constants/grid-columns/actions.tsx` — `getCancelOperation`'s `hidden` predicate
  keeps its current shape; it already yields the correct behavior for `CANCELLING` and for a regression.
- `apps/ai-dial-admin/src/components/TestSuites/Runs/useRunStatusStream.ts` and
  `src/app/api/runs/status-stream/route.ts` — both already forward arbitrary status strings.
- Export and Compare gating (`status !== COMPLETED`) is already correct for `CANCELLING`.

**Read-only consumers checked, no change needed**
- `TestSuites/Trends/utils/parse-trends.ts` keys only off `FAILED`; `Runs/Compare/utils.ts` filters to
  `COMPLETED`; the Runs status grid column uses a free-text string filter
  (`evalStringFilter([EQUALS, NOT_EQUAL])`), not a fixed value list, so there is no filter option set to
  extend.

## Non-goals

- **No poll-until-terminal.** Polling covers the `CANCELLING` window only. When a cancellation regresses to
  `RUNNING` the poll stops and the Stop action reappears; the user's re-press is the re-entry point.
  Polling every `RUNNING` run would mean a background request per running row on `/runs` — a different
  feature with real load implications, not a gap in this one.
- **No poll ceiling.** The poll runs until the status leaves `CANCELLING` or the component unmounts,
  matching every existing poller in the app. A run wedged in `CANCELLING` keeps polling, exactly as a
  wedged container does today.
- **No SSE work.** No extension of the status stream to the detail page or to `/runs` (its
  `?testSuiteIds=` contract is test-suite-scoped and would need a backend change), and no resilience
  layer for the existing stream.
- **No cross-tab sync**, carried over from the original change: only surfaces that are open and showing a
  `CANCELLING` row update themselves.
- **No bulk cancel**, also carried over.
- **No change to how a cancelled run's partial results are displayed.**
