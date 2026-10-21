## Why

The shared schema property editor (`Common/SchemaGrid`) accepts property names, titles, descriptions,
and catalog tab/section hints of any length. A 1000-character title typed there is stored verbatim,
and every surface that later renders the schema breaks on it: the catalog Generated form's field
header, its inline "… is required" message, and the catalog-properties error list push the rest of
the form off-screen (issue #4723). Core cannot catch this — its catalog meta-schema declares `title`
and `description` as plain strings with no `maxLength`, and it stores catalog-schema bodies
verbatim. The limit has to be applied where the value is entered.

The related readability defect — the inline required message not quoting the field label, so a long
label runs into "is required" (issue #4731) — lives in `@epam/ai-dial-ui-kit`'s `DialSchemaRenderer`
and is fixed there; this change picks it up through the dependency bump.

## What Changes

- The schema property editor applies default input constraints to its free-text cells: Name, Title,
  Tab, and Section at most 255 characters; Description at most 1024. Order carries no default.
- Each consumer of the editor can disable the defaults entirely, disable them for one field, or
  override or extend them per field with any native input attribute (`maxLength`, `minLength`,
  `pattern`, `inputMode`, `min`, …) — through a single optional prop. The defaults are on for all
  three current consumers.
- A value that violates a length or pattern constraint — typically one arriving through the raw JSON
  editor or an import, which the input's own `maxLength` cannot stop — blocks save and is reported
  above the grid, the way empty and duplicate property names already are.
- The shared `EditableCellRenderer` gains a generic pass-through for native input attributes, so the
  editor's cells can receive them; the grid-owned attributes (value, change, key handling, type,
  styling) stay non-overridable.
- `@epam/ai-dial-ui-kit` is bumped to the release that quotes the field label in the required-field
  message.

## Capabilities

### New Capabilities

- `schema-property-editor`: the shared property editor used by Catalog Schemas, platform App Runners,
  and Application Runners — its default input constraints, how a consumer configures them, and how
  constraint violations block save.

### Modified Capabilities

None. `platform-catalog-schemas` and `platform-app-runners` describe their Parameters tabs in terms of
which fields are editable; they inherit the constraint behavior from the shared editor rather than
restating it.

## Non-goals

- Shortening or rewriting schemas already stored with over-limit values. They open normally, and
  saving them is blocked until the offending value is edited.
- Constraining the schema-level fields on the Properties tab (`$id`, display name, default locale) —
  they use shared entity controls with their own rules.
- Hardening the Generated form (`DialSchemaRenderer`) or the catalog-properties error list against
  long labels coming from existing schemas.
- Adding `maxLength` to Core's catalog meta-schema. If Core adds one later, the defaults here must be
  changed to match it.

## Impact

- `apps/ai-dial-admin/src/components/Common/SchemaGrid/` — new prop, defaults, resolution and
  validation utilities, name cell pass-through.
- `apps/ai-dial-admin/src/components/Grid/CellRenderers/EditableCellRenderer.tsx` — shared renderer
  used by many grids; the new parameter is optional, so other grids are unaffected.
- Consumers: `Assets/Platform/CatalogSchemas/Parameters.tsx`, `Assets/Platform/AppRunners/Parameters.tsx`,
  `ApplicationRunners/ConfigurationView/Parameters.tsx` — pick up the defaults with no code change.
  An app-runner schema already holding an over-limit title can no longer be saved until it is
  shortened.
- i18n: new messages in `src/locales/en.ts` / `src/constants/i18n.ts`.
- `package.json`: `@epam/ai-dial-ui-kit` version.
