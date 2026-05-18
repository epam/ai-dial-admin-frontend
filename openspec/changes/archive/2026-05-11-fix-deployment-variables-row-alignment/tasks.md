## 1. Structural Refactor

- [x] 1.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables.tsx`, replace the inner `flex flex-col gap-2 lg:pr-2 overflow-auto` list wrapper with a `lg:grid` container that defines the 7 columns from `design.md` (`24px`, `minmax(100px,1fr)`, `minmax(150px,1.5fr)`, `minmax(280px,3fr)`, `40px`, `minmax(160px,1.5fr)`, `40px`), keeping `flex flex-col gap-2` as the `< lg` fallback
- [x] 1.2 In `ContainerVariables.tsx`, add a header row (rendered only at `lg:grid` and only when `variables.length > 0`) containing the labels "Variable Name", "Description", "Value", an empty file-upload header cell, "Mount type", and an empty trash header cell, using existing `EnvVariablesI18nKey` / `EntityFieldsI18nKey` keys
- [x] 1.3 In `ContainerVariables.tsx`, give each header label cell a stable `id` so variable rows can reference them via `aria-labelledby` for screen-reader compatibility
- [x] 1.4 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Variable.tsx`, replace the current outer/inner flex wrappers with a single row wrapper that uses `lg:grid lg:grid-cols-subgrid lg:col-span-7 lg:gap-x-4 lg:items-start` and retains the existing `< lg` flex-col + collapsible-header behavior
- [x] 1.5 In `Variable.tsx`, render the 7 grid cells in order: drag handle (with `IconGripVertical`), Name (`DialInput`), Description (`DialInput`), Value (`<Value>`), file-upload (`DialNeutralButton` with `IconFileArrowRight`), Mount type (`DialSelectField`), trash (`DialRemoveButton`) — removing all `index === 0 ? label : ''` conditionals and all `mt-[23px]` / `mt-3 lg:mt-6` margins
- [x] 1.6 In `Variable.tsx`, wire each input's `aria-labelledby` to the corresponding header cell id from task 1.3
- [x] 1.7 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Value.tsx`, remove the absolute-positioned `DialNeutralButton` for file upload, the hidden `<input type="file">`, the `pr-[50px]` reservation, and the `handleFileUpload` / `handleFileInputClick` callbacks; `Value` becomes a pure renderer (DialInput / DialPasswordInput / ValueFile)
- [x] 1.8 In `Variable.tsx`, add the file-upload state and handlers that previously lived in `Value.tsx`: a `useRef` for the hidden `<input type="file">`, `handleFileInputClick`, and `handleFileUpload` that calls the existing `onValueChange` with `{ $type: VALUE_TYPE.FILE, fileName, fileContent }`

## 2. Drag-and-Drop Integration

- [x] 2.1 In `Variable.tsx`, import `useDrag` and `useDrop` from `react-dnd` and mirror the configuration from `apps/ai-dial-admin/src/components/Common/DraggableItem/DraggableItem.tsx` lines 17–55 (same `type: 'column'`, same `item`, `collect`, `end`, `hover` behavior)
- [x] 2.2 Attach the `useDrag` connector to a ref on the first grid cell (drag handle) and the `useDrop` connector (plus the drag `preview`) to a ref on the row wrapper
- [x] 2.3 Apply the `isDragging` opacity rule to the row wrapper exactly as `DraggableItem` does (`style={{ opacity: isDragging ? 0 : 1 }}`)
- [x] 2.4 Remove the `DraggableItem` wrapper from `Variable.tsx`'s JSX; leave `DraggableItem.tsx` itself unchanged on disk
- [x] 2.5 Add a brief inline comment in `Variable.tsx` near the `useDrag`/`useDrop` block pointing to `DraggableItem.tsx` as the canonical pattern, noting that a shared hook may be extracted later if a third call site appears

## 3. Tests

- [x] 3.1 Update `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/tests/Variable.spec.tsx` to query inputs by placeholder/role instead of by adjacent label text (since labels now live at the list level), keep existing assertions for name validation, mount-type changes, and remove-row behavior
- [x] 3.2 Add a `Variable.spec.tsx` test asserting that the grid row exposes seven direct children in the documented order (drag handle, Name, Description, Value, file-upload, Mount type, trash) at `lg+` simulated viewport
- [x] 3.3 Add a `Variable.spec.tsx` test that simulates clicking the file-upload button and dispatching a `change` event on the hidden file input, asserting `updateVariable` is called with a `VALUE_TYPE.FILE`-typed value
- [x] 3.4 Update `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/tests/Value.spec.tsx` to drop assertions about the file-upload button and to cover only text/password/file-chip rendering
- [x] 3.5 Update `apps/ai-dial-admin/src/components/Deployments/Fields/tests/ContainerVariables.spec.tsx` to assert that the column header row renders exactly one "Variable Name", "Description", "Value", and "Mount type" label when at least one variable exists, and that no header row renders for an empty list
- [x] 3.6 Add a `ContainerVariables.spec.tsx` test confirming that adding a second variable does not duplicate the column header row (still exactly one of each label across the document)
- [x] 3.7 Ensure all updated tests use only mocks already defined in `apps/ai-dial-admin/test-setup.tsx`; do not introduce new global mocks and do not use `data-testid` attributes

## 4. Code Quality and Verification

- [x] 4.1 Run `npm run lint` from the repository root and resolve any new findings introduced by this change
- [x] 4.2 Run `npm run format` and apply formatting fixes if any
- [x] 4.3 Run `npm run test` and ensure the full Vitest suite passes
- [x] 4.4 Inspect the `Variable` and `ContainerVariables` files for unused imports (`DraggableItem` import in `Variable.tsx`, `IconChevronDown`/`IconChevronRight` if relocated, file-upload icons in `Value.tsx`) and remove them
- [x] 4.5 Verify no remaining references to the removed `pr-[50px]`, `mt-[23px]`, or `mt-3 lg:mt-6` strings exist under `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/`
