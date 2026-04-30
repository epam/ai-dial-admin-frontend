## Why

The deployment-manager backend (PR #302) now streams Cilium DNS verdicts as `event: domain` SSE messages on image build and container pod log streams. When a domain is BLOCKED, the user has no way to see which domain caused the failure or to fix it without leaving the log view, opening the Firewall tab, manually copying the domain, and saving. The user needs an in-context banner that surfaces the blocked domain(s) and offers a one-click way to add them to the entity's allowed domains list.

## What Changes

- Listen for the new `event: domain` SSE messages on the existing image installation log and container execution log streams; collect domains where `verdict === "BLOCKED"`.
- In the image **Installation log** tab, render a banner above the log when a blocked domain is observed. Image builds fail on the first block, so the banner shows exactly one domain. Banner includes an "Add to allowed domains" button.
- In the container **Execution log** tab, render the same banner when one or more blocked domains are observed during the run. Multiple domains accumulate and render comma-joined as plain text. Button adds all of them to the container's allowed domains.
- Show an `invalid` (error) indicator on the **Installation log** / **Execution log** tab while the banner is active.
- Clicking "Add to allowed domains":
  - Merges the blocked domain(s) into the entity's `allowedDomains` array (deduped), dirties the form via the existing `onChange(entity)` flow so the global Save/Discard header activates.
  - Hides the banner immediately and clears the tab error indicator.
  - Does NOT trigger a save, install, or redeploy — user saves via the header, then re-runs install/redeploy themselves.
- Apply uniformly to the MCP container route, which uses the same Execution log tab.

## Capabilities

### New Capabilities
- `blocked-domain-banner`: Surfaces Hubble-Relay BLOCKED domain SSE events in the installation/execution log tabs and lets the user one-click promote them into the entity's allowed-domains list.

### Modified Capabilities
*None — global whitelist behavior is untouched, and existing per-entity allowed-domains UI is reused as-is via the standard `onChange` flow.*

## Impact

- **Frontend code touched**:
  - `components/Images/View/InstallationLog/InstallationLog.tsx` — owns local `blockedDomains: string[]`, listens for the new `domain` SSE event, filters domains already in `selectedImage.allowedDomains`, renders the banner, and on click merges into `allowedDomains` via `onChange`.
  - `components/Images/View/ImageView.tsx` — owns `hasBlockedDomains: boolean` for the tab indicator only; passes `setHasBlockedDomains` setter down through `TabsContent`. Tabs derived inline via `withFlags`.
  - `components/Images/View/TabsContent.tsx` — passes `selectedImage`, `onChange`, `setHasBlockedDomains` to `InstallationLog`.
  - `components/Containers/View/ExecutionLog/PodView.tsx` — new SSE `domain` listener; calls a callback passed by `ExecutionLog`.
  - `components/Containers/View/ExecutionLog/ExecutionLog.tsx` — owns local `blockedDomains: string[]`, accumulates BLOCKED domains from each `PodView`, filters against `selectedContainer.allowedDomains`, renders the banner above the pods, and on click merges via `onChange`.
  - `components/Containers/View/ContainerView.tsx` — owns `hasBlockedDomains: boolean` and (refactored) `hasWarningEvents: boolean` for tab indicators only; passes `setHasBlockedDomains` setter down through `TabsContent`. Tabs derived in `useMemo` via `withFlags`.
  - `components/Containers/View/TabsContent.tsx` — passes `selectedContainer`, `onChange`, `setHasBlockedDomains` to `ExecutionLog`.
  - `components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner.tsx` — new thin wrapper over the existing `EntityBanner` (`AlertVariant.Error`) with a `DialNeutralButton` action.
  - `utils/tabs/utils.ts` — adds `withFlags(tabs, flagsMap)` helper for applying `invalid`/`warning`/`disabled` to tabs by id.
  - `utils/deployments/whitelist.ts` — new file with `mergeAllowedDomains(existing, additions)` (deduped).
  - `locales/en.ts`, `constants/i18n.ts` — new keys: `ImagesI18nKey.BlockedDomainInBuild`, `ContainersI18nKey.BlockedDomainsInRun`, `DeploymentsI18nKey.AddToAllowedDomains`.
- **No backend/API changes** — consumes the existing SSE proxy at `/api/sse?entity=image|container&...`.
- **No new dependencies**.
- **Non-goals**: Consuming the new `domains[]` field on the build details response (relies on SSE replay instead), changes to the global domain whitelist, automatic re-install / re-deploy after adding a domain, surfacing ALLOWED verdicts.
