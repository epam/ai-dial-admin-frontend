## 1. Model and Properties field

- [x] 1.1 Add `editorUrl?: string` to `DialRouterResource` in `apps/ai-dial-admin/src/models/dial/resource.ts`.
- [x] 1.2 Render `EditorUrlControl` (`components/BaseControls/Endpoint/EditorUrl.tsx`) under the `baseUrl`
  field in `components/Assets/Platform/Routers/Properties.tsx`, writing `editorUrl: value || undefined`
  (design D6).
- [x] 1.3 Add `docs/INFRA-CHANGELOG.md` entry under the upcoming release: a router's `Editor URL` and its
  embedded UI need a DIAL Core that includes epam/ai-dial-core#2303; an older Core answers `400` on save.

## 2. Parameters tab for routers

- [x] 2.1 In `components/Applications/ParametersTab/ParametersTab.tsx` drop the
  `view !== ApplicationRoute.PlatformRouters` term from `hasUi` and its comment (design D2).
- [x] 2.2 Add a `ParametersTab` prop that withholds the `Table` view and the add-property action, and pass it
  from `components/Assets/Platform/Routers/TabsContent.tsx` when the router has no
  `applicationTypeSchemaId` (design D3).
- [x] 2.3 In `components/Assets/Platform/Routers/View.tsx` compute `hasParameters` as
  `!!applicationTypeSchemaId || (!!editorUrl && !isReadOnlyAdmin)` from the edited router (design D4).

## 3. Iframe save wiring in the router view

- [x] 3.1 Wire `useParametersTabGuard` and `useIframeSaveFeedback` into
  `components/Assets/Platform/Routers/View.tsx` as `components/Assets/Platform/Applications/View.tsx` does:
  combined changed/saving/save-disabled state, save and discard routed to the iframe while it is dirty, the
  guard's `onChangeActiveTab` and confirmation modal (design D5).
- [x] 3.2 Forward `frameRef`, `frameCallbacks`, `isChanged`, `discardKey` and `onSave` from `TabsContent.tsx`
  to `ParametersTab`.

## 4. Unit tests

- [x] 4.1 `Properties` spec under `components/Assets/Platform/Routers/tests/`: the `Editor URL` field renders,
  writes the typed value, writes `undefined` when emptied, and reports an invalid URL to save validation.
- [x] 4.2 Router `View` spec: tab list for schema only, editor URL only, both, neither, and editor URL only
  while read-only; clearing the editor URL removes `Parameters` and returns to `Properties`; header save goes to
  the iframe while it is dirty.
- [x] 4.3 `ParametersTab` spec: a `PlatformRouters` view with an editor URL offers the `UI` view and opens on
  it; the schema's `dial:applicationTypeEditorUrl` wins over the router's; without a schema neither the
  selector nor the add action is shown; read-only offers no `UI` view.
- [x] 4.4 `utils/tabs` spec: the `PlatformRouters` branch inserts `Parameters` on `hasParameters`, unchanged
  otherwise (`getTabsForAsset` itself is unchanged; its existing router cases cover it).

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change's `platform-routers` scenarios against the local
  stack (auth disabled), on a router the run creates for itself; resolve every `fail` verdict before
  continuing.

## 6. Quality checks

- [x] 6.1 `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` pass.
- [x] 6.2 `openspec validate add-router-editor-url --strict` passes.
