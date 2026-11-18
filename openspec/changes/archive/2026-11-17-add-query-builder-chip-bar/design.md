## Context

See `proposal.md` for motivation. What shapes the approach:

- The builder's state (`QueryBuilderState`: `mode`, `filter` tree, `select`, `groupBy`, `aggregates`,
  `having`, `sort`, `page`) and its two-way mapping to the structured query (`utils/serialize.ts`
  `buildQuery`, `utils/deserialize.ts` `parseQuery`) are sound and well covered by tests. The form
  sections are one view over that state; they mutate it in place and call `refresh`.
- "Can the builder show this query" is one function, `isBuilderRepresentable`, with three callers:
  leaving the SQL buffer, restoring a stored query, and running an assistant message.
- The JSON view threads through `QueryBuilder.tsx` (buffer, diverged flag, sync on time change, Run,
  Copy), `use-saved-query-page.tsx` (restore, baseline, capture) and `utils/saved-query.ts`
  (`divergedJsonText`, `SavedQueryEditor.Json`).
- A time bucket today is not a concept: it is the catalog's binning function added as a scalar
  group-by row, with its unit list coming from the catalog's `allowed_values`. The time bound is the
  one place the code already names catalog functions by constant (`date_sub`, `now`) and verifies the
  catalog serves them.
- An enum field's `enum_values` reach the client but the filter editor ignores them.
- `Common/SplitPane` is percentage-based with a fixed 50% default; `Common/TimeFilter` fuses its
  trigger, preset list and calendar into one component and keeps `isCustom` as local state.
- The kit's `Dropdown` anchors an arbitrary overlay (`renderOverlay`) with a dialog role, focus
  management and Escape handling.

## Goals / Non-Goals

**Goals:**

- Chips are a new view over the existing state. The state model, `buildQuery`, `parseQuery` and the
  saved-query payload stay as they are.
- One representability rule for chips, replacing the form's, with the same three callers.
- The JSON view is removed completely, not hidden.
- No new props on `Common/*` components, with one exception: `Common/RangePicker` takes an optional
  `formatWeekDay`, because the calendar's week-day headings are rendered inside it and cannot be
  restyled from the Period popup. Its other caller passes nothing and renders as before.

**Non-Goals:**

- Trimming `QueryBuilderState` of the fields chips never set (`having`, `distinct`, row `fn`s). They
  keep the parser total: a query the chips cannot show still parses, it is only never displayed.
- A generic chip-and-popup component for the rest of the app.

## Decisions

### D1. Chips read and write the existing state

Each chip kind owns a slice: Period → the page's time filter state; Limit → `page`; Filter →
`filter.children`; Aggregate → `mode` + `groupBy` + `aggregates`; Show columns → `select`; Sort →
`sort`. A popup copies its slice into local form state on open and writes it back on Apply through the
existing `patch`. Nothing else changes: serialization, the SQL seed, dirty detection and Save all read
the same state they read today.

*Alternative — a chip model converted to and from `QueryBuilderState`.* Rejected: a second model needs
a second round trip and a second set of tests for information the state already holds.

Pure helpers carry the mapping so components stay markup: `chips/filter.ts` (predicate ↔ form, value
shaping by field type), `chips/aggregate.ts` (form ↔ `groupBy`/`aggregates` rows, bucket ↔ binning
row), `chips/labels.ts` (the words a chip states), `chips/sort.ts` (options, pruning).

### D2. Local edits, applied on Apply

The form edited the query live. A popup with Cancel cannot: it edits a draft of its slice and commits
once. This also removes the half-filled states the form had to tolerate — a predicate with no field, a
metric with an unfilled argument — so `hasDroppedCondition`, `getAggregateWarnings` and the warning
strings lose their only consumers and are deleted with the sections.

### D3. One popup shell over the kit `Dropdown`

`Chips/ChipPopup.tsx` wraps the kit `Dropdown` with `renderOverlay`, `overlayRole` dialog and a title
id; it renders the title (with the optional back control), the body, and the footer (Remove on the
left when editing; Cancel and Apply). Every chip kind supplies a body and an `isValid` flag. The Add
control is a `Dropdown` with `items`; choosing an entry swaps its overlay for that kind's popup in
adding form, anchored to the same control, so the back control is a state change and not a second
overlay.

### D4. Chip representability replaces builder representability

`isChipRepresentable(query, functions)` in `utils/deserialize.ts` implements the rule in the spec. It
is stricter than `isBuilderRepresentable` everywhere, so it replaces it rather than composing with it;
the function-catalog checks (served, arity, literal positions) are kept as shared helpers. The three
callers switch over. `isFilterRepresentable` and the nested-call allowances lose their callers and are
removed with their tests.

The Period pair is lifted before the filter is judged (`liftTimeRange` already returns the `rest`), so
a stored query with only a period shows no Filter chips rather than failing the flat-AND test.

### D5. A stored body the chips cannot show is translated on the server

`app/[lang]/queries/[id]/page.tsx` already has the stored query and the function catalog. When the
body is structured and `isChipRepresentable` is false, the page calls `translateQuery` and passes the
SQL as `initialSql`. `toBuilderRestore` takes it and returns the SQL editor with that text, so the
restore stays synchronous and the unsaved-changes baseline is built from the same text the editor
shows.

*Alternative — translate on the client after mount.* Rejected: the page would mount in the Builder
view with empty chips, then jump to SQL, and the baseline would have to be re-set after an async call
— the exact flicker and dirty-flag race the server prefetch pattern exists to avoid.

A refused translation passes the failure to the client, which opens an empty SQL view and reports the
failure through `useReadFailureNotification`. The stored query is not modified by opening it; it
becomes SQL only if the user saves.

### D6. The JSON view is deleted

Removed: `QueryBuilderView.Json`, `SavedQueryEditor.Json`, the JSON buffer and its flags,
`syncJsonBuffer`, `onChangeJson`, `parseDivergedBody`, `divergedJsonText` in
`SavedQueryCaptureInput`, the JSON branches of `onChangeView` / `leaveSqlBuffer` / `onConfirmDiscard`,
the JSON wording of `DiscardQueryPopup`, and the i18n keys behind them. `deriveSavedQueryEditor`
returns Builder or Sql. The save payload's precedence becomes: a non-blank SQL buffer, else the builder
state.

### D7. The builder area is its own resizable, in pixels

`Layout/BuilderArea.tsx` uses `re-resizable` directly with a bottom handle: a pixel height with a
default sized for two rows of chips, a minimum of one row, a maximum bound to a share of the page, and
the height persisted in localStorage and applied after mount. The handle is a `separator` with
`aria-valuenow` and arrow-key steps, like `Common/SplitPane`'s.

*Alternative — `Common/SplitPane`.* Rejected: it splits by percentage from a fixed 50% default and
exposes neither a default nor a pixel minimum. Making it fit would mean new props on a shared component
for one caller, which the repo's convention forbids; the mismatch is handled in the feature.

### D8. The Period popup is built from the preset config and `RangePicker`

`Chips/Period/PeriodPopup.tsx` lists `timePeriodOptionsConfig` and renders `Common/RangePicker` for the
custom range; it calls the page's existing `onChangeTimePeriod` / `onChangeTimeRange` on Apply.
`Common/TimeFilter` is not reused: its trigger and overlay are one component, and its custom flag is
internal. `useTimeFilter` stays the owner of the period state, so serialization and the saved time
intent are untouched.

### D9. The time bucket names the binning function by constant

Split by period maps to a scalar group-by row over the catalog's binning function, the same row the
form produced. The function is named by a constant beside `date_sub` / `now`, and offered only when the
catalog serves it with the argument shape the chip fills (an integer amount, a unit with allowed
values, an expression). Presets are data — amount and unit — filtered by the catalog's allowed units;
Custom parses "amount unit" against the same list and the amount's declared minimum.

*Alternative — find the function structurally in the catalog.* Rejected: two functions can share that
argument shape (`width_bucket` is one argument away), and a wrong structural match would silently bin
by something else. Naming it follows the time-bound precedent, including the "serve it or do not offer
it" check.

### D10. Distinct count is the counting function with distinct set

The Function list is the catalog's aggregate functions. For the implicit-measure function
(`implicitMeasureFunction`, the one whose arguments are all optional) with `distinct_supported`, the
list adds a second entry that sets `distinct` and requires the column. No function name is hardcoded.

### D11. Null checks are operators

The form offered "is null" as a value type under equals and does not equal. The popup has no value
type, so the same state (`isNull` on an `eq` / `ne` predicate) is reached by two operator entries, is
empty and is not empty. This is beyond the mockups; without it `IS NULL` would need SQL.

### D12. Show columns is a row-query chip

The mockups also show a column list on an aggregate query. An aggregate query's output is its keys and
its measure; hiding one of them is a grid-column preference, not a part of the query, and has nowhere
to be stored in a saved query. That is left out: with an Aggregate chip the Show columns entry is
unavailable.

### D13. The assistant is a panel, not a view

`AiPanel` is rendered inside `Ai/AiSidePanel.tsx` at the right edge of the query page: collapsed to a
narrow control by default, open as a 400px column, laid over the content below the tablet breakpoint.
Whether it is open is kept in localStorage and applied after mount. The view switcher keeps Builder and
SQL only, so Run and Copy no longer depend on the assistant.

Running a message switches the view to the one that shows the loaded query — Builder when the chips can
show it, SQL otherwise — because the panel no longer occupies the builder area and leaving the view
where it was would show a query other than the one that just ran. The conversation hook already lives
in `QueryBuilder`, which is remounted per page, so "lasts as long as the page" needs no code.

### D14. What is deleted

`Rail/`, `Mode/`, `Select/`, `Aggregate/`, `Sort/`, `Page/`, `Common/SectionBlock`,
`Common/FunctionRow`, `Common/FieldChip`, `Toolbar/QueryBuilderToolbar`, and the constants only they used (rail width and
storage key, paging and nulls option lists, value-type options, warning map). Kept: the
filter tree (`Filter/`, `filter-tree-context.tsx`) with `Common/SectionAction`, `Common/ChipRow`,
`Common/CategorizedFieldDropdown`, `Common/FnArgEditor`, `Common/CompactInput`, `Common/CompactSelect`
and `Common/FieldDropdownOption` — the table access row-limit editor still renders it, and with it
`isFilterRepresentable`. The chip popups use the kit `Select` for every column field.

### D15. The draft's table is page state, not part of the address

Picking a table no longer writes `?table=<name>` into the address. The Source panel provider, which
lives in the Queries layout and so outlives navigation between the draft and a saved query, holds the
picked table; `/queries` renders the draft on it, falling back to the first queryable table. The first
table's schema is still read on the server; a picked table's schema comes from the panel's own column
cache, the same read the Tables tab uses to show a table's columns.

Accepted cost: the table does not survive a reload, cannot be shared as a link, and a table row opened
in a new tab shows the first table. Alternative kept in reserve: the query parameter, which gave all
three at the price of an address that changes on every pick.

## Risks / Trade-offs

- **The builder can express less than before** → by decision; SQL covers the rest, and the guard and
  the server-side translation keep such queries reachable and intact.
- **A saved query that used to open in the Builder now opens as SQL** → nothing is rewritten on open;
  the stored body changes only on Save. Saving it stores SQL, after which it stays a SQL query.
- **A stored body the service cannot translate opens empty** → reported by notification with the
  service's words; the stored query is untouched and can still be deleted or duplicated.
- **The binning function is named by constant** → guarded by the catalog check; a deployment without it
  loses Split by period, not the Aggregate chip.
- **A large change in one PR** → the utils stay, so the diff is mostly component replacement; the
  tasks are ordered so the page works after each group.
- **Resetting the builder area height on small screens** → the maximum is a share of the page, not a
  fixed number, so a remembered height cannot push the results off screen.

## Migration Plan

Single frontend deploy, no data or API change. Stored queries are read as before; none is rewritten
until a user saves it. Rollback is reverting the change — a query saved as SQL in the meantime stays a
valid SQL query for the previous version.

## Open Questions

- Whether an aggregate with no group-by (one total over the filtered rows) should be offered. The
  mockups always show a group-by; the spec requires one. Relaxing it later adds a "none" choice and
  does not change the rule's shape.
- The exact preset list of Split by period beyond what the catalog's units allow (week and month
  depend on the deployment's binning function).
