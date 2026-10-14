## Why

DIAL Core added two interface-related settings the platform (Assets → Platform) editors cannot yet
express: a per-interface `overridePaths` map (`6ed0c9a6`) and a `skills_supported` feature flag
(`c0e21362`). Without FE support an admin can only set them by hand-editing JSON, and an editor
that round-trips an entity may not preserve them.

## What Changes

- Add a per-operation **override paths** editor to each interface row on Assets → Models, Assets →
  Applications (platform) and Assets → Platform Interceptors. Each interface type shows only the
  operation keys Core accepts under it.
- Add a **`skills_supported`** switch to the Features tab and the per-interface Features popup of
  platform Models and platform Applications.
- Rename the shared "Tools / Function Calling" feature group label to cover skills (the `en.ts`
  string only; the `GroupToolsFunctionCalling` key is kept).
- Switching an interface to `translator` mode clears its override paths (Core rejects the
  combination).
- Unknown override-path keys already saved on an entity are preserved untouched.

### Non-goals

- Entity-level (admin-backend) Models, Applications and Interceptors, and `DialDeploymentInterface`.
- A `skills_supported` switch on the entity-level Features tab (`DialFeatures`). It shares the renamed
  group label, which is accepted.
- Interceptor Properties feature editing (it edits `configuration_endpoint` only).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deployment-interfaces-config`: new per-interface override paths requirements (per-type keys,
  `{id}` validation, translator-mode clearing, round-trip preservation); the per-interface Features
  popup gains the skills switch.
- `platform-models`: Features tab gains `skills_supported` in the renamed tools group.
- `platform-applications`: Features tab gains `skills_supported` in the renamed tools group.

## Impact

- `models/dial/interfaces.ts`, `InterfacesField/{models.ts,InterfaceRow.tsx}`, a new override-paths
  editor component and per-type key constants.
- `models/dial/resource.ts` (`DialResourceFeatures`), `Assets/Platform/Models/constants.ts`,
  `Assets/Resources/constants.ts`, `constants/i18n.ts`, `locales/en.ts`.
- Shared group label also shows on the entity-level Features tab.
