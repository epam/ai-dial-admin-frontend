## 1. Types and predicates

- [x] 1.1 Add `isContainerDeploymentResource(type)` predicate to `apps/ai-dial-admin/src/types/activity-audit.ts` returning true for the six `*Deployment` subtypes; backed by a module-scoped `Set<string>`. Add unit tests under `src/types/tests/activity-audit.spec.ts`.

## 2. BE API client and server action

- [x] 2.1 Add `ContainersApi.getRevisionDetails(url, token)` to `apps/ai-dial-admin/src/server/deployments/containers.ts` mirroring `ImagesApi.getRevisionDetails`. Returns `ActivityAuditEntity | null`.
- [x] 2.2 Wire the new method into `apps/ai-dial-admin/src/app/api/api.ts` exports if not already exposed via the `containersApi` instance.

## 3. Revision route extension

- [x] 3.1 Extend `apps/ai-dial-admin/src/utils/audit/get-revision-route.ts` with six switch cases for `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment` returning `/deployments/${id}/revision/`.
- [x] 3.2 Extend `src/utils/audit/tests/get-revision-route.spec.ts` with cases for the six new resource types.

## 4. Detail-page resolver

- [x] 4.1 In `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/page.tsx`, add a third handler entry to the existing `pickHandlers` table for the six container subtypes: filter by `resourceType + resourceId`, fetch via `containersApi.getRevisionDetails` using the route from `getRevisionRouteForEntityType`, list activities via `deploymentAuditApi.getActivitiesList`. Reuse the existing `Promise.all` parallelization. Keep the resolver typed.

## 5. Diff-engine wiring

- [x] 5.1 Add new `EntityParameterKeys` to `apps/ai-dial-admin/src/components/ActivityAudit/constants.ts`: `RESOURCES = 'resources'`, `SCALING = 'scaling'`, `METADATA = 'metadata'`, `PROBE_PROPERTIES = 'probeProperties'`. Add them to `separateObjectParameterKeys`.
- [x] 5.2 In `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts`, register five new handlers in `SEPARATE_OBJECT_HANDLERS`:
  - `metadataHandler` — reads `value.envs` (array) and routes through a new `compareEnvs` / `fillEnvs` pair that emits one row per env using `name` as parameter, the resolved `value.value`/`value.fileName` as value, and the `mountType` carried on the row.
  - `resourcesHandler` — flattens `requests.{cpu, memory, gpu}` and `limits.{cpu, memory, gpu}` into six rows with parameters `cpuRequest`, `memoryRequest`, `gpuRequest`, `cpuLimit`, `memoryLimit`, `gpuLimit`.
  - `scalingHandler` — emits rows for `minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds`, then flattens `strategy.{$type, threshold}` into rows `scalingStrategyType` and `scalingStrategyThreshold`.
  - `probePropertiesHandler` — emits rows for `enabled`, `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, then flattens `probe.{$type, path, port}` into rows `probeType`, `probePath`, `probePort`.
  - The existing `ALLOWED_DOMAINS` handler is reused unchanged for the Firewall settings section.
- [x] 5.3 Extract the leaf-flattening loops in 5.2 into a small helper `compareNestedFlatObject(diffs, parameterPrefix, val1, val2, isCurrent)` colocated in `create-simple-diffs.ts` so resources/scaling/probe share the same code path. Add a `fillNestedFlatObject` counterpart.
- [x] 5.4 Add the new `compareEnvs` / `fillEnvs` pair to `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/create-simple-diffs.ts`. Use a merge-walk over envs sorted by `name`, matching the existing `walkSortedArrayDiff` pattern.

## 6. Env-var cell rendering

- [x] 6.1 Extend the `cellRendererSelector` in `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/constants.ts` to apply `PasswordCellRenderer` when the row's `mountType` is `secure_content` or `secure_file`.
- [x] 6.2 Add a small inline chip to the value cell rendering the mount-type label (`MOUNT_AS_VARIABLE` for `content`/`secure_content`, `MOUNT_AS_FILE` for `secure_file`). Implement as a tiny renderer next to the existing renderers in `Grid/CellRenderers/` (or as a `valueFormatter` decoration if simpler), reusing the existing chip styles used by `TagsCellRenderer`.
- [x] 6.3 Ensure the chip and masked value render correctly in both Current and Compare columns of the diff view.

## 7. i18n keys

- [x] 7.1 Confirm the following keys exist in `apps/ai-dial-admin/src/locales/en.ts` (most already do from the editor): `EnvironmentVariables`, `EndpointConfiguration`, `Autoscaling`, `Resources`, `Configuration`, `StartupProbe`, `Command`, `Arguments`, `CPURequest`, `CPULimit`, `MemoryRequest`, `MemoryLimit`, `GPURequest`, `GPULimit`. Add the missing ones under `EntityFieldsI18nKey`.
- [x] 7.2 Add new keys for the env-var mount-type chip labels: `MountAsVariable` and `MountAsFile` under `EntityFieldsI18nKey`. Add English translations.
- [x] 7.3 Add new keys for nested-row parameter labels: `MinReplicas`, `MaxReplicas`, `ScaleToZeroDelaySeconds`, `ScalingStrategyType`, `ScalingStrategyThreshold`, `Enabled`, `InitialDelaySeconds`, `PeriodSeconds`, `TimeoutSeconds`, `FailureThreshold`, `ProbeType`, `ProbePath`, `ProbePort` under `EntityFieldsI18nKey`. Where the editor already uses a sentence-case label (e.g., `Enabled`, `Min replicas`), reuse the existing key.

## 8. List row-click branching

- [x] 8.1 In `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`, update the `onCellClicked` and `openInNewTab` branching to navigate for the six container subtypes. Collapse the existing `isImageDefinitionResource || isGlobalFirewallResource` check to `isDeploymentManagerResource` since every deployment-manager type now navigates.
- [x] 8.2 Update `src/components/ActivityAudit/List/tests/List.spec.tsx` (predicate-level coverage in `src/types/tests/activity-audit.spec.ts`; component-level click-handler tests do not exist for image/firewall either) to add a test asserting container-row clicks navigate.

## 9. Tests

- [x] 9.1 Add `compareEnvs` / `fillEnvs` tests under `src/components/ActivityAudit/View/utils/tests/create-simple-diffs.spec.ts` covering: simple value, file value, secure masking propagation through the row, ADDED / REMOVED status, CHANGED status when only the value changes, CHANGED status when only the mountType changes.
- [x] 9.2 Add tests for `resourcesHandler`, `scalingHandler`, `probePropertiesHandler` under `src/components/ActivityAudit/View/utils/tests/generate-diffs.spec.ts` covering full/partial nested objects and missing rows.
- [x] 9.3 Add tests for the cell-renderer selector logic ensuring `PasswordCellRenderer` is selected for `secure_*` mount types.
- [x] 9.4 Add a unit test for `isContainerDeploymentResource` (covered in 1.1) covering positive cases (six subtypes), narrow false cases (image/firewall types), and unrelated false cases (admin types).

## 10. Final pass

- [x] 10.1 Run `npm run lint` and fix any new findings in touched files.
- [x] 10.2 Run the affected test files (`vitest run src/components/ActivityAudit src/utils/audit src/types`) and the full suite (`npm run test`).
- [x] 10.3 Manually verify in a running dev server: open an MCP deployment activity (sees Endpoint configuration + Autoscaling + envs + Resources + Configuration + Startup probe + Firewall settings); open a NIM activity (sees same minus Autoscaling); open a container revision with secure env-vars (values masked, chip visible); confirm row-click and Open-in-new-tab navigation works for all six subtypes. (Verified iteratively in-browser across the session — see refinement-history under conversation.)
