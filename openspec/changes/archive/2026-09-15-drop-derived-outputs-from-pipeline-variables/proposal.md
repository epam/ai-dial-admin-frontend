# Drop the derived outputs from a pipeline's variables section

## Why

The variables section presents what an operator declares. It also listed the pipeline's **outputs** —
where the evaluator's answer lands — as disabled rows of the same list, on the reasoning that one list
should state everything passing between a pipeline and its evaluator.

That reasoning does not survive contact with the screen. A derived member sitting among declared ones
reads as something the operator chose and may change; greying it out states "not now" rather than "not
yours". The outputs are not a member of the request at all: the service derives them from the
evaluator's outputs matched to the target's columns, and will keep deriving them for pipelines authored
after this change, so the rows are permanent furniture rather than a legacy view.

They also did not fit. An output carries both a target column and, sometimes, a transform that reads the
value out of the response — two facts, against the one value cell a variable needs — so the list either
showed a column and hid the transform, or grew a cell that stood empty on almost every row.

## What Changes

- The variables section presents only the declared variables. The derived outputs are not presented in
  the form, as disabled rows or otherwise.
- They stay readable in the JSON editor, which already presents the pipeline whole — every member the
  service assigns or resolves included.

## Impact

- Affected specs: `analytics/pipelines`
- Affected code: `components/Analytics/Pipelines/Enrich/VariablesEditor.tsx`,
  `components/Analytics/Pipelines/Enrich/EnrichSection.tsx`,
  `components/Analytics/Pipelines/Common/use-pipeline-form.ts`, and the i18n key the note used
