## Why

ADAS moved its pipeline declaration gate from "when the row is written" to "when the row is armed"
(`feat/defer-pipeline-validation-to-arm`, in the service's `development`, and on the local instance).
`POST /v1/pipelines` now registers a pipeline from **name, kind and target alone**; a write that leaves the
pipeline disabled may carry any subset of the declaration; and the kind gate — every check that used to
make registration one-shot — runs when a write arms the pipeline, or on preview.

The console still asks for the whole declaration up front, because that is what the service used to
demand. A registration modal that collects a transform type, a model, a request template, at least one
output and a trigger branch is now asking for information the author is allowed not to have yet, and the
detail page compounds it: Save is blocked until the form is complete, so a pipeline registered with three
fields could not be filled in a step at a time anyway.

## What Changes

1. **The create modal collects name, kind and target, and nothing else.** Those three are what the service
   requires: `target` stays mandatory because it is the input to every later authoring step — an
   aggregate's group keys derive from its `ordering_key`, and an enrichment's `transform.outputs` is keyed
   by its column names — and because a targetless row has no cleanup path. Everything the modal collects
   today beyond them moves to the pipeline's own page, which already presents all of it.

2. **Completeness stops gating the console's buttons.** Save on the detail page and the enable toggle are
   offered whatever the declaration holds; the service decides. This is the user's call, made explicitly:
   a greyed-out control the console cannot fully explain is worse than the service's own message, and the
   console cannot reproduce the gate anyway — it does not know that a target is inactive, that group keys
   must equal `ordering_key` in order, that a measure's type must fit its column, or that a read source
   must declare scan metadata. Those refusals arrive as `422 pipeline_validation_failed` and are already
   reported the way every other action failure is.

3. **What is relaxed is absence, not contradiction.** A member the author has not filled in yet stops
   blocking anything. A value the author filled in *wrongly* keeps blocking the save exactly as it does
   today — the six-field cron above all, because the service never parses the expression and the console
   is the only guard there; likewise `distinct` without a column, a member selection without a limit, a
   duplicate output name and a `sample_fraction` outside `(0, 1]`. The line is whether the service would
   ever tell the author what is wrong.

4. **An unset trigger is omitted from the request rather than sent as `{}`.** `buildTrigger` always
   constructs a trigger object, so a pipeline registered before its trigger is chosen would post
   `trigger: {}` — which the service reads as a declared trigger with no kind. With registration no longer
   collecting one, this stops being unreachable.

5. **The registration no longer sends `enabled: false`.** The service required it present for an enrichment
   registration and now defaults it; an aggregate was always stored disabled regardless. Both kinds still
   register not running.

6. **The transform's model and request template stop being required to save.** The service refused a blank
   `request_template` on every write before; now it refuses it when the pipeline is armed. Verified against
   the local instance: a disabled pipeline accepts an `llm` transform carrying neither.

## Non-goals

- Any new "draft" affordance. The service added no field for it: a draft is `enabled: false`, and the
  header badge already says that. Nothing new is presented to distinguish a complete declaration from an
  incomplete one.
- A console-side checklist of what is missing before enable. It was considered and dropped in the same
  conversation: the console's list would be a partial copy of a gate it cannot fully evaluate.
- Preview. The service now offers a disabled pipeline's preview as the author's diagnostic; the console has
  no preview surface for pipelines, and adding one is its own change.
- The detail page's layout, section set and editors, which stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: what registration collects; completeness no longer gating save or enable; the
  trigger omitted when unset; `enabled` no longer sent at registration; the transform's model and template
  no longer required to save.

## Impact

- `components/Analytics/Pipelines/CreatePipelinePopup.tsx`, `Enrich/CreateEnrichPopup.tsx`,
  `Aggregate/CreateAggregatePopup.tsx`, `Common/CreatePipelineShell.tsx` — the modal shrinks to three
  fields, so the kind-specific create popups collapse into one.
- `Common/use-pipeline-form.ts`, `Enrich/use-enrich-form.ts`, `Aggregate/use-aggregate-form.ts` — the
  composed `isValid` is replaced by a registration-scoped check; the field-level flags stay.
- `Common/PipelineDetailFrame.tsx` — Save stops consulting form completeness.
- `utils/analytics/pipeline-dto.ts` — an unset trigger is omitted.
- The `isModal` branches in `Enrich/EnrichSection.tsx`, `Enrich/TransformSection.tsx`,
  `Enrich/ReadyWhenEditor.tsx`, `Aggregate/AggregateSection.tsx` and `Common/PipelineSharedFields.tsx`
  become unreachable and are removed with the prop.
- No new endpoint and no service change: the console calls the same `POST` and `PATCH` it calls today.
