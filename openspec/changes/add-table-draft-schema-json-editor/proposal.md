## Why

`apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`'s `!isActive` branch
(`PENDING`/`FAILED`) renders `DraftSchemaEditor`, which builds `DraftSchemaDto` one column, one key,
one option at a time (`use-draft-schema-form.ts`). Copying a table's schema from another environment
today means re-typing every column by hand instead of pasting the object the source environment's
`GET` already returned. Worse, `tag_order` cannot be set on a draft at all: the only place it is
editable is `EditTableMetadataPopup`, opened from the tables catalog list's row action menu, and it
builds its reorder list from `distinctTags(table)` — the tags on the table's **existing** columns
(`EditTableMetadataPopup.tsx:20-27`). A draft has no columns yet, so that popup has nothing to offer
one; a table's tag grouping can only be authored today by materializing it first, then reordering tags
that already exist.

This applies, a third time, a pattern already shipped twice in this codebase for the same reason: the
evaluator detail page (`openspec/changes/archive/2026-08-31-add-evaluator-json-editor/`) and the
enrichment-rule detail page (`openspec/changes/archive/2026-09-04-add-enrichment-rule-json-editor/`)
each gained a JSON editor toggle beside their column-by-column form, backed by `EntityJsonEditor` and
`SaveValidationContextProvider`, because both entities have a document larger than what the form asks
for one field at a time. The table draft is the same shape of problem: `DraftSchemaDto` plus
`description` and `tag_order` is the whole document a draft can carry, and today's form only ever
builds part of it.

## What Changes

- The table detail view's draft/failed screen (`!isActive` branch of `TableDetailView.tsx`) gains a
  JSON editor toggle alongside `DraftSchemaEditor`, editing one shared draft that both surfaces submit
  through the same `Save` action already in the header. Following the precedent both prior JSON
  editors set, the editor and the column form are **mutually exclusive** — opening the editor takes
  over the screen, and the column form is not shown or edited alongside it. **No change on an
  `ACTIVE` table** — that branch, and its scoped schema-patch surface, are untouched.
- **The document's shape.** The JSON document is `DraftSchemaDto` (`DraftSourceSchemaDto` for a source
  table — `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`; or
  `DraftEnrichmentSchemaDto` for an enrichment — `columns`, `grain_key`, `cardinality`) plus
  `description` and `tag_order`, which neither existing DTO carries today. It is seeded **once** from
  the current draft-form state (`use-draft-schema-form.ts`'s `buildDto()`, extended with the table's
  current `description` and `tag_order`) — not re-seeded on every render, the same rule the two prior
  JSON editors followed, because re-seeding recreates Monaco's model on every keystroke.
- **Pasting a foreign `GET` response is the point.** An admin who copies the JSON `GET /v1/tables/{name}`
  returned on another environment and pastes it here gets a working document with no manual editing,
  because the client:
  - drops the fields the service does not accept on write and that a `GET` response carries: `status`,
    `system`, `permissions`, `column_count`, `name`, `type`, `source_table`;
  - unpacks the nested `grain: { grain_key, cardinality }` (`AnalyticsTableGrain`, `table.ts`) into the
    two flat fields `grain_key` and `cardinality` that `DraftEnrichmentSchemaDto` already uses;
  - passes every other member through untouched, including one the console does not otherwise
    understand.
- **While the editor is open, the form's own completeness checks stop gating Save.** Today `Save` is
  disabled by `draft.canMaterialize` — the column-by-column form's own rules (a non-empty ordering key,
  a complete-or-absent scan-metadata pair, a non-empty grain key, no invalid column row). In editor
  mode those rules do not apply; the only client-side gate is that the document parses (Monaco's error
  markers), matching the rule this codebase's two prior JSON editors already established — an
  incomplete or otherwise-rejectable document is a service rejection, not a client-side block.
- **Save sends two requests, in order:**
  1. `PUT /v1/tables/{name}` (`updateTable`, `UpdateTableDto` — `description`, `tag_order`; merge-patch
     semantics already documented on that type).
  2. `POST /v1/tables/{name}/schema` (`defineTableSchema`) — the schema, which materializes the table.

  If the `PUT` fails, the `POST` is not sent and the table's state is unchanged. If the `POST` fails,
  the table stays `PENDING`/`FAILED` (as it already does today on a schema failure) and a retried `PUT`
  is harmless, since it is a merge-patch. This holds for **every** Save on this screen, not only when
  the JSON editor was opened — the two DTOs share the one draft, so `description`/`tag_order` round-trip
  through even for an author who never opens the editor and only uses the column form.
- **No new client-side content validation.** The service parses request bodies strictly and rejects an
  unknown property one at a time (`FAIL_ON_UNKNOWN_PROPERTIES`, already confirmed against the backend —
  not re-verified here); its errors are shown as-is, exactly as the prior two JSON editors do.

## Acceptance Scenarios

Stated here in the proposal's own words, as the behaviour a spec delta will formalize during the
specification phase. Grouped by the concerns the task named.

### Requirement: The draft JSON document

For a `PENDING`/`FAILED` table, the detail view SHALL offer a JSON editor whose document is the
table's `DraftSchemaDto` (kind-specific: source or enrichment) plus `description` and `tag_order`,
seeded once from the current draft-form state rather than on every render.

#### Scenario: A source table's document carries the source shape

- **WHEN** the JSON editor opens for a source table's draft
- **THEN** the document carries `columns`, `ordering_key`, `partition_by`, `identity_column`,
  `version_column`, `description`, and `tag_order`

#### Scenario: An enrichment table's document carries the enrichment shape

- **WHEN** the JSON editor opens for an enrichment table's draft
- **THEN** the document carries `columns`, `grain_key`, `cardinality`, `description`, and `tag_order`,
  and no source-only member (`ordering_key`, `partition_by`, `identity_column`, `version_column`)

#### Scenario: The document is seeded once, not on every render

- **WHEN** the user edits the JSON document and the surrounding view re-renders (e.g. from an
  unrelated state change)
- **THEN** the editor's content is not overwritten by a fresh seed, and the user's in-progress edit
  survives the re-render

### Requirement: Pasting a foreign table's GET response

Pasting the JSON body of `GET /v1/tables/{name}` copied from another environment's table SHALL yield
a document usable as-is for Save on this table, after the client removes the members the service does
not accept on write and reshapes the one member whose write shape differs from its read shape.

#### Scenario: Read-only and identity fields are dropped

- **WHEN** the user pastes a `GET` response containing `status`, `system`, `permissions`,
  `column_count`, `name`, `type`, and `source_table`
- **THEN** none of those seven fields is present in the document the editor holds afterward

#### Scenario: A nested grain object is unpacked into flat fields

- **WHEN** the pasted response is an enrichment table's and carries `grain: { grain_key: "x",
  cardinality: "zero_or_one" }`
- **THEN** the document holds `grain_key: "x"` and `cardinality: "zero_or_one"` as top-level fields,
  and no `grain` object

#### Scenario: Unrecognized members pass through untouched

- **WHEN** the pasted response contains a member the console does not otherwise read or write
- **THEN** that member remains in the document exactly as pasted, and is included in the schema
  request Save sends

### Requirement: Editor mode's Save gate

While the JSON editor is open, Save SHALL be gated only on the document parsing as valid JSON. The
column form's own completeness rules (ordering key present, scan-metadata pair complete-or-absent,
grain key present, no invalid column row) SHALL NOT gate Save in this mode; a document that is valid
JSON but incomplete or otherwise invalid by those rules SHALL be sent, and the service's rejection is
what surfaces.

#### Scenario: Invalid JSON blocks Save

- **WHEN** the document does not parse as valid JSON (a Monaco marker is present)
- **THEN** Save is not available, independent of anything the service would otherwise accept

#### Scenario: A parseable but incomplete document is not blocked client-side

- **WHEN** the editor is open and the document parses as valid JSON but omits a member the column
  form would have required (e.g. a source draft with no `ordering_key`)
- **THEN** Save is available, and the resulting rejection (if any) comes from the service, not from a
  client-side completeness check

### Requirement: Save order and failure handling

Save SHALL send the metadata update before the schema, and SHALL send the schema only if the metadata
update succeeded.

#### Scenario: A successful save sends both requests in order

- **WHEN** the user saves a complete draft and both requests succeed
- **THEN** `PUT /v1/tables/{name}` is sent before `POST /v1/tables/{name}/schema`, and the table
  becomes `ACTIVE`

#### Scenario: A failed metadata update blocks the schema request

- **WHEN** `PUT /v1/tables/{name}` fails
- **THEN** `POST /v1/tables/{name}/schema` is not sent, the table's status is unchanged, and the
  service's error is shown as-is

#### Scenario: A failed schema request leaves the table pending for a safe retry

- **WHEN** `PUT /v1/tables/{name}` succeeds but `POST /v1/tables/{name}/schema` fails
- **THEN** the table remains `PENDING`/`FAILED`, the service's error is shown as-is, and the user can
  correct the document and save again — the repeated `PUT` (merge-patch, same values or corrected
  ones) causes no harm

#### Scenario: No client-side validation of the pasted content

- **WHEN** the document parses as valid JSON but its content would be rejected by the service (an
  unknown property, a missing required field, an invalid value)
- **THEN** the client performs no validation of that content before sending; the service's rejection
  is what surfaces, shown as-is

## Capabilities

### Modified Capabilities

- `analytics/tables`:
  - **"Define and materialize a table schema"** — Save today sends the whole document via a single
    `defineTableSchema` call gated on `draft.canMaterialize`; this changes it to the two-request
    sequence above, adds the JSON editor as an alternative way to author the same document the column
    form builds, and — while the editor is open — replaces the `canMaterialize` gate with Monaco's own
    parse-error gate.
  - **"Table metadata editing (description and tag order)"** — today states this surface "SHALL NOT be
    offered from the table detail view." This change carves out an explicit exception: on a
    `PENDING`/`FAILED` table, Save now also submits `description`/`tag_order` via the same `PUT` this
    requirement already names, seeded from the draft state rather than from the catalog popup. The
    catalog's `EditTableMetadataPopup` is unchanged and remains the only surface for an `ACTIVE` table.

### New Capabilities

None — this extends the draft-authoring surface `analytics/tables` already specifies.

## Impact

**Code** (read, not designed here — component shape and file layout are SA's):

- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` — the `!isActive` branch and
  `onSubmitDefineSchema` are where the second request and the editor toggle land.
- `apps/ai-dial-admin/src/components/Analytics/Tables/DraftSchemaEditor.tsx` and
  `use-draft-schema-form.ts` — the shared draft the JSON document must seed from and stay consistent
  with under the same "one draft, one submit path" rule the enrichment-rule change established.
- `apps/ai-dial-admin/src/models/analytics/table.ts` — `DraftSchemaDto`, `UpdateTableDto`,
  `AnalyticsTableGrain` are the existing types the document composes; no backend contract changes.
- `apps/ai-dial-admin/src/app/[lang]/tables/[id]/page.tsx` — currently has no
  `SaveValidationContextProvider`; `EntityJsonEditor` calls `useJsonEditorValidation()`
  unconditionally (confirmed in the enrichment-rule proposal), so the page needs the provider added.
- `EditTableMetadataPopup.tsx` and the tables catalog's row action menu are **not** touched — they
  keep serving `ACTIVE` (and any status, per the existing requirement) tables exactly as today.
- No shared component gains a new prop for this caller alone: `EntityJsonEditor` and
  `SaveValidationContextProvider` are reused as-is, following the same adoption the evaluator and rule
  changes made.

**Spec** — the two requirement changes above go into `openspec/specs/analytics/tables/spec.md` via
this change's delta; no other capability's spec is touched.

## Non-goals

- **The create-table screen.** Create stays identity-only (name, type, optional description /
  source table) — no JSON editor there. Explicitly deferred by the task as needing its own design.
- **Bulk import of multiple tables.** Also explicitly deferred; this is a single-table, single-draft
  editor.
- **Any change to an `ACTIVE` table.** An active table has no full-object write — only the scoped
  `PATCH /v1/tables/{name}/schema` add/drop/rename/update patches it already has. Nothing here adds a
  JSON editor, or any new write path, to that branch.
- **Ordering or content correctness of what is pasted.** Whether `source` columns are declared before
  `enrichment` columns that reference them, and whether the pasted document is otherwise sound, is the
  author's responsibility — the client filters and reshapes the fields named above and nothing else.
- **Guarding the `tag_order`/`description` carry-through with a confirmation or diff.** Consistent with
  the enrichment-rule editor's precedent: the document is the request, and the console presents it as
  such without a second confirmation layer.
