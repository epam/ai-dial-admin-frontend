## Why

A model-calling enrichment with an empty dead-letter queue shows no Failures card at all on its `Runtime`
tab. An operator checking a pipeline for failures cannot tell that absence from "this pipeline's failures
are not tracked here", and a queue the service has since emptied looks the same as one that never held
anything. Checking a live pipeline whose dead letters had gone, the card's silence read as a missing
feature until a deliberately broken pipeline proved the card does appear once something fails.

## What Changes

- The Failures card of a model-calling enrichment is rendered when the service reports no dead letters,
  stating that there are no failures, with no expand control and no retry controls.
- The card stays absent before the first read has answered, so it never claims "no failures" about a
  pipeline the service has not been asked about yet.
- Unchanged: no card for a SQL enrichment or an aggregate, no card and no error when no runtime service is
  configured, the failed-read state, and the `Runtime` tab's error mark, which still appears only when
  there is at least one failure.

## Non-goals

- No change to which pipeline kinds dead-letter, or to how the failures are read and counted.
- No retention or "older failures were cleaned up" messaging: the service reports nothing about
  retention, so the console has nothing to state.
- No zero-state for the registry's run-level failures group, which follows its own requirement.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: the requirement "The failures card states why it has nothing to show" — the
  no-failures case changes from an absent card to a card stating zero.

## Impact

- `components/Analytics/Pipelines/Failures/PipelineFailuresCard.tsx` — the render gate.
- `components/Analytics/Pipelines/Failures/use-pipeline-failures.ts` — exposes whether the service has
  answered, since zero counters alone no longer distinguish "not asked yet" from "none".
- Their specs and the shared failures mock; `PipelineRuntime.spec.tsx` for the tab-level expectation.
- No API, server-action, i18n or shared-component change: the "No failures" string already exists.
