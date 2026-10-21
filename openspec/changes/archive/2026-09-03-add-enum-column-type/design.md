## Context

See `proposal.md` — Why. The constraints that shape the approach:

**The service contract** (ADAS `dde7afe`, `docs/enum-columns.md`, confirmed against the live dev catalog):
`enum_values` is the type parameter `enum` takes the way `element_type` is the one `array` takes — required iff
the type is `enum`, rejected on any other type. Declared order becomes each value's numeric id, so the column
sorts in declared order. Rules: 1–512 values, distinct after trimming, non-blank, ≤64 characters, stored
trimmed. Any character is legal in a value, quotes included. The domain is **immutable**: a schema-patch
`update` carrying `enum_values` is refused with 422, not ignored. Enum is allowed as an ordering-key entry, an
identity column and an enrichment grain key; refused as a TTL column, a source's `version_column`, and an
`array` `element_type`. On the query path values cross the wire as plain strings, and the LIKE-based operators
(`co`/`nc`/`ico`/`inc`) plus the string functions are refused.

**The frontend today.** `AnalyticsFieldType.Enum` already exists and the Conversations grid already routes an
enum column to `ConversationValueFilter` — added when the *entity schema* began reporting the type. What is
missing is the other half: the type is filtered out of `COLUMN_TYPE_OPTIONS` on a comment asserting the catalog
would reject it, and no model carries `enum_values`.

**The shared list popup is a fixed dependency.** The value-list control the user chose — the Topics-style list
popup — is `Common/Multiselect` → `MultiselectModal` → `ModalContent` → `DraggableList` → `NewItem` →
`NewItemInput`, and it is used by Topics and by several entity property panels. It is to be **used, not
edited**: `NewItemInput` validates each row with `getTopicError` and registers it under a `topic_`
validation-context prefix, and `MultiselectModal` gates Apply on `isErrorPresent(errorFields, ['topic_'])`.
Both are givens this change designs around rather than parameterises.

## Goals / Non-Goals

**Goals:**

- One place decides what an enum column is, so the type's rules are not restated per call site.
- Reuse the existing list-popup pattern rather than introduce a second multi-value control.
- Add no API to the shared list components, and leave every current caller behaving identically — except
  where the current behaviour loses data.
- Keep the Conversations filter's *behaviour* untouched while changing its presentation.

**Non-Goals:**

- Beyond `proposal.md` — Non-goals, this design does not generalise `Common/Multiselect` into a validated
  list-editor abstraction, nor parameterise it for this caller at all. If a later consumer genuinely needs
  per-list validation rules, that is the point to design the seam — with more than one real case to shape it.
- No re-layout of the column row. The enum control takes the slot the element-type control occupies for an
  Array row, so a row's width budget is unchanged.

## Decisions

### 1. `enum_values` lives on the column model, not in a parallel map

`AnalyticsTableColumn.enum_values?: string[]` and `AnalyticsEntityField.enum_values?: string[]`, mirroring how
`element_type` is already carried. The draft-row model gains `ColumnRow.enum_values: string[]` (always an array,
empty when the type is not enum) and `ColumnRowError.enum_values?: string`.

*Alternative considered:* a discriminated union on `type`, so `enum_values` is only reachable on an enum column
and `element_type` only on an array one. Rejected — `AnalyticsTableColumn` is a wire DTO consumed by mappers,
grid value-getters and the connect snippets that all read `type` dynamically; a union would push a narrowing
branch into every one of them to express a constraint the service already enforces. Optional fields with the
required-iff rule in validation is the shape `element_type` established.

### 2. `enum_values` is emitted only for an enum column, in one place

`toTableColumns` already gates `element_type` on `isArray`; `enum_values` is gated on `isEnum` the same way, so
retyping a row cannot leak a stale domain into the payload. `update` in `use-draft-schema-form` already clears
selections a retype invalidated (partition, identity, version); nothing needs to clear `enum_values` there
because the emit gate makes a stale value unreachable — but the *editor* clears it on retype anyway, so the
control does not redisplay values a subsequent retype back to enum would silently resurrect.

`buildColumnEditPatch` needs no change to satisfy the immutability rule: it builds its `update` entry from an
explicit field list that has never included `enum_values`. That is worth an assertion in the tests rather than a
code change — the requirement is that the patch never carries the key, and the current shape already guarantees
it.

### 3. Validation stays in `Tables/utils.ts` alongside the rules it joins

Enum-value validation is a per-row concern computed by `getColumnRowErrors`, which already owns identifier,
length and element-type validation for the same row and is a pure function under test. A new
`getAnalyticsEnumValuesError` in `utils/validation/analytics-table-error.ts` holds the four rules (count,
non-blank, length, distinct-after-trim) next to the other analytics validators, and `getColumnRowErrors` calls
it. `hasColumnRowErrors` and `ColumnRowsEditor`'s `rowHasError` both enumerate error keys explicitly, so both
gain the new key.

*Note on the error shape:* `ColumnRowError.enum_values` is a single string, not a per-value list. The popup
renders its own per-entry messages (from the shared topic rule — see decision 4), and this row-level string is
what disables Save and labels the collapsed field, so one message is what that slot needs.

### 4. The list popup is used as it is, never adapted

`EnumValuesField` wraps the shared `Common/Multiselect` in `draggable` mode and passes it nothing it does
not already accept. The shared component is a dependency, not a thing to bend around this feature.

Two consequences follow from taking it as-is, and both are handled outside it:

- **Its rows validate with the topic rule (2-255 characters), not the enum rule.** That is fine because the
  *authoritative* check was never going to live in the popup: `getAnalyticsEnumValuesError`, reached through
  `getColumnRowErrors`, gates Save on the real service limits (1-512 values, 1-64 characters each, distinct
  after trimming). The popup's rule differs from it only by being stricter at the low end, so the one thing
  it costs is that a single-character value has to be entered as part of a set the row-level check then
  accepts.
- **Its rows register in `SaveValidationContext` under a shared `topic_` key**, and the popup's Apply is
  gated on that map — so a stale entry from another list would disable Apply here for no visible reason.
  `EnumValuesField` therefore wraps its popup in a private `SaveValidationContextProvider`, which keeps its
  row validity to itself. Composition, not modification.

The declared-order hint is rendered by `EnumValuesField` beneath the field, since the shared component has
no slot for it.

*Alternatives considered:*

- *Threading an injectable validator and validation-key prefix through the six components between
  `Multiselect` and `NewItemInput`* (with today's values as defaults, so existing callers were unaffected).
  Rejected: it edits shared code used by Topics and several entity property panels in order to fit one new
  caller, and the correctness it buys is already owned by the row-level check.
- *A dedicated enum-values control built from ui-kit primitives.* Rejected: it would duplicate the popup
  chrome, the drag-reorder list, the add-row action and the apply/cancel wiring — a near-copy of a shared
  component is the review failure `AGENTS.md` warns about.

### 5. `DraggableList`'s search becomes presentational — the one shared-component edit, and a bug fix

`DraggableList` holds `list` state, pushes it upward with `useEffect(() => setItems(list), [list])`, and on a
filter change sets `list` to the *filtered* subset. So typing a search term and applying commits only the
matching items — every other value is dropped. `MultiselectModal`'s draggable branch applies `newItems`
wholesale, so the loss reaches the entity.

This is reachable today (the search renders above ten items, and Topics can exceed ten), but an enum domain of
up to 512 values makes it routine, so the fix is in scope rather than deferred. The fix: keep the authored list
as the single source of truth and derive the rendered view from it, so a filtered view never becomes the
committed value. Item mutations (edit, remove, reorder) must therefore address an item by its **index in the
authored list**, not in the filtered view — which is also what makes drag-reorder correct under a filter. The
simplest correct form is to disable reordering while a filter is active: a drag between two rows that are not
adjacent in the authored list has no single defensible meaning.

*Alternative considered:* leave the bug and cap the enum control's list below the search threshold. Rejected —
it caps the feature at ten values to avoid a defect, and leaves the defect for Topics.

This is the only change to shared code in this change, and it is a correctness fix rather than an adaptation:
it adds no API, and it changes behaviour only in the case that currently loses data. It would be reasonable to
land it as its own commit or PR ahead of this feature.

### 6. Enum's key/candidate eligibility falls out of the existing helpers

`getVersionColumnNames` already narrows to `Timestamp`, and `getTemporalColumnNames` to `Date`/`Timestamp`, so
enum is excluded from the version and partition selectors with no change. `getIdentityColumnNames` filters on
non-nullable and non-sensitive only, so enum is already offered there — which matches the service. Ordering key
and grain key are drawn from all declared names, likewise correct. `ELEMENT_TYPE_OPTIONS` is derived by
subtracting Array and Object from `COLUMN_TYPE_OPTIONS`; once Enum enters the latter it must be subtracted too,
so the derivation gains it explicitly rather than inheriting it.

The stale comment in `constants/analytics/tables.ts` is replaced by one stating what is now true: enum is
declarable, and it is the `element_type` list it is excluded from.

### 7. The query-builder guard filters options at the consumer, keyed on the field's type

`OPERATOR_OPTION_DESCRIPTORS` is a flat constant. The condition row already resolves its selected field's type
from the loaded schema (it drives the value-type default), so the guard is a filter applied where the options
are turned into select options — not a second constant and not a per-field table. `AnalyticsFieldType.Enum` is
the only trigger, satisfying the spec's "declared type alone".

The spec also requires that changing a condition's field to an enum-typed one moves an existing contains
operator off it. That is a field-change handler concern, in the same place the value type is already
re-defaulted on a field change.

### 8. The filter restyle reuses the grid's filter chrome rather than re-theming AG Grid

`ConversationValueFilter` is an AG Grid custom filter, so AG Grid owns the popup; the built-in text and number
filters get their app styling from the `.ag-filter-wrapper` block in `scss/ag-grid.scss`. Rather than extend that
SCSS to reach a custom component's markup, the component composes the same ui-kit controls the app's own
`GridFilterDropdown` overlay uses — the `bg-layer-4` surface, `DialInput` with `IconSearch`, and the outlined
neutral Reset button — so the two read the same without a second styling mechanism.

`Checkbox`'s `labelProps.label` currently receives `"<value> (<count>)"`, which makes the count part of the
option's accessible name. The count moves to a sibling element in `text-secondary`, leaving the value as the
name — this is the a11y requirement in the spec, and it is why the label is not merely restyled.

Select-all is a tri-state `Checkbox` (`indeterminate` for a partial selection) rather than a pair of
Select-all/Clear buttons: one control that reports the current state, and the same widget the ui-kit `Select`
uses for its own Select All.

*Behaviour held constant:* the values still come from `context.requestFieldValues` on every opening, still
observed-values-with-counts most-frequent-first, still `null` model for an empty selection. The search filters
the rendered list only and never touches the model.

## Risks / Trade-offs

- **The popup validates its rows against the topic rule, not the enum rule.** → The row-level check is the
  authority and gates Save on the real limits; the popup's rule differs only by being stricter at the low
  end. The visible cost is that a single-character value cannot be the only entry being added. Accepted
  deliberately in exchange for leaving the shared component untouched.
- **The `DraggableList` fix changes behaviour for existing callers.** → It changes it only in the case that
  currently loses data (apply-while-filtered), and it removes an affordance (reorder-while-filtered) whose
  current result is arbitrary. Both get tests stating the new behaviour.
- **An older analytics service that predates `dde7afe` will reject an enum declaration.** → The failure is the
  service's own 422 surfaced through the existing error notification, identical to any other unsupported
  declaration. Version-gating the type option would need a capability probe the service does not offer.
- **A 512-value domain in a column row is a lot of state behind a collapsed field.** → The collapsed
  `DialInputPopup` already collapses tag overflow, and the popup carries the search; the count is shown so the
  field is not silently deep.
- **`Enum` entering `COLUMN_TYPE_OPTIONS` reaches every consumer of that constant.** →
  `ANALYTICS_FIELD_TYPE_SAMPLE` is an exhaustive `Record<AnalyticsFieldType, …>` and already has an Enum entry,
  so the compiler cannot catch that its value (`'example'`) is now wrong for a declarable type. The connect-
  snippet change (spec: the write literal is one of the column's declared values) is what makes it right, and it
  is a required task rather than a follow-up.

## Migration Plan

None. No persisted frontend state, no stored column-state shape and no API contract changes. The change is
additive to the type vocabulary: existing tables and columns are unaffected, and an enum column created through
the API before this change becomes editable and correctly snippet-ed by it.
