## Why

Three bugs in the platform asset create/duplicate flows degrade UX and block role duplication entirely:
the platform app runner create modal applies an `$id` character constraint that the entity-side form
does not, the shared duplicate modal unconditionally demands a Display Name for every view including
routes that have no such field, and roles have no duplicate action at all because of that modal defect.

## What Changes

- **Platform App Runners — create modal**: remove the `CORE_UNENCODABLE_ID_CHARS` forbidden-char
  constraint from `AppRunnerCreateProperties`. The entity-side create form (`CreateAppRunner`) has no
  such constraint; the platform create form must match it. Core will reject invalid names at save time.
- **Shared duplicate modal (`DuplicatePlatformAsset`) — routes and roles**: conditionally render
  `DisplayNameControl` only for views that carry a `displayName` field (models, app runners,
  interceptors). Routes and roles have no such field; showing a required Display Name field blocks
  duplication incorrectly.
- **Platform Roles — add duplicate action**: once the duplicate modal no longer unconditionally writes
  `displayName`, enable the `duplicate` row action for `PlatformRoles` in `getGridActionLabels`.
  The supporting infrastructure (`GetAssetActionMap`, `CreateAssetActionMap`) already handles roles.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `platform-app-runners`: remove the requirement that the platform create modal applies
  `CORE_UNENCODABLE_ID_CHARS` to the `$id` field; the entity-side form is the reference behaviour.
- `platform-routes`: duplicate no longer requires or renders a Display Name field; the modal collects
  only the new ID.
- `platform-roles`: add the duplicate action; the duplicate modal collects only the new ID, matching
  the routes pattern.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/CreateProperties.tsx` — remove
  `idForbiddenChars` prop.
- `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx` — gate
  `DisplayNameControl` render and its state initialisation on `hasDisplayName(view)`.
- `apps/ai-dial-admin/src/components/Assets/utils.ts` (`getGridActionLabels`) — move `PlatformRoles`
  to the case that includes `duplicate`; remove the explanatory comment that cited the modal defect.
- `openspec/specs/platform-app-runners/spec.md` — update to remove the forbidden-char requirement
  from the create-modal scenario.
- `openspec/specs/platform-routes/spec.md` — update duplicate scenario to reflect displayName-free flow.
- `openspec/specs/platform-roles/spec.md` — add duplicate scenario.
