## Context

See proposal.md — Why. Three facts about the current code shape the approach:

- The detail page reads the runner twice, through `usePausedPipelines`: the paused listing and the cache
  listing. Both are **global** reads — they answer about every pipeline — and the page then looks itself up in
  the two answers. `runtimeStatusOf` derives the chip from that pair.
- `PipelineRuntime.tsx` renders `pipeline.state`, which the registry owns. The registry fills it for the kinds
  it drives itself; for an `enrich` pipeline it is near-empty by design.
- The listing page uses the same hook for its runtime column, and must keep doing so: one view request per row
  is not a trade worth making for a grid.

The runner's error envelope already reaches the console intact — `ServerActionResponse` carries `status` and
`errorHeader`, where `errorHeader` is the service's machine code. That is what makes the view's three outcomes
separable without inventing a transport.

## Goals / Non-Goals

**Goals:**

- One runner read per detail page, carrying everything the page states about the runtime.
- The three outcomes of a view request — held by the runner, not held, not yet synced — reach the UI as
  distinct states rather than as one failure.
- The listing's behaviour is byte-identical afterwards except for the renamed properties.

**Non-Goals:**

- Reworking `usePausedPipelines`. It keeps its shape, its two independent reads and its failure semantics; only
  the property it keys the map on changes.
- Touching the failures card, its hooks or its grid. See proposal.md — What Changes for why the summary stays
  on its own read.
- A shared card shell. The duplication between `RuntimeSection` and the failures card's own shell is real and
  was noted in the previous change's review; folding them is a separate change, not a rider on this one.

## Decisions

### D1 — The detail page reads the view; the listing keeps the two listings

A per-pipeline view and a pair of global listings answer the same question at different granularities. The page
that asks about one pipeline takes the view, which states the pipeline's state directly and carries its pause;
the page that asks about three hundred keeps the two listings, which answer all of them in two requests.

The alternative — keeping the detail page on the listings and reading the view only for the new cards — leaves
two sources for one fact on one screen. The pause would come from the listing and the state from the view, and
a breaker pause that lifted between the two reads would be stated and contradicted on the same page.

**Consequence, accepted:** the listing can state `running` for a pipeline whose detail page states `over
budget`. They are different questions — the listing asks whether the runner has it and is not pausing it; the
detail page asks what it is doing — and the second is strictly more informative. The listing's three states
remain correct statements.

### D2 — One status enum, with the listing using a subset

`PipelineRuntimeStatus` grows from four members to seven: `Running`, `Paused`, `Held`, `OverBudget`,
`Backpressured`, `NotTracked`, `Unknown`. The listing's `runtimeStatusOf` keeps producing only the four it can
derive; the detail page maps the view's `state` onto the rest.

Two enums — one for the service's wire states, one for what the chip shows — were considered and rejected: the
chip would then be a one-to-one mapping of the wire enum plus two console-only members, which is the same
closed set written twice. One enum with a documented note on which producer yields which members is a single
place to add a state when the runner adds one.

### D3 — The view's outcome is one value, read off the error envelope

A view request resolves to exactly one of six, decided in this order:

| Service answer | Outcome | What the tab states |
| --- | --- | --- |
| nothing yet | `Pending` | nothing at all |
| no host configured | `Unavailable` | no affordance, no error |
| `pipeline_cache_cold` | `Cold` | not read yet, re-readable |
| `not_found` | `NotHeld` | the existing "nothing is running this pipeline" warning |
| 200 | `Read` | `status.state` drives the chip |
| anything else | `Failed` | the service's message **and** "configuration unaffected" |

Keyed on `errorHeader` rather than on the status code, because the codes are what the service documents and a
bare 404 on this route could as easily be a misconfigured host as a pipeline the runner does not hold. The
console already carries `errorHeader` through `noRunner()` for the unconfigured case, so this is the same
channel used for one more code rather than a new one.

**One value, not a set of flags.** The first attempt exposed `isUnavailable` / `isCold` / `isNotHeld` /
`hasFailed` and let the tab compose them, and every one of the five content bugs the review found was a
conjunction that came out wrong: "not asked yet" and "no runner at all" were the same two booleans; the
failed-read notice fired for the two answers its own comment excluded; and the never-run empty state fired
for a third. A reader that must state exactly one thing is handed exactly one thing. `Pending` carries its
weight here: it is the value that makes "we have not asked" unrepresentable as "we asked and got nothing".

### D4 — A read hook per concern, over one shared guard

`Common/use-pipeline-runtime-view.ts` reads once on mount for a full admin, exposes `reload`, and reads only
for an `enrich` pipeline — `isRunnerDriven`, which already exists and already encodes that rule — and only
with analytics enabled.

The two guards every such read needs — only the newest may write, nothing writes after unmount — move into
`src/hooks/use-guarded-read.ts`, and all three runner hooks use it. They are four lines each, and this change
would have been the third copy; the copy is what goes wrong in one place only, which is exactly what happened
here, where the new hook's cancel path returned without invalidating the read already in flight. `run` starts
a generation and `follow` continues the current one, which is the distinction the dead-letter listing needs
between a filter change and the next page of the one on screen.

`usePipelinePause` takes the view's `reload` instead of the listing hook's, so a pause or resume re-reads the
view that states it.

### D4b — What the chip states and what the page offers are different questions

The chip answers "what is this pipeline doing", and nothing can answer it from a read that did not land. The
pause control answers "may the operator stop this", and a failed read is no reason to say no — it is when an
operator most wants to. Deriving both from one `Unknown` is how collapsing the two runner listings into one
read lost the affordance that the old pair's independent-failure rule had protected: `runtimeStatusOfView`
and `isPauseOfferedFor` are therefore separate functions over the same outcome, and only `NotHeld` (nothing
to stop) and `Pending` (do not flicker `Pause` into `Resume`) withhold the control.

The same split settles the pause itself. `pauseOf` keys on the reported state and nothing else: the runner
holds the pause's origin and start time in memory, so requiring them produced a chip reading `Paused` above a
page whose only control was `Pause`. The banner states what it has and omits the age when the service did not
send one.

### D5 — The tab's cards follow the service's grouping, not the console's

The service already groups the view into schedule, progress, queue, groups and spend, and those groups are the
questions an operator asks. Regrouping them — say, folding queue into progress because both are about
throughput — would mean the console deciding that two services' notions of "progress" are the same notion. The
cards are `RuntimeSection` as it stands, one per section the response carries.

The registry's own state keeps the members the view does not report: the materialized-through position, the
drained-at probe and the cursor position. For an `enrich` pipeline the registry fills almost none of them, so
in practice that card renders empty and `RuntimeSection` drops it — which is the behaviour already specified
for a group with nothing to draw, not a new rule.

Where the two overlap — lag, backlog, next fire — the choice is made **per field**, runner first. Making it
per service instead (draw the registry's copy only when no view was read) deleted what the registry knew
whenever the runner answered sparsely, which is precisely its answer after a restart.

`RuntimeSection` decides whether to draw its heading by testing its children for truthiness, so a child that
renders `null` still counts as present. Every value is therefore guarded **outside** the element, and the
count helper is a called function rather than a component for the same reason. This is the one trap in the
file and it caught two separate edits during this change.

### D6 — The declaration revision is compared, and stated as information

The view carries the generation the runner holds; the pipeline carries the registry's. A difference means the
runner has not synced the latest save — the single most likely question after an operator saves a change and
sees the runtime unmoved. Stated as an informational alert in the tab rather than as a chip state: it is not a
state of the pipeline, it is a statement about the age of one of the two answers on screen, and it clears on
the runner's own sync cadence.

### D7 — snake_case is adopted, not accommodated

`PausedPipeline` renames its two members to match the wire. The alternative — accepting both spellings for a
release — buys nothing here: the two services deploy together, so there is no window in which the old spelling
arrives, and a model carrying two names for one fact is a permanent cost for a temporary condition.

## Risks / Trade-offs

- **The console is deployed ahead of the runner.** → The paused listing is parsed in snake_case, so no pipeline
  reads as paused, and the view route answers 404 — which the console would state as "nothing is running this
  pipeline" for every enrichment. Both are wrong and neither is quiet. Mitigation is procedural, and it is the
  decision recorded in D7: the two deploy together. Worth naming in the release notes.
- **Two pages can state different things about one pipeline.** → See D1. Accepted; both statements are true
  answers to the questions their page asks.
- **The view is a point-in-time read with no age on screen.** → Already the tab's rule for the registry's
  state, and the re-read control is the answer. Lag and queue depth age fastest, which is an argument for
  reading again rather than for a timer.
- **Seven chip states is more than a chip comfortably carries.** → Four of them are mutually exclusive gate
  states that an operator meets rarely, and each is one word. If the chip proves crowded, the gate states move
  into the Runtime tab and the chip keeps `running` / `paused` / `not running` — a presentation change that
  needs no contract change.

## Migration Plan

Deploy the runner first, or both together. The runner's change is already on its master. No console
configuration changes: the view is served from the host the console already calls.

Rollback is the console's own revert; it holds no state and writes nothing new.
