## Context

See `proposal.md` — Why. What matters for the approach is that the builder already has every piece
this change needs, assembled once in `Aggregate/GroupBySection.tsx`:

- `Common/CategorizedFieldDropdown.tsx` already accepts `functions` / `onSelectFunction` and renders a
  Functions group above the column categories.
- `FnArgEditor` builds an argument editor purely from a catalog `QueryFunctionArg` (it moves from
  `Aggregate/` to `Common/` here, since three sections now use it).
- `utils/functions.ts` supplies `scalarFunctions`, `emptyArgs`, `requiredArgsFilled`,
  `functionArgSummary`, `functionResultType`; `utils/fields.ts` supplies the alias machinery
  (`deriveAlias`, `uniqueAlias`, `computedColumnNames`, `takenColumnNames`, `prefilledAlias`).
- `utils/serialize.ts` has `fnExpr`; `utils/deserialize.ts` has `argsToSlots`.

Two state shapes are what block reuse. `QueryBuilderState.select` is `string[]` — it can hold a column
name and nothing else. `FilterPredicateNode.field` is a `string` — a predicate's left side can only be
a column. Everything downstream of those two facts is a consequence.

The backend imposes no constraint here: `StructuredQueryBuilder.buildRow` runs every projection entry
through the shared expression translator and aliases it (registering the alias as a sortable output
name), and `ExprTranslator` resolves an `fn` expression in any filter operand.

## Goals / Non-Goals

**Goals:**

- One representation for "a column or a scalar-function call", reused by Group by, the row-mode
  projection, and a filter condition's left operand.
- Deserialization that either shows a query faithfully or declines to show it — never a third outcome
  where it is shown with parts missing.
- No new function knowledge in the frontend: everything still read from the served catalog.

**Non-Goals** (beyond the proposal's): no change to `FnArgEditor`'s argument model, and therefore no
variadic slots and no literal or nested-call `expression` arguments; no new dropdown mode; no change
to how aggregate mode builds its rows beyond extracting shared rendering; and no catalog threaded
into the saved-queries grid (see decision 4).

## Decisions

### 1. Row-mode `select` becomes a row list of the same shape as `GroupByRow`

`select: string[]` → `select: SelectRow[]`, where `SelectRow` is the existing group-by row shape
(`id`, `fn: string | null`, `field`, `alias`, `aliasEdited`, `args`). The two are structurally
identical, so the shape moves to a shared `ExpressionRow` interface in
`models/analytics/query-builder.ts` that both alias.

*Alternative — keep `select: string[]` and add a parallel `selectFunctions` list.* Rejected: the spec
requires entries to serialize in the order they were added, and two lists cannot express interleaving
without a third ordering structure. It would also fork the alias machinery.

*Alternative — a discriminated union (`{kind: 'column'} | {kind: 'fn'}`).* Cleaner in isolation, but it
would make the row-mode row shape differ from the group-by row it must share rendering and alias code
with. Matching the established shape wins; the repo's cost of a locally-nicer-but-different shape is
higher than the cost of an unused `field` on a function row (which `GroupByRow` already carries).

### 2. `FilterPredicateNode` gains `fn` + `args`, keeping `field`

The predicate gets the same `fn: string | null` discriminator as a group-by row rather than a
`left: FieldOperand | FnOperand` union. Existing readers of `node.field` (`renamedFilterFields`, the
having-options resolver, the summary) keep working unchanged, and the null case stays the common case.

Trade-off: a nominally meaningless state (`fn` set *and* `field` set) is representable. It is
unreachable through the UI and resolved the same way `GroupByRow` resolves it — `fn` wins — which is a
rule the codebase already applies rather than a new one.

### 3. One operand-type resolver, used by both type-dependent rules

A condition has two behaviors keyed on its left operand's type: the default value type, and the
withholding of the contains operators over an enum. Today both read `fieldTypeOf(fieldOptions, field)`
independently. They move behind a single resolver — schema type for a column, `functionResultType` for
a function — so a function operand can never get its value type from one rule and its operator list
from the other.

### 4. Representability gains a catalog check

`isBuilderRepresentable(query)` → `isBuilderRepresentable(query, functions)`, additionally walking
every expression in a builder-edited position and requiring not just that the catalog names the
function but that its arguments match the shapes the argument editor can produce. Five call sites:
three in `QueryBuilder.tsx` and one in `utils/saved-query.ts` hold the catalog; the fifth, the
saved-queries grid's Editor column (`constants/grid-columns/grid-columns.tsx`), does not — that page
never loads one. The parameter is therefore **required but nullable**, so a new call site has to
choose rather than inherit the permissive path, and `null` means "structure only". The grid can
consequently label a query "Builder" that opens in JSON; threading the catalog into a static column
factory is the larger change, and the mislabel is cosmetic where the guard is not.

*Alternative — have `parseQuery` report what it dropped.* Rejected: representability is already the one
gate the JSON/SQL→Builder guard consults; a second signal would mean two sources of truth for the same
question, and the guard would have to reconcile them.

This also closes the same hole in `aggregate` mode, where `parseAggregateSelect` already skips an
unserved function silently.

### 5. The function row's rendering is extracted, not copied

The expanded function row — collapsed summary, one `FnArgEditor` per catalog argument, alias input — is
identical in Group by and in the row-mode projection. It moves to a presentational component under
`QueryBuilder/Common/`, parameterized by section color and id prefix, with argument and alias changes
raised to the owning section. Alias *policy* stays with each section, because it differs: a group-by
rename must rewrite sort keys and having fields, a row-mode rename only sort keys.

*Alternative — duplicate the JSX.* Rejected: it is the alias-rederivation wiring that must stay in
sync, and that is exactly the part a copy silently diverges on.

### 6. Alias machinery is extended, not duplicated, for row mode

`computedRows` in `utils/fields.ts` gains the row-mode select function entries. Prefill, uniqueness
against sibling output names, blank-alias fallback at serialization, and the row-mode `sortFieldOptions`
then all follow from the existing implementations with no new rules. The two modes never contribute
rows at the same time, so the function stays mode-scoped rather than growing a branch per caller.

### 7. The function affordances reuse Group by's strings; only the warnings are new

The Functions group label, the argument-editor labels (which come from catalog argument names), and the
alias placeholder are all existing keys used by Group by. The two dropped-entry warnings are the only
new strings, and they follow the existing `QueryBuilderWarning` → `WARNING_I18N` → `SectionBlock`
`warning` path rather than inventing a second way to surface one.

## Risks / Trade-offs

- **A consumer of `select: string[]` outside the three known files** → the compiler is the net; the
  type change is breaking by construction, so nothing fails silently at runtime.
- **A row-mode function alias colliding with a projected column name**, which would collapse two result
  columns → uniqueness is resolved through `takenColumnNames`, which must include the projection's plain
  columns, not only its function entries.
- **Queries that previously opened in the Builder now open in JSON** → correct by intent, but a wider
  class than the unserved-function case alone: a variadic call, a constant passed to an `expression`
  argument, and a non-literal right operand all become unrepresentable too. Before this change each
  opened in the Builder with that part silently blanked. This is the user-visible face of the change
  and is stated in the spec delta rather than left to the code.
- **An enum-typed operand reached through a function** (a function whose return type is its argument's
  own, over an enum column) → handled by `functionResultType`, which already resolves that case; the
  withholding rule keys on the resolved type, so it holds without a special case.
- **Extracting the shared function row touches working aggregate-mode code** → the extraction is
  behavior-preserving and covered by the existing Group by tests, which must keep passing untouched.

## Migration Plan

None. The state shape is client-side only; the structured-query wire format, the saved-query payload,
and every server action are unchanged. Nothing persisted needs rewriting, and the change is revertible
by revert alone.
