## Why

App Routes has two distinct ownership models: the admin backend exposes arrays, while DIAL Core owns keyed route objects for asset applications and Platform App Runners. Sending Core objects to the array-only shared route editor prevents Core-owned routes from rendering or being edited correctly, and converting the collection to an array hides Core’s actual representation from the JSON editor.

## What Changes

- Keep `ApplicationAppRoutes` and `EntityRoutes` exclusively for the admin-BE-backed `/applications` and `/application-runners` array contract.
- Add a separate object-native App Routes component for `/assets-applications` and `/platform-app-runners` that retains keyed route objects in parent state and in the JSON editor.
- Support both Core-owned object field contracts in that component: unprefixed asset-application route fields and `dial:`-prefixed App Runner fields.
- Load Config-origin runner details through the config-file API and Platform-origin details through the resource API, exposing their original Core object routes to the object-native component.
- Validate Platform App Runner Core route objects directly before save and send the validated object unchanged to Core.
- Remove the collection-level array-to-Core-object and Core-object-to-array converters, along with their obsolete tests.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-app-runners`: Core-owned App Routes use an object-native editor and JSON representation for Platform App Runners and Asset Applications while admin-BE route arrays remain unchanged.

## Impact

- New object-native route UI under `apps/ai-dial-admin/src/components/Assets/`.
- Platform App Runner validation, actions, and tab wiring.
- Asset application App Routes and runner-details hook.
- Removal of `core-app-routes` collection converters and dependent tests.
- Existing Core config-file schema read API and platform resource API; no new backend endpoint or dependency.

## Non-goals

- Changing the admin-BE routes returned by `/applications` or `/application-runners`.
- Altering app-runner picker references, schema resolution, or CRUD ownership.
- Changing DIAL Core's stored route schema or configuration-file entities.
