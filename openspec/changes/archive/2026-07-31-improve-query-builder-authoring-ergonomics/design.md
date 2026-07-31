## Context

The Query Builder's Builder view is a compact rail of section blocks (`components/Analytics/QueryBuilder/`) over a mutable `QueryBuilderState` held in a ref-like context: sections mutate the state object in place and call `refresh()` to re-render. Serialization to `StructuredQuery` happens in `utils/serialize.ts`; every view (JSON, SQL, Run, Copy) reads from that one function.

Three facts from the current code and the analytics service shape this design:

1. **An alias is the only name a computed column has.** `StructuredQueryBuilder.requireAlias` (analytics-data-access-service) rejects a computed `select` entry whose `as` is null or blank, and `sortFields` resolves a computed sort key only through `selectAliases`. The builder creates aggregates and group-by function rows with `alias: ''` (`utils/state.ts`), serializes `as: a.alias || ''` (`utils/serialize.ts:130`), filters aliasless aggregates out of the Sort/Having options (`utils/fields.ts:110`), and does not gate Run on the warning (`QueryBuilder.tsx:388`). An unaliased aggregate is therefore simultaneously invisible to Sort and fatal to Run.
2. **Pretty aliases are safe on every leg of the round trip** — verified before proposing: jOOQ aliases via `expr.as(alias)` and references via `DSL.field(DSL.name(alias))`; the DSL→SQL renderer quotes with `quoteIdentifier` (doubling embedded quotes); the SQL→DSL front end parses with `withQuotedCasing(Casing.UNCHANGED)`, so `"Total tokens (sum)"` survives verbatim. No charset or length validation exists on `as` anywhere in the service — only the blank check.
3. **Two of the three shared controls involved are QueryBuilder-local.** `CompactSelect` and `CategorizedFieldDropdown` live under `QueryBuilder/Common/` and have no consumers outside it; `OPERATOR_OPTIONS`, `VALUE_TYPE_OPTIONS`, and `SORT_DIRECTION_OPTIONS` each have exactly one consumer. The blast radius of changing all three is the Query Builder.

There is also an existing labeling mechanism worth reusing rather than duplicating: `buildExecutedMeta` (`QueryBuilder.tsx:573`) already builds a `columnLabels` map from schema display names, but only for `group_by` dimension columns, and only `ResultChart` reads it — `getResultColumns` (`utils/result.ts`) heads grid columns with the raw column key.

## Goals / Non-Goals

**Goals:**

- A computed row (aggregate, group-by function) is addressable — by Sort, by Having, by the backend — the moment it is added, with no manual naming step.
- The builder can no longer serialize a computed output column with a blank `as`, so a builder-authored aggregate query cannot fail validation for a missing alias.
- Adding several fields to Select or plain Group by takes one dropdown visit.
- The operator, function, and sort-direction pickers say what they mean in words — list, trigger and row summary alike — with a hover description.
- One resolver names every computed column, so the prefill, the Having/Sort options and serialization can never disagree, and a rename never orphans a reference.
- One labeling mechanism serves grid and chart; the raw field `name` stays the query's contract for schema columns.

**Non-Goals:**

- No backend or DTO change (no `display_name` on the function catalog).
- No alias validation (uniqueness of user-typed aliases, charset, length) and no gating of Run on warnings.
- No multi-select for single-valued pickers; no relaxing of the one-category accordion; no "select all in category".
- No full-name treatment for value-type, Nulls, page-type, or chart-type selects.
- No move from name-based to id-based column references in Sort/Having (see D9).

## Decisions

### D1: Derive the alias in a pure util, store it on the row, track user edits with a flag

`AggregateRow` and `GroupByRow` gain `aliasEdited: boolean`. Derivation is a pure function in `utils/fields.ts` (it needs `AnalyticsEntityField` display names and the catalog function, both already parameters of that module's helpers):

```
deriveAlias(fn, args, distinct, fields) -> string
  no filled expression arg    → functionLabel(fn)                       count → "Row count"
  first expression arg filled → "<display name> (<label>[ distinct])"   sum(total_tokens) → "Total tokens (Sum)"
uniqueAlias(candidate, taken) -> string                                 appends " 2", " 3", …
computedColumnNames(state)    -> Map<rowId, name>                       the one resolver (D8)
```

Rows are created with the derived alias (`utils/state.ts`), and the sections rederive on function/argument/distinct change **only while `aliasEdited` is false**. `CompactInput`'s `onChange` sets `aliasEdited = true`. `utils/deserialize.ts` sets `aliasEdited: true` for every row it builds, so an authored JSON alias is never rewritten.

*Alternative rejected — derive only at serialization time (`utils/serialize.ts`):* smaller diff, but the name would never appear in the rail, so the Sort dropdown would offer a column name with no on-screen origin, and the user would have nothing to edit. The ask was explicitly "prefill, but allow to change".

*Alternative rejected — a `useMemo`-derived alias with no stored flag:* the row must remember that the user took ownership of the name across unrelated re-renders; a derived value cannot express that without a stored bit.

### D2: Keep a serialization-time fallback as well as the prefill

`utils/serialize.ts` computes `as: row.alias.trim() || deriveAlias(...)` for computed columns. This is belt-and-braces, not redundancy: the input can legitimately be empty mid-typing, and a JSON round-trip can hand the builder a row with a blank alias. With the fallback, no state reachable in the UI can produce the 400.

Consequence: `QueryBuilderWarning.MissingAggregateAlias` and `MissingGroupByAlias` describe unreachable states and are removed from the enum, `WARNING_I18N`, the section warning lists, and `getAggregateWarnings`. `MissingGroupByField` and `EmptyAggregate` stay. `group_by` inclusion loses its `alias` condition (`serialize.ts:113`) and keys only on required-args-filled, since an alias now always exists.

### D3: Aliases for computed columns, display-name labels for schema columns

Two column kinds, two mechanisms, no overlap:

| Column kind | Name in the query | Header in the result |
|---|---|---|
| computed (aggregate, group-by fn) | the alias — its only name | the alias |
| schema (row-mode select, plain group-by) | the raw field `name` | display name via label map |

Aliasing schema columns with their display name would put presentation text into the query and contradict a standing requirement (*"Display names are presentation-only: structured-query serialization, the JSON view, and the SQL view SHALL always use the raw field `name`"*), and would make a server-side display-name change silently rewrite saved query JSON.

The labeling half is closed by extending what exists rather than adding a path: `buildExecutedMeta` populates `columnLabels` for row-mode `select` columns (and the schema-backed `group_by` columns it already covers), and `getResultColumns` takes the map as a second argument to set `headerName`, falling back to the column key. `ResultChart` keeps reading the same map. SQL-view runs return an empty map, so their headers stay as returned.

*Alternative rejected — alias everything, drop `columnLabels`:* one mechanism, but it violates the requirement above and bloats every query with UI text.

### D4: `CategorizedFieldDropdown` gains a mode enum, not a boolean

The component already carries two implicit modes (ghost "+ Add" trigger vs. select-like picker trigger, keyed off `addLabel`). A third behavior (stay-open, multi-value) on top of a boolean would give four prop combinations of which two are meaningless. Instead: `FieldDropdownMode { Picker, Add, MultiAdd }` in `models/analytics/query-builder.ts` (the repo prefers enums over string unions for value sets), and `Props` is a discriminated union on it — a picker carries `value`/`placeholder`/`emptyOptionLabel`, both add modes require `addLabel`, and only `MultiAdd` carries `selected`. An unlabelled add trigger or a picker with a selection list is then unrepresentable rather than merely unused.

Behavior in `MultiAdd`: `onPick` toggles and does **not** `setOpen(false)`; `onOpenChange(true)` no longer resets `search`/`expandedTag`, so the term and open category survive picks within a visit. The option row's existing `option.name === value && 'bg-accent-primary-alpha'` selected tint generalizes to `isSelected(option)` — the multi-select visual is the single-select visual, so no new tint token is introduced. `role="listbox"` gains `aria-multiselectable`, and `aria-selected` carries the toggle state, which is the non-visual channel for a color-only cue; the chip row beneath each section remains the textual confirmation of what is selected.

Selected-vs-hover legibility: rows use `hover:bg-layer-4`, and a hovered selected row must not read as unselected. The selected tint is applied after the hover class so it wins, and the option row extraction (below) keeps that ordering in one place.

The 276-line file grows a checkbox-free but stateful option row, so the option `<button>` (tooltip wrapper, display name, sensitive marker, type, description, selected tint) moves into its own component file under `QueryBuilder/Common/`, per the one-component-per-file rule.

Call-site changes: `SelectProjection` and `GroupBySection` stop filtering picked fields out of `options` (there must be a row to tint and to click again) and pass a toggle handler instead of an append handler. Toggling off a plain group-by column removes that row; ordering stays selection order, which is the existing `state.select` / `state.groupBy` push order.

### D5: `CompactSelect` options carry a name and a description — no short code

Codes are dropped entirely: a full name reads in the option list, the collapsed trigger, and the row summary. The rail has room once the operator select is widened (`min-w-[200px]`, direction `w-[112px]`), and two registers for one value ("Contains" in the list, `CO` in the trigger) is the kind of split that makes a control feel arbitrary. ui-kit's `SelectOption` already carries `description`, so `CompactSelect` needs no bespoke option type — each option is wrapped in `DialTooltip` with `hideTooltip={!description}`, the pattern `CategorizedFieldDropdown` already uses, and the trigger label sits in a `DialEllipsisTooltip` so a name too long for the trigger stays reachable (`components.md` §9).

Because option text must be translated but the option set is fixed, constants hold `CompactSelectOptionDescriptor { value, labelKey, descriptionKey }` (the `WARNING_I18N` precedent) and `utils/options.ts` resolves them against the caller's `t` — one pure helper shared by `FilterCondition` and `SortKeys`, plus `compactSelectLabel` for row summaries.

Value-type and Nulls options stay as they are; they already read as words.

### D7: A function's label is lifted from its served description

The catalog serves no display name, and the spec forbids a per-function table in the frontend — but its descriptions open by naming the function ("Average of a numeric expression over the group; …", "Row count; with an argument …", "Continuous percentile: …"). So `functionLabel` takes that leading phrase, cutting at the first clause break or the `<name> of/for …` / `<name> (…)` pattern, and falls back to `humanizeFunctionName` when the phrase is prose (over three words) or absent. Verified against all 14 production descriptions in `QueryFunctionCatalog.java`, pinned in `utils/tests/functions.spec.ts`.

Two functions can open their descriptions with the same phrase, and two identically labelled options are unpickable, so `functionLabels` resolves a whole picker at once and drops every colliding function back to its own catalog name.

*Trade-off:* the emitted `as` / `group_by` / `ORDER BY` names for non-user-edited rows now depend on backend description text, so a reword changes them. Accepted: those names are already derived (not user-authored), a user-typed alias is never touched, and the alternative — a hardcoded map — breaks the catalog's "new functions need no frontend change" guarantee.

### D8: One resolver names every computed column

Three paths need a computed column's name (the alias prefill, the Having/Sort options, serialization). Deriving independently in each let them disagree — the review found exactly that: a blank alias invisible to the prefill's uniqueness check, and options offering a name the serializer then suffixed. `computedColumnNames(state)` walks the rows in serialization order and returns row id → name: the row's own alias when non-blank (a user's duplicate included — their choice), otherwise the derived name uniquified against everything already assigned, plain group-by columns included. Rows the query excludes (a function row with an unfilled required argument) are not named and so not offered.

The row's stored alias is deliberately authoritative rather than recomputed, so the name in the alias input is always the name in the query — recomputing would let the input drift from the emitted column after an unrelated row was removed.

### D9: A renamed column carries its references

A rederived name would otherwise orphan any Sort key or Having condition holding the old string, producing `ORDER BY` on a column the query no longer emits — a 400. `renamedSortKeys` / `renamedFilterFields` (pure, in `utils/state.ts`) rewrite those references, and both sections apply them in `syncAlias` before storing the new alias. Sort/Having keep storing a *name*, not a row id: switching them to ids would make orphaning structurally impossible but touches `SortRow`, `FilterPredicateNode`, deserialization, and every option path — disproportionate for this change, and recorded here as the known limit.

### D6: Tests follow the existing split

Derivation and uniquifying are pure — unit tests in `utils/tests/fields.spec.ts`; the serialization fallback and the warning removal in `utils/tests/serialize.spec.ts`; the label map in `utils/tests/result.spec.ts`. Multi-select toggling, selected tint, stay-open behavior, and the option-list wording go in the existing component specs (`Common/tests/CategorizedFieldDropdown.spec.tsx`, `Common/tests/CompactSelect.spec.tsx`, `Aggregate/tests/FunctionSections.spec.tsx`).

## Risks / Trade-offs

- **A derived alias reads badly for parameterized functions** — `percentile_cont(0.95, latency)` derives `Latency (percentile_cont)`, losing `0.95`; `date_bin(5, minute, request_time)` derives `Request time (date_bin)`, losing the bucket width. → Accepted: the scheme is optimized for the aggregate majority, the alias stays editable, and encoding literal args into the name would produce longer and more brittle labels. Documented in the spec by example so it is not discovered as a surprise.
- **Duplicate output column names silently collapse** — result rows are `Record<string, unknown>`, so two columns with the same name lose one in the grid, and `ORDER BY "name"` is ambiguous. → `uniqueAlias` suffixes derived aliases against the aliases already in state. A user who types a duplicate by hand still gets the collapse; that is pre-existing behavior and out of scope (no alias validation).
- **Aliases with spaces and parentheses now appear in the SQL view** — a user hand-editing that SQL must keep the quoting (`AS "Total tokens (sum)"`). → Verified valid on both legs (renderer quotes and escapes; the Calcite front end preserves quoted casing), and the SQL path is already backend-authoritative for validation.
- **Changed default headers for existing behavior** — the implicit count column moves from `count` to `Count`, and aggregate headers now read as derived labels. → Display-only, no stored user state to migrate; the JSON/SQL views show the alias so nothing is hidden.
- **Selection shown by background alone is a color-only cue** (WCAG 1.4.1) — this was an explicit product decision over checkboxes. → Mitigated by `aria-selected` + `aria-multiselectable` for assistive technology and by the chip row as a textual echo of the selection. If a visual non-color cue is wanted later, a check glyph in the option row is an additive change to the extracted option component.
- **Keeping search and accordion state across picks changes reopen behavior** — the overlay no longer resets its search on open in `MultiAdd`. → Confined to the two multi-select call sites; `Picker` mode keeps resetting and keeps opening on the group holding the current selection.
- **Removing two warning enum members touches shared constants** — `WARNING_I18N` and the section warning lists are exhaustive `Record`s over the enum. → TypeScript flags every site; the i18n keys and locale strings are removed with them.

## Open Questions

None blocking. Resolved during exploration and review, recorded so they are not relitigated: a cleared alias falls back to the derived value rather than warning (D2); every picker reads in full names, codes dropped (D5); function labels come from the served description (D7); Sort/Having still reference columns by name, kept in sync on rename (D9).
