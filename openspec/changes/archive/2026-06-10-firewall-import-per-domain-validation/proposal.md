## Why

The deployment-manager backend (commit #359, `010-import-validations`) now emits **one validation error per invalid global-firewall domain**, keyed by the offending domain in `entityIdentifier` (e.g. `{ entityType: "GLOBAL_DOMAIN_WHITELIST", entityIdentifier: "bad!", message: "domain 'bad!' is not a valid domain name" }`). Previously `entityIdentifier` was empty, so the frontend filtered these errors out entirely (`filterArtifactErrors`) and a user could import a config with an invalid firewall domain past a clean-looking preview. Now that each error carries its domain, the frontend can join errors to specific rows and surface them inline.

## What Changes

- **Stop discarding firewall errors**: `GLOBAL_DOMAIN_WHITELIST` errors are no longer filtered out of the deployment import preview.
- **Per-domain inline decoration**: in the Global Firewall tab's `DomainList`, each invalid domain renders in error color (`text-error`) with a trailing `IconInfoCircle` whose `DialTooltip` shows that domain's error message(s). Valid domains render unchanged.
- **Gate import on firewall errors**: firewall errors count toward `validationSummary.totalFailed`, marking the Global Firewall `TabModel.invalid`, turning the Configuration wizard step to `StepStatus.ERROR`, and disabling the Import button (reuses the existing `totalFailed`-driven gating).
- **No tab-content banner** for the firewall tab — the per-domain decoration is the sole in-tab surface (the existing above-tabs summary banner still reflects the global count).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `deployment-import-preview-validation-errors`: reverses the "Whitelist errors filtered out of UI" requirement; allows the Global Firewall `TabModel.invalid` to be `true`; firewall errors now contribute to `validationSummary.totalFailed`, the Configuration step status, and the Import-button gate. The per-domain decoration is added to the Global Firewall tab.

## Non-goals

- **No backend change** — the backend already emits per-domain errors as of #359.
- **No tab-content banner** (`DialNotification`/`ValidationBanner`) inside the Global Firewall tab. The existing above-tabs summary banner is unchanged.
- **No per-row State column** on the firewall tab (it has no grid; decoration lives in `DomainList`).
- **No change** to the admin Config Import path (`isDeployments === false`), the "Compare changes" modal, or the standalone Global Firewall editor (`GlobalWhitelist.tsx`).

## Impact

- **Affected code** (under `apps/ai-dial-admin/src/`):
  - `components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts` — extract firewall errors into a per-domain map, count them in `totalFailed`, mark the firewall tab invalid, return the map.
  - `components/Deployments/Common/Whitelists/DomainList.tsx` — optional per-domain error decoration (red text + info-icon tooltip).
  - `components/ImportConfig/ConfigurationPreview/DeploymentConfigurationGrid.tsx` — pass the per-domain error map to `DomainList`.
  - `components/ImportConfig/ConfigurationPreview/ConfigurationPreview.tsx` — thread the map from preview to grid.
  - Co-located `.spec` files for the touched utils/components.
- **No API or dependency changes.**
- **Shared-component note**: `DomainList` is reused by the editor/compare flows; the new `errors` prop is optional, so those callers are unaffected.
