## Context

The deployment manager backend has fully implemented export and import preview endpoints (`POST /configs/export/preview` and `POST /configs/import/preview`). The FE currently short-circuits both flows when `isDeploymentExport` / `isDeployments` is true, rendering `DialNoDataContent` with `IconEyeOff` instead of calling the API.

## Goals / Non-Goals

**Goals:**
- Show tabbed export preview for deployments in `PreviewModal`
- Show tabbed import preview with Action column for deployments in `ConfigurationPreview`
- Global Firewall tab on import with domain list and Before/After compare popup
- Reuse and share constants across export/import flows

**Non-Goals:**
- Validation errors display (deferred)
- Per-row Compare changes for deployment entities (deferred)
- JSON Editor toggle on import preview (deferred)
- Any changes to admin export/import flows

## Decisions

### D1: New components for deployment-specific UI, reusing existing building blocks

Three new components were created, each composing existing UI primitives:

| New Component | Reuses | File |
|---|---|---|
| `DomainList` | Cloud icon, `BASE_BUTTON_ICON_PROPS` | `Deployments/Common/Whitelists/DomainList.tsx` |
| `DeploymentConfigurationGrid` | `GridView`, `getDeploymentColDefs`, `getComponentActionColumn`, `DomainList`, `DialGhostButton` | `ImportConfig/ConfigurationPreview/DeploymentConfigurationGrid.tsx` |
| `GlobalFirewallCompareModal` | `DialPopup`, `GridView`, `DIFF_ROW_CLASS_RULES`, `DOMAIN_COLUMN`, `DiffLegend`, `LabelledText` | `ImportConfig/ConfigurationPreview/GlobalFirewallCompareModal.tsx` |

Existing components reused without modification:

| Mockup Element | Existing Component |
|---|---|
| Export preview grid | `GridView` with `getDeploymentColDefs()` |
| Import Action column | `getComponentActionColumn()` from `ConfigurationPreview.utils.ts` |
| Tab definitions | `DEPLOYMENT_ENTITY_TABS` from `deployment-utils.ts` (single-sourced) |
| Diff row highlighting | `DIFF_ROW_CLASS_RULES` from `ag-grid.ts` (shared with `AuditEntityGrid`) |
| Domain grid column | `DOMAIN_COLUMN` from `grid-columns.tsx` |

### D2: Export preview — remove guard, call endpoint, map response to tabs

`PreviewModal.tsx` guards are removed. When `isDeploymentExport` is true, a separate `useEffect` calls `previewDeploymentExportConfig`. The response shape:

```typescript
interface DeploymentExportPreviewResponse {
  globalImageBuildDomainWhitelist: string[];
  imageDefinitions: ExportComponentInfo[];
  deployments: ExportComponentInfo[];
}
```

`getDeploymentExportPreviewTabs` maps this response by grouping `deployments` by `type` field (normalized to uppercase since BE returns lowercase e.g. `mcp_deployment`) into container-type categories using `DEPLOYMENT_ENTITY_TABS`. Images and containers use different grid data mapping (`toImageGridData` vs `toDeploymentGridData`) because the Image grid reads `name` for Display Name and `id` for ID, while container grids read `displayName` and `name` respectively.

The export request is built via `buildDeploymentExportPreviewRequest(customExportData)` utility in `deployment-utils.ts`.

### D3: Import preview — remove guard, call new endpoint, delegate to DeploymentConfigurationGrid

`ConfigurationPreview.tsx` guards are removed. When `isDeployments` is true, it calls `previewDeploymentImportConfig` and delegates rendering to `DeploymentConfigurationGrid`, which handles both entity grid tabs and the Global Firewall tab.

`getDeploymentConfigurationPreview` in `ConfigurationPreview.utils.ts` groups BE response keys into container-type tabs using the shared `DEPLOYMENT_ENTITY_TABS`:

```
mcpDeployments          → MCP_CONTAINER tab
adapterDeployments      → ADAPTER_CONTAINER tab
interceptorDeployments  → INTERCEPTOR_CONTAINER tab
nimDeployments          → MODEL_SERVING tab
inferenceDeployments    → MODEL_SERVING tab
mcpImageDefinitions     → IMAGE tab
adapterImageDefinitions → IMAGE tab
interceptorImageDefinitions → IMAGE tab
globalImageBuildDomainWhitelist → GLOBAL_FIREWALL tab
```

### D4: Global Firewall tab — DomainList + GridView compare modal

The Global Firewall tab is rendered by `DeploymentConfigurationGrid` when `selectedTab === GLOBAL_FIREWALL_TAB_ID`:

1. Tab label is "Global Firewall" (no counter — it's always a single resource)
2. Content: heading + `DomainList` showing `next` domains + `DialGhostButton` with `IconReplace` for "Compare changes"
3. Compare opens `GlobalFirewallCompareModal` — a `DialPopup` with:
   - `LabelledText` for Action (capitalized) and Resource type
   - `DiffLegend` showing added count
   - Two `GridView` tables (Before/After) using `DOMAIN_COLUMN` and `DIFF_ROW_CLASS_RULES` for row highlighting (`ag-new-row` for added domains)

`ActivityDetails`/`AuditView` was not used because `generateCurrentResource` cannot process simple domain string arrays — it's designed for complex entity objects.

### D5: API layer — two new methods on DeploymentConfigApi

`DeploymentConfigApi` gains:
- `previewExportConfig(request, token)` → `POST ${DEPLOYMENT_EXPORT_CONFIG_URL}/preview` with JSON body via `postAction`
- `previewImportConfig(file, resolutionPolicy, token)` → `POST ${DEPLOYMENT_IMPORT_CONFIG_URL}/preview?resolutionPolicy=${policy}` with multipart/form-data via `postFiles`

### D6: Shared constants — single source, multiple consumers

| Constant | Location | Consumers |
|---|---|---|
| `DEPLOYMENT_ENTITY_TABS` | `ExportConfig/deployment-utils.ts` | Export preview utils, import preview utils, `DeploymentConfigContent` |
| `DIFF_ROW_CLASS_RULES` | `constants/ag-grid.ts` | `AuditEntityGrid`, `GlobalFirewallCompareModal` |
| `DOMAIN_COLUMN` | `constants/grid-columns/grid-columns.tsx` | `GlobalFirewallCompareModal` |
| `DomainList` | `Deployments/Common/Whitelists/DomainList.tsx` | `Whitelists`, `DeploymentConfigurationGrid` |

### D7: BE returns lowercase type values

The BE export preview response returns deployment `type` values in lowercase (e.g., `mcp_deployment` instead of `MCP_DEPLOYMENT`). The `COMPONENT_TYPE_TO_ENTITY_TYPE` mapping normalizes via `.toUpperCase()` before lookup.

## Risks / Trade-offs

**[Resolved] Response type case mismatch** — BE returns lowercase type values. Mitigated by `.toUpperCase()` normalization in the mapping lookup, with a dedicated test case.

**[Low risk] Global Firewall as non-grid tab** — The Global Firewall tab renders `DomainList` instead of AG Grid, which is a different rendering path than all other tabs. Handled by `isGlobalFirewallTab` conditional in `DeploymentConfigurationGrid`.
