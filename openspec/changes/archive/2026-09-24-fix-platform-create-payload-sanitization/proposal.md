## Why

The shared asset-list create flow supplies `folderId` as transient routing context, but every flat platform entity create action receives it through `CreateAssetActionMap`. Unlike the merged-read `_metadata` graft, that flat identity field is not currently removed by the map boundary and can reach DIAL Core's strict config-resource DTOs as an unknown field.

## What Changes

- Sanitize every platform entry in `CreateAssetActionMap` before it invokes its server action, removing transient `folderId` and `_metadata` while retaining the entity content and identity fields each action needs.
- Add focused map-boundary tests covering every platform create action to prevent regressions in the shared create flow.

### Non-goals

- Change platform application or toolset creation, which dispatches through `PlatformCreateAssetActionMap` and has its own bucket-specific payload handling.
- Change entity-specific server-action payload transforms, Core APIs, create-modal UI, navigation, or user-visible behavior.
- Add browser verification: this is an internal request-payload contract correction with no browser-observable acceptance change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-models`: The shared flat-platform create dispatch must not forward transient identity fields to a delegated create action.

## Impact

- `apps/ai-dial-admin/src/components/Assets/BaseAssetList/utils.tsx`: platform `CreateAssetActionMap` entries.
- The corresponding focused unit tests for the shared map boundary.
- No backend API, dependency, route, or consolidated-spec changes.
