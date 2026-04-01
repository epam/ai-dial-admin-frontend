## Tasks

### 1. Create `mergeWithIgnoredFields` utility

- [ ] Create util function in `apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/utils.ts`
  ```ts
  mergeWithIgnoredFields<T extends object>(prev: T, parsed: Partial<T>, ignoredFields?: (keyof T)[]): T
  ```
  - Spreads `prev` with `parsed`, then restores `ignoredFields` from `prev`
  - Returns `prev` spread unchanged when `ignoredFields` is empty/undefined

### 2. Add unit tests for `mergeWithIgnoredFields`

- [ ] Add tests in `apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/tests/mergeWithIgnoredFields.spec.ts`
  - Merges correctly when no ignored fields
  - Preserves ignored fields from `prev` when `parsed` modifies them
  - Handles missing `ignoredFields` param (undefined)
  - Handles empty `ignoredFields` array

### 3. Add `ignoredFields` prop to `EntityJsonEditor`

- [ ] Update `Props<T>` interface in `apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/JsonEditor.tsx` — add optional `ignoredFields?: (keyof T)[]`
- [ ] Update `onChangeJSON` to use `mergeWithIgnoredFields` with functional `setSelectedEntity` update:
  ```ts
  setSelectedEntity(prev => mergeWithIgnoredFields(prev, parsed, ignoredFields));
  ```

### 4. Wire `ignoredFields` in deployment entity views

- [ ] `apps/ai-dial-admin/src/components/Images/View/ImageView.tsx` — pass `ignoredFields={['id']}`
- [ ] `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx` — pass `ignoredFields={['name', '$type']}`

### 5. Run code quality checks

- [ ] Run `npm run lint` and `npm run format` — fix any issues
- [ ] Run `npm run test` — verify all tests pass
