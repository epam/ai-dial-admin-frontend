## 1. New shared cell renderer

- [x] 1.1 Create `src/components/Grid/CellRenderers/EditableOnBlurCellRenderer.tsx` — holds local `draftValue` state, fires `onBlur` callback only on blur, syncs from `value` prop only when not focused, accepts `validate: (value: string) => string | null` prop and shows inline error when non-null, supports `isReadonly` prop

## 2. Local type and model cleanup

- [x] 2.1 Create `src/components/Applications/ParametersTab/models.ts` with `ApplicationPropertyRow` interface (`key`, `value`, `type`, `required`, `isFromScheme`)
- [x] 2.2 Remove `applicationPropertiesTemp?: ApplicationPropertiesTemp[]` field from `src/models/dial/application.ts` and remove the `ApplicationPropertiesTemp` export
- [x] 2.3 Remove `applicationPropertiesTemp?: ApplicationPropertiesTemp[]` field from `src/models/dial/application-resource.ts`

## 3. Save-path cleanup

- [x] 3.1 Remove `applicationPropertiesTemp` branch and `delete app.applicationPropertiesTemp` from `src/app/[lang]/applications/actions.ts` — use `application.applicationProperties` directly
- [x] 3.2 Same cleanup in `src/app/[lang]/assets-applications/actions.ts`
- [x] 3.3 Same cleanup in `src/components/Publications/View/utils.ts`

## 4. Utility updates

- [x] 4.1 Add `inferTypeFromValue(value: unknown): string` to `src/components/Applications/ParametersTab/utils.ts` (null/undefined → "object", typeof boolean → "boolean", typeof number → "number", typeof object → "object", else → "string")
- [x] 4.2 Update `getAppPropertiesColumns` in `utils.ts` to use `EditableOnBlurCellRenderer` for the key column (user-added rows only), passing a `validate` function; update all `ApplicationPropertiesTemp` type references to `ApplicationPropertyRow`
- [x] 4.3 Update `convertJsonSchema` and `convertAppPropertiesToArray` in `utils.ts` to import `ApplicationPropertyRow` from the local `models.ts` instead of the entity model

## 5. TableView refactor

- [x] 5.1 Replace the `properties: ApplicationPropertiesTemp[]` prop with `applicationProperties: Record<string, unknown>` and `schemeProperties: ApplicationPropertyRow[]`; replace `onChangeProperties(ApplicationPropertiesTemp[])` with `onChangeProperties(Record<string, unknown>, isSkipRefresh?)` and add `onValidityChange(isValid: boolean)` and `onAdd: () => void` props; remove `isAddClicked`/`setIsAddClicked` props
- [x] 5.2 Add `orderedUserKeys: string[]` state — initialised from `Object.keys(applicationProperties)` filtered to keys not in `schemeProperties`, on mount
- [x] 5.3 Derive display rows in `useMemo`: scheme rows from `schemeProperties` + `applicationProperties[key]`, user rows from `orderedUserKeys` + `inferTypeFromValue`, plus a pending empty row when `orderedUserKeys.includes("")`
- [x] 5.4 Implement `onAdd` handler: push `""` to `orderedUserKeys` only if `""` not already present
- [x] 5.5 Implement key-blur handler: validate non-empty and non-duplicate; on valid — replace `""` (or old key) in `orderedUserKeys` at same index, update `applicationProperties`; on invalid — keep empty-string entry and call `onValidityChange(false)`
- [x] 5.6 Implement value-change handler: update `applicationProperties[key]` and call `onChangeProperties(newRecord, true)`
- [x] 5.7 Implement type-change handler: update `applicationProperties[key] = getValueByType(newType)` and call `onChangeProperties(newRecord)`
- [x] 5.8 Implement remove handler: delete key from `applicationProperties`, splice from `orderedUserKeys`, call `onChangeProperties(newRecord, false)`
- [x] 5.9 Call `onValidityChange` whenever validity changes (empty key present, duplicate key present, or all keys valid)

## 6. ParametersTab refactor

- [x] 6.1 Remove `appPropertiesTemp` state and `setAppPropertiesTemp`; remove all `applicationPropertiesTemp` references
- [x] 6.2 Compute `schemeProperties: ApplicationPropertyRow[]` from scheme via `convertJsonSchema` (already done in `onGetSchemeDefaults`) and pass to `TableView`
- [x] 6.3 Update `onChangeProperties` to call `onChange({ ...application, applicationProperties: newRecord })`; dispatch `ValidationContext` from `onValidityChange` callback instead
- [x] 6.4 Pass `applicationProperties={application?.applicationProperties ?? {}}`, `schemeProperties`, `onAdd`, and `onValidityChange` to `<TableView>`; pass `key={discardKey}` on `<TableView>` for reset-on-discard
- [x] 6.5 Move Add button `disabled` logic: disable when `application?.applicationProperties` includes a `""` key — or leave Add button always enabled (TableView ignores duplicate Add); remove `isAddClicked`/`setIsAddClicked` state

## 7. Tests

- [ ] 7.1 Write unit tests for `EditableOnBlurCellRenderer`: draft value update on change, blur fires callback with correct value, blur with failing `validate` shows error and does not fire callback, value prop sync only when not focused
- [x] 7.2 Write unit tests for `inferTypeFromValue` in `ParametersTab/tests/utils.spec.ts`
- [x] 7.3 Update `src/app/[lang]/applications/actions.spec.ts` — remove `applicationPropertiesTemp` from test fixtures; assert saved entity has correct `applicationProperties` and no `applicationPropertiesTemp` field
- [x] 7.4 Update `src/app/[lang]/assets-applications/actions.spec.ts` — same as 7.3
- [x] 7.5 Update `src/components/Publications/View/tests/utils.spec.ts` — remove `applicationPropertiesTemp` fixtures and assertions

## 8. Browser verification

- [ ] 8.1 Run `/spec-browser-verify` for change `refactor-app-properties-table` against the running local dev stack; resolve any `fail` verdicts before marking the change complete

## 9. Quality checks

- [x] 9.1 Run `npm run lint` from repo root — fix any errors
- [x] 9.2 Run `npm run test` from `apps/ai-dial-admin/` — all tests pass
