## Context

See `proposal.md` for motivation. Today the aggregate declaration is `group_by` + `measures` on `CreatePipelineDto`,
authored by `AggregateSection` over `useAggregateForm` → `usePipelineForm`, and sent through `buildPipelineDto`
(`utils/analytics/pipeline-dto.ts`), which prunes the other kind's members (`AGGREGATE_ONLY_MEMBERS`,
`ENRICH_ONLY_MEMBERS`). The JSON editor works off the same DTO, so any member `buildPipelineDto` keeps is visible
and editable there.

Service contract (`analytics-data-access-service`, `ed9315ea`): `sql` is aggregate-only and exclusive with
`group_by`, `measures` and `filter` (422 otherwise). A patch that sends `sql` clears the form members and vice
versa; a patch carrying neither keeps the stored statement. A SQL-mode pipeline is read back with `sql` verbatim
and without `group_by`. Draft (disabled) writes accept an unparseable statement; the full gate runs on arming and
on preview, and refusals are 422s with a message naming the clause.

## Goals / Non-Goals

**Goals:**
- A SQL-mode aggregate can be created, opened, edited and saved without ever sending a mixed body.
- Mode is derived from data, so a pipeline created elsewhere opens correctly.

**Non-Goals:**
- Anything in the proposal's Non-goals. Additionally: no new server action or API method; the pipeline write path
  forwards the DTO unchanged.

## Decisions

### D1. Mode lives in the draft as `sql` presence, not as a separate field

The draft has no `mode` property. SQL mode is `draft.sql !== undefined`; Form mode is its absence. Switching to SQL
sets `sql: ''` and deletes `group_by`/`measures`/`filter`; switching to Form deletes `sql`.
- Keeps the draft a subset of `CreatePipelineDto`, so `toPipelineDraft`, the JSON editor seed and `buildPipelineDto`
  need no second source of truth, and opening a pipeline needs no mode-derivation step.
- *Rejected: a `mode` enum beside the members.* Two facts that must agree, and the JSON editor would have to
  reconcile them when the caller edits the document into the other mode.
- The `filter` field belongs to Form mode: a SQL declaration carries its own WHERE and the service refuses a
  `filter` beside `sql`. The section therefore hides it in SQL mode (`isFilterHidden` on `PipelineSharedFields`),
  rather than showing a control whose value is discarded on save. The mode switch clears it with the form members.
- Consequence: `sql: ''` must survive in the draft (empty editor, SQL mode still active) but must not be sent;
  `buildPipelineDto` drops a blank or whitespace-only `sql` with an explicit `trim()` check, since
  `dropEmptyMembers` drops only `''`.

### D2. `buildPipelineDto` prunes by mode

For an aggregate: SQL mode (`sql` present in the draft) removes `group_by`, `measures` and `filter`; Form mode
removes `sql`. `AGGREGATE_ONLY_MEMBERS` gains `sql` for enrich. A pure function over the draft, covered by util tests.
- **Wrinkle:** a blank statement is dropped from the body, and the draft then carries no `sql` in the DTO. A save
  of a pipeline switched to SQL but left blank therefore sends no declaration members at all. That is the state
  the service already stores for an undeclared aggregate, and it is the spec's "empty statement is not sent".
- `filter` is pruned in SQL mode only. In Form mode it stays, as today.

### D3. The statement is edited in a plain monospaced textarea first

Reuse the textarea branch of `Common/SqlPredicateField` pattern, not the Query Builder's `SqlEditor`.
- `SqlEditor` reads `useQueryBuilder()` for completions and formats on type/paste; neither fits a pipeline, and
  auto-formatting would rewrite the statement the service stores verbatim (spec: "The statement is not rewritten").
- `JsonEditorBase` (Monaco) is the generic editor and is the candidate if a plain textarea proves too thin for
  multi-line statements. The decision is the component `SqlDeclarationEditor`, with the underlying control swappable
  without touching the spec. Start with the textarea (`rows` ~12, `font-mono`, `spellCheck={false}`), as the
  existing predicate field already follows the "1.0 textarea" constraint documented in `SqlPredicateField`.
- *Rejected: extending `SqlPredicateField`.* Its caption, `sourceName` and compact variant are predicate-specific, and
  `use-dont-edit-shared-components` applies to `Common/*`; a sibling in `Aggregate/` wraps the ui-kit textarea itself.

### D4. Mode switch is a ui-kit radio group with a confirm on discard

`AggregateModeSwitch` renders the two modes (ui-kit `RadioGroup`, as the create modal's kind choice: two mutually exclusive modes
are a radio choice, and the group carries its own `radiogroup` semantics). The switch is blocked on a confirm
(`ConfirmationPopup`, as `PausePipelinePopup` does) only when the mode being left has authored content: non-empty
`group_by`/`measures` for Form, non-blank `sql` for SQL. State lives in `use-aggregate-form`
(`mode`, `onModeChange`, `isDiscardConfirmOpen`) so the section stays presentational.

### D5. Submit gate follows the mode

The console enforces no "at least one measure" gate today: `use-aggregate-form` derives only
`hasDistinctWithoutColumn`, and its spec pins that a declaration with no measure is not withheld. The measure
requirement is the service's. SQL mode therefore needs no gate change, and `hasDistinctWithoutColumn` is false
there because `measures` is absent from the draft.

### D6. Preview

`PipelinePreview` reads the saved pipeline through the service, which compiles the statement itself. For a refused
budget run the preview offers to open the declaration's section; for an aggregate that was the group keys section,
which a SQL declaration does not have. `getRemedySection` now returns `Properties` for an aggregate served with
`sql`. No new preview behaviour.

## Risks / Trade-offs

- [A switch that confirms and then discards loses typed work] → The confirm names what is lost; Cancel restores. No
  undo, consistent with the JSON-editor discard.
- [`sql: ''` in the draft vs. absent in the body] → Pinned by D2 and a util test; the one place the two diverge.
- [A plain textarea is a thin editor for long statements] → Accepted for the minimal scope; Monaco via
  `JsonEditorBase` is the named follow-up if reviewers want line numbers and highlighting.
- [The service refuses with 422 only on save/arm/preview, so a bad statement is saved as a draft silently] → That is
  the service's draft contract; the arming and preview errors surface it. Not a console concern.
- [Spec delta adds a mode-switch confirm the minimal scope did not list] → It is one popup reusing an existing
  pattern; dropping it would let a mis-click discard a statement. Flagged for the reviewer.

## Open Questions

- None that change the specs or task breakdown. Textarea vs Monaco (D3) is settled for this change.
