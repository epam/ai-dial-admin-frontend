## 1. Models, constants and i18n

- [x] 1.1 Add `enum_values?: string[]` to `AnalyticsTableColumn` (`src/models/analytics/table.ts`) and to
      `AnalyticsEntityField` (`src/models/analytics/entity.ts`), each with a comment stating the required-iff-enum
      rule and the significance of declared order. Update `AnalyticsFieldType.Enum`'s own comment — it currently
      says the type is reported by the entity schema and never declared on a column, which is no longer true.
- [x] 1.2 Add `enum_values: string[]` to `ColumnRow` and `enum_values?: string` to `ColumnRowError`
      (`src/models/analytics/tables-ui.ts`).
- [x] 1.3 In `src/constants/analytics/tables.ts`: include `Enum` in the declarable column types, subtract it
      explicitly from `ELEMENT_TYPE_OPTIONS` alongside Array and Object, add `ANALYTICS_ENUM_VALUES_MIN`/`_MAX`
      (1 / 512) and `ANALYTICS_ENUM_VALUE_MAX_LENGTH` (64), and replace the stale comment asserting the catalog
      rejects an enum declaration.
- [x] 1.4 Add the new `AnalyticsTablesI18nKey` members (enum values label, add-value title, value placeholder,
      declared-order caption, the four validation messages, the immutable-domain note) and the new
      `ConversationsTraceI18nKey` members (filter search placeholder, select-all label) in
      `src/constants/i18n.ts`, with English strings in `src/locales/en.ts`.

## 2. Enum value validation

- [x] 2.1 Add `getAnalyticsEnumValuesError` to `src/utils/validation/analytics-table-error.ts`: count within
      1–512, every value non-blank after trimming, every value at most 64 characters, values distinct after
      trimming. Returns a `FieldError` or null.
- [x] 2.2 Wire it into `getColumnRowErrors` (`src/components/Analytics/Tables/utils.ts`) for enum-typed rows only,
      and add `enum_values` to `hasColumnRowErrors`.
- [x] 2.3 Emit `enum_values` from `toTableColumns` for enum rows only — trimmed, order preserved — mirroring the
      existing `element_type` gate; seed it in `createColumnRow` (empty array) and in `toColumnRows` from
      `c.enum_values ?? []` so a `FAILED` table's stored domain survives a resubmission.

## 3. Shared list popup: injectable validation and the filter fix

- [x] 3.1 Use `Common/Multiselect` as it is — no new props, no edits to it or to `Modal/*` / `Lists/CheckboxList`.
      The row-level `getAnalyticsEnumValuesError` stays the authoritative check, and `EnumValuesField` wraps its
      popup in a private `SaveValidationContextProvider` so the shared `topic_` validation keys cannot leak
      between lists.
- [x] 3.2 Fix `Lists/DraggableList.tsx` so the search is presentational: keep the authored list as the single
      source of truth, derive the rendered rows from it, and address edit/remove/reorder by the item's index in
      the authored list — so applying while a search term is active no longer commits only the matching items.
      Disable drag-reorder while a filter is active.
- [x] 3.3 Give the mapped `NewItem` elements a stable `key` in `DraggableList` (the current `key` sits on the
      inner `<li>`, so the parent list has none) — required for correct reconciliation once rows are addressed by
      authored index.

## 4. Declaring an enum column

- [x] 4.1 Add `EnumValuesField` under `src/components/Analytics/Tables/` — a thin wrapper over `Multiselect` in
      `draggable` mode supplying the labels, its own private validation provider, and the declared-order hint
      rendered beneath the field (the shared popup has no slot for it).
- [x] 4.2 Render it in `ColumnRowsEditor.tsx` for enum-typed rows, in the slot the element-type control occupies
      for an Array row; clear `enum_values` when the row is retyped away from enum (as `element_type` is cleared
      today) and add `rowError?.enum_values` to the row's `rowHasError` check.
- [x] 4.3 Confirm the "Add columns" popup on an `ACTIVE` table carries the control through unchanged (it reuses
      `ColumnRowsEditor` and `toTableColumns`), and that the resulting patch's `add` entry carries `enum_values`.

## 5. Read surfaces and the immutable domain

- [x] 5.1 Show an enum column's declared values read-only in `EditColumnPopup.tsx`, with the note that the domain
      cannot be changed and that changing it means dropping and re-adding the column. Leave `buildColumnEditPatch`
      as it is — it builds `update` from an explicit field list — and assert in tests that no patch it produces
      carries `enum_values`.
- [x] 5.2 Add an `enum` colour to `TYPE_COLOR` in `src/components/Analytics/Common/TypeBadge.tsx`, distinct from
      the tokens already used, and make the declared values reachable from the table detail columns grid without
      opening the edit modal (a tooltip on the type cell).
- [x] 5.3 Seed an enum column's write-snippet literal from its first declared value in
      `ConnectPanel/connect-snippets.ts`, replacing the `'example'` placeholder in
      `ANALYTICS_FIELD_TYPE_SAMPLE`, which the service would reject on insert.

## 6. Query-builder operator guard

- [x] 6.1 Withhold `QueryOperator.Ico` and `QueryOperator.Inc` from a condition's operator options when the
      selected field's schema type is `AnalyticsFieldType.Enum`, filtering `OPERATOR_OPTION_DESCRIPTORS` where the
      condition row builds its select options (keyed on the declared type alone, no per-field list).
- [x] 6.2 On a field change to an enum-typed field, move a condition already carrying a contains operator to a
      supported one, in the same handler that re-defaults the value type.

## 7. Conversations enum filter presentation

- [x] 7.1 Restyle `ConversationsTrace/List/ConversationValueFilter.tsx` to the app's filter language: the
      `bg-layer-4` overlay, spacing and Reset button matching `Grid/Filter/GridFilterDropdown`, a `DialInput`
      search with `IconSearch` shown once the list is long enough to scan, and a tri-state select-all `Checkbox`.
- [x] 7.2 Move each value's count out of `labelProps.label` into a trailing `text-secondary` element so the
      option's accessible name is the value alone; keep the `role="status"` live region separate from the control
      labels and keep the failed state in the error text treatment.
- [x] 7.4 Add `ConversationValueFloatingFilter` — an intentionally **empty** body — and bind it via
      `floatingFilterComponent` so an enum column keeps its place in the floating-filter row (it previously
      opted out with `floatingFilter: false`, which left the affordance a row above every neighbour and
      reachable only on hover). Empty because the only job is displacing the default text entry: the grid's
      own filter button then supplies the affordance, identical to every neighbouring column's. Do not set
      `suppressFloatingFilterButton` — that makes the grid fall back to a header-row icon instead.
- [x] 7.3 Keep behaviour unchanged: values still resolved through `context.requestFieldValues` on every opening,
      still observed values with counts most-frequent-first, still a `null` model for an empty selection, and the
      search filtering the rendered list only — never the model.

## 8. Tests

- [x] 8.1 Unit-test `getAnalyticsEnumValuesError` and the enum branch of `getColumnRowErrors` /
      `hasColumnRowErrors` (count bounds, blank, over-length, distinct-after-trim), and `toTableColumns` (trimmed,
      order preserved, emitted only for enum, absent after a retype) in
      `src/components/Analytics/Tables/tests/utils.spec.ts` and the validation util's own spec.
- [x] 8.2 Component-test `ColumnRowsEditor` (enum reveals the value control, retype clears it, error surfaces),
      `EditColumnPopup` (domain read-only; no produced patch carries `enum_values`), and `EnumValuesField`
      (label, declared-order hint, collapsed readout, row-level error, per-row field identity), including the
      popup driven from the field: add a row, apply, and the authored values reach `onChange` in order; cancel
      publishes nothing. The popup is opened from the **empty** state because the ui-kit `DialInputPopup`
      trigger is a real button only there and a role-less `<div>` once values are selected.
- [x] 8.3 Cover the `DraggableList` search fix in `Common/Lists/tests/DraggableList.spec.tsx`: applying while a
      search term is active keeps every authored item, and edit/remove address the authored index.
      `Multiselect.spec.tsx` is left as it was, the component being unchanged.
- [x] 8.4 Component-test the restyled `ConversationValueFilter`: search narrows the list without changing the
      selection, select-all/clear act on the whole list, an option's accessible name is the value alone (queried
      by role and accessible name), reset clears the model, and the three states are announced.
- [x] 8.5 Unit-test the query-builder guard: contains is absent for an enum-typed field and present for a string
      one, and a contains condition retargeted to an enum field ends up on a supported operator.
- [x] 8.6 Unit-test the enum write-snippet literal in `ConnectPanel/tests/connect-snippets.spec.ts`.

No verification task: the user chose unit tests only for this change.

## 9. Quality gate

- [x] 9.1 Run `npm run lint`, `npm run format`, `npx tsc --noEmit` and the full `npm run test` from
      `apps/ai-dial-admin/`, and fix everything they report.
