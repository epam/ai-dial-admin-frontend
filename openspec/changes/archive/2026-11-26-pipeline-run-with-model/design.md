## Context

The Preview tab's state lives in `usePipelinePreview`, held by `PipelineDetailFrame` so that a result survives tab
switches. `PipelinePreview` renders the run bar, notes, grid, empty state and the Statement/Outputs section from
one `PipelinePreview` result, and `PreviewError` maps registry codes to failure states. Runner calls go through
`AnalyticsRunnerApi` with the caller's token. Every runner action returns `runner_not_configured` without a
request when no host is set, and the frame already reads the pipeline's runtime view for every `enrich` pipeline,
which answers `RuntimeReadOutcome.Unavailable` in that case.

The runner's dry run (epam/ai-dial-analytics-enrichment-runner#16) answers `{ preview, evaluations[] }`, where
`preview` is the registry's preview body, unchanged. It forwards the caller's own credential to the registry's
trial-input read (epam/ai-dial-analytics#97), so the caller's column and row restrictions apply. A sibling
confirmation exists in `Failures/RequeueFailuresPopup.tsx`.

The design artboards ("Try with model — dry run") are the visual source. This change renames their `Try` wording to
`Run … with model`.

## Goals / Non-Goals

**Goals:**
- One held result per detail view, whichever run produced it, so that the tab's existing dimming, stale, unsaved
  and failure rules apply to model runs unchanged.
- Reuse the preview presentation for `try.preview` rather than build a second grid.

**Non-Goals:**
- No new probe of the runner, and no capability read.
- No server-side or client-side timeout added to the request.

## Decisions

### Second control in the Preview tab, worded `Run … with model`

The alternatives were to replace `Run preview` for LLM pipelines, or to add a separate tab. Replacing would make
every look at the sample cost a model call. A separate tab would duplicate the grid, notes and failure states that
`try.preview` already fills. The verb follows the tab's existing `Run preview` / `Run again` /
`Run on saved version`, so the author reads one family of controls. The artboards' `Try` is not used: it would
give the tab two verbs for one action. In code the server action is `runPipelineWithModel`, the hook method `runWithModel`, and the
response model `PipelineModelRun`; stages reuse `DlqStage`, since the runner names them as the dead-letter queue does.

### One hook, extended, rather than a second hook

`usePipelinePreview` gains `runWithModel()` beside `run()`. Its held `result` becomes the preview plus optional
`evaluations` and the generation it was issued at. Its `failure` gains the runner refusal kinds. A separate
`usePipelineModelRun` was considered and rejected. Two hooks would hold two results and two failures, and every
rule of the spec would have to arbitrate between them: last-to-return owns the tab, `previousGroupKey` across
both kinds, dimming under either failure. One run id already guards against a late answer landing, so one hook
keeps that guarantee for both kinds.

### Availability from the runtime read the frame already makes

The control is rendered when the transform is `llm`, the caller passes the existing full-admin and
`analyticsEnabled` guards, and the runtime read's outcome is neither `Pending` nor `Unavailable`. `NotHeld` still
renders it, because a disabled draft is the main case the dry run serves and the runner never holds a draft. A
`Failed` runtime read still renders it, because the dry run has its own refusal states. A server-provided
`isRunnerConfigured` prop was the alternative. It would thread a new prop through the page for a fact the frame
already learns.

### Evaluation-to-row matching by grain key

The dry run evaluates the first `limit` rows of the same read, so with no body `evaluations[0]` is
`preview.rows[0]`. The grid matches on the evaluation's `grain_key` against the grain-key column, and does not
rely on the index. If no row matches, it falls back to the first row. The grain-key column is the column whose
role is `grain_key`.

### Model columns from the evaluation's `outputs` keys

`outputs` is keyed by physical target column and carries no type. The `From model` columns use those keys as they
are. Joining them to `pipeline.outputs` to recover output names was rejected: for an unsaved or a just-saved draft
the registry's copy can lag the declaration the runner evaluated. Headers therefore state the target column and
`From model`, with no type.

### Stage order kept in the console

The runner returns only the failed stage. The track's order — `input_map | group_map → dial_call → validate →
output_map` — is a constant in a Preview `constants.ts`, and a pure helper derives each stage's state from
`status` and `stage`. A stage the console does not know is shown as the failed stage with every other stage not
reached. This keeps an unknown stage from breaking the track.

### Refusal mapping

The runner's own codes map to new `PreviewFailureKind` members, rendered by `PreviewError` beside its existing
kinds. Registry codes the runner passes through fall into `PreviewError`'s existing mapping untouched. The runner's
own `404` is told from a passed-through one by its code, `not_found`, against the registry's specific codes. It
sets a per-view `isModelRunUnsupported` flag in the hook, which disables the control for the rest of the visit. This
is inference from the code. The runner offers no capability read, and asking for one is out of scope.

### Confirmation as a popup sibling of the requeue confirmation

The dialog follows `RequeueFailuresPopup`'s shape and the ui-kit modal it uses. It returns focus to the opener on
close. The facts — deployment or application and route, and call count — come from `pipeline.transform` and its
preset. Nothing is fetched to open it.

### Request and reply sections

They reuse the Properties-tab `Accordion` and `Common/CopyButton`, as `PreviewStatement` does. Pretty-printing is
`JSON.parse` + `JSON.stringify(…, null, 2)` inside a try: text the runner cut at 64 KB does not parse and is shown
verbatim.

## Risks / Trade-offs

- **The call can take minutes.** The worst case is a 60 s read timeout twice for `chat_completion`, or 180 s for an
  application route, plus the registry read. → No client timeout is added, and Node's default 300 s applies. Any
  ingress in front of the console or the runner must allow it. This is an operations note in
  `docs/INFRA-CHANGELOG.md`, not a UI promise.
- **Leaving the tab does not cancel a billed call.** → The in-flight banner says so. The hook drops the late answer,
  as the preview hook does.
- **The `404` heuristic can misread a proxy's 404.** → Such a proxy would break every runner call, which the Runtime
  tab already surfaces. The control disables itself, and the page is not broken.
- **Physical column names instead of output names.** → They match what the pipeline writes, which is the fact the
  author checks. Output names stay one tab away, in Properties.
- **The generation shown is the page's, not the evaluated one.** The runner does not echo it, so a save made
  elsewhere between issue and answer is not detected. → This is the same race the preview already accepts.

## Migration Plan

No migration. The control appears once a runner build with the dry run is deployed, paired with the matching
registry build. With an older runner it disables itself on first use.
