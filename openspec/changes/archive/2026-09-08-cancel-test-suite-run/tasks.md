## 1. Model & status display

- [x] 1.1 Add `CANCELLED` to `RunStatus` enum in `apps/ai-dial-admin/src/models/evaluation/run.ts` and
      run a full type-check (`npm run build` or `tsc --noEmit`) to surface any non-exhaustive switch on
      `RunStatus` that the compiler flags
- [x] 1.2 Add a `CANCELLED` case to `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx`
      and verify with a component test that the badge renders the expected icon/label for
      `RunStatus.CANCELLED`

## 2. API & server action

- [x] 2.1 Add a `cancelRun(id, token)` method to `apps/ai-dial-admin/src/server/eval/runs-api.ts`
      calling `POST /test-suite-runs/{id}/cancel`, following the existing `removeRun`/`getRun` method
      shape, and verify with a unit test that it hits the correct URL/method
- [x] 2.2 Add a `cancelRun` server action in `apps/ai-dial-admin/src/app/[lang]/runs/actions.ts`
      (`'use server'`, `getUserToken()` + delegate to `runsApi.cancelRun`, return
      `ServerActionResponse`), and verify with a unit test covering both the success and error-response
      paths

## 3. Detail page: Cancel action

- [x] 3.1 Add a status-gated "Cancel" action to `apps/ai-dial-admin/src/components/Runs/View/View.tsx`'s
      `adaptiveActions`, visible only when `run.status === RunStatus.RUNNING`, following the existing
      inline gating convention (`isCompareDisabled`, the Export `disabled` check)
- [x] 3.2 Add a `RunCancelModal` confirmation component (`DialConfirmationPopup`, danger variant,
      confirm label "Cancel"), following `ImageStopBuild.tsx`'s shape, calling the `cancelRun` server
      action on confirm
- [x] 3.3 Wire success/error handling: on success, show a success notification and call
      `router.refresh()`; on error, show an error notification and leave the displayed status unchanged
- [x] 3.4 Add component tests for `View.tsx` covering: Cancel action visible only when `RUNNING`, hidden
      for `COMPLETED`/`FAILED`/`CANCELLED`, confirmation required before the action fires, and the
      success/error notification paths

## 4. Runs lists: Cancel row action

There are two list surfaces showing run rows with a context menu — the per-test-suite Runs tab
(`TestSuites/Runs/Runs.tsx`) and the main `/runs` list (`ListView/Evaluation/List.tsx`, shared with
TestSuites/Datasets/Metrics via `route === ApplicationRoute.Runs` gating). Both need the Cancel row
action for parity with their existing Export/Compare actions.

- [x] 4.1 Add a `getCancelOperation` factory to `apps/ai-dial-admin/src/constants/grid-columns/actions.tsx`,
      following the `getStopOperation` shape, hidden unless `node.data?.status === RunStatus.RUNNING`
- [x] 4.2 Wire `getCancelOperation` into the `ACTION_COLUMN` in
      `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx`, lifting confirmation-modal state to
      the list component following the existing `isDeleteModalOpen`/`selectedRun` pattern
- [x] 4.3 On confirmed cancel from `Runs.tsx`, call the `cancelRun` server action, then reuse the
      existing `refreshGrid()` datasource-reload used for Delete; show success/error notifications
      matching the Delete flow's notification helpers
- [x] 4.4 Add component tests for `Runs.tsx` covering: Cancel action visible only for `RUNNING` rows,
      hidden for terminal statuses, confirmation required, and the grid reflecting the row's updated
      status after a successful cancel
- [x] 4.5 Wire `getCancelOperation` (gated behind `route === ApplicationRoute.Runs`, matching the
      existing Export/Compare gating at `List.tsx:267-270`) into
      `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx`'s action column, reusing its
      existing delete-modal state pattern for which run is pending confirmation
- [x] 4.6 On confirmed cancel from `List.tsx`, call the `cancelRun` server action, then call
      `router.refresh()` matching its existing Delete flow; show success/error notifications matching
      that flow's notification helpers
- [x] 4.7 Add component tests for `List.tsx` covering: Cancel action visible only for `RUNNING` rows when
      `route === ApplicationRoute.Runs`, absent entirely for other routes, hidden for terminal statuses,
      and confirmation required before the request fires

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` (full suite with coverage) from
      `apps/ai-dial-admin/` and confirm all pass
