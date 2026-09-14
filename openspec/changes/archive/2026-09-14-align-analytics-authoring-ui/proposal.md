## Why

The analytics data-access service is collapsing its authoring surface: one fact is now declared once
and derived everywhere else. The target table owns a field's name, type, enum domain and order; the
evaluator owns only the prose the model is told; the pipeline composes the executable form from the
two. Everything that became derivable was removed from the request surface, and sending it is now a
400 naming the field.

Our authoring UI writes the removed shape on every save. Creating or editing an enrich pipeline, and
registering any evaluator version, stop working the moment the service ships — the console has no
working path to either. Reads degrade quietly at the same time: the default projection changed, so
the pipelines grid loses the evaluator type badge and resolved input, and the detail page loses grain
key and version column.

## What Changes

- **BREAKING**: the evaluator request drops `input_vars`, `response_schema` and `output_vars` for a
  single `outputs` map — output name to the prose the model is told, optionally with a closed value
  list or a jsonata transform; for a `sql` evaluator the value is the expression itself and carries
  no per-output type. The three form blocks they backed are replaced by one reorderable editor, and
  the type column disappears: the target column owns it now.
- **BREAKING**: the pipeline request drops `input_bindings`, `output_bindings`, `priority`,
  `freshness` and the four flat execution knobs. Input bindings become `vars`; the output mapping is
  derived by the service and leaves the form entirely; the knobs move under `advanced` with clearer
  names and a strictly-positive sample fraction.
- Pipeline reads move to the compiled projection explicitly, so the grid and detail page keep the
  resolved values they render today.
- Evaluator reads normalize both stored shapes into one model — the new field first, the old fields
  as fallback — so a version stored before the change renders in the new form with no second view.
- Aggregate authoring loses the freshness control, stops requiring group keys (the service derives
  them from the target's ordering key), and gets a measure editor that reads as the mapping it is:
  target column, function, source column.
- Group-trigger readiness becomes three explicit conditions with at least one required, each with its
  own duration presets and a custom escape.
- Both create modals keep only what registration actually requires; everything optional moves to the
  detail page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/evaluators`: the `outputs` shape replacing three declaration members, the sql/llm field
  split, reordering as a first-class action, reading either stored shape through one model, and the
  reduced create modal.
- `analytics/pipelines`: `vars` replacing input bindings with the output mapping gone from the form,
  `advanced` replacing the execution block, the compiled read projection, the readiness-condition
  rework, member selection, and the aggregate changes (no freshness, optional group keys, measure
  editor).

## Non-goals

- Migrating evaluator versions stored in the old shape. Those are migrated by hand against the new
  API; the UI only has to render them.
- Any editing affordance specific to an old-shape version — no read-only mode, no badge, no separate
  view. Rendering is shared; whether a save succeeds is not this change's concern.
- Pipeline preview. The service extends `POST /v1/pipelines/{name}/preview` to enrich pipelines in
  the same release; surfacing it is separate work.
- Client-side validation of anything the service validates against data the form cannot see — target
  columns from an evaluator screen, or a trigger kind from an evaluator's template.

## Impact

- **Models and mappers**: `models/analytics/pipeline.ts`, `models/analytics/evaluator.ts`,
  `models/analytics/pipeline-ui.ts`, `utils/analytics/pipeline-dto.ts`,
  `utils/analytics/evaluator-dto.ts`, `utils/analytics/pipeline-list-item.ts`.
- **API layer**: `server/analytics/analytics-data-api.ts` gains the read projection parameter;
  `app/[lang]/pipelines/actions.ts` passes it through.
- **Removed**: both binding editors and their helpers, the freshness field, the evaluator vars
  editor, the type-compatibility helper (its only caller goes), and the i18n keys behind them.
- **Added**: a variables editor, an outputs editor with drag-and-drop, and a shared
  placeholder-token hint used by two screens.
- **Reworked**: the enrich and aggregate sections, both create modals, the evaluator properties form,
  the measure editor, the readiness and member-selection blocks, and the detail frame's enable
  toggle.
- **Release coupling**: the service, the enrichment runner and the MCP server ship in one window with
  no compatibility in either direction, so this must ship with them.
- **Tests and docs**: the specs above, plus the existing evaluator and enrich pipeline test suites —
  part is deleted with the editors it covers.
