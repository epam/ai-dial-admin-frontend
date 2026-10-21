## Context

`CatalogSchemaParameters` gates the editor on emptiness:

```tsx
const isNoData = useMemo(() => !schema?.properties || !Object.keys(schema.properties).length, [schema]);
{isNoData ? <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} /> : <SchemaGrid … />}
```

`SchemaGrid` owns the only add-field control (`onAddField`, plus `Add sub-field` per row), so the
gate removes the one action that would resolve the state it reports. Verified on the running app: a
schema created through the console's own create modal lands on `No Configuration Scheme` with no add
action, and the raw JSON editor is the only way out.

The same file's doc comment already states the opposite of what the code does — *"the schema as
loaded is the parameter set, and it is always editable"* — and so does the capability's own
requirement, whose body promises the properties are editable with "no read-only mode to enter" while
one of its scenarios mandated the empty state.

`SchemaGrid` needs nothing for this: `getIsEmptyData={() => fields.length === 0 && isReadonlyGrid}`
already reserves its empty presentation for the read-only case, so an editable grid with zero fields
renders as an empty grid with its add action.

## Goals / Non-Goals

**Goals:**

- Make the first property creatable on the tab that owns property editing.
- Leave the empty-state decision where it already belongs — inside the shared editor.

**Non-Goals:**

- Touching `SchemaGrid` or its two other callers.
- Changing how a schema with properties renders today.

## Decisions

### D1. Drop the gate rather than add an add-field control beside it

The tab renders `SchemaGrid` unconditionally, matching `TestSuites/EndpointSchema`, the third caller,
which has never gated on emptiness and is editable from zero fields for exactly this reason.

Rejected: keeping the empty state and adding an "Add first property" button next to it. That builds a
second add path for one screen, and the grid's own empty rendering already reads as empty — the
`DialNoDataContent` was standing in for a state the grid expresses itself.

### D2. App Runners keep the identical gate, and this records what it really covers

`Assets/Platform/AppRunners/Parameters` computes `schema = isReadonly ? resolvedSchema : runner`,
where `isReadonly` is just `!!runner['dial:applicationTypeSchemaEndpoint']`. Its `isNoData` gate
therefore covers two cases, and neither is a failed resolve — that path returns earlier, with
`ResolvedSchemaFailed`, which the tab's own pre-existing test pins by asserting
`NoConfigurationSchema` is absent there:

1. **Endpoint declared, resolve succeeded, resolved schema declares no properties.** The grid would
   be read-only, so it carries no add action anyway and the empty state is the honest rendering.
2. **No endpoint, runner declares no properties.** Editable, and the same dead end this change fixes
   for catalog schemas.

Case 2 is left alone deliberately: it belongs to the app-runner capability's own delta, and this
change touches one surface. A catalog schema never has case 1 — it declares no endpoint, the resource
*is* the schema — which is why removing the gate here is safe while removing it there is not this
change's call.

### D3. `Catalog metadata`, not `Catalog` and not `Schema parameters`

The tab holds `catalogProperties` — what an end user sees on the catalog card — and its first label,
`Catalog`, repeated the name of the menu group containing two of the four surfaces that show it.

`Schema parameters` reads naturally in isolation and is worse in place: on an interceptor it would
sit immediately after `Parameter Scheme`, which holds that interceptor's own configuration schema,
and "parameters" already means two other things nearby — `applicationProperties` driven by a runner
schema on App Runners and applications, and a catalog schema's own property declarations on its
Parameters tab. A near-anagram of the tab beside it, for unrelated content, is a worse collision than
sharing a word with a navigation group.

`Catalog metadata` is the field's own description in Core (*"Curated marketplace/catalog display
metadata"*), collides with neither, and says the content is about presentation rather than
configuration. Only the label and its i18n key change; `EntityViewTab.Catalog` stays the tab id, so
the four `TabsContent` switches are untouched.

## Risks / Trade-offs

- **An empty grid reads as a loading state** → `SchemaGrid` renders its header row and the add action
  immediately, and the catalog-schema read is already complete before the tab mounts (no resolved
  read to await, per D2), so there is no interval where the grid is empty because data is pending.
