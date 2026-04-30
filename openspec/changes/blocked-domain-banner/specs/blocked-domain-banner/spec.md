## ADDED Requirements

### Requirement: Image installation log subscribes to domain SSE events

The `InstallationLog` component SHALL listen for the `domain` Server-Sent Event on its existing EventSource (`/api/sse?entity=image&id=<selectedImage.id>`) alongside the existing `logs` and `error` listeners.

When a `domain` event is received with `verdict === "BLOCKED"`, the component SHALL append the domain string to its local `blockedDomains: string[]` state, ignoring duplicates and ignoring domains already present in `selectedImage.allowedDomains`.

When a `domain` event is received with `verdict === "ALLOWED"`, the component SHALL ignore it.

When the first BLOCKED domain is appended, the component SHALL call the parent-supplied `setHasBlockedDomains(true)` callback so the parent can flip the tab error indicator.

#### Scenario: BLOCKED domain event received during install

- **WHEN** the SSE stream emits `event: domain` with `data: {"domain":"internal-registry.myco.com","verdict":"BLOCKED"}`
- **THEN** `internal-registry.myco.com` is added to `InstallationLog`'s local `blockedDomains` array
- **AND** `setHasBlockedDomains(true)` is invoked

#### Scenario: ALLOWED domain event is ignored

- **WHEN** the SSE stream emits `event: domain` with `data: {"domain":"auth.docker.io","verdict":"ALLOWED"}`
- **THEN** `blockedDomains` is unchanged
- **AND** `setHasBlockedDomains` is not called

#### Scenario: Duplicate BLOCKED event is deduplicated

- **WHEN** the SSE stream emits the same `domain` BLOCKED event twice for the same domain
- **THEN** the domain appears at most once in `blockedDomains`

#### Scenario: BLOCKED domain already in allowedDomains is filtered out

- **GIVEN** `selectedImage.allowedDomains` contains `x.example.com`
- **WHEN** the SSE stream emits `event: domain` with `data: {"domain":"x.example.com","verdict":"BLOCKED"}`
- **THEN** `blockedDomains` is unchanged
- **AND** `setHasBlockedDomains` is not called

#### Scenario: Malformed payload is logged and ignored

- **WHEN** the SSE stream emits `event: domain` with a payload that is not valid JSON
- **THEN** the component logs `[SSE] Error parsing event: domain` to the console
- **AND** does not throw or update any state

### Requirement: Container execution log subscribes to domain SSE events per pod

Each `PodView` component SHALL listen for the `domain` Server-Sent Event on its existing per-pod EventSource (`/api/sse?entity=container&id=<selectedContainer.name>&podName=<podName>`) alongside the existing `logs`, `error`, and `open` listeners.

When a `domain` event is received with `verdict === "BLOCKED"`, the component SHALL invoke the `onBlockedDomain(domain)` callback supplied by `ExecutionLog`.

When a `domain` event is received with `verdict === "ALLOWED"`, the component SHALL ignore it.

`ExecutionLog` SHALL accumulate reported domains in its own local `blockedDomains: string[]` state, ignoring duplicates and ignoring domains already present in `selectedContainer.allowedDomains`. When the first BLOCKED domain is appended, `ExecutionLog` SHALL call the parent-supplied `setHasBlockedDomains(true)` callback.

#### Scenario: BLOCKED domain accumulates across pods

- **WHEN** pod A's SSE emits BLOCKED for `a.example.com` and pod B's SSE emits BLOCKED for `b.example.com`
- **THEN** `ExecutionLog`'s `blockedDomains` contains both `a.example.com` and `b.example.com`

#### Scenario: Same BLOCKED domain on multiple pods is deduplicated

- **WHEN** pod A and pod B both emit BLOCKED for the same domain `x.example.com`
- **THEN** `x.example.com` appears at most once in `blockedDomains`

#### Scenario: BLOCKED domain already in allowedDomains is filtered out

- **GIVEN** `selectedContainer.allowedDomains` contains `x.example.com`
- **WHEN** any pod's SSE emits BLOCKED for `x.example.com`
- **THEN** `blockedDomains` is unchanged
- **AND** `setHasBlockedDomains` is not called

#### Scenario: Malformed payload is logged and ignored

- **WHEN** any pod's SSE emits `event: domain` with a payload that is not valid JSON
- **THEN** `PodView` logs `[SSE] Error parsing event: domain` to the console
- **AND** does not invoke `onBlockedDomain`

### Requirement: Banner appears above log content when blocked domains exist

When `blockedDomains.length > 0`, the system SHALL render a `BlockedDomainBanner` (a thin wrapper over the existing `EntityBanner` primitive using an error/red variant) above the log content:
- For images: above `<LogViewer>` inside `InstallationLog`.
- For containers: above the per-pod content inside `ExecutionLog`, regardless of which pod tab is active.

The banner SHALL contain a translated message that includes the blocked domain(s) rendered as plain text (no underlines, no link styling, comma-separated for multiple) and a button labelled "Add to allowed domains".

When `blockedDomains.length === 0`, the system SHALL NOT render the banner.

#### Scenario: Image banner shows the single blocked domain

- **GIVEN** `blockedDomains = ["internal-registry.myco.com"]` in `ImageView`
- **WHEN** the user is on the Installation log tab
- **THEN** a banner is rendered above the log with text equivalent to `"Domain internal-registry.myco.com was blocked in last build. Add domain to allowed domains and install the image."` and an "Add to allowed domains" button

#### Scenario: Container banner shows multiple blocked domains comma-joined

- **GIVEN** `blockedDomains = ["a.example.com", "b.example.com"]` in `ContainerView`
- **WHEN** the user is on the Execution log tab
- **THEN** a banner is rendered above the pod content with text equivalent to `"Domain a.example.com, b.example.com was blocked in last run. Add domain to allowed domains and redeploy the container."` and an "Add to allowed domains" button

#### Scenario: No banner when no blocked domains

- **GIVEN** `blockedDomains = []`
- **WHEN** the user opens the Installation log or Execution log tab
- **THEN** no banner is rendered

### Requirement: Tab error indicator reflects blocked domains

The parent entity view (`ImageView` / `ContainerView`) SHALL hold a `hasBlockedDomains: boolean` state, set to `true` when the log component first reports a BLOCKED domain via `setHasBlockedDomains(true)` and reset to `false` when the user dismisses the banner via `setHasBlockedDomains(false)`.

The system SHALL apply `invalid: true` to the `InstallationLog` tab (image route) and to the `ExecutionLog` tab (container and MCP container routes) whenever the parent's `hasBlockedDomains` is `true`. The flag SHALL be derived in the tabs computation using the `withFlags(tabs, flagsMap)` helper from `utils/tabs/utils.ts` — not toggled imperatively.

When `hasBlockedDomains` is `false`, the tab SHALL show `invalid: false` from this feature.

#### Scenario: Installation log tab shows error indicator on blocked domain

- **GIVEN** `blockedDomains = ["x.example.com"]` in `ImageView`
- **WHEN** the tabs are rendered
- **THEN** the `InstallationLog` tab is marked `invalid: true`

#### Scenario: Execution log tab shows error indicator on blocked domain (regular container)

- **GIVEN** `blockedDomains = ["x.example.com"]` in `ContainerView` for `ApplicationRoute.Containers` (or any non-MCP container route)
- **WHEN** the tabs are rendered
- **THEN** the `ExecutionLog` tab is marked `invalid: true`

#### Scenario: Execution log tab shows error indicator on blocked domain (MCP container)

- **GIVEN** `blockedDomains = ["x.example.com"]` in `ContainerView` for `ApplicationRoute.McpContainers`
- **WHEN** the tabs are rendered
- **THEN** the `ExecutionLog` tab is marked `invalid: true`

#### Scenario: Tab error clears when hasBlockedDomains is set to false

- **GIVEN** the tab was marked `invalid: true` due to a blocked domain
- **WHEN** the log component calls `setHasBlockedDomains(false)` (e.g., user clicked "Add to allowed domains")
- **THEN** the tab is rendered with `invalid: false`

### Requirement: "Add to allowed domains" merges domains into the entity and dirties the form

When the user clicks the "Add to allowed domains" button on the banner, the log component SHALL:

1. Compute `merged = mergeAllowedDomains(entity.allowedDomains, blockedDomains)` (a deduped union preserving insertion order; `mergeAllowedDomains` lives in `utils/deployments/whitelist.ts`).
2. Invoke the existing `onChange` callback with the entity patched to use `merged` as `allowedDomains`. This SHALL dirty the form via the standard `isChanged` detection and activate the existing Save/Discard controls in the entity header.
3. Clear its local `blockedDomains` to `[]`, immediately hiding the banner.
4. Call `setHasBlockedDomains(false)` so the parent clears the tab error indicator.
5. NOT call `updateImage` / `updateContainer` directly. The user saves explicitly via the existing header.
6. NOT trigger an install or redeploy. The user re-runs install/redeploy explicitly via existing controls.

#### Scenario: Image — single domain added to empty allowedDomains

- **GIVEN** `selectedImage.allowedDomains = []` and `blockedDomains = ["x.example.com"]`
- **WHEN** the user clicks "Add to allowed domains"
- **THEN** `onChange` is called with `selectedImage.allowedDomains = ["x.example.com"]`
- **AND** `blockedDomains` becomes `[]`
- **AND** the Save/Discard controls in the header become active

#### Scenario: Container — multiple new domains merged with existing allowedDomains

- **GIVEN** `selectedContainer.allowedDomains = ["existing.example.com"]` and `blockedDomains = ["a.example.com", "b.example.com"]`
- **WHEN** the user clicks "Add to allowed domains"
- **THEN** `onChange` is called with `selectedContainer.allowedDomains = ["existing.example.com", "a.example.com", "b.example.com"]`
- **AND** `blockedDomains` becomes `[]`

#### Scenario: Domain already present is not duplicated

- **GIVEN** `selectedContainer.allowedDomains = ["x.example.com"]` and `blockedDomains = ["x.example.com", "y.example.com"]`
- **WHEN** the user clicks "Add to allowed domains"
- **THEN** `onChange` is called with `selectedContainer.allowedDomains = ["x.example.com", "y.example.com"]` (no duplicate `x`)

#### Scenario: Banner hides immediately on click without waiting for save

- **GIVEN** the banner is visible
- **WHEN** the user clicks "Add to allowed domains"
- **THEN** the banner is hidden in the same render pass — independent of whether the user subsequently clicks Save or Discard

### Requirement: All user-facing strings are i18n keys

The system SHALL define translation keys in the existing locale catalog (`apps/ai-dial-admin/src/locales/en.ts`) and group them under the existing `<Entity>I18nKey` enums in `apps/ai-dial-admin/src/constants/i18n.ts`:
- `ImagesI18nKey.BlockedDomainInBuild` — image-context message key with a `{domain}` placeholder.
- `ContainersI18nKey.BlockedDomainsInRun` — container-context message key with a `{domains}` placeholder (interpolated as the comma-joined list).
- `DeploymentsI18nKey.AddToAllowedDomains` — button label key reused by both.

The system SHALL NOT hardcode any user-facing string in component code.

#### Scenario: Image banner uses image-context i18n key

- **WHEN** the image banner renders
- **THEN** its message comes from `t(ImagesI18nKey.BlockedDomainInBuild, { domain })`

#### Scenario: Container banner uses container-context i18n key

- **WHEN** the container banner renders
- **THEN** its message comes from `t(ContainersI18nKey.BlockedDomainsInRun, { domains })`

#### Scenario: Button label is reused

- **WHEN** either banner renders
- **THEN** the button label is `t(DeploymentsI18nKey.AddToAllowedDomains)` — the same translated string in both contexts

### Requirement: Banner is built on the existing `EntityBanner` primitive

The new `BlockedDomainBanner` component SHALL render via the existing `EntityBanner` (`apps/ai-dial-admin/src/components/Deployments/Common/EntityBanner/EntityBanner.tsx`) using the error/red `AlertVariant`, with the action button supplied as `children` — matching the established pattern in `ImageStatusBanner.tsx`.

The system SHALL NOT introduce a new alert primitive.

#### Scenario: Banner uses EntityBanner with error variant

- **WHEN** `BlockedDomainBanner` renders
- **THEN** it composes `EntityBanner` with the error/red `AlertVariant` and a `DialNeutralButton` (or equivalent ai-dial-ui-kit button) as `children`

### Requirement: Out of scope — global whitelist, ALLOWED verdicts, build details `domains[]`

The system SHALL NOT modify the global domain whitelist UI or behavior.
The system SHALL NOT render any UI in response to ALLOWED verdicts (only BLOCKED).
The system SHALL NOT consume the new `domains[]` field on the `GET /api/v1/images/builds/{id}/details` response in this change. (Future work may revisit.)

#### Scenario: Global whitelist is untouched

- **WHEN** the user clicks "Add to allowed domains"
- **THEN** only the per-entity `allowedDomains` is mutated; the global whitelist is unchanged

#### Scenario: ALLOWED events produce no UI

- **WHEN** the SSE stream emits one or more `domain` events with `verdict === "ALLOWED"` and no BLOCKED events
- **THEN** no banner is rendered and no tab error indicator is shown
