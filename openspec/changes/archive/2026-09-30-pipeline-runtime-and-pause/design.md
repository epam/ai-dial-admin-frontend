## Context

See `proposal.md` — Why. What shapes the approach here is that the console gains a **second** analytics
upstream. Until now every analytics read went to the registry service (`DIAL_ANALYTICS_API_URL`); pause,
resume and the paused listing are served by the enrichment runner, a separate deployment with its own host,
its own availability and its own permission rule.

Three properties of that service drive most of the decisions below:

- It authorizes **every** endpoint on `FULL_ADMIN`, reads included. There is no read that a read-only
  admin could be shown.
- Its paused listing is **whole**: one call returns every paused pipeline. There is no per-pipeline read,
  so asking about one pipeline and asking about all of them cost the same request.
- Its pause registry is **in memory, in one replica**. A restart clears every pause.

Its error envelope is byte-identical to the registry's, which is what lets the existing client machinery
carry it unchanged.

## Goals / Non-Goals

**Goals**

- One place in the codebase that knows the runner exists, so the second upstream does not leak into the
  components.
- The runner being down, unconfigured, or refused degrades to *no runtime affordance*, never to a broken
  pipeline page.
- The Runtime tab is honest about when its values were read, because every one of them is measured
  against the moment of the read.

**Non-Goals**

- No client-side polling. The tab states the age of its read and offers to read again; it does not refresh
  itself on a timer. A pipeline's lag moves continuously, so a polled page would be a page that changes
  under the reader without being asked.
- No optimistic pause. The chip and the banner follow the service's answer, not the click.
- No new abstraction over the two upstreams. They are two clients on the same base, not a federation.

## Decisions

### The runner is a second `BaseApi` client, not a branch inside the existing one

`AnalyticsRunnerApi extends BaseApi`, constructed in `src/app/api/api.ts` with
`host: process.env.DIAL_ANALYTICS_RUNNER_API_URL`, beside `analyticsDataApi`. Its error envelope matches
the registry's, so `parseErrorBody` is inherited rather than overridden, and failures reach the UI in the
`ServerActionResponse` shape every other action already returns.

*Alternative rejected:* adding runner methods to `AnalyticsDataApi` with a per-method host override. The
class would then carry two hosts whose availability differs, and every caller would have to know which
methods can be down while the others work.

### Runtime state is read on the client, not in the page's server component

The pipeline page and the listing page are both server components, and reading the paused list there would
be the fewest moving parts. It is rejected because **the server has no role check**: `isFullAdmin` is
derived in `AppContext` from `userInfo` on the client, and there is no server-side equivalent short of an
extra `getUserInfo` round trip per page. A server read would therefore issue a runner request for every
caller and let the runner refuse it — which is exactly what the spec forbids, and which would also put a
403 in the log of every read-only admin who opens a pipeline.

So: a `useEffect` in the client component, guarded by `isFullAdmin`, calling a server action that holds the
token. The cost is one request after hydration and a chip that appears a beat after the page; the benefit
is that the permission rule is enforced where the permission is actually known.

*Consequence:* the "Read N ago" clock starts when that response lands, which is the truthful reading —
the values were read then, not when the page was rendered.

### Two listings are read together, and membership decides the answer

The runner answers two questions in list form: which pipelines it has taken on (`/v1/pipelines/cache`)
and which of them are paused (`/v1/pipelines/paused`). Neither has a per-pipeline read, so the detail
page and the listing issue the same two requests and ask about membership — one name for the page, a set
for the grid.

**Only for `enrich`.** Two services execute pipelines: the runner drives `enrich`, and the registry
service drives `aggregate` on its own `AggregateScheduler`, which is also what writes their
`next_run_at`. The runner's `unsupportedReason` refuses anything without a `transform` and a grain key,
so an aggregate pipeline is absent from its cache by construction — and the first version of this
change read that absence as a fault and flagged every healthy rollup on the page. The same boundary
makes a pause meaningless there: the runner would record it and answer 204, but only its own executors
consult the pause registry.

Both or neither. The cache is what makes the third state expressible: the runner admits a pipeline only
when it is enabled and `PipelineRouting` accepts its declaration, then schedules from that exact set, so
an enabled pipeline missing from it is one nothing drives. With the pauses alone the console cannot tell
that pipeline from a healthy one and would state `running` over it — which is why a failed cache read
takes the whole runtime status down with it rather than degrading to "not paused".

### An unconfigured host short-circuits before the request

The action checks the environment variable and returns "not configured" without calling out. An
installation that has not deployed the runner therefore pays nothing and logs nothing, and the UI treats
that answer identically to a failed read: no chip, no banner, no tab content, no column, no notification.
Distinguishing the two in the UI would ask the reader to care about a deployment fact they cannot act on.

### The Runtime tab renders from `pipeline.state`, which the page already has

No second registry read. `state` arrives with the pipeline, so the tab is a presentation of data the frame
already holds, and the three content states are distinguished by what that member contains:

| Content state | Condition |
| --- | --- |
| Unavailable | `state` is absent entirely |
| Never run | `state` is present and `last_run_at` is absent |
| Loaded | `state` is present and reports a run |

"Read again" is `router.refresh()`, which re-runs the server component and brings a fresh `state` with it,
and re-triggers the runner read through the effect's dependency on the pipeline. One control, both
upstreams, no bespoke refetch path.

*Alternative rejected:* a dedicated client-side re-read of the pipeline. It would leave the server
component's copy stale and put two versions of the same pipeline on the page.

### Alerts stay above the tab strip; the tab restates them as dated facts

The existing spec lifted these three out of the facts row because readers missed them there; filing them
inside a tab is further away, not nearer. `PipelineRuntimeAlerts` is therefore untouched. The tab's
failures section is not a copy of it: the alert is a headline with no timestamp, the section states the
failure beside the time it was reported and the clamp beside the position it was held to — which is what
makes it matchable against a run.

### The tab's groups are separated by a rule, and the pause control lives in the header

The design board draws each runtime group as a bordered card. Three cards stacked in a column inside a
panel that already has its own border draw two lines where one does the work, so the groups are divided
by a rule instead. What the board's layout is kept for is the shape: a quiet uppercase group heading and
a three-column value grid, rather than one long wrapping row — the cursor pair and the
materialized-through pair read as pairs only when they line up.

Values stay on `LabelledText` and the repo's own type scale rather than the board's pixel sizes and its
monospaced identifiers: the page around them is built from that scale, and a second one inside one tab
would read as a different product.

A group with nothing to draw is not drawn, and when no group has anything the tab falls back to the
console's own empty state rather than to a bare sentence. Both came out of reading real pipelines on dev:
an on-ingest pipeline has no schedule and an unfailed one has no failure, and headings over white space
read as faults. For the same reason the tab does not restate the clamp or the required rebuild — the
alerts above the tab strip already say those, word for word.

The pause control sits in the tab's control bar, beside the read statement, and in the pause banner while
the pipeline is paused. The identity row was tried and put back: four controls there — delete, the enable
toggle, the JSON switch and a pause — read as a row of equals, where three of them change the pipeline
and one does not.

Two consequences of reading the runner in the frame rather than in the tab survive that move: the banner
can carry Resume from any tab, and the control knows which verb to offer without the tab having to ask.

### Pause origin is an enum, and the banner is one component with two texts

`PauseOrigin.Operator` / `PauseOrigin.Breaker`, per the house rule on fixed string sets. The two differ in
one sentence — whether the pause lifts itself, and when — so one banner component takes the pause and
picks the sentence, rather than two components that would drift apart.

`resumesAt` is present only on a breaker pause, and the runner lifts an expired pause lazily on read, so a
banner whose `resumesAt` is already in the past is possible between the expiry and the next read. The
banner states the time rather than counting down to it, so a stale one reads as "lifts at 14:20" rather
than as a negative countdown.

### Resume is offered twice and confirmed never

Once in the banner, once in the tab's control bar — the banner is what a reader arriving on Properties or
Audit sees, and the control bar is where the reader who went looking for runtime expects it. Both call the
same action. Pause is confirmed; resume is not, being the undo of the confirmed act.

The confirmation is the informational variant. Danger is reserved for delete, and the header already makes
that distinction between `Delete` and `Disable`.

### Neither control is gated on unsaved edits

`Disable` is withheld while the form is dirty because toggling re-reads the pipeline and would discard the
draft. Pause sends no part of the document and triggers no re-read of it, so the same gate would withhold
a runtime action for a reason that does not apply to it — during an incident, which is when the form is
most likely to be half-edited.

### Where the code goes

| Concern | Location |
| --- | --- |
| Client | `src/server/analytics/analytics-runner-api.ts`, registered in `src/app/api/api.ts` |
| Models | `src/models/analytics/pipeline-runtime.ts` (`PausedPipeline`, `PauseOrigin`) |
| Actions | `src/app/[lang]/pipelines/actions.ts` |
| Runtime tab | `src/components/Analytics/Pipelines/PipelineRuntime.tsx`, beside `PipelineAudit.tsx`, with its sections built on the existing `PipelineSection` |
| Pause banner, chip, controls | `src/components/Analytics/Pipelines/Common/` |
| Tab id | `EntityViewTab.Runtime` and a `runtimeTab(t)` factory in `src/utils/tabs/utils.ts`, matching `auditTab` |

Relative times reuse `formatRelativeTime` from `src/utils/analytics/session-formatting.ts` rather than a
second implementation.

### The 2.0 migration rides along, and the shared controls take a flag rather than a copy

The runtime controls are 2.0 components; putting them on a page of 1.0 fields made the page read as
half-finished, so the pipeline pages move over as a whole. Most of it is mechanical — the 2.0 controls
take the same props — with three exceptions worth recording:

- `Checkbox`, `RadioGroup` and `Select` renamed their props (`checked` → `isSelected`, `label` →
  `labelProps`, `elementId` → `id`, `radioButtons` → `items`), so those call sites were rewritten rather
  than re-imported.
- `DialSelectField` has no 2.0 twin. `Common/SelectField` wraps the 2.0 `Select` with the one prop the
  old field had and the kit does not (`required`), and carries two corrections in one place: the chosen
  option is marked with a check rather than the default tint, which this deployment's theme does not
  render, and the options keep their height instead of being squeezed by a bounded list.
- `ChangedEntityButtons` and `JsonToggle` are rendered by **every** entity page. They take an
  `isDesignSystem2` flag, default off, so this page opts in and nothing else changes. A local copy was
  written first and thrown away: both carry logic — the discard confirmation, the save-validation
  binding, the responsive classes — that a copy would have let drift.

## Risks / Trade-offs

- **A pause that vanishes on a runner restart** → The confirmation says so. The console cannot prevent it
  and must not imply permanence; an operator who knows the rule can re-check after a deployment.
- **The runtime read lands after the page** → The chip and the column are absent for one round trip rather
  than flickering through a wrong value. The column is rendered only once the answer is in, so the grid's
  column set changes at most once per load.
- **`isFullAdmin` is a client-side derivation** → It is already what gates `Disable`, `Save` and `Delete`
  on this page, so runtime affordances are no weaker than what ships today. The runner enforces
  `FULL_ADMIN` itself; the client check is about not issuing a doomed request, not about security.
- **Two upstreams, one page** → A registry read that succeeds while the runner is down leaves the page
  fully usable and silently runtime-less. The reverse — runner up, registry down — is the existing
  not-found path and is unchanged.
- **A new prop on two shared components** → The house rule is to absorb a mismatch in the caller's own
  wrapper. Here the wrapper would have had to copy the discard modal and the validation binding, which
  is the drift the rule exists to prevent; the flag keeps one implementation and leaves every other page
  on its current default. Both branches are covered by tests.
- **The listing's column depends on a service the listing did not need before** → It is omitted rather
  than errored, so a runner outage costs the listing nothing but that column.

## Open Questions

None. The contract was read from the runner's own source, and the four judgement calls the design turned
on — no author name, no `Draining` chip, the restart caveat in the confirmation, and one PR rather than
three — were settled with the requester before this document was written.
