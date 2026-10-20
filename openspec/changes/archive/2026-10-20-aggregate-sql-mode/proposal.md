## Why

The Form declaration (group keys + measures) cannot express expression measures, expression keys, non-trunc keys
or `arg_max`. The analytics service now accepts an aggregate declared as one `INSERT INTO <target> (cols…) SELECT …`
statement in a new `sql` member (service change `aggregate-sql-declaration`, merged 2026-10-14). The console does
not know the member: it cannot author, show or round-trip such a pipeline, and a SQL-mode pipeline created elsewhere
opens as an empty form.

## What Changes

- The aggregate section gains a **Form / SQL mode choice (radio buttons)**. Form mode is today's group keys + measures editors.
  SQL mode replaces them with a SQL editor holding the statement.
- The mode of an existing pipeline is read from the declaration: `sql` present → SQL, otherwise Form. A new
  aggregate opens in Form mode.
- `CreatePipelineDto` and `Pipeline` carry `sql?: string`. The request body carries **either** `sql` **or**
  `group_by`/`measures`, never both: switching mode drops the other mode's members from the draft.
- The request is built from the active mode only, so a PATCH always states the mode explicitly. This is what makes
  the service clear the other mode's members.
- The JSON editor shows `sql` for a SQL-mode pipeline like any other member.
- The "at least one measure" submit gate applies to Form mode only.
- The service's 422 on an unsupported statement (HAVING, joins, windows, nullable keys, bucket step ≠ 1, …) is
  shown as-is through the existing save-error path. The console does not parse or validate SQL.

### Non-goals

- Client-side SQL parsing or validation, a column picker, or Form ⇄ SQL conversion in either direction. Switching
  mode discards the other mode's content after the same unsaved-changes treatment any edit gets.
- SQL autocomplete. The Query Builder's `SqlEditor` is bound to its own context; reuse is a separate change.
- New Preview behaviour. Preview already shows the service's compiled `statement`; whether it needs a SQL-mode
  tweak is checked during apply, not designed here.
- Create-modal changes: registration still takes name, kind and target only.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `analytics/pipelines`: the aggregate section offers a Form/SQL mode choice and a SQL editor; the request carries
  `sql` exclusively of `group_by`/`measures`; the measure gate and the JSON editor's aggregate scenario account for
  SQL mode.

## Impact

- `apps/ai-dial-admin/src/models/analytics/pipeline.ts`, `models/analytics/pipeline-ui.ts`: `sql` member, mode enum.
- `utils/analytics/pipeline-dto.ts`: mode-aware member pruning in `buildPipelineDto` / `toPipelineDraft`.
- `components/Analytics/Pipelines/Aggregate/`: `AggregateSection`, `use-aggregate-form`, a new SQL declaration
  editor; `Common/SqlPredicateField` is a candidate for reuse.
- i18n keys (`AnalyticsPipelinesI18nKey`, `locales/en.ts`), specs and tests co-located with the above.
- No server-action or API-class change expected: the pipeline write already forwards the DTO. Verified in design.
- Backend contract: `analytics-data-access-service` commit `ed9315ea`. Not modified here.
