## Context

See proposal.md — Why. Three facts about the current code shape the approach.

- The app has two right-hand panels. A slot in `AppContext.sidebar`, which a page hands content to and which
  squeezes the page; and `Common/Drawer`, a modal panel over the page that the table permissions use. The first
  version used the slot; the permissions drawer was what had been asked for, and it is the one used now.
- The runner client (`AnalyticsRunnerApi`, `analytics-runner-api.ts`) already holds the dead-letter listing
  narrowed by run id and the requeue by run, and already handles "no runner host configured" and full-admin
  authorization. The data-service client (`analyticsDataApi`) has no ingest-run call.
- The repo has no polling hook; the existing intervals are ad hoc inside components.

The two upstreams differ, and the console keeps the difference visible instead of hiding it:

| | Ingest run (data service) | Pipeline run (runner) |
|---|---|---|
| States on the wire | `running`, `completed`, `failed` | `running`, `paused`, `done`, `cancelled` |
| Window | two calendar dates, inclusive | two moments, `(from, to]` |
| Progress | days finished of days total | rows done, no total |
| Verbs | start | start, pause, resume, cancel |
| Retention | five newest, one instance's memory | a database table, listed newest first with a limit |
| Authorization | start needs an operate privilege, reads need registry read | every endpoint needs full admin |

## Goals / Non-Goals

**Goals:** one mechanism (button, drawer, banner) for both backfills; one status vocabulary; the same
drawer shell for both, with a body per entity; behavior that is exact about what each service can and cannot
report.

**Non-Goals:** a shared run model across the two upstreams — their shapes differ and a union would only move
the branching; a page of every pipeline's runs; changing the Runtime tab.

## Decisions

### D1. A header button opening a drawer, not a section in the Runtime tab

The first design placed the pipeline's backfill in the Runtime tab beside its read-only facts, with the
earlier runs as a table and the start form in a modal. It is replaced by a header button and the drawer the
Tables page uses.

- The Runtime tab states how a pipeline is processing at the moment it is read. A start form, three verbs and
  a run history are not that, and they would put the only mutating controls on the tab that is otherwise read
  only.
- The runtime view carries no backfill data, so a section there costs a second request on every visit to the
  tab by someone who may never start a backfill. The drawer reads on open and the banner reads once.
- One mechanism for two entities is one thing to learn and one component to test.

Alternative rejected: two buttons, or a dropdown, one for starting and one for history. The toolbar already
carries the controls that create a table, and a dropdown hides the history behind a menu for no gain.

The cost is visibility: a backfill is no longer in view on the Runtime tab. The banner above the tab strip
covers a run that is running or paused — the two states in which something is still happening or still held —
and the drawer covers the rest.

### D2. Shared pieces, a body per entity

Both drawers are built from the same few feature components: `BackfillDrawer` (the panel), `BackfillSection` (a
labelled block), `BackfillRunFacts` (the run's id, window, outcome and times, laid out one way), `BackfillRow`,
`BackfillStatusBadge` and the date field. Each entity supplies its body: `Tables` for the ingest run, `Pipelines`
for the pipeline run. These are new feature components; no prop is added to a `Common/*` component to fit one
caller. The body is chosen by the entity that opens the drawer, so there is no routing inside the shared pieces.

### D3. Status vocabulary: a presentation enum over two wire enums

Each upstream's states are an enum of its own spelling. A third enum, the presentation status, has Running,
Paused, Done, Queued, Cancelled and Failed, and one pure function maps a wire state — plus, for a pipeline
run, whether the pipeline's trigger is a group — onto it. `completed` maps to Done. A group pipeline's `done`
maps to Queued. The pipeline's trigger kind is read from its declaration, which the page already holds; the
run's own `kind` field is the run's kind (live, backfill, schedule) and says nothing about the trigger.

An early stop is never inferred from counts. The ingest service reports `failed` for a run that ended before
its range, and counts that sum to the total are not evidence it covered it.

### D4. Window conversion is a pure utility

For an ingest run, dates pass through unchanged as `yyyy-MM-dd`. For a pipeline run, one function turns
"first day, last day" into the lower bound `00:00:00.000 UTC − 1 ms` and the upper bound `23:59:59.999 UTC`,
because the runner's lower bound is exclusive and the version column is millisecond precision. The inverse
turns a run's reported moments back into days when they fall on those boundaries and into exact moments when
they do not, which is the case for a run started outside the console. Everything is the absence of a window.

The run's reported upper bound is the one the caller sent, not the one the service enforced: the service
clamps it on every page by its own settling lag and does not write the clamp back. So the console cannot show
where the run stopped; it shows "up to now" when the last day is today in UTC and says nothing about the
clamp otherwise.

### D5. Banners read once, runs poll

Each banner reads a list on mount: the ingest service's runs filtered to running, and the runner's runs
narrowed to the pipeline, newest ten. Neither needs the run id. The drawer reads the presented run and polls it on an
interval while it is running, through one hook that takes a read function, an interval constant and a
terminal-state predicate, and stops when the predicate holds or the component unmounts. The interval is a
constant, five seconds for both.

The banner is polled too, while its run is running and the drawer is closed. A banner left alone would announce a
run that has long finished, and its "day N of M" would never move. While the drawer is open it is the only
reader: it reads the whole list and hands every answer back to the banner's owner, so the two never poll at once
and the banner is already right when the drawer closes. A paused run is not polled — nothing about it changes
until someone acts on it, and the drawer reads on open.

### D6. Re-run is a computed range, not a service verb

The ingest service starts one range per request. The re-run range is the earliest failed day through the last
day of the original range: for a Done run with failed days the last failed day would do, but for a Failed run
the days after the stop are unattempted and are named nowhere, so only the original end covers them. Because
a start skips what the service has ingested unless re-ingest is chosen (D17), the extra days cost a listing
and nothing else; with re-ingest chosen they are written again, which the checkbox's caption states.
The computation is a pure utility with the two cases as tests.

### D7. A pipeline run is repeated by requeue, never by a new run

The runner has no restart for a finished run, and a run over a window re-drives the whole window — there is no
"already processed" predicate on its side. A new run over the same window would repeat every row at full model
cost. The failure path is therefore the existing requeue by run, which re-runs only dead letters.

### D8. Counts the services do not give are derived from what they do

The run's dead-letter count is the `total` of the dead-letter listing narrowed to the run with the smallest
page size, read when the run is presented — not for every run in a list, since the drawer presents one run.
"Day N of M" is days completed plus days failed plus the day in progress against days total.

### D9. Authorization is the full-admin role, as elsewhere

The console cannot see the service's privileges, only the caller's role. A full admin is the proxy for "may
start", as it already is for every runtime control on the pipeline page. For the ingest run this is stricter
than the service, which lets a registry reader read the run; the console withholds the whole feature from a
caller who is not a full admin, by decision, and the banner with it.

### D10. The span limit is a constant

The 366-day limit sits in a constants file and is changed with the service's default. The service's own 400 is
the backstop when the two drift, and the console shows its message. The number appears in exactly one place in
the interface — the message for a range over it — and is interpolated from the constant, so it cannot drift from
the check. An earlier version kept it out of the text altogether; a reader told only that a range is "too long"
has to guess how long is long enough.

### D11. Three blocks on a lighter background; empty blocks are not drawn

The drawer is the form, the run and the list — in that order, because starting a run is what a reader opens it for
and the form should not sit under the last run's figures — each its own labelled region (`BackfillSection`) on `layer-4`
over the drawer panel's `layer-3`, and a row inside one that needs a hover or selected surface takes `layer-3`. A border
was tried first and discarded: it put a line on every edge of a column that is already dense. A block with
nothing to show is not drawn — no list heading over a retention sentence for a service that holds no run, no run
block before there is a run — because an empty frame states nothing and costs the space of a block.

### D12. No replay of a pipeline's whole history; Resume is gated on the pipeline's pause

The first form had an Everything choice that started a run with no window. It is removed: such a run costs a
model call for every row the pipeline has ever read, the runner has no test for "already processed", and it can
neither be repeated nor abandoned cheaply. A run that was started that way elsewhere is still shown, as
Everything, because the run reports no window.

The runner repeats the start checks on a resume (the pipeline's pause, its daily budget, another running run) and
answers 409 when one fails; it does not check the pipeline for a cancel. So Resume is withheld while the pipeline
is paused — the one condition the console can see — and replaced by a line saying why, and Cancel stays. The
console cannot see the spent budget, so a resume refused for it still ends in the service's message. The drawer's
content is a child of the page, so it reads the pipeline's pause live; the slot it replaced was handed content once
and needed it handed over again whenever the pause changed.

### D13. Controls first and large

Pause and Cancel are what a reader opens the run for when it is spending model budget, so they head the run
block at the large button size rather than sitting among the run's facts or below them.

### D16. A drawer, 600px wide, that closes on a press outside it

The shared `Drawer` is the panel the permissions use: modal, over the page, 460px. The backfill drawer is the same
panel at 600px, so the outcome row of three figures and a run's window fit without wrapping. The shared one ignores
outside presses on purpose — its form holds input an accidental click would discard — and is not edited for that:
the backfill wrapper catches the press as it bubbles through the React tree out of the portal, and closes only when
the target is the scrim itself. A calendar's popup or the cancel confirmation is also "outside the panel" and a press
in it is not a press away; a press that began inside and ended on the scrim is a text selection, not a click away, and
is a mouse-down rule for that reason. The drawer is not mounted while closed, so every opening reads the service afresh
and the polling that fed the banner is the page's alone while it is shut.

### D14. One layout of a run's facts for both kinds of run

`BackfillRunFacts` fixes the order and the names: id, window, the run's outcome in rows of figures, whatever else
it measured, then start and finish in a row of their own. The two drawers differ only in what they pass for the outcome (days for an ingest, rows and
dead letters for a pipeline), so they cannot drift apart. The outcome row is coloured — a success where something went
through, a failure where something did not, nothing for a zero — which replaces the yellow "N days failed" that sat
beside the status and said again what the row already showed. What skipped and dropped mean sits behind an info icon
beside those labels; the sentence about the service keeping five runs in memory is gone, because the console cannot
act on it.

### D17. Re-ingest is a per-start choice, off by default, never inferred

The service's `includeIngested` re-ingests every log in the range, recorded or not; the overlap collapses in
the target tables' `ReplacingMergeTree`, but the re-written rows re-trigger what reads those tables. It was a
non-goal, then requested: restoring lost rows and applying a changed mapping both need it, and so does
finishing such a repair when it stopped early — a re-run with it off skips the failed day's logs the service
had already recorded, so the repair never reaches that day. The choice is therefore offered on the start form
and beside **Rerun failed**, off in both, and made anew each time: the run's own body does not say which way
it was started, so a re-run cannot inherit it. A caption states the cost; no confirmation is asked, since the
caption sits beside the only control that turns it on.

### D15. Accessibility

The banners are status regions; a change of a run's state while the drawer is open is announced through a
live region and not only through the chip's colour. Disabled start controls state why through the visible
range summary, not through a tooltip alone. The drawer is a landmark with a labelled heading, and Cancel's
confirmation follows the existing confirmation pattern. Rules: `.claude/rules/a11y.md`.

## Risks / Trade-offs

- **The run's upper bound is the caller's, not the enforced one** → the console words the window as a request
  and shows "up to now" for today; it never claims a day was covered.
- **Ingest run state is one instance's memory** → an empty list reads "none on this instance"; the console
  states the retention of five and that a restart clears it. A second instance can accept a start the first
  already holds a run for; the service's refusal is shown as given.
- **The pipeline list has no total and no paging** → the console reads ten and, when that many come back,
  says only the latest are shown; it never claims the history is complete. Showing more means asking for a
  larger limit again, not for a next page.
- **A paused run is easy to forget** → the banner above the tab strip covers it, except where the pipeline's
  own banner already explains the pause.
- **A Queued label does not age** → a group run's label stays Queued however long ago it finished, because
  nothing reports when its groups were evaluated. The explanation line says evaluation follows on the
  pipeline's schedule and does not say it has not happened.
- **Backfill switched off in the service is discoverable only by trying** → the button stays and the refusal is
  shown; a probe would be a second source of truth for something the start already answers.
- **Two reads can disagree with a run that just changed** → every verb that the service can refuse for state
  shows the service's message and re-reads the run.
