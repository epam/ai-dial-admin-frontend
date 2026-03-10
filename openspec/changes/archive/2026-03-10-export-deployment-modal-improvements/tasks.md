## 1. i18n Keys

- [x] 1.1 Add image dependency label keys (`McpImage`, `InterceptorImage`, `AdapterImage`) to `ExportI18nKey` enum in `src/constants/i18n.ts`
- [x] 1.2 Add corresponding English translations in `src/locales/en.ts` under the Export section

## 2. Extend Existing Entity Mapping

- [x] 2.1 Add `DeploymentExportEntityType` values to `entityTypeToMenuKey` in `src/components/ExportConfig/AddEntities/utils.ts` using existing `MenuI18nKey` plural labels
- [x] 2.2 Add `DEPLOYMENT_IMAGE_DEP` constants (MCP_IMAGE, INTERCEPTOR_IMAGE, ADAPTER_IMAGE) to `entityTypeToMenuKey` with `ExportI18nKey` labels
- [x] 2.3 Remove `.toLowerCase()` from `getButtonTitle` for consistent casing across core and deployment entities

## 3. Extend Dependency Resolution

- [x] 3.1 Add `DEPLOYMENT_IMAGE_DEP` constants to `src/utils/entities/get-export-deps.ts`
- [x] 3.2 Add deployment container cases to `getAllAvailableDependencies` returning image dependency keys for MCP, Interceptor, and Adapter container types

## 4. Dependencies Component

- [x] 4.1 Add `disabled` boolean prop to `Dependencies` in `src/components/ExportConfig/AddEntities/Dependencies.tsx`
- [x] 4.2 When `disabled` is true, hide "All dependencies" toggle and pass `disabled` to individual `DialCheckbox` components
- [x] 4.3 Adjust padding/margin when `disabled` (no indent since "All dependencies" toggle is hidden)

## 5. AddEntitiesModal and DeploymentConfigContent

- [x] 5.1 Add `disabledDependencies` prop to `AddEntitiesModal` and pass through to `Dependencies` as `disabled`
- [x] 5.2 Pass `disabledDependencies` from `DeploymentConfigContent` to `AddEntitiesModal`

## 6. Testing

- [x] 6.1 Add unit tests for `getButtonTitle` verifying correct titles for deployment entity types
- [x] 6.2 Add unit tests for `getAllAvailableDependencies` verifying image dependency keys returned for container types and empty arrays for non-container deployment types
