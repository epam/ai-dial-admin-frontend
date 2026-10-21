## Why

An operator who changes a pipeline's declaration, or finds days missing from an ingest table, can re-drive
the history only by calling the services directly. Both upstreams have grown a backfill API — one that
re-ingests raw logs for a range of UTC days into the source tables, and one that replays a pipeline's
history on its own cursor — and nothing in the console reaches either. Without a view of the run, an
operator also cannot tell a run that is slow from one that is stuck, or learn that a run stopped early and
what it left undone.

The two backfills are different operations that share a shape: a window, one run at a time, a run that
reports what it did, and a failure list that can be acted on. They differ in what they can be told to do —
the ingest run cannot be paused or cancelled, the pipeline run can — and in what they can report: days for
the first, a bare row count for the second.

## What Changes

- **Backfill data** on the Tables page: a toolbar button that opens a **drawer** — the panel the table permissions
  use, 600px wide, closing on a press outside it — drawn as up to three blocks on a lighter background than the drawer's own: the run (the one in progress,
  or the one the reader chose, or the newest), the form that starts a new one, and the runs the service still
  retains. A block with nothing to show is not drawn. The form takes two inclusive UTC dates and sends them as
  dates; a range over the span limit is refused with a message that gives the limit. The button is withheld
  while a run is in progress and from anyone who is not a full admin.
- While an ingest run is in progress, a **banner** above the Tables listing states its progress and opens the
  drawer. It is shown for a running run only; a finished run is reached through the button.
- A finished ingest run that left failed days offers **Re-run from the first failed day**, which starts a run
  from the earliest failed day to the end of the original range. It is shown for a `completed` run that
  carries failed days and for a `failed` one, and only when no run is in progress. By default the console asks
  the service to skip what it already ingested, so the re-run does only what is missing.
- **Re-ingest already ingested data**, a checkbox on the start form and beside the re-run, off by default in
  both: it re-ingests every log in the range, to restore lost rows or apply a changed mapping, and says beside
  it that the re-written rows re-trigger the pipelines reading the source tables.
- **Backfill** on the pipeline detail page: a button in the header row, present on every tab, that opens the
  same drawer for a pipeline's backfill, in the same three blocks: the run that is running or paused (or the
  latest, or the one chosen), the start form (two inclusive UTC dates; there is no replay of the whole history),
  and the ten latest runs. Pause, Resume and Cancel are the first and largest controls in the run block,
  state-appropriate; Cancel is confirmed, and **Resume is withheld while the pipeline is paused**, because the
  runner refuses it then, with a line saying the pipeline must be resumed first. A finished run with dead letters
  offers **Requeue failed rows**, which re-runs only that run's failures. A copyable run id lets the operator
  filter `Failed rows` by hand; there is no link between the two.
- A **banner** above the pipeline's tab strip for a backfill that is running or paused, next to the existing
  pause banner. It is not shown for a run paused because its pipeline is paused: the pipeline's own banner
  already says so.
- A run of a pipeline that evaluates groups reports **Queued** where it would report Done: the run marks
  groups, and evaluation follows on the pipeline's schedule.
- One status vocabulary across both: the ingest service's `completed` is presented as **Done**.

Non-goals: pausing or cancelling an ingest run (the service has no such verb); a page listing every
pipeline's runs; a per-table backfill (the ingest run writes
every ingest target and takes no table); a progress percentage (neither service reports a total); a run
history beyond what the services retain; a link from a run to `Failed rows`; a replay of a pipeline's whole
history from the console (a run started that way elsewhere is still shown, as Everything).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: the Backfill data button, its drawer (run, form, re-run), the in-progress banner, and
  the date-window rules.
- `analytics/pipelines`: the Backfill header button and drawer, the banner above the tab strip, run
  controls, the Queued state for a group pipeline, and requeue by run.

## Impact

- New server actions and API methods against both upstreams: the analytics data service (start, read, list)
  and the enrichment runner (start, read, list, pause, resume, cancel). The runner's calls reuse the
  full-admin authorization and the not-configured handling that `AnalyticsRunnerApi` already has.
- A `BackfillDrawer` used by both entities, a wrapper over the shared `Common/Drawer` rather than new props on it:
  the shared drawer ignores outside presses on purpose, and the wrapper decides, for these two forms, that a press on
  the scrim closes.
- A polling hook with a stop on a terminal state, which the repo does not have: only ad-hoc intervals.
- The existing dead-letter requeue by run (`requeueFailures`, `RUNNER_DLQ_REQUEUE_URL`) is reused, not
  extended.
- Constants: the 366-day span limit lives in a constant that is changed together with the service's default.
- No change to the pipeline Runtime tab: its runtime view carries no backfill data, so the run is read
  separately.
