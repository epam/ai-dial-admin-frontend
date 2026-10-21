## Why

ADAS folds the evaluator into the pipeline. Its change `2026-09-18-fold-evaluator-into-pipeline`
(branch `feat/fold-evaluators-to-pipelines`, migration V41) moves the whole evaluator definition into
the `enrich` declaration as a nested `transform` block, removes `POST /v1/evaluators`, and refuses
`evaluator_name`, `evaluator_version` and the top-level `vars` at the binding. The console's two
enrichment surfaces stop working the day that ships: registration sends fields the service now answers
`400` to, and the detail form resolves an evaluator the compiled projection no longer inlines.

The fold also removes the reason the console carried two surfaces. Registering an evaluator *was*
publishing it, so a test evaluator could never be deleted and an incomplete one could never be saved;
reuse — the one thing a separate object would have bought — never happened on dev, and is structurally
blocked because `outputs` is keyed by the target table's column names. Folding dissolves all three:
an enrichment is created, edited and deleted through `/v1/pipelines` alone, which the console already
drives, already audits, and already deletes.

One improvement falls out of the fold rather than being bolted onto it. An evaluator could not suggest
anything about its outputs, because it did not know which table it wrote to — so an output's name was a
free-text field an author had to spell correctly from memory. A pipeline knows its target, and the
console already resolves that target's columns for the variables editor. The same columns answer the
outputs editor.

## What Changes

- **BREAKING** The Evaluators console is **removed whole** — route, listing, version-addressed detail,
  the create modal, the version switcher, the Pipelines tab, the used-by column, the menu item, the
  server actions and the i18n keys. `GET /v1/evaluators` survives on the service as a read-only archive
  of pre-fold definitions; the console does not surface it, because a page that can only be read and
  never reached from anything is a maintenance cost with no operator standing behind it.
- **BREAKING** The `enrich` declaration gains the nested **`transform`** block — `type`, `model`,
  `preset`, `params`, `request_template`, `inputs`, `outputs` — carrying what the evaluator used to
  carry. `evaluator_name` and `evaluator_version` leave the wire shape entirely, and the top-level
  `vars` becomes `transform.inputs`.
- The three editors the evaluator page owned move to the enrich surface unchanged in behaviour:
  `OutputsEditor`, `AllowedValuesField`, `EvaluatorParamsEditor`, plus `outputs.ts` and the type badge.
  `use-evaluator-form` folds into `use-enrich-form`.
- The compiled projection no longer inlines an `evaluator` object and serves a derived top-level
  `response_schema` instead, so the pipeline form stops resolving an evaluator and its version — two
  fewer requests per edit, and `use-pipeline-resolution` keeps only the table half.
- **Because the target is known, the outputs editor stops asking for what it can offer**: an output's
  `name` becomes a select over the target table's columns (provenance columns and already-bound names
  excluded, a stranded name kept as an invalid option the way the variables editor already does);
  `values` becomes a multi-select over that column's enum domain rather than free text; an output's
  type is shown as the column's own read-only fact instead of being asked for; and the Transform
  section stays disabled until a target is chosen, matching the variables editor's `isReady` gate.
- `prose` stops being required. The service defaults a missing one to the target column's
  `description` at composition time and never stores it, so the field presents that column description
  as its placeholder and sends nothing when the author leaves it alone.
- Deleting an enrichment pipeline now deletes its transform with it — the confirmation says so, where
  before the evaluator outlived the pipeline that named it.
- Saving an incomplete enrichment becomes possible: the service moved the `{{placeholder}}` check from
  every declaration write to enable and preview, so the console no longer blocks a save on a template
  whose inputs are not yet bound, and reports the refusal when the pipeline is enabled.

## Non-goals

- A read-only archive view of pre-fold evaluator definitions. The endpoints stay; no console surface
  reads them.
- Surfacing `POST /v1/pipelines/{name}/preview`. The enrich arm exists on the service and deserves a
  change of its own.
- Aggregate pipelines, beyond what they share with enrichment through the common form shell.
- The `pipeline_generation` provenance column, and anything on the Tables or Conversations surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the enrich declaration's `transform` block and its editors; `vars` becoming
  `transform.inputs`; the removal of evaluator selection, version pinning and evaluator resolution;
  the compiled projection's derived `response_schema`; the outputs editor's target-derived selects and
  optional prose; the deletion confirmation; and the relaxed save.
- `analytics`: the index's routing table drops the `analytics/evaluators` row, the menu loses its
  "Evaluators" item, and the API surface drops the evaluator endpoints and re-states the pipeline
  request shape.

### Removed Capabilities

- `analytics/evaluators`: removed whole. Every requirement it carries describes a surface this change
  deletes; what survives of it — the outputs editor, the params editor, the type badge, the JSON
  editing rules — is re-stated on `analytics/pipelines` where it now lives.

## Impact

- **Deleted**: `app/[lang]/evaluators/` (page, detail page, actions), `components/Analytics/Evaluators/`
  (`EvaluatorsView`, `EvaluatorDetailView`, `EvaluatorProperties`, `CreateEvaluatorPopup`,
  `EvaluatorVersionSwitcher`, `EvaluatorPipelinesGrid`, `use-create-evaluator-form`,
  `use-evaluator-form`, `utils.ts`), `components/Analytics/Pipelines/Common/EvaluatorCell.tsx`,
  `utils/analytics/evaluator-usage.ts`, `utils/analytics/evaluator-created-message.ts`,
  `utils/analytics/evaluator-dto.ts`, `utils/validation/evaluator-name-error.ts`, and their specs.
- **Moved**: `OutputsEditor.tsx`, `AllowedValuesField.tsx`, `EvaluatorParamsEditor.tsx`, `outputs.ts`,
  `EvaluatorTypeBadge.tsx` → `components/Analytics/Pipelines/Enrich/`.
- **Modified**: `models/analytics/pipeline.ts`, `models/analytics/evaluator.ts` (what survives becomes
  the transform's types), `models/analytics/pipeline-ui.ts`, `models/analytics/evaluator-ui.ts`,
  `utils/analytics/pipeline-dto.ts`, `utils/analytics/pipeline-list-item.ts`,
  `server/analytics/analytics-data-api.ts`, `app/[lang]/pipelines/actions.ts`,
  `components/Analytics/Pipelines/` (`PipelinesView`, `PipelineDetailView`, `CreatePipelinePopup`,
  `Enrich/*`, `Common/use-pipeline-form`, `Common/use-pipeline-resolution`,
  `Common/PipelineReadOnlyFacts`), `constants/analytics/pipelines.ts`, `constants/i18n.ts`,
  `locales/en.ts`, `types/routes.ts`, `menu-configuration.tsx`, breadcrumb configuration.
- **API**: `POST /v1/evaluators` gone; `GET /v1/evaluators*` no longer called; `POST|PATCH
  /v1/pipelines` carry `transform`; `GET /v1/pipelines?view=compiled` returns `response_schema` in
  place of `evaluator`.
- **Release coupling**: this cannot merge before ADAS ships the fold. The removed fields are refused
  rather than ignored, so the console breaks against a pre-fold service exactly as a pre-fold console
  breaks against a folded one. As of 2026-09-21 the fold is on the ADAS branch, not on `development`,
  and dev still serves the pre-fold shape.
