## Why

Copying an analytics table's definition from one environment to another needs a source and a target.
The target side now exists: a `PENDING`/`FAILED` table's detail view can be authored as one JSON
document. The source side does not. Once a table is `ACTIVE`, the console shows its definition only as
rendered UI — the columns grid, the keys panel, the status badge, the tag chips — and there is no way
to read the definition **as a document**. An operator who wants to stand the same table up on another
environment either re-types every column into the target's form, or leaves the console entirely and
issues `GET /v1/tables/{name}` from a REST client to get something pasteable. Both are worse than the
console being able to show what it already holds: `TableDetailView.tsx:133` computes
`buildDraftDocument(table, draft.baselineDto)` as `storedDocument` for **every** table, `ACTIVE`
included, and then never surfaces it on the materialized branch.

Reaching for a REST client is not only inconvenient, it produces the wrong text. A `GET` response is
the read shape, not the write shape: it carries members the write path rejects or reshapes, so the
copy has to be pruned by hand before it will paste. The console is the one place that already knows
the difference.

## What Changes

- **An `ACTIVE` table's detail view makes its definition readable as JSON, read-only.** The document
  is rendered through the shared `EntityJsonEditor`
  (`apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/JsonEditor.tsx`), which already takes a
  `readonly` prop and forces its Monaco instance read-only — no new prop on a shared component for
  this caller.
- **The document shown is the paste-ready shape, not the raw `GET` body.** It is
  `buildDraftDocument(table, schema)` (`Analytics/Tables/draft-document.ts`) — the kind-specific
  schema body (`columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column` for a
  source table; `columns`, `grain_key`, `cardinality` for an enrichment) plus `description` and
  `tag_order`. That is the identical shape a `PENDING` table's JSON editor seeds, which is what turns
  the copy into a round trip: read it here, paste it there, nothing to prune or reshape.

  Showing the raw `GET /v1/tables/{name}` body instead would add `status`, `system`, `permissions`,
  `column_count`, `name`, `type`, `source_table` and the nested `grain` object — members the paste
  transform (`splitDraftDocument`, same file) drops or unpacks anyway, most of which the page already
  states elsewhere (the status badge, the system chip, the kind tag, the columns grid), and the rest
  of which is environment-local and therefore noise in a comparison between two environments. The one
  genuine loss is an enrichment's `source_table`. That is acceptable: it is a create-time identity
  field, and the target environment supplies it on its own create screen either way — it is not part
  of what the draft editor accepts.
- **The document is taken to the clipboard in one action.** A copy control is offered with the
  document and puts the whole of it on the clipboard, confirming the copy in a way assistive
  technology announces. The feature exists so an operator can carry the definition to another
  environment; a read-only pane without it leaves the primary action as a click-drag selection over a
  document that scrolls, which is the interaction this change is meant to remove.
- **The view is ungated.** Anyone who can open the table's detail page can read it. It mutates
  nothing; **Connect**, the other non-mutating affordance in the same header, is already shown
  regardless of permission; and system tables — which report `permissions {write: false,
  modify: false}` to everyone — are exactly the tables an operator most often wants to copy. Gating
  the read on a write permission would withhold it precisely where it is most useful.
- **Read-only is observable, not merely intended.** Typing or pasting into the view leaves the content
  unchanged; no Save, no Discard and no changed-entity header appear in any state a reader can reach;
  and no `updateTable` and no `defineTableSchema` request is ever issued from this view. The last of
  those is the one that fails if someone later wires a save path through this surface, which is why it
  is stated as behaviour rather than as intent.
- **Where the view is reached from is deliberately left open.** A third tab beside Properties and
  Audit, or a toggle in the header, each satisfies the requirement below; it is written so that either
  does. The architect chooses — see Impact.
- **Nothing else on the `ACTIVE` branch moves.** Manage access, Delete table, Add columns, Add rows,
  Connect, the per-column edit/drop and inline-rename actions and `EditTableMetadataPopup` all behave
  exactly as they do today.

## Acceptance Scenarios

Stated here in the proposal's own words, as the behaviour a spec delta will formalize during the
specification phase.

### Requirement: A read-only JSON view of a materialized table

For an `ACTIVE` table, the detail view SHALL make the table's document reachable without leaving the
page, rendered read-only. The document SHALL be the same one a draft editor seeds — the schema body
for the table's kind plus `description` and `tag_order` — so that the source and the target of a
cross-environment copy present the identical shape. The view SHALL be reachable by any caller who can
open the table's detail page, since it performs no write; it SHALL offer no way to change the table;
and it SHALL leave the `ACTIVE` view's existing actions exactly as they are. This requirement does
**not** fix *where* on the screen the view is reached from — any placement that satisfies the
scenarios below is acceptable.

#### Scenario: The document is the paste-ready shape, not the GET response

- **WHEN** a reader reaches the JSON view of an `ACTIVE` source table
- **THEN** it shows `columns`, `ordering_key`, `partition_by`, `description` and `tag_order` — plus
  `identity_column` and `version_column` when the stored definition declares them — and none of
  `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested
  `grain` object
- **AND** on an `ACTIVE` enrichment table it shows `columns`, `grain_key`, `cardinality`, `description`
  and `tag_order`, and no source-only member

#### Scenario: The document pastes into another environment's draft with no editing

- **WHEN** the reader copies the document shown for an `ACTIVE` table and pastes it into the JSON
  editor of a `PENDING` table of the same kind on another environment
- **THEN** the pasted text is already the shape that editor seeds, so no member has to be removed,
  renamed or unpacked by hand before Save

#### Scenario: A caller with no write or modify permission still sees it

- **WHEN** the detail view of an `ACTIVE` table renders for a caller the table reports
  `permissions {write: false, modify: false}` for — which is every caller on a system table
- **THEN** the JSON view is reachable, on the same reasoning that already keeps **Connect** available
  to that caller
- **AND** no permission-gated action appears alongside it

#### Scenario: The view cannot be edited

- **WHEN** a caller with every permission reaches the JSON view of an `ACTIVE` table and types or
  pastes into it
- **THEN** the document's content is unchanged

#### Scenario: No save path exists from an ACTIVE table's JSON view

- **WHEN** the JSON view is shown on an `ACTIVE` table, in any state a reader can put it in
- **THEN** neither Save nor Discard is offered, the changed-entity header is never presented, and no
  `updateTable` and no `defineTableSchema` request is issued from this view

#### Scenario: The ACTIVE view's own actions are unaffected

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with every permission
- **THEN** Manage access, Delete table, Add columns, Add rows and Connect are all still offered, each
  behaving exactly as before, whether or not the JSON view is the surface on screen

### Requirement: The document is copyable to the clipboard in one action

Wherever the read-only view presents the document, a control SHALL be offered with it that places
that same document — the paste-ready shape of the requirement above, in full — on the clipboard, and
the result SHALL be confirmed by a `polite` live-region announcement kept separate from the control's
own accessible name (`.claude/rules/a11y.md`, "Status feedback for dynamic content"; a notification
container that is itself announced satisfies this). Like the requirement above, this one does **not**
fix where the control sits or by what mechanism the announcement is carried — only that the control
is offered with the document and that the outcome is observable.

#### Scenario: The copy control is offered wherever the document is

- **WHEN** a reader reaches the JSON view of an `ACTIVE` table, under any placement of that view
- **THEN** a control whose accessible name states that it copies is offered together with the document
- **AND** it is offered to every caller the view itself is offered to, including one the table reports
  `permissions {write: false, modify: false}` for

#### Scenario: Copying places the whole displayed document on the clipboard

- **WHEN** the reader activates that control
- **THEN** the clipboard holds the entire document the view displays — the paste-ready shape of the
  requirement above, complete, whatever part of it is scrolled into view and whatever the editor's own
  selection happens to be
- **AND** pasting it into a `PENDING` table's JSON editor of the same kind needs no member removed,
  renamed or unpacked, exactly as when the text is taken by hand

#### Scenario: The copy is announced to assistive technology

- **WHEN** the copy succeeds
- **THEN** a confirmation is announced politely through a live region distinct from the control's own
  accessible name, which is unchanged by the copy
- **AND** the reader is not required to see a transient visual cue to know the copy happened

## Capabilities

### Modified Capabilities

- `analytics/tables`:
  - **"Table detail gates edits by per-table permissions"** (`openspec/specs/analytics/tables/spec.md:215`)
    — the read-only view is a non-mutating affordance on an `ACTIVE` table that is deliberately **not**
    permission-gated, on the same reasoning that requirement already applies to **Connect** ("shown
    regardless of permission"). If the chosen placement is a header control, that requirement's fixed
    header-action order gains an entry.
  - The requirement above, "A read-only JSON view of a materialized table", is **added** to the same
    capability.
  - So is "The document is copyable to the clipboard in one action", which has no meaning apart from
    that view and travels with it.

### New Capabilities

None — this extends the table detail surface `analytics/tables` already specifies.

## Impact

**Code** (read, not designed here — component shape and file layout are SA's):

- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` — the `isActive` branch is
  where the view lands. **The document already exists in the component**: `storedDocument`
  (`TableDetailView.tsx:133`) is `buildDraftDocument(table, draft.baselineDto)` and is computed for
  every table today, `ACTIVE` included, so the view needs no new derivation. **Unconfirmed and for SA
  to confirm**: whether `useDraftSchemaForm`'s baseline is faithful for a *materialized* table — in
  particular that each column's `display_name`, `description`, `sensitive` and tag survive into it,
  and what a column renamed after materialization contributes (the exposed name is what a fresh
  definition in the target environment wants; the physical source name is target-local).
- `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts` — `buildDraftDocument` and
  `splitDraftDocument` are the existing shape contract; no backend contract changes, no new request.
- `apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/JsonEditor.tsx:138` — `EntityJsonEditor`
  already takes `readonly` and forces the Monaco instance read-only, so no shared component gains a
  prop for this caller.
- `apps/ai-dial-admin/src/components/Common/CopyButton/CopyButton.tsx` — the shared copy control this
  console already uses: it writes with `navigator.clipboard.writeText`, takes its accessible name from
  `valueLabel`, and raises the confirmation through `NotificationContext`
  (`getCopyToClipboardNotification`). The copy requirement therefore adds **no new file and no new
  dependency** — it reuses this component as it stands. What SA does have to confirm is the a11y half:
  that the notification container is itself announced, which is what `.claude/rules/a11y.md` requires
  of any result surfaced only through `NotificationContext`.

**Placement — open, and the architect's call.** An `ACTIVE` table renders a Properties/Audit tab strip
when analytics is enabled (`TableDetailView.tsx:487-500`), while the draft screen instead swaps its
whole body from a header `JsonToggle` (`TableDetailView.tsx:449-471`). Both satisfy the requirements
above, and so does either placement of the copy control that travels with the document. Two
consequences differ by placement, and each is a finding, not a decision:

- **Header placement** touches the consolidated spec's fixed header-action order
  (`openspec/specs/analytics/tables/spec.md:225`, and its scenario at `:271`), which would gain an
  entry.
- **Tab placement** inherits the `featureFlags.analyticsEnabled` gate at `TableDetailView.tsx:487`. A
  Tables page is itself analytics-gated, so this is probably moot — SA should confirm rather than
  inherit the gate by accident.

**Sequencing against `add-table-draft-schema-json-editor` — a finding for the architect, not solved
here.** Two requirements in *that* change's delta
(`openspec/changes/add-table-draft-schema-json-editor/specs/analytics/tables/spec.md`) contradict this
one:

- `### Requirement: JSON editor for a table draft` states "The toggle SHALL NOT be offered on an
  `ACTIVE` table" — false under **either** placement once an `ACTIVE` table has a JSON surface; the
  sentence needs to distinguish the authoring toggle from the read-only view rather than forbid both.
- `#### Scenario: An ACTIVE table's header is untouched` — still true under tab placement, false under
  header placement.

Neither of those requirements is in `openspec/specs/analytics/tables/spec.md` yet. They arrive there
only when PR #4492 merges and that change is archived. **This change's delta therefore cannot modify a
requirement that does not exist in the consolidated spec**, and the ordering — whether this change
waits for that archive, or its delta is written against the consolidated spec and the collision
reconciled at archive time — is the architect's problem to solve. Nothing in this change may be
written into `add-table-draft-schema-json-editor`: that change is finished and its PR carries an
approval a further push would dismiss.

**Spec** — the requirements above go into `openspec/specs/analytics/tables/spec.md` via this change's
delta; no other capability's spec is touched.

## Non-goals

- **Any editing of an `ACTIVE` table.** This puts a **read-only** view on a materialized table and
  nothing more. Out of scope: any write issued from it — no Save, no Discard, no changed-entity
  header — and any full-object write for an `ACTIVE` table, which the service does not offer anyway
  (it has only the scoped `PATCH /v1/tables/{name}/schema` add/drop/rename/update). Also out of scope:
  any change to **Add columns**, **Add rows** or **Connect**, to the per-column edit/drop and
  inline-rename actions, or to `EditTableMetadataPopup` — every existing `ACTIVE` editing surface
  behaves exactly as it does today.
- **The draft/failed branch.** The JSON editor on a `PENDING`/`FAILED` table is
  `add-table-draft-schema-json-editor`'s subject and is untouched here.
- **Comparing two environments' documents in the console.** This view makes the copy possible;
  diffing, syncing or promoting a table between environments is a different feature.
- **Bulk export of multiple tables.** Single table, single document.
- **Restoring the members the paste-ready shape omits.** `source_table` in particular is not carried;
  the target environment's create screen asks for it. Adding it back would mean showing the read shape,
  which is the thing this change deliberately does not do.
