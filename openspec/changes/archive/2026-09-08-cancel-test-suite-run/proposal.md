## Why

Once a test suite run starts, there is no way to stop it from the Admin UI. A run started by mistake,
or one that is taking too long, can only be waited out — the backend already supports cancellation
(`POST /api/v1/test-suite-runs/{id}/cancel`), but nothing in the frontend exposes it.

## What Changes

- Add a `CANCELLED` value to the `RunStatus` enum and its badge rendering, matching the backend's
  status string.
- Add a "Cancel" action to the run detail page header, visible only while `status === RUNNING`, gated
  behind a confirmation dialog (following the `stop-image-build` header-button pattern).
- Add a "Cancel" row action to both Run-row-bearing list surfaces' context menus — the main `/runs`
  list (`ListView/Evaluation/List.tsx`) and the per-test-suite Runs tab
  (`TestSuites/Runs/Runs.tsx`) — visible only while `status === RUNNING`, gated behind a confirmation
  dialog (following the Containers list's `getRunOperation`/`getStopOperation` row-menu pattern).
  Both surfaces already duplicate the Export/Compare row actions independently, so Cancel follows the
  same existing duplication rather than introducing a new shared list component.
- Add a `cancelRun` server action and a corresponding `runsApi` method calling the cancel endpoint.
- After a successful cancel, refresh the acting surface's own view of the run (detail page:
  `router.refresh()`; list page: existing grid datasource reload) so the status updates without a
  manual page reload.

## Capabilities

### New Capabilities

- `cancel-test-suite-run`: ability to cancel a pending or running test suite run from both the run
  detail page and the Runs list, including the new `CANCELLED` status value and its display.

### Modified Capabilities

_None._ No existing spec documents the Runs detail page or Runs list actions today, so this is a new
capability rather than a delta on an existing one.

## Impact

- `apps/ai-dial-admin/src/models/evaluation/run.ts` — add `CANCELLED` to `RunStatus`.
- `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx` — render the new status.
- `apps/ai-dial-admin/src/server/eval/runs-api.ts` — add a `cancelRun` API method.
- `apps/ai-dial-admin/src/app/[lang]/runs/actions.ts` — add a `cancelRun` server action.
- `apps/ai-dial-admin/src/components/Runs/View/View.tsx` — add the Cancel button + confirmation modal
  to the detail page header.
- `apps/ai-dial-admin/src/constants/grid-columns/actions.tsx` — add the shared `getCancelOperation`
  row-action factory and its gating.
- `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` — wire the Cancel row action into the
  per-test-suite Runs tab.
- `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` — wire the Cancel row action into
  the main `/runs` list (`route === ApplicationRoute.Runs`).
- `apps/ai-dial-admin/src/components/TestSuites/Runs/useRunStatusStream.ts` — no code change expected
  (it already forwards arbitrary status strings), but the new `CANCELLED` value must render correctly
  wherever it lands.

## Non-goals

- No cross-tab/live sync of run status: if a run is cancelled from one open tab or by another user,
  a different tab already viewing that run's detail page is not required to reflect the change until
  it is refreshed by some other action or reload. Only the surface that performed the cancel is
  required to update itself.
- No bulk-cancel action on multi-selected rows in the Runs list — this change is single-run cancel only,
  from either surface.
- No changes to how a run's partial results (test cases already completed before cancellation) are
  displayed — this is a status/action change only; result display behavior for a cancelled run follows
  whatever the backend already returns.
