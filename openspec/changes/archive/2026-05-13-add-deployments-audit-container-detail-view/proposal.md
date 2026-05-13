## Why

The previous detail-view change (`2026-05-12-add-deployments-audit-detail-view`) intentionally scoped detail rendering to image definitions and the global firewall, leaving the six container subtypes (`AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`) as no-op rows in the Deployments grid. Container and Model Serving activities are now the largest remaining gap in the audit experience — users see them in the list but cannot inspect what changed between revisions. The design (Model Serving / NIM mockup) is locked, the diff-engine chassis from the image work is reusable, and the BE revision endpoint follows the same pattern as images, so this is the right time to close the loop.

## What Changes

- Detail page at `/activity-audit/{activityId}` resolves the six `*Deployment` resource types from the deployment-manager backend (third branch alongside the existing admin and image branches), fetching the `Container` snapshot from `GET /api/v1/deployments/{id}/revision/{revision}`.
- `AuditView` renders the container snapshot through the existing diff engine, organized into seven sections that mirror the editor's accordion structure: Properties, Endpoint configuration, Autoscaling, Environment variables, Resources, Configuration, Startup probe, Firewall settings. Sections render only when their underlying field is present, so NIM/Inference rows show no Autoscaling section, non-MCP rows show no transport/endpoint-path rows, etc.
- Environment variable rows render `name` as parameter and the resolved value (`value.value` for simple, `value.fileName` for file) as value. Secure mount types (`secure_content`, `secure_file`) mask the value via the existing `PasswordCellRenderer`. The mount type renders as an inline chip on the value cell.
- Nested objects (`scaling.strategy`, `probeProperties.probe`, `resources.requests`, `resources.limits`) flatten into their parent section as flat rows — six rows total for Resources (CPU/Memory/GPU × Request/Limit).
- The Deployments-grid row interactions flip for the six container subtypes: both the Open-in-new-tab menu action and the row-body click now navigate to `/activity-audit/{activityId}`, replacing the current no-op handler.
- `isContainerDeploymentResource(type)` predicate added next to the existing `isImageDefinitionResource` / `isGlobalFirewallResource` predicates in `src/types/activity-audit.ts`. The existing `isDeploymentManagerResource` already covers these types, so the rollback-hide and header-chip rules need no change.
- New cell renderer (or `cellRendererSelector` rule on the existing diff grid) for env-var rows: applies password masking when `mountType` is `secure_*` and decorates the value cell with a small `mountType` chip.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-audit-deployments-detail`: adds requirements for resolving container snapshots, rendering the seven container detail sections, env-var value/masking rules, and the container-deployment predicate.
- `activity-audit-deployments-view`: tightens the row-click requirement so the six `*Deployment` types navigate to the detail page (previously kept as no-op pending container detail rendering).

## Non-goals

- Activity types beyond `Create | Update | Delete`. The "Launch Successful / Launch Failed" labels in the design mockup are illustrative; the BE does not emit those variants in this change.
- Embedded per-entity Audit tab on the Container view (still deferred to a future change).
- Container rollback. `isDeploymentManagerResource` already hides the Resource Rollback button for all eleven deployment-manager types, and the BE has no per-deployment rollback endpoint.
- Runtime tabs (Tools, Resources, Prompts, Metrics, Execution Log, Events). They are not part of the revision snapshot and have no audit semantics.
- `Asset` view in the audit selector. Still disabled.

## Impact

- **Frontend**
  - New `ContainersApi.getRevisionDetails(url, token)` (mirrors `ImagesApi.getRevisionDetails`).
  - `src/app/[lang]/activity-audit/[id]/page.tsx`: extend the `pickHandlers` resolver table with a third entry for the six container subtypes.
  - `src/utils/audit/get-revision-route.ts`: six new cases returning `/deployments/{id}/revision/`.
  - `src/components/ActivityAudit/constants.ts`: five new `EntityParameterKeys` (`RESOURCES`, `SCALING`, `METADATA` or equivalent for envs, `PROBE_PROPERTIES`) and registrations in `separateObjectParameterKeys`.
  - `src/components/ActivityAudit/View/utils/generate-diffs.ts`: five new entries in `SEPARATE_OBJECT_HANDLERS` plus a small helper for flattening nested objects (`strategy`, `probe`, `requests`, `limits`) into the parent section's row list.
  - `src/components/ActivityAudit/EntityGrid/constants.ts`: cell renderer rule for env rows (Password masking on secure mount types) and i18n mapping for new row labels (mostly reusing existing `EntityFieldsI18nKey` from the editor).
  - `src/components/ActivityAudit/List/List.tsx`: flip the six container subtypes from no-op to navigate in `onCellClicked` and `openInNewTab` handlers.
- **BE dependency** — assumed shipped: `GET /api/v1/deployments/{id}/revision/{r}` returning `Container`. Same shape as the editor consumes today. Verified on first integration call; if the URL differs slightly we adjust the route helper only.
- **Backwards compatibility** — additive. No behavior changes for image, firewall, or admin-backend detail pages.
- **i18n** — reuses existing `EntityFieldsI18nKey` keys from the editor (`EndpointConfiguration`, `Autoscaling`, `Resources`, `Configuration`, `StartupProbe`, `EnvironmentVariables`, `GPURequest`, `Command`, `Arguments`, etc.). New keys are needed only for env-var mount-type chip labels (`MountAsVariable`, `MountAsFile`) and any container-specific row labels not already covered.
- **Tests** — Vitest coverage for the new predicate, the six new `get-revision-route` cases, env-var diff rendering (simple value, file, secure masking), resources flat-rows diff, autoscaling/strategy nested diff, startup-probe/probe nested diff, and List row-click navigation for container types.
