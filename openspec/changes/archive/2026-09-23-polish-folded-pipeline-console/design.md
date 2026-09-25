## Context

See `proposal.md`. Seven items found by driving the folded console against the live registry; four are
defects, three are presentation. They share one form, so they ship together.

The one that shapes the others: the form resolves **tables**, and the service resolves **entities**. A
table read returns that table's own columns; an entity is the source with every enrichment flattened in,
and a column of one is addressed `<enrichment>.<column>`. Both live enrichments bind such a column
(`dial_usage_log_payload.request_body`), so every control scoped to the read source is both missing options
and marking valid declarations invalid.

## Goals / Non-Goals

**Goals:**

- One source of truth for "what may this control name": the read source's entity for everything scoped to
  the source, the target's table for the outputs editor.
- Stop the console reporting a valid live declaration as broken — in the inputs editor and in the outputs
  list alike.
- Let the transform block read as the wire member it is: one block, wire order, no section of it outside.

**Non-Goals:**

- Anything requiring an ADAS change.
- The create modal's field set, and the aggregate section beyond the shared controls.
- Tagging, grouping or filtering the new field lists by `tag`/`sensitive`/`heavy` — the schema carries
  them, this change only stops hiding fields.

## Decisions

### D1 — The entity schema is a third resolution, beside the two tables

`use-pipeline-resolution` gains `getEntitySchema(sourceName)` through the same cached-resolution helper the
tables already use, keyed by the source's name. It resolves after the target, since the source name comes
from the target's `source_table` when the pipeline follows.

*Alternative considered:* deriving the qualified names client-side by listing enrichments whose
`source_table` matches and prefixing their columns. Rejected: it reimplements the service's own flattening
— which hides join columns and filters `sensitive` by role — and would drift the moment either rule
changes.

### D2 — Source-scoped controls take entity fields; the outputs editor keeps table columns

`VariablesEditor`, `SqlPredicateField` and `MemberSelectEditor`'s ranking take `AnalyticsEntityField[]`.
`OutputsEditor` keeps `AnalyticsTableColumn[]`: an output writes a column of the target table, and the
target's entity would additionally offer columns of enrichments **on** the target, which an output may not
write.

The two types are close but not the same, and the difference is the point — the prop type is what stops a
future edit from scoping the outputs editor to an entity.

### D3 — Following is a sentinel entry, not the followed table's name

The read-scope select's first entry carries a reserved value (not a table name) meaning "follow the target
enrichment", labelled with the table it currently resolves to. Selecting it clears the input; selecting any
table sets it.

*Alternative considered:* seeding the select with the followed table's name and inferring "follow" when the
value equals `target.source_table`. Rejected for the reason the current radio exists: the two are different
declarations — following omits `inputs`, pinning sends it and is validated more strictly — and a shared
spelling makes "pin to the table I am already following" unexpressible.

The follow-vs-pin state therefore stops being local component state: the select's value is derived from the
draft (`inputs` absent → the sentinel), which also removes the re-seeding problem the current component
documents.

### D4 — The identity transform is dropped where declarations are read, not where rows are rendered

`fromLegacyVars` and `fromOutputSpec` (in `transform-dto.ts`) drop a `jsonata` equal to the output's name.
Doing it in the mapper rather than in the editor means the dropped value never reaches the draft, so it
cannot be sent back, and the editor's existing "identity typed here is invalid" marker keeps working for
what an operator actually types.

### D5 — The grouping key becomes `LabelledText`

Not a `readOnly` input, which reads as a disabled field; not `disabled`, which removes the value from the
accessibility tree. `LabelledText` is what the read-only facts already use for `grain_key` — the same value,
in fact, seen from the trigger's side.

### D6 — The separator moves to `stroke-primary`

`stroke-secondary` is documented in this repo's own contrast table as decorative-only and sits far below
3:1 on `layer-2`. `stroke-primary` gives 3.35:1, which is what a divider carrying structure needs.

## Risks / Trade-offs

- **A third resolution on every target change** → It is one request, cached by name for the life of the
  surface, and it replaces nothing: the table read is still needed for `grain`, `source_table` and the
  target's own columns.
- **The entity schema can fail independently of the table read** → Reported like any other failed
  resolution; the controls say they could not load rather than showing a short list as though complete.
- **Source-before-target reads oddly in a form where target drives source** → Only the detail page renders
  the control, and there the target is already resolved. The create modal is untouched.
- **An entity field list is longer than a table's** → It is the list the service accepts; the query builder
  already presents the same set for the same source.
