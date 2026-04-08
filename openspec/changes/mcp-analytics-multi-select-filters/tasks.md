## 1. Data model changes

- [x] 1.1 Update `FilterData` interface in `apps/ai-dial-admin/src/models/telemetry.ts` to change `value: string` to `value: string[]`

## 2. Verify DialSelectField multi-select support

- [x] 2.1 Check `@epam/ai-dial-ui-kit` DialSelectField API for multi-select prop name (`isMulti`, `multiple`, etc.)
- [x] 2.2 Create test component to verify multi-select behavior with string array values

## 3. Update CreateFilter component

- [x] 3.1 Fix condition dropdown bug in `CreateFilter.tsx` line 101: change `type` to `condition` in the find expression
- [x] 3.2 Update Entity DialSelectField (lines 111-116) to enable multi-select:
  - Remove `.find()` logic for value
  - Add `multiple={true}` prop
  - Update `onChange` to handle `string[]`
  - Add placeholder for empty state
- [x] 3.3 Update Project DialSelectField (lines 118-123) with same multi-select changes
- [x] 3.4 Update `setConditionHandler` (lines 43-57) to reset `value` to `[]` instead of string
- [x] 3.5 Update `setTypeHandler` (lines 59-79) to reset `value` to `[]` when switching types

## 4. Update AddFilter component

- [x] 4.1 Change `value` state type from `string` to `string[]` in `AddFilter.tsx` line 36
- [x] 4.2 Update `reset` callback (lines 38-42) to use `[]` as default value
- [x] 4.3 Update `onCreate` callback to handle array values

## 5. Update Filter display component

- [x] 5.1 Update Filter.tsx line 41 to display multiple values with smart truncation:
  - If 1-2 values: show comma-separated
  - If 3+ values: show first 2 + count (e.g., "MCP-1, MCP-2, +3 more")

## 6. Update query generation

- [x] 6.1 Modify `getFormattedDataFilters` in `utils/telemetry.ts` to handle array values:
  - Use `$in` operator for Equal condition with multiple values
  - Use `$nin` operator for NotEqual condition with multiple values
  - Use first array element `[0]` for single-value or text input cases
- [x] 6.2 Add `getDefaultFilterValue` update to return empty array `[]` instead of empty string

## 7. Update validation logic

- [x] 7.1 Update `AddFilterModal.tsx` disable condition (line 63) to check `value.length > 0` instead of truthy check
- [x] 7.2 Update `AddFilterPopover.tsx` disable condition (line 56) to check `value.length > 0`

## 8. Testing

- [x] 8.1 Add unit tests for FilterData with array values
- [x] 8.2 Add unit tests for query generation with `$in`/`$nin` operators
- [x] 8.3 Add unit tests for display logic (1, 2, 3+ values)
- [ ] 8.4 Add component tests for CreateFilter with multi-select enabled
- [ ] 8.5 Add component tests for Filter chip display with multiple values
- [x] 8.6 Update existing Filters.spec.tsx tests to handle array values

## 9. Integration testing

- [ ] 9.1 Manual test: Create filter with single entity
- [ ] 9.2 Manual test: Create filter with 2 entities
- [ ] 9.3 Manual test: Create filter with 5+ entities
- [ ] 9.4 Manual test: Edit existing multi-value filter
- [ ] 9.5 Manual test: Switch between Equal and Contains conditions
- [ ] 9.6 Manual test: Switch between Entity and Project types
- [ ] 9.7 Manual test: Mobile view (modal instead of popover)
- [ ] 9.8 Verify backend query results match expected data

## 10. Code quality

- [x] 10.1 Run `npm run lint` and fix any issues
- [x] 10.2 Run `npm run format:write` to ensure consistent formatting
- [ ] 10.3 Run `npm run test` to verify all tests pass
