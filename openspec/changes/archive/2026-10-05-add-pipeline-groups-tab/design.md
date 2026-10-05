## Context

See proposal.md — Why. The relevant current state:

- The detail page (`src/app/[lang]/pipelines/[name]/page.tsx`) loads the pipeline, the function catalog and the
  bound targets on the server and passes only those down. Every runner read — pause, runtime view, failures —
  happens on the client, in hooks under `Common/` and `Failures/`, gated on `useAppContext().isFullAdmin`.
- `isFullAdmin` is computed in `AppContext.tsx` from `featureFlags.adminApiEnabled`, `isEnableAuth` and the
  roles `getUserInfo(token)` returns in the root layout. The server has no equivalent helper.
- The runner contract (`analytics-enrichment-runner`, `GroupAdminController`, `GroupStateDto`): `GET
  /v1/pipelines/{name}/groups?limit=` clamps `limit` to 1..500, orders by `last_activity_at` ascending, has no
  cursor, and 404s for a pipeline that is not cached or not a group pipeline. Each group carries `group_key`,
  `group_version`, `last_activity_at`, `signalled`, `computed_version`, `computed_at`, `computed_truncated`,
  `evaluations_day`, `evaluations`, `dirty`. `POST …/groups/{key}/requeue` answers 202, 404 for an unknown group,
  and checks neither readiness nor the ceiling.
- The Failures card is the closest sibling: a grid on the app's `GridView`, a `ConfirmationPopup` for the bulk
  re-run, a polite `role="status"` span for the outcome, an error notification on refusal, and a re-read in
  `finally`.

## Goals / Non-Goals

**Goals:**

- One pure module decides a group's state and its checklist; the badge, the tooltip, the dialog and the state
  filter all read from it.
- The readiness summary is generated from `ready_when`, so a new runner condition is one entry, not new
  components.

**Non-Goals:**

- No change to the Runtime tab's group counts, to `Common/*` components, or to the Failures card.
- No polling. The grid is read when the tab opens, after an evaluation is queued, and on an explicit read-again
  after a failure.

## Decisions

### D1 — The tab's presence is a server-side probe, passed as a flag

`page.tsx` issues `GET …/groups?limit=1` and passes `hasGroups: boolean` through `PipelineDetailView` to
`PipelineDetailFrame`, only when the pipeline's trigger kind is `group`, analytics is enabled, the runner host is
configured, and the caller is a full admin. Any failure folds to `false` and is logged, not surfaced.

*Alternative:* probe on the client with the other runner hooks. Rejected by the user: the tab would appear after the
strip rendered and push `Audit` sideways. *Alternative:* render the tab from trigger kind alone. Rejected: a group
pipeline with nothing tracked would offer a tab with nothing in it.

**Full admin on the server.** The probe must not reach the runner for a caller the runner would refuse — the
runner-service requirement already promises no runner request for such a caller. The rule currently lives inline in
`AppContext.tsx`. Extract it into a pure `resolveIsFullAdmin(adminApiEnabled, isEnableAuth, roles)` in
`src/utils/`, call it from `AppContext` unchanged in behavior, and from a server helper that reads the token, the
auth toggle and `getUserInfo`. One rule, two callers; a copied rule would drift the first time roles change.
The extra `getUserInfo` call happens only on the group-pipeline path that already pays for the probe.

### D2 — State is derived by one pure function, from the facts and a clock

`deriveGroupState(group, readyWhen, now)` returns `{ state, checks }`, where `checks` is the ordered list of
declared conditions, each `{ condition, role, isSatisfied, value, threshold, remaining }`. The order of checks and states
is the spec's (`Up to date` → `At cap` → `Ready` → `Waiting`). Durations from `ready_when` are read with a
`durationToMs` beside `parseDuration` in `src/utils/analytics/duration.ts`. Not `parseDuration` itself: it returns
one unit for the editor to show and refuses compound ISO (`PT1H30M`), which the runner honours. A value neither
form matches makes its check not met rather than throwing.

`evaluationsToday(group, now)` is a separate helper because both the cell and the ceiling check need it, and it is
the one fact a naive reading gets wrong (`evaluations` recorded against yesterday is zero today).

`now` is passed in, never read inside, so every rule is testable without fake timers. The tab owns **one** clock
(`useMinuteTick`) and hands it to the rows, the tooltip and the dialog. An earlier draft let the tooltip read its own
clock on mount; the badge and the explanation then disagreed for up to a minute, and whether the tooltip remounted
on open was a kit implementation detail.

*Alternative:* ask the runner for a verdict. It does not serve one; the runtime view's aggregate counts are not
per group.

### D3 — The readiness summary and the checklist share one condition table

`CONDITION_META`, keyed by `GroupCondition` (the three `ready_when` conditions, `DefaultIdle` and the ceiling),
holds what is fixed per condition: its role and its summary i18n key. Each condition's check is a `Record` entry in
`groups.ts`, so the compiler names it once the condition exists; what decides whether a pipeline carries the
condition (`declaredConditions`) and how a checklist line words it (`ConditionCheckLine`) are one place each. The
summary renders thresholds only; the tooltip and the dialog render thresholds with the group's values.

`Idle (default)` is the entry used when `idle` is absent. It has no threshold, and for a dirty group it is never met
(spec rationale: the runner would already have taken the group). The console does not carry the runner's default
value: it is a runner deployment setting that can change without the console knowing.

### D4 — Grid on `GridView`, filters client-side, one read of 500

Follow `FailuresGrid`: the app's `GridView`, columns in a `useMemo<ColDef[]>`, cell renderers as components in the
feature folder. A `use-pipeline-groups` hook owns the read (`limit=500`), `isLoading`, `error` and `reload`. Search
and the state filter are a `useMemo` over the rows already held, with the state computed by D2 at render time.

The window-full note is driven by `rows.length === 500` from the constant, not by a flag from the runner, which has
none.

### D5 — Badge tooltip and disabled control use kit 2.0 tooltip parts

The state badge is the trigger of a kit 2.0 `Tooltip` with `asChild`, which takes a node as its content, so the
checklist needs no lower-level parts; `asChild` puts `aria-describedby` on the badge, and the badge is made
focusable so the tooltip opens from the keyboard. The disabled `At cap` control uses `aria-disabled` rather than
`disabled`, so it stays focusable and its tooltip reachable (a11y rules: hover-only content needs a focus path).

### D6 — Queue evaluation follows the failures re-run, with one dialog per state

A `use-queue-group-evaluation` hook mirrors `use-requeue-failures`: `isBusy`, `outcome`, `queue(key)`. Success
writes the outcome to the tab's polite status span; refusal raises `getErrorNotification` with the service message
and request id; a 404 maps to the "no longer tracked" text; `finally` calls `reload`. The dialog is the kit's
`Popup` at `Lg` rather than the sibling's `ConfirmationPopup`: it carries a facts card, a checklist and section
notices, which need the width and a body of their own. Its body is chosen by state — the Waiting checklist (the same list
component as the tooltip), the Up-to-date re-evaluation warning — plus notes when they apply: the last evaluation of the day, a runner still on an older revision (the frame's
existing `isGenerationBehind`), and a paused pipeline.
Pause state comes from the frame's existing `usePipelinePause` result, passed down as a prop, not re-read.

Group keys go into the path through `encodeURIComponent`, like every other runner path segment.

## Risks / Trade-offs

- [The 500-group window hides the newest groups on a busy pipeline] → the window-full note says so; a runner
  cursor is a separate request to that service.
- [The console's state can disagree with the runner's] — a configured default idle the console cannot see, a runner
  held at its depth ceiling, the few seconds between a trigger and the stamp → the tooltip states the facts behind
  every verdict, and `Idle (default)` makes the unknown explicit rather than guessed.
- [The probe can go stale while the page is open]: groups evicted after load leave an open tab with an empty grid →
  the grid states that the runner holds no groups; the tab is not withdrawn mid-session.
- [A queued evaluation runs on a paused pipeline] → verified in the runner source: `PipelinePauseRegistry` gates
  enqueueing only (scan, backfill, sweep, materialize), and `GroupWorkerService` consults no pause. The request
  queues the work directly, so the dialog states that the evaluation still runs — the opposite of the failures
  re-run wording, whose own claim that re-run items wait for the resume is worth re-checking separately.
- [A group key containing `/`]: Spring rejects an encoded slash in a path variable by default, so such a group cannot
  be queued. Report the refusal as any other; not fixable on this side.
- [An `At cap` group can still be evaluated by the runner if anything else asks it to] → only the console's control
  is gated; the runner does not refuse. Stated in the spec as the reason the console guards it.

## Migration Plan

Additive. No new environment variable: the runner host (`DIAL_ANALYTICS_RUNNER_API_URL`) is already configured for
the Runtime tab. An installation without it never probes and never shows the tab.
