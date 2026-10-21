> No browser-verification task is included: the change has browser-observable criteria and the question was
> asked, and the user chose to skip it because no available environment currently emits `CANCELLING` or the
> `CANCELLING → RUNNING` regression, which would leave the gate unable to reach the states it exists to
> check. Coverage for those states is unit tests (groups 1.4, 2.4, 3.5).

## 1. Run status model and display

- [x] 1.1 Add `CANCELLING = 'CANCELLING'` to `RunStatus` in
  `apps/ai-dial-admin/src/models/evaluation/run.ts`, and verify `npm run typecheck` passes and reports no
  newly non-exhaustive switch over `RunStatus`.
- [x] 1.2 Add `RunsI18nKey.Cancelling` to `apps/ai-dial-admin/src/constants/i18n.ts` alongside the other
  `Runs.Status.*` keys, and its `Runs.Status.Cancelling` string to `apps/ai-dial-admin/src/locales/en.ts`;
  verify by loading a `CANCELLING` run status in the existing `RunStatus` component spec and seeing the key
  resolved rather than an empty label.
- [x] 1.3 Create `apps/ai-dial-admin/src/constants/runs.ts` with `RUN_CANCEL_POLL_INTERVAL = 5000` and
  `TRANSITIONAL_RUN_STATUSES = [RunStatus.RUNNING, RunStatus.CANCELLING]` (mirroring `LOADING_STATUSES` in
  `constants/deployments/images.tsx:111`), and verify both are imported by the consumers added in later
  tasks with no duplicate literal `5000` left in run code.
- [x] 1.4 Rewrite `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx` from its
  `status === X &&` chain to a status-keyed descriptor with a default branch, and widen
  `getStatusLabel` in `apps/ai-dial-admin/src/components/Common/RunStatus/utils.ts` to accept a value
  outside the enum and return the raw status for an unrecognized one (empty for a missing one). Verify with
  new cases in `src/components/Common/RunStatus/test/RunStatus.spec.tsx` and
  `test/utils.spec.ts` covering: `CANCELLING` renders an in-progress indicator plus its label; an unknown
  status renders its raw value and is not blank; a missing status renders no text and no placeholder.

## 2. Surfaces display CANCELLING instead of CANCELLED

- [x] 2.1 Change the optimistic write in `apps/ai-dial-admin/src/components/Runs/View/View.tsx`
  (`onRunCancelled`, lines 54-59) from `RunStatus.CANCELLED` to `RunStatus.CANCELLING`, and verify the
  existing `src/components/Runs/View/tests/View.spec.tsx` cancel case asserts `CANCELLING`.
- [x] 2.2 Change the optimistic `node.setData` write in
  `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` (`onCancelRun`, lines 177-190) to
  `RunStatus.CANCELLING`, and update `src/components/TestSuites/Runs/tests/Runs.spec.tsx:127` — which
  currently asserts `status: RunStatus.CANCELLED` and will fail until updated.
- [x] 2.3 Change the optimistic `node.setData` write in
  `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` (`onCancelRunSuccess`, lines 212-222) to
  `RunStatus.CANCELLING`, and update `src/components/ListView/Evaluation/tests/List.spec.tsx:118` — same
  currently-passing assertion on `CANCELLED`.
- [x] 2.4 Add cases to `src/components/Runs/View/tests/View.spec.tsx` extending the existing
  `test.each([COMPLETED, FAILED, CANCELLED])` hidden-Stop assertion to include `CANCELLING`, and asserting
  Stop is shown again for a run whose status is `RUNNING` after having been `CANCELLING`. Verify the
  specs pass with `npx vitest run src/components/Runs/View/tests/View.spec.tsx` from
  `apps/ai-dial-admin/`.

## 3. Polling while a run is CANCELLING

- [x] 3.1 Add `apps/ai-dial-admin/src/components/Runs/Cancel/useCancellingRunsPoll.ts`: a hook taking the
  `GridApi` and an enabled flag that runs one `RUN_CANCEL_POLL_INTERVAL` interval, and on each tick scans
  `gridApi.forEachNode` for rows whose `status === RunStatus.CANCELLING`, returns early with no request
  when there are none, otherwise fetches each via the existing `getRun` server action
  (`src/app/[lang]/runs/actions.ts:16`) with `Promise.allSettled` and writes back changed statuses with
  `node.setData`. Verify it clears its interval on cleanup and issues zero `getRun` calls when no row is
  `CANCELLING`.
- [x] 3.2 Wire the hook into `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` next to the
  existing `useRunStatusStream(selectedTestSuite.id, gridApi)` call, leaving `useRunStatusStream.ts`
  unchanged; verify a `CANCELLING` row's status updates on a tick and that an SSE-delivered `CANCELLING`
  also starts polling.
- [x] 3.3 Wire the hook into `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` gated on
  `route === ApplicationRoute.Runs` (matching the existing Runs-only action gating at `List.tsx:295-296`);
  verify no polling occurs when the component renders for TestSuites, Datasets or Metrics.
- [x] 3.4 Add the detail-page poll effect to `apps/ai-dial-admin/src/components/Runs/View/View.tsx` over
  `selectedRun`, following `Containers/View/ContainerView.tsx:214-275`: while
  `selectedRun.status === RunStatus.CANCELLING`, poll `getRun` every `RUN_CANCEL_POLL_INTERVAL`, update
  `selectedRun`, and clear the interval once the status is no longer `CANCELLING` (never on an allowlist of
  settled statuses). Verify the interval clears for a run settling as `COMPLETED` as well as `CANCELLED`.
- [x] 3.5 Add specs for the poll behavior in `src/components/Runs/Cancel/tests/` and
  `src/components/Runs/View/tests/` using fake timers, covering: a run already `CANCELLING` on mount is
  polled without any user action; the displayed status updates to `CANCELLED` on settle; the interval stops
  for `COMPLETED` and `FAILED` as well; no requests are issued when nothing is `CANCELLING`; the interval is
  cleared on unmount.

## 4. Failed-cancellation notification

- [x] 4.1 Add `RunsI18nKey.CancelRunFailed` / `CancelRunFailedDescription` to
  `apps/ai-dial-admin/src/constants/i18n.ts` and their strings to `apps/ai-dial-admin/src/locales/en.ts`,
  stating the run was not stopped; verify the keys resolve in the notification specs added in 4.3.
- [x] 4.2 Emit an error notification from both pollers when a polled run's status comes back as
  `RunStatus.RUNNING` — which, because a run is polled only while `CANCELLING`, is the regression case —
  using `getErrorNotification` via `useNotification`, one per regressing run. Verify no notification is
  emitted when a run settles as `CANCELLED`, `COMPLETED` or `FAILED`.
- [x] 4.3 Add specs covering the regression path on both the detail page and a list surface: a run polled
  as `RUNNING` produces exactly one error notification, its displayed status becomes `RUNNING`, and the
  Stop action is available again; a run polled as `CANCELLED` produces no additional notification beyond
  the request-accepted one. Verify with `npx vitest run` on the touched spec files from
  `apps/ai-dial-admin/`.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run test` from the repo root
  and verify all pass, with no increase in the `npm run typecheck:specs` error count for the files touched
  by this change.
