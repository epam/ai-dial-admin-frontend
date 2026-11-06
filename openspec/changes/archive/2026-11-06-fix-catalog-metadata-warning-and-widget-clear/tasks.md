## 1. Contain catalog metadata messages

- [x] 1.1 Update `apps/ai-dial-admin/src/components/CatalogProperties/UndeclaredPropertiesBanner.tsx` to bound and wrap the message, support keyboard scrolling, and keep the removal control outside the scroll region without changing warning, error, or read-only behavior.

## 2. Clear optional widgets

- [x] 2.1 Check the ui-kit Select contract, then add a localized `- None -` option only to the widget column in `apps/ai-dial-admin/src/components/Common/SchemaGrid/columns.tsx`; map it to the existing empty-value deletion path and retain an empty placeholder when cleared.
- [x] 2.2 Ensure the `SchemaGrid.tsx` and `utils.ts` metadata update and serialization paths remove only the widget, preserve sibling metadata, and omit an empty metadata object. Preserve unrelated edits in `CatalogPropertiesEditor.tsx`.
- [x] 2.3 Keep the shared single-select renderer's empty state controlled after a value is selected; cover clearing the widget on the first attempt in `columns.spec.tsx`.

## 3. Automated tests

- [x] 3.1 Extend `apps/ai-dial-admin/src/components/CatalogProperties/tests/CatalogPropertiesEditor.spec.tsx` or add focused banner tests for long warning/error content, the bounded keyboard-accessible region, read-only behavior, and removal without losing declared values.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/Common/SchemaGrid/tests/columns.spec.tsx` and appropriate schema-grid tests for the eight supported widgets plus none, initial empty display, clearing and reselection, required properties, sibling metadata preservation, removal of the last metadata key, and serialized save/reopen without a sentinel, empty string, or null. Retain coverage of unrelated selectors.

## 4. Quality checks

- [x] 4.1 Run lint, formatting checks, the test suite, `npm run typecheck`, and `npm run typecheck:specs`; report failures or environment limitations. Full coverage suite stopped at user request before completion; focused tests passed.
