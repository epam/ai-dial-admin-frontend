## Why

The evaluator fold (#4641, in `development`) moved the whole transform onto the enrichment pipeline. Driving
the folded console against the live registry turned up three things the fold left behind: a column list
that answers a different question than the service asks, a legacy declaration that the form marks invalid
on every output, and a section that sits outside the block whose member it edits.

The list was closed at seven items; an eighth was added when driving the console turned up a crash it
introduces.

## What Changes

1. **The enrichment form reads the entity, not the table.** `transform.inputs`, the SQL predicates
   (`filter`, `prefer_sql`) and the member-selection `order_by` all take their columns from
   `GET /v1/tables/{name}`, which serves a table's own columns. The service addresses the **entity** — the
   source with every enrichment flattened in — so `dial_usage_log_payload.request_body`,
   `usage_client_identity.*` and `usage_request_baggage.*` are absent from every dropdown and marked
   invalid where a declaration already names one. Both live enrichments bind exactly those columns.
2. **A legacy declaration's identity transform is dropped on read.** `conversation-insights-live` carries
   `title → title`, `summary → summary` and so on in its folded `output_vars`; the service refuses the
   identity expression, so the console marks every output invalid and the first save is a 422 — for a
   declaration nobody edited. An absent `jsonata` already means that lookup, so reading one drops it.
3. **The inputs editor moves inside the transform block.** It is `transform.inputs` on the wire, next to
   `transform.outputs`, but the section sits outside the Transform block — a leftover from when `vars` was
   a top-level member. Worse, the placeholder-correspondence chips live with the inputs while the template
   they are matched against lives in the block, so the two halves of one check are in different sections.
   The order becomes the wire's: type → model → params → template → inputs → outputs.

4. **The composed response schema leaves the read-only facts.** The fold put it in the facts row as a
   comma-separated field list; beside one-line values like the grain key it reads as a paragraph — 13
   names on `session-insights-live` — and it repeats what the outputs editor states below. It is dropped
   with no replacement: the one case it spoke to, a declaration that stores its own schema and so is
   served verbatim rather than composed, stays readable in the JSON editor.

5. **The grouping key stops looking editable.** It is derived from the target's grain key and the service
   assigns it, but it renders as a `readOnly` text input, which reads as a field someone forgot to enable.
   It becomes a labelled read-only value, as `grain_key` and `version_column` already are. Not `disabled`:
   a disabled input leaves the accessibility tree, so the value would stop being readable at all.

6. **The read scope becomes one control, source first.** The follow-vs-pin radio plus its conditional table
   select collapse into a single dropdown whose first entry is "follow the target enrichment", naming the
   table that resolves to. The distinction stays on the wire: the follow entry sends no `inputs`, while
   choosing a table by hand pins it, which the service validates more strictly. Source is presented before
   target — wherever the pair appears: the enrichment's read scope, the aggregate's plain input select, and
   the read-only facts row above both, which named them the other way round.

7. **The outputs list gets a separator that can be seen.** The rows are already divided by a bottom border,
   but it uses `stroke-secondary`, which the contrast table admits for decorative lines only and which is
   effectively invisible on `layer-2`. It moves to `stroke-primary`, with more room between rows.

8. **An output stored without a refinement is read back rather than crashing the page.** An output the
   form sends with no prose and no refinement — the common shape now that the column supplies the
   description — is stored by the service as `null`, and reading one dereferenced it, so every pipeline
   created through the console's own modal failed to open. Found by driving the live registry through the
   console.

## Non-goals

- Anything the ADAS contract itself would have to change.
- The create modal's field set, which stays as the fold left it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the column source for the inputs editor and the SQL-scoped controls; the identity
  transform dropped on read; the inputs editor's place in the transform block; the response schema leaving
  the read-only facts; the grouping key as a read-only value rather than a field; the read scope as one
  control with source before target.

## Impact

- `components/Analytics/Pipelines/Common/use-pipeline-resolution.ts` (entity schema alongside the tables),
  `Enrich/VariablesEditor.tsx`, `Common/SqlPredicateField.tsx`, `Enrich/MemberSelectEditor.tsx`,
  `Enrich/EnrichSection.tsx`, `Enrich/TransformSection.tsx`, `Common/PipelineReadOnlyFacts.tsx`,
  `Common/SourceField.tsx`, `Common/PipelineSharedFields.tsx`, `Enrich/OutputsEditor.tsx`,
  `utils/analytics/transform-dto.ts`, and the `ResponseSchema` i18n key, which nothing else renders.
- Reads `GET /v1/queries/entities/schema/{name}` from the pipeline form, which until now only the query
  builder called. No new endpoint and no service change.
