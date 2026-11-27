## Why

A router service can come with its own admin UI. DIAL Core now stores an optional `editorUrl` on a router
(epam/ai-dial-core#2303) so that DIAL Admin can embed that UI on the router's page, as it already embeds an
application's custom editor. `Platform > Routers` has neither a field for the URL nor an embedded view, so the
router's UI can still be reached only through a separate application entry.

## What Changes

- The router Properties tab gains an `Editor URL` field under `baseUrl`, with the same control and URL check
  the application editor URL uses. An empty field is written as an absent `editorUrl`, so a router without
  one is stored as before.
- The router's `Parameters` tab gains the `UI` view the Applications `Parameters` tab has: the editor URL
  rendered in an iframe, opened by default when present, saved and discarded through the header actions with
  the same unsaved-changes guard. The URL is resolved as for an application: the app-type schema's
  `dial:applicationTypeEditorUrl` first, then the router's own `editorUrl`.
- The `Parameters` tab appears while a router has an app-type schema **or** an editor URL. Today it appears
  only with a schema. Without a schema it offers the `UI` view only, since Core rejects
  `applicationProperties` without a schema.
- A router opened from the `file` root, and any read-only admin, never sees the `UI` view, as for
  applications; for them an editor URL alone does not add the `Parameters` tab.

## Non-goals

- `viewerUrl` for a router, or any change to the router list columns.
- Defining where the router's UI stores its settings: that belongs to the router service.
- Changes to `ParametersTab` behavior for applications, app runners or catalog schemas.

## Capabilities

### New Capabilities

### Modified Capabilities
- `platform-routers`: the detail view tab set (Parameters also appears for an editor URL), the Properties tab
  content (an `Editor URL` field), and a new requirement for the embedded router UI.

## Impact

- Code: `DialRouterResource` (`models/dial/resource.ts`), router `Properties`, `View` and `TabsContent`
  (`components/Assets/Platform/Routers/`), the router branch of `getTabsForAsset` (`utils/tabs/utils.ts`), and
  the router exclusion in `components/Applications/ParametersTab/ParametersTab.tsx`. The shared
  `ParametersTab`, `FrameRenderer`, `useParametersTabGuard` and `useIframeSaveFeedback` are reused, not
  reshaped.
- API: no new endpoint; `editorUrl` rides on the existing `routers/platform/{name}` read and write.
- Deployment: saving a router with an editor URL needs a DIAL Core that includes epam/ai-dial-core#2303. An
  older Core answers `400`, which the router view already surfaces. Noted in `docs/INFRA-CHANGELOG.md`.
