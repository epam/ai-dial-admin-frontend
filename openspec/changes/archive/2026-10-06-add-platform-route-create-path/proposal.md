## Why

Creating a platform route currently collects only its Core resource name, allowing it to be created without a route-matching path. A route should begin with one valid path so it is actionable immediately and invalid configuration is prevented before the request reaches Core.

## What Changes

- Add one required initial Path field to the Platform > Routes create modal alongside the existing required name field.
- Store the entered path as the first item in the route `paths` array and block creation until both name and path are valid.
- Reuse the established route-path validation and error behavior used by the existing route create flow.
- Keep the Platform Route create modal free of Display Name and Description fields.
- Keep multi-path editing in the existing Platform Route Properties tab after creation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-routes`: Change the Platform Route creation contract from name-only creation to requiring one valid initial path.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Platform/Routes/CreateProperties.tsx`
- Shared create-modal validation setup in `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx`
- Platform Route create-form tests and the `platform-routes` specification

No backend API, Core payload contract, or dependency changes are required: `DialRouteResource.paths` and the route create action already support the field.

## Non-goals

- Changing the Platform Route Properties tab or its existing multi-path editor.
- Changing the separate Entities > Routes create flow.
- Adding Display Name or Description fields to a Platform Route.
