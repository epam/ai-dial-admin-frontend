## Why

A catalog schema that declares no properties cannot get its first one. Its Parameters tab renders an
empty state instead of the editor, and the only control that adds a field lives inside the editor —
so a freshly created schema is a dead end, and the sole way forward is the raw JSON editor.

Reproduced on the running app: a schema created through the console's own create modal
(`dial:catalogEntityType: interceptor`, no `properties`) shows "No Configuration Scheme" with no add
action anywhere on the tab.

## What Changes

- The catalog-schema Parameters tab renders the shared schema editor unconditionally, so a schema
  with no properties offers its add-field action and the first property can be created in the UI.
- The empty presentation stays the editor's own: it already distinguishes an editable empty grid from
  a read-only one, so nothing needs to be built for the zero-property case.
- `platform-catalog-schemas` loses the requirement scenario that mandated the empty state, which
  contradicted the same requirement's own promise that the tab is always editable.
- The values-editor tab a deployment gains is relabelled `Catalog metadata`. `Catalog` collided twice
  over: with the menu group of the same name on `Catalog ▸ Models`/`Interceptors`, and — once the
  obvious alternative `Schema parameters` was considered — with the `Parameter Scheme` tab sitting
  directly beside it on an interceptor, which holds that interceptor's own configuration schema
  rather than catalog display data. `Catalog metadata` is DIAL Core's own wording for the field
  (`catalogProperties` — "Curated marketplace/catalog display metadata").

Non-goals:

- **App Runners keep their empty state.** The identical gate in `Assets/Platform/AppRunners/Parameters`
  covers a read-only grid whose schema an endpoint owns, where there is nothing to add — and, in the
  endpoint-less case, the very same dead end this change fixes. Fixing that one too belongs to the
  app-runner capability's own delta; this change touches one surface. (A failed resolve is a third,
  separate branch that returns earlier with its own message, so it is not what the gate is for.)
- **Surfacing a schema DIAL Core rejected.** A schema whose stored body declares no `$id` reads back
  with `status: invalid` and Core's own reason, and the console shows it as an ordinary row with an
  `$id` synthesised from its blob name. That masking is real and predates this change; it belongs to
  its own change rather than being folded in here.

## Capabilities

### Modified Capabilities

- `platform-catalog-schemas`: the "Parameters tab edits the schema's own properties" requirement drops
  the scenario that required an empty state for a schema with no properties, and states instead that
  the editor and its add-field action are offered so the first property can be created.

## Impact

- **Touched**: `components/Assets/Platform/CatalogSchemas/Parameters.tsx` — the `isNoData` branch and
  the now-unused `DialNoDataContent`/`EntitiesI18nKey` imports.
- **Touched, label only**: `TabsI18nKey.Catalog` becomes `TabsI18nKey.CatalogMetadata` with the label
  to match, plus its two references. `EntityViewTab.Catalog` — the tab's internal id, which four
  `TabsContent` components switch on — is deliberately left alone; no spec names the label, so no
  requirement changes.
- **Shared, untouched**: `Common/SchemaGrid` already handles a propertyless schema; this change only
  stops hiding it. No new props, no change for its two other callers.
- **No backend work.** DIAL Core stores the schema body verbatim and validates only the `$id`; a
  schema with no `properties` is valid to Core either way.
