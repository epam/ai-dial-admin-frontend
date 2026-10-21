## Context

See `proposal.md` — Why. The state this design builds on, all verified against source:

DIAL Core carries `catalogSchemaId` and `catalogProperties` on `Deployment`, and validates the pair
in two different places. `CatalogPropertiesConformToSchemasValidator` runs over
`models`/`applications`/`toolsets`/`interceptors` of the merged `Config` — so a platform-bucket
resource with invalid values fails the whole configuration at assembly. `ApplicationService` and
`ToolSetService` additionally call `CatalogSchemaService.validate` on write, which is why a
user-bucket application or toolset is rejected immediately with a `400`. Those four types are the
complete set; `Skill` does not extend `Deployment`.

The schema list for a picker exists as one route: `GET /v1/catalog_schemas/schemas` returns `$id`,
`dial:catalogEntityType` and `dial:catalogDisplayName` for every schema in the merged config — both
populations, no resource metadata. Entity type is informational: nothing in Core compares a
deployment's kind against it.

The console already renders a form from a JSON schema — `SchemaUiRenderer` wrapping ui-kit's
`DialSchemaRenderer`, used by the application parameters tab. Neither knows `dial:file` nor
`dial:meta`: neither string appears in the shipped ui-kit package.

`catalogSchemaId`/`catalogProperties` are already declared on `DialModelResource` (added 2026-07-29
in #4058) with no reader and no writer anywhere.

## Goals / Non-Goals

**Goals:**

- One mechanism, four placements: the picker, the editor and the validation live in one place, and
  each surface contributes only where it renders them.
- Use the shared `SchemaUiRenderer`/`DialSchemaRenderer` as it is, and state what it does not yet
  support rather than working around it.
- Make the client-side gate real protection where Core has none, without pretending the two buckets
  behave alike.

**Non-Goals:**

- Authoring locale maps for `displayName`/`description`/`intro` (preservation only).
- Any change to how the application parameters tab renders `applicationProperties`.
- Filtering the picker by entity kind.

## Decisions

### D1. Placement: the picker in `Properties`, the values in their own tab

This follows how an app runner is already integrated into an application: the runner **selection**
is a field in `Properties` (`ResourceSourceField` on the asset view, the source field on the entity
view), while the values its schema declares live in the separate `Parameters` tab. Catalog metadata
splits the same way — the schema a deployment points at is a property of the deployment, and filling
the schema in is its own surface.

So: the schema picker goes into each surface's `Properties`, and a `Catalog` tab holds the values
editor. With no schema selected the tab shows an empty state, exactly as `Parameters` does for an
application with no runner.

Rejected: both halves in one new tab (this design's first draft). It diverges from the established
integration for no gain, and it buries the selection one tab away from every other property of the
deployment.

Also rejected: both halves in `Properties`. A schema declares an open-ended field set — the values
editor is a variable-size block, and `Properties` already carries display name, description, icon,
endpoints, topics and interfaces.

### D2. The picker: repeat the App Runner source-field shape, with its own modal

The field is a 1.0 `DialSelectField` plus a button that opens `SelectCatalogSchemaModal`, and the
selected schema is openable in a new tab — the shape `SourceField/Application/AppRunners.tsx` already
has. The modal is a new file built the same way `SelectAppRunnersModal` is (`DialFormPopup` +
`GridView` + `RadioButtonRenderer` + `SINGLE_ROW_SELECTION`, ~100 lines), with
`CATALOG_SCHEMA_PICKER_COLUMNS` alongside `PICKER_RUNNER_COLUMNS`.

The app-runner modal is not reused: it is typed to `DialApplicationScheme`/`DialAdapter` and its
columns are the runner set. Widening it to a second entity would mean a generic modal serving two
callers with disjoint columns — more coupling than a second 100-line file.

1.0 components, not ui-kit 2.0: the ui-kit MCP marks `DialSelect*` superseded by `Select`, but every
other control on these pages is 1.0, and mixing generations inside one form is worse than being one
generation behind. Migrating is its own change.

Rejected: a plain select with no modal. It is enough to pick by `$id`, but then the entity kind and
display name have nowhere to show, and an admin picks blind between schemas whose ids are URIs.

### D3. The editor is the shared renderer, unchanged, and the gap is stated

`catalog_properties` are edited by `SchemaUiRenderer` — the wrapper over ui-kit's
`DialSchemaRenderer` that the application parameters tab already uses. No layer of ours around it.

Reading the shipped renderer settled this. It is not a flat field list: `SchemaObjectEditor`,
`SchemaArrayEditor`, `SchemaOneOfEditor`, `SchemaAnyOfEditor`, `SchemaAdditionalPropertiesEditor`,
`SchemaKeyValueEditor` and `SchemaSection` are all there, primitives resolve to `Input`, `Select`
(for `enum`) and `Switch`, and it already reads one `dial` extension of its own —
`dial:resource` + `acceptableResourceTypes` renders a resource picker. So the overwhelming majority
of any catalog schema is already handled.

What it does not read is the catalog meta-schema's presentation metadata (`dial:tab`,
`dial:section`, `dial:propertyOrder`, `dial:widget`) and its `dial:file` marker — no `format`
branching either. Those stay inert in this change, and the spec says so rather than leaving it as a
surprise: a file-valued property is edited as the text reference it is.

Which side should change is deliberately left open, because the app-runner meta-schema answers it
halfway already: there `dial:file` is annotated *"The schema is deprecated. Use
dialResourceFormatAndTypeSchema"*, and its replacement is `dial:resource` +
`acceptableResourceTypes` — exactly the extension the renderer supports. The catalog meta-schema
inherited the deprecated form. So the fix may belong in Core's catalog meta-schema (adopt
`dial:resource`) rather than in the renderer (learn `dial:file`), and the presentation metadata is a
separate question from the file marker. This change renders what the renderer renders and defers
that call.

To keep that honest, the catalog tab offers the raw JSON view of `catalog_properties` alongside the
form, so a value the form renders awkwardly is still enterable exactly — the same escape hatch the
parameters tab has.

Rejected, in order:

- **Our own layer that groups by `dial:meta` and renders catalog widgets** (this design's second
  draft). It duplicates layout logic that belongs upstream, and the one live schema we have — from
  Core's own `CatalogSchemaServiceTest` — declares no tabs, sections, order or widgets at all.
- **Our own field mapping on repo controls** (the third draft). It would have thrown away the
  object, array and `oneOf` editors that already work, to gain a file picker.
- **Rewriting `dial:file` into `dial:resource` before handing the schema over**, to borrow the
  renderer's resource picker. Tempting, but it would fabricate a declaration the schema's author did
  not write, and the picker offers a caller-supplied list rather than browsing files — so it is not
  the control a file field wants anyway.

### D4. Validation lives in a util, gated the same way on both buckets

`validateCatalogProperties(schema, values)` returns `{ field, message }[]`, mirroring
`validateCatalogSchema`. Both save paths call it, and both block on a non-empty result — even though
Core itself would have caught a user-bucket write. Two reasons: an admin should get the same message
in the same place regardless of which bucket the resource happens to live in, and a `400` round-trip
is a worse experience than an inline block.

The default locale for a `dial:localized` property comes from the schema's own `dial:defaultLocale`,
falling back to `en` exactly as `CatalogSchemaService` does. `Config.defaultLocale` is deliberately
not consulted: Core exposes it through no endpoint — not the settings blob, not the config-file
half — so a console that depended on it would be guessing.

### D5. Locale-map display fields: widen the type, preserve the value, render only strings

`displayName`/`description`/`intro` become `string | Record<string, string>` on the four resource
models. The controls stay string-only: when the value is a map, the field renders read-only with the
default-locale value (or the first available one) and the map is carried through the save untouched.

This is the smallest change that stops the corruption. Today the map reaches a text input, renders as
an object, and is overwritten on the next save — the value is destroyed by a console that never meant
to edit it. Authoring is out of scope (see proposal non-goals), so a read-only rendering plus
preservation is the whole of it.

Rejected: leaving the types alone and stripping maps on read. That trades silent corruption for
silent loss.

### D6. Config-file half: the eighth covered type, no new mechanism

`CatalogSchemas` joins `READABLE_CONFIG_FILE_TYPES` and the route joins `CONFIG_FILE_ENTITY_VIEWS`;
the list page gains the `ConfigFileListSwap` + `ConfigFileEntityList` wrapper the other seven views
have. Verified reachable: `GET /v1/admin/config/file/catalog_schemas/{name}` returns the schema body
plus `name` and `status: valid` — the same shape `ConfigFileEntityList` already consumes for App
Runners, whose config-file entries are schemas too.

### D7. The `$id`-versus-blob-name rewrite

`mergeCatalogSchemaResource` currently overwrites the body's `$id` with the decoded resource name.
For a console-created schema the two are identical by construction. For one created elsewhere they
can differ — Core keys its merged config by `$id` and accepts any legal blob name — and then the
console shows the wrong identity and turns the next save into a rejected `$id` change.

Fix: prefer the `$id` the body declares, and fall back to the decoded name only when the body has
none. The same reasoning applies to `mergeAppRunnerResource`, which has the identical line; this
change fixes the catalog-schema one and leaves a note on the runner, because changing it needs the
app-runner capability's own delta.

## Risks / Trade-offs

- **Presentation metadata stays inert longer than expected** → The gap is specced, not hidden, and
  the raw JSON view keeps every value enterable meanwhile. When the renderer gains `dial:meta`, this
  surface inherits it with no change; until then a schema author's layout simply does not show.
- **A file field edited as text lets an admin enter a path Core cannot resolve** → Validation checks
  that the value looks like a DIAL file reference, and Core rejects an unresolvable one on publish
  or share. A file picker is the renderer's to add.
- **A locale map reaching a read-only field confuses an admin** → It renders the default-locale value
  with an explicit read-only state rather than an empty or object-looking field, and the spec requires
  the map to survive. The alternative — a full authoring UI — is blocked by D4's missing endpoint.
- **Client validation diverges from Core's** → Our util enforces what the meta-schema declares
  (required, types, enums, localized default locale, file references), not everything a JSON-Schema
  validator checks. For user-bucket resources Core still answers `400`, and that message is surfaced;
  for platform-bucket ones a schema can still contain a constraint we do not check, which is why the
  detail views keep surfacing Core's own `invalid` status where they already do.
- **Four surfaces, one mechanism, four chances to wire it differently** → Each surface's delta requires
  the same placement, and the tasks add the tab through one shared component rather than per-surface
  markup.

## Open Questions

Deliberately parked, not resolved here — recorded so the observation is not lost.

The app-runner meta-schema declares `dial:meta` with `required: ["dial:propertyOrder",
"dial:propertyKind"]`, while the grid's `Order` and `Property kind` columns write either key
independently. Setting only one therefore produces a schema that violates the meta-schema, which
Core rejects when it assembles the merged configuration. The owner of the fix depends on a decision
that has not been made: if Core's meta-schemas are revised (see D3 on the deprecated `dial:file`),
the required pair may not survive the revision, and a fix written now would be undone. Left
untouched by an explicit call; revisit once the Core-versus-renderer question above is settled.

The catalog meta-schema has no such constraint — its `dial:meta` keys are all optional — so nothing
this change builds is affected.
