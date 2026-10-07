## Why

Two separate problems with the same root — the console treats a catalog schema's declared entity
kind as decoration rather than as the fact it is.

On a deployment, the schema picker lists every catalog schema DIAL Core resolves and shows the kind
each declares in a column. An administrator editing a model therefore scrolls past every agent,
toolset and interceptor schema to reach the handful that apply. The kind column tells them which is
which only after they read it row by row.

On a catalog schema's own Properties tab, the entity-type selection offers `skill`. A skill cannot
carry a catalog schema at all: `Skill` does not extend `Deployment` in DIAL Core, and the Skills view
in this console has only `Properties` and `Skill` tabs — there is no Catalog tab to feed. Offering it
invites an administrator to author a schema nothing can ever reference.

Removing `skill` from the offered list must not narrow what the console accepts. Issue #4880 was
caused by exactly that conflation: `CatalogEntityType` had been narrowed to three values while Core's
catalog meta-schema allows five and `required`s the field, so a configuration file could legally
declare a schema typed `skill` or `interceptor`, the console would open it, and the narrow validator
made it permanently unsaveable. This change keeps the two concerns apart on purpose.

## What Changes

- Filter the deployment schema picker — both its dropdown and its browse grid — to the schemas whose
  declared kind matches the deployment being edited: Models to `model`, Applications to `agent`,
  ToolSets to `toolset`, Interceptors to `interceptor`.
- Never hide a schema that declares no kind at all, nor the schema the deployment currently points
  at, whatever kind it declares.
- Offer a "show all entity kinds" control in the browse modal, so a deliberate cross-kind pairing
  stays reachable. DIAL Core never checks a deployment's kind against the schema's, so our UI must
  not refuse a pairing Core accepts.
- Drop the kind column from the filtered grid, where it is a constant, and keep the schema's `$id`
  and display name. Restore the kind column in the "show all" view.
- Stop offering `skill` in the catalog-schema entity-type selection: offer `model`, `agent`,
  `toolset` and `interceptor`.
- Keep the save gate at Core's full five values, so a schema already typed `skill` keeps saving, and
  keep such a schema's own kind visible in its selection rather than blanking the field.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `catalog-properties-editing`: the deployment schema picker filters to the deployment's own entity
  kind, with an escape hatch that keeps every schema reachable.
- `platform-catalog-schemas`: the entity-type selection offers four kinds while the save gate
  continues to accept Core's five.

## Impact

- `apps/ai-dial-admin/src/constants/catalog-schemas.ts`
- `apps/ai-dial-admin/src/models/dial/catalog-schema.ts`
- `apps/ai-dial-admin/src/utils/catalog-schemas/picker-options.ts` (new)
- `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx`
- `apps/ai-dial-admin/src/components/CatalogProperties/SelectCatalogSchemaModal.tsx`
- `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/CreateProperties.tsx`
- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`
- The four deployment Properties surfaces that render the picker: platform models, platform
  interceptors, asset applications, asset toolsets
- `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts`
- No API, server-action, or dependency changes; `src/utils/catalog-schemas/validation.ts` is
  deliberately untouched
