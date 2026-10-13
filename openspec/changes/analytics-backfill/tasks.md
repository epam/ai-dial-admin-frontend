## 1. Shared foundation

- [x] 1.1 Add the wire and presentation models: `apps/ai-dial-admin/src/models/analytics/table-backfill.ts` (ingest run, list response, start request/response) and `models/analytics/pipeline-backfill.ts` (pipeline run, list response, start request); enums for each upstream's states, pause reasons and the presentation status (Running, Paused, Done, Queued, Cancelled, Failed). Follow `models/analytics/pipeline-dlq.ts` for optional members the service omits.
- [x] 1.2 Add `constants/analytics/backfill.ts`: the span limit (366), the poll interval (5 s), the pipeline runs list size (10), the ingest runs retained (5) used in the retention text.
- [x] 1.3 Add pure utilities in `utils/analytics/backfill.ts`: wire state → presentation status (group-trigger `done` → Queued; `completed` → Done); first-day/last-day → window moments and back (whole days or exact moments); span in days and the validity of a range (UTC today); the re-run range from failed days and the original end; days-progress "day N of M".
- [x] 1.4 Add a polling hook `hooks/use-polled-read.ts` taking a read function, an interval and a terminal predicate, stopping at the terminal state and on unmount. Build it on `use-guarded-read.ts` so a late answer cannot overwrite a newer one (a read racing a Pause or Resume); `use-minute-tick.ts` is a clock for relative times, not a poller, and is not reused.
- [x] 1.5 Add the shared shell `components/Analytics/Common/BackfillSidebar/`: header with title and status chip, labelled rows, copyable id row, actions slot, and a runs-list slot. Build it as a feature wrapper; add no prop to a `Common/*` component.
- [x] 1.6 Add the date-range field `components/Analytics/Common/BackfillSidebar/BackfillRangeField.tsx`: two date inputs, the day count, and the issue it is given shown beside it. Built on two ui-kit 2.0 `Calendar`s in date mode; the shared `Common/RangePicker` is not reused because it caps at the reader's local today, not UTC today.
- [x] 1.7 Add i18n keys for both areas under a `BackfillI18nKey` enum in `constants/i18n.ts` and the strings in `locales/en.ts`, reusing `BasicI18nKey` and `ButtonsI18nKey` labels.

## 2. Backfill data: service layer

- [x] 2.1 Extend `server/analytics/analytics-data-api.ts` with start (`POST` the range with re-ingest off), read by id, and list with an optional state filter; add the URL constants beside the existing ones.
- [x] 2.2 Add server actions to `app/[lang]/tables/actions.ts`: start, read, list; each authenticates through the existing token helper and returns the existing `ServerActionResponse` so a refusal carries the service's message.

## 3. Backfill data: Tables UI

- [x] 3.1 Add the **Backfill data** toolbar button to `components/Analytics/Tables/TablesView.tsx`, shown only to a full admin and hidden while a run is in progress; it opens the sidebar through `AppContext.sidebar`.
- [x] 3.2 Add the in-progress banner above the listing: read once for running runs, "day N of M" and start time, a control that opens the sidebar, status semantics for assistive technology.
- [x] 3.3 Add the sidebar body for an ingest run: presented run (running, else latest, else chosen), counts with the skipped/dropped note, failed days, copyable id, the already-ingested note for a Done run with zero files, retention text, empty state.
- [x] 3.4 Add the retained-runs list at the bottom of the sidebar with selection.
- [x] 3.5 Add the start form (range field, day count, start control) shown only when no run is in progress, and the **Re-run from** control for a Done-with-failed-days or Failed run when no run is in progress; show the service's message on a refusal and keep the form.
- [x] 3.6 Poll the presented run while it is running and re-read the banner when the run reaches a terminal state.

## 4. Pipeline backfill: service layer

- [x] 4.1 Extend `server/analytics/analytics-runner-api.ts` with start (with an optional window), read by id, list narrowed by pipeline name with a limit, and pause, resume and cancel by run id; add the URL constants.
- [x] 4.2 Add server actions to `app/[lang]/pipelines/actions.ts` for each, with the existing "no runner configured" handling; reuse `requeueFailures` and the dead-letter listing narrowed by run for the failure count.

## 5. Pipeline backfill: pipeline detail UI

- [x] 5.1 Add the **Backfill** button to the header row in `components/Analytics/Pipelines/Common/PipelineDetailFrame.tsx` (the frame `PipelineDetailView` renders) (full admin and a configured runner only), opening the sidebar from every tab.
- [x] 5.2 Add the banner for a running or paused run beside `Common/PipelinePauseBanner.tsx`, suppressed for the two pipeline-paused reasons, with the reason for other paused runs; read once, narrowed to the pipeline.
- [x] 5.3 Add the sidebar body for a pipeline run: status (with Queued for a group trigger and its explanation), window as days or "Everything" or exact moments, rows done, retrying error, paused reason and instant, dead-letter count, copyable id. The group-trigger flag comes from the page's pipeline draft (`trigger.kind`, as `PipelineDetailFrame.tsx` already reads it) and is passed to the sidebar as a prop.
- [x] 5.4 Add the latest-runs list (ten, with the "only the latest are shown" line) and selection.
- [x] 5.5 Add the controls by state: Pause, Resume, Cancel; a confirmation for Cancel; the service's message and a re-read on a refusal; **Requeue failed rows** with the count and the number the service re-ran.
- [x] 5.6 Add the start form (range field only — no replay of the whole history; "up to now" caption for today) shown only when no run is running or paused; show the runner's message on a refusal.
- [x] 5.7 Poll the presented run while it is running.

## 6. Tests

- [x] 6.1 Unit tests for the utilities in 1.3, including the Failed-run re-run range, the whole-day moments and their inverse, and the UTC-today boundary (follow `.claude/rules/testing.md`).
- [x] 6.2 Tests for the API methods and actions in 2 and 4 (URLs, bodies, the re-ingest-off flag, the omitted window for Everything).
- [x] 6.3 Component tests for the shell, range field, Tables button, banner, sidebar, start form and re-run, covering each spec scenario for `analytics/tables`.
- [x] 6.4 Component tests for the pipeline button, banner suppression, sidebar, controls, Cancel confirmation, Queued, list and requeue, covering each spec scenario for `analytics/pipelines`.
- [x] 6.5 Keep `npm run typecheck:specs` at zero for every new spec file.

## 7. Docs and spec consistency

- [x] 7.1 Check `docs/` for text that describes the Tables toolbar, the pipeline header or the Runtime tab and update it in this change; confirm each requirement in the two delta specs is reflected by a test in 6.3 and 6.4. (`docs/` holds only the menu, theming, preview-tag and upgrade documents; none describes these surfaces, so nothing to update.)

## 8. Browser verification

- [x] 8.1 Run the `spec-browser-verify` skill for this change against the local app, and resolve every `fail` verdict before the change is complete. (22 scenarios pass in round one, 8 more in round two after the review follow-ups; run on a disposable pipeline and table of our own. Starting and re-running a backfill on the Tables page was not run live — it writes the shared ingest tables — and is covered by the component tests.)

## 9. Quality checks

- [x] 9.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the full test suite; fix everything they report.

## 10. Follow-ups from review

- [x] 10.1 Draw each sidebar as up to three blocks (`BackfillSection`: run, start form, latest runs) on a background one step lighter than the sidebar's own, no border; rows inside take `layer-4`. Do not draw the list block, or the run block, when there is nothing to show.
- [x] 10.2 State the span limit, from the one constant, in the message for a range that is too long (`BackfillRangeField` takes `maxDays`).
- [x] 10.3 Remove the Everything choice from the pipeline start form; keep "Everything" only as the label of a window the runner reports without bounds.
- [x] 10.4 Put the run's controls first in its block at the large button size, and withhold Resume while the pipeline is paused with a line saying why (Cancel stays); re-hand the sidebar to the shared slot when the pipeline's pause changes while it is open.
- [x] 10.5 Keep a run's range and window on one line; show the skipped/dropped note only for a run that skipped or dropped some.
- [x] 10.6 Update the tests for 10.1–10.5, including a matrix of ingest runs with different outcomes (running, done, done with failed days, stopped early, nothing written, clean) presented through the sidebar.
- [x] 10.7 Put the start form block first, then the run, then the list, in both sidebars; order the pipeline run's facts as id, window, rows done with dead letters, then start with finish.
- [x] 10.8 Move the Tables toolbar buttons (Backfill data, Create enrichment, Create source) and the sidebar's close control to the 2.0 design system; the 1.0 close button's box was wider than its icon and made the sidebar scroll sideways, so the sidebar no longer does.
- [x] 10.9 Replace the Tables toolbar's two create buttons with one 2.0 `ButtonDropdown` "Create" offering Source and Enrichment; split the ingest sidebar into a presentational `TableBackfillSidebarView` (runs in, start out) and the container that reads the service.
- [x] 10.10 Lay out a run's facts the same way for both kinds of run in one component (`BackfillRunFacts`): id, window, outcome in one coloured row, other measures, times; explain skipped and dropped rows behind an info icon; drop the retention sentence and the yellow failed-days line beside the status.
- [x] 10.11 Replace the shared sidebar slot with the shared `Drawer` (the panel the table permissions use) at 600px through a `BackfillDrawer` wrapper that also closes on a press on the scrim; the page owns whether it is open, the sidebar content is a child, and the shell's own header and close control go.
- [x] 10.12 Show rows inserted, skipped and dropped in one row beside the days, start and finish in a row of their own, drop the failed-days list and rename the re-run control "Rerun failed".
