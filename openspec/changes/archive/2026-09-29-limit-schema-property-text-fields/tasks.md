## 1. Types, defaults, and resolution

- [x] 1.1 In `apps/ai-dial-admin/src/components/Common/SchemaGrid/models.ts`, add the `SchemaInputField` enum (`Name`, `Title`, `Description`, `Tab`, `Section`, `Order`), the `SchemaFieldInputProps` type (`Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'type' | 'id' | 'className'>`), and `SchemaFieldInputConfig` (`Partial<Record<SchemaInputField, SchemaFieldInputProps | null>>`) — design D1
- [x] 1.2 In `SchemaGrid/constants.ts`, add `DEFAULT_SCHEMA_FIELD_INPUT_PROPS` (Name/Title/Tab/Section `maxLength: 255`, Description `maxLength: 1024`, no Order entry), with a comment that Core's catalog meta-schema declares no limit and the values must follow it if it ever does
- [x] 1.3 In `SchemaGrid/utils.ts`, add the pure `resolveSchemaFieldInputProps(config?: SchemaFieldInputConfig | false)` with the `undefined` / `false` / `null` / per-attribute merge semantics of design D2

## 2. Renderer pass-through

- [x] 2.1 Add an optional `inputProps` parameter to `apps/ai-dial-admin/src/components/Grid/CellRenderers/EditableCellRenderer.tsx`, typed locally with the same `Omit<…>`, spread onto `<input>` before every attribute the renderer sets — design D3
- [x] 2.2 Add the same `inputProps` parameter to `SchemaGrid/TreeNameCellRenderer.tsx`, with the same spread order

## 3. Wiring the grid

- [x] 3.1 Add `fieldInputProps?: SchemaFieldInputConfig | false` to `SchemaGrid.tsx`, memoize `resolveSchemaFieldInputProps(fieldInputProps)`, and pass the result to `getSchemaGridColumns`
- [x] 3.2 In `SchemaGrid/columns.tsx`, put each field's resolved props into `cellRendererParams.inputProps` for the Name, Title, Description, Order, Tab, and Section columns

## 4. Save check

- [x] 4.1 In `SchemaGrid/utils.ts`, add the pure `getFieldConstraintViolations(fields, resolved, metaColumns)` per design D4: recursive walk, Tab/Section on first-level rows only and only when their meta column is present, `maxLength`/`minLength` by `length`, `pattern` anchored with the `u` flag and ignored when it fails to compile, empty values skipped for `minLength`/`pattern`, results deduplicated by field and rule
- [x] 4.2 Add three `BasicI18nKey` entries with `{field}` / `{limit}` parameters to `apps/ai-dial-admin/src/constants/i18n.ts` and `src/locales/en.ts` — max length, min length, pattern — design D5
- [x] 4.3 In `SchemaGrid.tsx`, combine the violations with `hasInvalidFieldNames` into the one `isValid` dispatched to `SaveValidationContext`, and render one `DialErrorText` per violation under the existing name message, never interpolating the offending value

## 5. ui-kit bump (#4731)

- [x] 5.1 Once `@epam/ai-dial-ui-kit` is released with the quoted required-field label (branch `fix/schema-renderer-quote-required-label` in `ai-dial-ui-kit`), bump it in the root `package.json` and `package-lock.json`, and update any admin spec that asserts the old unquoted `… is required` text from `DialSchemaRenderer`

## 6. Tests

- [x] 6.1 `SchemaGrid/tests/field-input-props.spec.ts`: `resolveSchemaFieldInputProps` — no config, `false`, `null` for one field, a per-attribute override, an attribute set to `undefined`, an attribute added beyond length
- [x] 6.2 `SchemaGrid/tests/field-input-props.spec.ts`: `getFieldConstraintViolations` — over-limit name/title/description, nested row, Tab/Section ignored below first level and without their meta column, `minLength`, a matching and a non-matching `pattern`, an uncompilable `pattern`, empty values, deduplication
- [x] 6.3 `SchemaGrid/tests/columns.spec.tsx`: each free-text column carries its resolved `inputProps`; Order carries none by default
- [x] 6.4 Renderer specs for `EditableCellRenderer` and `TreeNameCellRenderer`: `inputProps` reach the `<input>` (e.g. `maxLength`), and an `inputProps` `value`/`onChange` cannot replace the renderer's own
- [x] 6.5 `SchemaGrid` component spec: an over-limit title from the incoming schema dispatches `isValid: false` and shows the max-length message without the value; shortening it dispatches `isValid: true` and removes the message; `fieldInputProps={false}` and a read-only grid do not block

No browser-verification task: the user chose to rely on unit and component tests for this change.

## 7. Quality gate

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`, and fix every failure
