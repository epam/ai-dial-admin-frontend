## 1. i18n

- [x] 1.1 Add `DuplicateName` key to `EnvVariablesI18nKey` enum in `src/constants/i18n.ts`
- [x] 1.2 Add English translation string (e.g., "Variable name already exists") in `src/locales/en.ts`

## 2. Extend `getVariableNameError()`

- [x] 2.1 Add optional `existingNames?: string[]` parameter to `getVariableNameError()` in `src/utils/deployments/validation.ts`
- [x] 2.2 Add duplicate check after existing validations (empty → length → format → duplicate): if name is in `existingNames`, return a `DUPLICATE` field error

## 3. Wire up in `ContainerVariables`

- [x] 3.1 In `ContainerVariables.tsx` (or `Variable.tsx`), build the sibling names array (all other variables' names, excluding the current one and empty names) and pass it to `getVariableNameError()`

## 4. Tests

- [x] 4.1 Add unit tests for `getVariableNameError()` with `existingNames`: duplicate detected, no duplicate, empty names excluded, case-sensitive comparison
- [x] 4.2 Add component test verifying the duplicate error message renders in the UI when two variables share a name

## 5. Quality Checks

- [x] 5.1 Run lint, format, and full test suite to verify no regressions
