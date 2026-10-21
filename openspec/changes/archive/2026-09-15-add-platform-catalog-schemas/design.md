## Context

See `proposal.md` — Why. The relevant current state:

DIAL Core's `CATALOG_SCHEMA` resource type (`catalog_schemas`, platform bucket only, shipped in
`0.47.1`) is written and read exactly like `APP_TYPE_SCHEMA`: `ConfigResourceController` builds its
write spec with a null entity class, so the request body is stored verbatim; on read the controller
injects `name` and a `status` of `valid`; on write it requires a non-blank `$id`, rejects a create
whose `$id` is already registered, and rejects an update that changes it. The merged-config map is
keyed by `$id`, not by the blob name, so the blob may be stored under any Core-legal name.

Three read-only routes exist beyond the resource itself: the meta-schema, a single schema by `$id`,
and a filtered list of `$id` + entity type + display name drawn from the merged config. A
config-file-sourced half is also exposed. This change uses none of them (see D4, D8, D10).

Unlike an app runner, a catalog schema declares no external schema endpoint — `CatalogSchemaService`
is explicit that catalog schemas are "always fully self-contained in config (no runner-hosted
schema-endpoint download/merge)" and that there is no server/client property split, since every
catalog field is public display data.

The admin console already has seven flat, Core-direct platform entities following one shape, most
recently `platform-translators`. One of them, App Runners, is the closest analogue: same verbatim
storage, same `$id`-as-name identity, same absence of write-time validation.

## Goals / Non-Goals

**Goals:**

- Register `CATALOG_SCHEMA` in the Core asset client the same way the seven existing platform types
  are registered, so the shared asset list, folder tree, and detail shell work unmodified.
- Keep the surface Core-direct: no admin-backend dependency for any operation.
- Make the schema grid lossless for the `dial`-prefixed extensions it does not render, which is a
  correctness fix for App Runners as much as a prerequisite here.

**Non-Goals:**

- A catalog renderer. This change edits the schema, not anything that reads it.
- Reading Core's `catalog_schemas/schemas` list route, its `schema?id=` route, or its meta-schema
  route (D4, D8).
- Any change to how the seven existing platform entities are listed, saved, or validated, beyond the
  shared-grid round-trip fix.

## Decisions

### D1. Follow the flat-platform-entity shape verbatim, entity-specific parts only

The eighth instance of an established pattern is not the place to reconsider it. `List.tsx` is a
`BaseAssetList` wrapper; `View.tsx` owns etag/discard/save/JSON-editor wiring; `TabsContent.tsx`
switches on `EntityViewTab`; the per-view maps in `BaseAssetList/utils.tsx`, `Assets/utils.ts`,
`Assets/Modals/utils.tsx`, and `EntityView/Modals/Delete/utils.ts` get one entry each. Only
`Properties.tsx`, `CreateProperties.tsx`, `Parameters.tsx`, and the validation util are new logic.

Rejected: a bespoke list/detail pair. It would duplicate folder-context, selection, bulk-delete and
breadcrumb wiring that the shared list already provides, and diverge from it on the first fix.

### D2. Extract the `$id`-to-resource-name helpers instead of importing them from `app-runners`

`toCoreRunnerName`, `fromCoreRunnerName`, `hasUnencodableRunnerIdChars`, and
`CORE_UNENCODABLE_ID_CHARS` encode a DIAL Core rule about schema-resource names: a JSON-Schema `$id`
is a URI, its separators fail Core's entity-name pattern once the route boundary has decoded the
path, and six characters `encodeURIComponent` leaves unescaped have no representable Core name at
all. That rule is not specific to runners. Move them to a neutral location (e.g.
`utils/core-schemas/`) with names that say what they operate on, and re-point the app-runner
imports.

Rejected: importing from `utils/app-runners/` — it would assert a dependency of catalog schemas on
app runners that does not exist, and the next reader would look for the runner-specific reason.
Also rejected: a second copy — the two must stay identical, since both types share one Core rule.

### D3. Fix and extend the shared `SchemaGrid`; do not fork it

`SchemaGrid` reconstructs each property from a fixed field set on save. Two consequences, both
verified in its `utils.ts`: `format` and `dial:file` are never read and never written, so they
disappear from any property the grid saves; and `dial:meta` is read and written only when
`parentId === null`, so nested per-property metadata disappears too.

For catalog schemas, `dial:file` is a first-class feature — Core's `CatalogFileKeyword` collects
file-valued catalog properties for copy-on-publish/share, so dropping the declaration breaks file
copying. For App Runners it is the same loss today, from the same definition: the catalog
meta-schema's file/format block is annotated in Core as "Reused verbatim from
application_type_schemas". So the fix belongs in the shared component, and it fixes both callers.

The new columns follow the component's existing extension mechanism: `Order` and `Property kind`
are already appended only when their `onChange` callback is supplied. Catalog schemas supply
callbacks for tab, section, order, widget, and localized, and deliberately do **not** supply
`onChangePropertyKind` — catalog schemas have no server/client split. No `isCatalog` flag, no
branching on entity type inside the component.

Column kinds follow the meta-schema, not intuition: tab and section are free strings, order is a
number, widget is a select over the eight allowed values, localized is a boolean.

Round-trip and authoring are separated on purpose: preservation applies at every nesting depth,
while the editable columns stay first-level-only, matching where the meta-schema's presentation
hints are meaningful and where the existing `Order` column already sits. Preserve everywhere,
author at the top level.

Rejected: a separate `CatalogSchemaGrid`. It would duplicate the flatten/rebuild tree logic — the
exact code carrying the round-trip bug — leaving two copies to fix and App Runners still lossy.
Rejected: read-only Parameters with JSON-only editing. It sidesteps the data loss rather than
fixing it, and leaves the shared bug in place for App Runners.

This is a deliberate exception to "use, don't edit, shared components": the change is a correctness
fix plus an extension through the component's own existing mechanism, not a new prop shaped for one
caller. Both existing callers — App Runners and Interceptors — need regression coverage (D-risk 1).

### D4. No resolved-schema client

`AppRunnerSchemaApi` exists because Core performs an external download and merge for app runners.
Catalog schemas have no endpoint field, so `v1/catalog_schemas/schema?id=` returns what the resource
read already returned. Adding a client for it would buy a second, slower path to identical data and a
second failure mode to handle. The Parameters tab therefore reads the loaded resource and is always
editable — no read-only mode, no resolve-error state.

The meta-schema route is likewise unused: its content is a fixed document, and the constraints this
surface enforces are written out in `validateCatalogSchema` (D5), where they can produce
field-specific messages instead of raw JSON-Schema violations.

### D5. Client-side validation as a standalone util, gating both editors

Core validates only the `$id`. Everything else it accepts and its config loader then rejects —
`@ConformToCatalogMetaSchema` validates the whole schema map, so a malformed schema is a problem for
the configuration, not just for its own row. A pure `validateCatalogSchema(schema)` returning
`{ field, message }[]` mirrors `validateAppRunner`, keeps the rules unit-testable without a DOM, and
can gate the raw JSON editor — which hands the save path arbitrary parsed JSON and is otherwise
ungated. Every field is shape-checked before use, so a wrong type surfaces as a validation message
rather than a thrown `TypeError` that leaves the save button inert.

### D6. Strip both Core-injected and client-side fields before writing

Core stores the body verbatim, so anything sent persists — including the `name` and `status` Core
itself injected on the read that populated the form, which would then break meta-schema conformance.
`toCatalogSchemaPayload` drops `name`, `status`, `validationWarnings`, `path`, `folderId`, `author`,
and the timestamps, following `toRunnerPayload`.

### D7. No duplicate action

Duplicating a catalog schema would produce a second resource with the same `$id`, which Core rejects
with a conflict; a duplicate that must be renamed before it can be saved is not a duplicate. No
entry in any duplicate-action map — the same call `platform-translators` made.

### D8. Metadata-only list columns

Core's `catalog_schemas/schemas` route would supply display name and entity type for every row in
one request, without per-row content reads. It is still not used: it reads from the merged config
rather than from resource metadata, so the list would mix two sources that can disagree — a schema
written moments ago but not yet merged, or a config-file-sourced schema with no metadata row — and
the reconciliation rules for that disagreement are a design surface this change does not need. The
list shows `$id`, author, created-at, updated-at, exactly as App Runners does.

### D9. Entity type and widget as TypeScript enums

Per `code-standards.md`, fixed string-value sets are enums, not string-literal unions:
`CatalogEntityType` (five values) and `CatalogPropertyWidget` (eight). Both are runtime-usable as
select option sources and as the validation util's membership check.

### D10. Config-file half stays out, and its stale comment gets corrected

`READABLE_CONFIG_FILE_TYPES` and `CONFIG_FILE_ENTITY_VIEWS` are untouched. The comment in
`constants/config-file-core.ts` currently justifies excluding `CatalogSchemas` on the grounds that it
has "no admin-console surface of its own" — which this change makes false. It must be rewritten to
say the surface exists and the config-file half is deferred, or the next reader will take the
exclusion as settled.

## Risks / Trade-offs

- **The shared-grid change regresses App Runners or Interceptors** → The round-trip fix is
  behavior-visible for both, which is why it is specced as a modification to `platform-app-runners`
  rather than an implementation detail. Cover it with tests on both existing callers, not only on the
  new one: a schema carrying `format`/`dial:file`/nested metadata must come back byte-identical
  through an unrelated edit.
- **Preserving unknown keys could preserve something Core rejects** → Preservation is scoped to keys
  already present in the loaded schema. The grid never introduces a key it cannot edit, so a schema
  that was valid before an edit stays valid after it.
- **A schema saved valid can still be reported invalid by Core** → `validateCatalogSchema` enforces
  the meta-schema constraints this surface can violate, not everything a JSON-Schema validator
  checks. The detail view therefore also surfaces Core's `invalid` status and validation warnings
  rather than assuming a client-side pass means the resource is healthy.
- **A registered schema nothing consumes** → Accepted, and stated in the proposal's non-goals. This
  half is useless alone in the same way the consumer half would be impossible alone; the ordering is
  the only one available.
- **`$id` immutability is enforced only by Core** → The detail view renders `$id` read-only and the
  create form validates it, so the conflict path is reachable only through the raw JSON editor or a
  concurrent write. Core answers with a conflict and the surface shows that message verbatim.
