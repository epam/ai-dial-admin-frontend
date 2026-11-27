## Context

See proposal.md for motivation. Facts on `development`:

- Core (epam/ai-dial-core#2303): `Router.editorUrl` is a camelCase string with alias `editor_url`, not
  validated, stored only when set, returned by `GET /v1/routers/platform/{name}` and
  `GET /v1/admin/config/file/routers/{name}`, absent from listings. Core does not resolve the schema's
  `dial:applicationTypeEditorUrl` for a router (its design D4) and chose the name `editorUrl` so that DIAL
  Admin's application editor code can serve a router page unchanged (its D1).
- `ParametersTab` already embeds an application's editor: `getCorrectConfig` takes the schema's
  `dial:applicationTypeEditorUrl`, then the entity's `editorUrl` / `editor_url`; `getTargetUrl` builds the
  iframe URL with `id` = the entity name. The router passes itself as a `DialApplication`, so `editorUrl`
  is picked up as is. The one block is `hasUi = … && view !== ApplicationRoute.PlatformRouters`.
- `hasUi` also requires `!isReadOnlyAdmin`. A `configFile=true` router view calls `setEntityReadOnly(true)`,
  which `AppContext` folds into `isReadOnlyAdmin`, so the file case is already covered.
- The router branch of `getTabsForAsset` inserts `Parameters` on `hasParameters`, which `RouterView` sets to
  `!!applicationTypeSchemaId`. `RouterView` already falls back to `Properties` when the active tab vanishes.
- `Platform/Applications/View.tsx` wires the iframe through `useParametersTabGuard` (frame ref, dirty /
  valid / saving state, save-or-discard modal on tab switch) and `useIframeSaveFeedback` (notifications,
  `router.refresh()`). `RouterView` has none of this.
- `EditorUrlControl` wraps `EndpointControl`, which validates with `getUrlError` and reports the field to
  `SaveValidationContext`; `RouterView` is already under a `SaveValidationContextProvider`.

## Goals / Non-Goals

**Goals:**

- Reuse the application iframe path end to end; the router view gains only wiring.

**Non-Goals:**

- Generalizing `ParametersTab` or the guard hook into a new shared shape.

## Decisions

### D1. The `UI` view of the existing `Parameters` tab, not a new tab

Chosen with the user: the same place and behavior as applications. Rejected: a separate `Editor` tab. It
would read more clearly for a router without a schema, but it is a tab no other entity has and would need its
own save wiring.

### D2. Lift the router exclusion in `ParametersTab`, keep the precedence

Drop `view !== ApplicationRoute.PlatformRouters` from `hasUi`. The precedence stays as `getCorrectConfig` has
it: schema editor URL, then the router's. This follows Core's D4. The comment that a router's schema
"contributes no editor" goes with the exclusion.

### D3. A router without a schema gets the `UI` view only

Core rejects `applicationProperties` without `applicationTypeSchemaId`, so the `Table` view and its add
action must not be offered there. `generateViewItems` already omits `Form` without a scheme. The router case
needs `Table` omitted too when it has no schema. That decision belongs to the router, so `RouterView` /
`TabsContent` pass the restriction into `ParametersTab` as a prop rather than `ParametersTab`
inferring it from the route. With a single item the selector is already hidden
(`showDropdown` needs more than one).

Rejected: keep `Table` and let Core answer `400`. That offers an edit the backend always refuses.

### D4. Tab visibility: schema, or editor URL with the `UI` view offered

`hasParameters` becomes `!!applicationTypeSchemaId || (!!editorUrl && !isReadOnlyAdmin)`. Without the
read-only term, a file router with only an editor URL would show an empty `Parameters` tab. The value is
taken from the edited router, so typing or clearing the field adds or removes the tab live, and the existing
fallback handles a vanished active tab.

### D5. Wire the iframe into `RouterView` as `Platform/Applications/View.tsx` does

Copy that view's use of `useParametersTabGuard` and `useIframeSaveFeedback`: combined `isChanged`,
`isSaving`, `isSaveDisabled`, save/discard routed to the iframe while it is dirty, `onChangeActiveTab` from
the guard, and the confirmation modal. The application view's `isHideJsonSelector` is not copied: it is not a
`JsonConfiguration` field and has no effect. `TabsContent` forwards
`frameRef`, `frameCallbacks`, `isChanged`, `discardKey` and `onSave` to `ParametersTab`. The notification
view is `ApplicationRoute.PlatformRouters`, so the texts are the router update ones.

### D6. Editor URL field and empty value

`EditorUrlControl` under the `baseUrl` field in `Properties`. Its `onChange` writes `editorUrl: value ||
undefined`, so an emptied field leaves no `editorUrl: ""` that Core would store. No new i18n key: the label
and placeholder already exist.

## Risks / Trade-offs

- [An older Core answers `400` to a router with `editorUrl`] → the router view already surfaces Core's
  message; the minimum Core is stated in `docs/INFRA-CHANGELOG.md`.
- [The iframe source is an admin-entered URL] → only admins with write access reach the field, as for an
  application editor URL; the same `getUrlError` check applies.
- [The tab is named `Parameters` while it holds only the router UI] → accepted with D1.

## Migration Plan

None. Routers without `editorUrl` render and save as before.
