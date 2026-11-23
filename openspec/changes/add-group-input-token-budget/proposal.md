## Why

The Analytics service now lets a `group` enrichment pipeline declare its own input token budget
(`advanced.input_token_budget`, epam/ai-dial-analytics PR 75, release 0.24). The runner uses it instead of the
runner-wide default when it trims a group's members to fit the model's input. The console cannot author it yet,
and it never removes the value from a pipeline whose trigger is switched to `schedule`, which the service
refuses with HTTP 422.

## What Changes

- The enrichment pipeline's **Advanced** block gains a fifth knob, **Input token budget**, presented only while
  the trigger kind is `group`.
- An empty value is omitted (the runner's default applies), `0` is sent as a value (trimming off), and a
  positive integer sets the pipeline's own ceiling. The console refuses a negative or fractional value before
  save.
- A pipeline whose trigger kind is not `group` never sends `advanced.input_token_budget`, a value left over
  from an earlier `group` choice included.

## Non-goals

- Catalog bundle `format_version` 3 and the runner contract bump that the same backend PR ships. Config
  transfer passes the bundle through, and its preview already shows a `catalog_bundle_version_unsupported`
  refusal.
- Showing the runner's configured default next to the field: the service does not expose it.
- Any change to the other four knobs.

## Capabilities

### New Capabilities

### Modified Capabilities

- `analytics/pipelines`: the Advanced-block requirement covers a fifth knob, which is presented and sent only
  for a `group` trigger.

## Impact

- `src/models/analytics/pipeline.ts`: `PipelineAdvanced` gains `input_token_budget`.
- `src/components/Analytics/Pipelines/Enrich/EnrichSection.tsx` and `use-enrich-form.ts`: the field and its
  validity.
- `src/utils/analytics/pipeline-dto.ts`: strip the member off a non-`group` trigger.
- `src/constants/i18n.ts`, `src/locales/en.ts`: label, caption, error text.
- Requires an Analytics service at 0.24 or later. An older service refuses the unknown member, so the
  console sends it only when the author fills the field. Until then a pipeline saves as before.
