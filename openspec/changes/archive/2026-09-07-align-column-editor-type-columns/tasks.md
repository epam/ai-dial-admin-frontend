## 1. Reserve a column per type-specific control

- [x] 1.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/ColumnRowsEditor.tsx`, derive
      `hasArrayRow` / `hasEnumRow` from the row set and render the element-type and value-list columns in
      **every** row while either holds: the control in the rows whose type uses it, an empty cell
      (`TYPED_DETAIL_CELL_CLASS` + `self-start`) in the rest. Reuse `hasEnumRow` for the declared-order
      hint that previously recomputed the same predicate.
- [x] 1.2 Render the column's label in the first row's cell when that row does not hold the control, so
      the label stays on the editor's label line instead of disappearing whenever the first row is not
      the Array/enum row.

## 2. Stop repeating the value column's label

- [x] 2.1 Add an `isLabelHidden` prop to
      `apps/ai-dial-admin/src/components/Analytics/Tables/EnumValuesField.tsx` that clips
      `Multiselect`'s own label (`[&>label]:sr-only` on its root), and pass it from `ColumnRowsEditor`
      for every row below the first. `Common/Multiselect` itself is not modified.

## 3. Unit tests

- [x] 3.1 Extend `tests/ColumnRowsEditor.spec.tsx`: the element-type control present only in the Array
      row with its label on the first row, the value column labelled on the first row when a later row is
      the enum row, the value-list label clipped in an enum row below the first, and two rows of
      different types rendering the same cell count. The spec's `DialSelectField` mock now forwards `id`
      so a per-row control can be addressed.
- [x] 3.2 Add two cases to `tests/EnumValuesField.spec.tsx` for `isLabelHidden` — label clipped when the
      caller labels the column, shown when it does not.

## 4. Quality checks

- [x] 4.1 Run lint, format, and the tests; fix anything they report.
      `npx vitest run src/components/Analytics/Tables/tests/` passes (13 files, 297 tests); eslint and
      prettier are clean on the touched files; `openspec validate analytics --type spec` reports valid.

_No browser-verification task: the user was asked and declined one. The change is layout-only, its
scenarios are covered by the unit tests above, and the resulting geometry was measured in the browser
on a replica of the components' real markup (see design.md)._
