## Why

DIAL Core is gaining resource dependencies for applications: an application declares the resources it
wants to act on behalf of the calling user (`resource_dependencies`), and an administrator must approve
that exact declaration before Core resolves it at request time. The admin console has no way to author
the declaration or to see, grant or withdraw the approval, so today the only route is hand-editing JSON
and calling Core directly.

## What Changes

- New **Resource Dependencies** tab on the **public-bucket** Assets > Applications detail view:
  - a grid of declared dependencies (Link ID, Target Path, Access, Required, row actions Edit /
    Duplicate / Remove) under a header `Resource Dependencies: {n}` with an **Add dependency** button;
  - an Add / Edit modal (Link ID, Target path, Read / Write access, Required switch);
  - an **Admin consent** block above the grid: Approve / Re-Approve / Revoke, status, last approved
    by / at, state-dependent info text, and the currently approved resources;
  - confirmation dialogs for Approve / Re-Approve and Revoke, each listing the affected paths.
- Declarations are stored in the application's `resource_dependencies` array as
  `{ kind: "dial.resourceLink", link_id, target: { path }, access: [...], required }`.
- Link ID uniqueness and the target-path grammar are validated in the UI, mirroring Core's write-time
  validator, so the user sees the problem before Save.
- **BREAKING (UI):** the **Dependencies** tab is removed from Assets > Applications (public **and**
  platform buckets). The deployment-name `dependencies[]` list stays in the data model and remains
  editable through the JSON editor only. The Applications surface backed by the admin backend keeps
  its Dependencies tab.
- New Core-direct admin-consent client and server actions over
  `GET | POST | DELETE /v1/consent/{app}/admin-consent`.

## Capabilities

### New Capabilities
- `application-resource-dependencies`: the Resource Dependencies tab — declaration grid and modal,
  validation, persistence shape, and the admin-consent block with its state matrix and dialogs.

### Modified Capabilities
- `platform-applications`: the platform application detail view no longer lists a Dependencies tab
  (the tab-set scenario of the Roles-tab requirement changes).

## Non-goals

- No feature flag. A Core without the feature (404) or a caller who is not an admin (403) simply gets the
  tab's no-data state.
- No UI for the deployment-name `dependencies[]` list.
- No Resource Dependencies tab on platform-bucket applications, on the admin-backend Applications
  surface, or on toolsets.
- No FE-side "consented" computation: status comes from Core's `consented` / `stale` flags.
- No bulk operations, import or reordering UI for dependencies.

## Impact

- `src/utils/tabs/utils.ts` (`EntityViewTab`, `getTabsForAsset`), `components/Applications/View/TabsContent.tsx`,
  `components/Assets/Entities/Apps/View.tsx`.
- New: `src/server/core/admin-consent-api.ts` (alongside `external-service-consent-api.ts`),
  server actions in `src/app/[lang]/assets-applications/actions.ts`, a `components/Assets/Entities/Apps/ResourceDependencies/`
  feature folder, model `ResourceDependency` and `AdminConsentStatus` in `src/models/dial/`, i18n keys.
- `DialApplication` gains `resource_dependencies?`.
- Depends on Core branch `feat/resource-dependencies-v1` (unreleased at the time of writing); the tab
  degrades to no-data on Cores without it.
- Shared surface: `TabsContent` is also used by the admin-backend Applications view, which must be
  unaffected.
