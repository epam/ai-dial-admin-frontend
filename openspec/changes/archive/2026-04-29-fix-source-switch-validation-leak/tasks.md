## 1. Validation cleanup in sub-source components

- [x] 1.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/McpServerNameField.tsx`, change the `useEffect` at lines 149-152 to return a cleanup that dispatches `{ type: ValidationActionType.RemoveField, field: 'mcpServerName' }`.
- [x] 1.2 In `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/HFModelNameField.tsx`, change the `useEffect` at lines 86-89 (the one dispatching `field: 'modelName'`) to return a cleanup that dispatches `{ type: ValidationActionType.RemoveField, field: 'modelName' }`.

## 2. Source-object cleanup on switch

- [x] 2.1 In `apps/ai-dial-admin/src/components/SourceField/SourceField.tsx`, in `onChangeSource` (around line 108), change `source: { ...entity.source, $type: sourceType as SOURCE_TYPE }` to `source: { $type: sourceType as SOURCE_TYPE }` so type-specific keys are not carried across a source-type switch.

## 3. Unit tests for cleanup behavior

- [x] 3.1 Add `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/tests/McpServerNameField.spec.tsx` covering: (a) on mount, the field is registered as `false` when `serverName` is empty; (b) on unmount, the field is removed from `SaveValidationContext.fieldValidations`. Reuse mocks from `apps/ai-dial-admin/test-setup.tsx`. Tests assert against the dispatch call args (matching the existing pattern in `ClientIdControl.spec.tsx`) rather than reading `errorFields` from a real provider.
- [x] 3.2 Add `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource/tests/HFModelNameField.spec.tsx` mirroring 3.1 for the `modelName` field.
- [x] 3.3 Add a unit test in `apps/ai-dial-admin/src/components/SourceField/tests/SourceField.spec.tsx` (or extend the existing file) asserting that, after calling `onChangeSource` from one source type to another, the resulting `entity.source` contains only `$type` and not the leftover keys. Cover at least: (a) MCP_REGISTRY → CONTAINER drops `serverName`/`serverVersion`; (b) CONTAINER → ENDPOINTS drops `containerId`.

## 4. Code quality checks

- [x] 4.1 Run `npm run lint` and resolve any issues introduced by the changes.
- [x] 4.2 Run `npm run format:write` to apply formatting.
- [x] 4.3 Run `npm run test` from `apps/ai-dial-admin/` and ensure all tests pass.
