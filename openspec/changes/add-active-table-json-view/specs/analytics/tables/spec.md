## ADDED Requirements

### Requirement: An ACTIVE table's definition is readable as JSON

For a table whose `status` is `ACTIVE`, the table detail view SHALL offer among the header's actions the **same JSON-editor toggle a draft offers**, and activating it SHALL replace the view's whole body — the Properties/Audit tab strip included — with the table's stored definition rendered as a JSON document, **read-only**. The only difference from the draft's arrangement SHALL be that nothing inside the document can be changed. Toggling the control off SHALL restore the body as it was, on the tab the reader had selected; the toggle SHALL stay in the header while the document is shown, so the way back is visible at all times and no other surface of the page is reachable behind it.

The document SHALL be the **paste-ready write shape**, not the `GET /v1/tables/{name}` read body: the schema body for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, and `identity_column`/`version_column` when the stored definition declares them; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the catalog metadata `description` and `tag_order`. It SHALL carry none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object. It SHALL be the identical document a `PENDING`/`FAILED` table's JSON editor seeds ("JSON editor for a table draft"), so a definition read here pastes into that editor on another environment with no member removed, renamed or unpacked. Each declared column SHALL carry the metadata the stored definition holds for it — its physical `source_name`, its exposed `name`, `type`, `nullable`, and `element_type`, `enum_values`, `tag`, `display_name`, `description` and `sensitive` where they are set — so that a column renamed after materialization contributes both names and the target environment reproduces the rename rather than losing it.

The toggle SHALL be offered on every `ACTIVE` table to every caller who can open its detail page:

- whatever the table reports for `permissions.write` and `permissions.modify` — including a system table, which reports `{write: false, modify: false}` to everyone — on the same reasoning that already keeps **Connect** free of a permission gate ("Table detail gates edits by per-table permissions"); and
- whatever `ANALYTICS_ENABLED` reports: with analytics disabled the detail view renders the Properties content as the whole body and no tab strip, and the toggle SHALL swap that body for the document just the same.

The JSON view SHALL offer no way to change the table. Its editor SHALL reject typing and pasting; no **Save**, no **Discard** and no changed-entity header SHALL be presented in any state a reader can reach from it; and no table write SHALL be issued from it — neither `updateTable` (`PUT /v1/tables/{name}`) nor `defineTableSchema` (`POST /v1/tables/{name}/schema`) nor `updateTableSchema` (`PATCH /v1/tables/{name}/schema`). Because the view is read-only there are no form fields to validate and no request to report on, so it raises no success or error notification of its own; the only notification it can produce is the copy confirmation specified in "The displayed definition is copyable in one action".

A save that materializes a draft **from its JSON editor** SHALL leave the reader on the live column surface of the now-`ACTIVE` table, not on the read-only JSON view: after a successful `defineTableSchema` the toggle SHALL be off, so that "Define and materialize a table schema" — "the view SHALL refresh showing the table `ACTIVE` with its live column surface" — keeps holding now that the same control has a meaning on an `ACTIVE` table.

Every existing affordance of the `ACTIVE` detail view — Manage access, Delete table, Add columns, Add rows, Connect, the per-column edit/drop and inline-rename actions — SHALL behave exactly as before. The JSON-editor toggle SHALL be the **last** control of the header row, after the primary **Connect** (see "Table detail gates edits by per-table permissions"). It is a view switch rather than an action on the table, and it is the one control that persists across the swap and that the reader returns to, so it sits at the end of the row where the actions stop. **Connect** remains the header's only primary action; it is no longer the header's last control. That is the same slot the toggle occupies on a draft, where it is also the row's last control.

#### Scenario: The JSON-editor toggle is offered in an ACTIVE table's header

- **WHEN** the detail view of an `ACTIVE` table renders
- **THEN** the header offers the same JSON-editor toggle a draft's header offers, as the last control of the row, after **Connect**
- **AND** activating it shows the table's stored definition as a read-only JSON document

#### Scenario: Opening the JSON view replaces the whole body

- **WHEN** a reader activates the toggle on an `ACTIVE` table whose body is showing the Properties/Audit tab strip
- **THEN** the document takes over the body, the tab strip is no longer rendered, and neither the columns grid nor the Audit tab's content is on screen
- **AND** the toggle is still in the header, showing that the JSON view is the active surface

#### Scenario: Closing the JSON view restores the tab the reader was on

- **WHEN** a reader on the **Audit** tab of an `ACTIVE` table opens the JSON view and then toggles it off
- **THEN** the tab strip is rendered again with **Audit** still selected and its content shown
- **AND** the same holds for the **Properties** tab

#### Scenario: A source table's document is the write shape, not the GET response

- **WHEN** a reader opens the JSON view on an `ACTIVE` source table whose stored definition declares columns, an ordering key, a partition and a scan-metadata pair
- **THEN** the document shows `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`, `description` and `tag_order`
- **AND** it shows none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object
- **AND** on a source table whose scan-metadata pair is unset, neither `identity_column` nor `version_column` is present

#### Scenario: An enrichment table's document carries its enrichment members

- **WHEN** a reader opens the JSON view on an `ACTIVE` enrichment table
- **THEN** the document shows `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it shows no source-only member — no `ordering_key`, no `partition_by`, no `identity_column`, no `version_column` — and no `source_table`

#### Scenario: A column's stored metadata survives into the document

- **WHEN** a reader opens the JSON view on an `ACTIVE` table one of whose columns was renamed after materialization and carries a tag, a display name, a description and the sensitive flag
- **THEN** that column appears with both its physical `source_name` and its exposed `name`, and with its `tag`, `display_name`, `description` and `sensitive` as stored
- **AND** a member the stored definition does not set is absent from that column rather than present and empty

#### Scenario: The document is the shape a draft editor seeds

- **WHEN** the document shown for an `ACTIVE` table is compared with the document a `PENDING` table of the same kind seeds its JSON editor with
- **THEN** the two are built from the same shape, so the text read here needs no member removed, renamed or unpacked before it is saved from that editor

#### Scenario: A caller with no write or modify permission still sees it

- **WHEN** the detail view of an `ACTIVE` table renders for a caller the table reports `permissions {write: false, modify: false}` for — which is every caller on a system table
- **THEN** the JSON-editor toggle is offered and opens the document
- **AND** no permission-gated action appears alongside it

#### Scenario: The JSON view is reachable with analytics disabled

- **WHEN** the detail view of an `ACTIVE` table renders with `ANALYTICS_ENABLED` off, so that no Properties/Audit tab strip is rendered and the Properties content is the whole body
- **THEN** the JSON-editor toggle is offered, and activating it replaces that body with the document

#### Scenario: The view cannot be edited

- **WHEN** a caller with every permission opens the JSON view of an `ACTIVE` table and types or pastes into the document
- **THEN** the document's content is unchanged

#### Scenario: No save path exists from an ACTIVE table's JSON view

- **WHEN** the JSON view is shown on an `ACTIVE` table, in any state a reader can put it in
- **THEN** neither Save nor Discard is offered, the changed-entity header is never presented, and no `updateTable`, `defineTableSchema` or `updateTableSchema` request is issued from it

#### Scenario: The ACTIVE view's own actions are unaffected

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with every permission
- **THEN** Manage access, Delete table, Add columns, Add rows and Connect are all still offered, each behaving exactly as before, whether the JSON view is on or off
- **AND** **Connect** is still the header's only primary action, though it is no longer the header's last control — the JSON-editor toggle follows it

#### Scenario: Materializing a draft from the JSON editor lands on the live column surface

- **WHEN** an author saves a `PENDING` table from its JSON editor and the schema request succeeds, so the refreshed table is `ACTIVE`
- **THEN** the body shows the live column surface of the now-`ACTIVE` table, not the read-only JSON view
- **AND** the toggle is off, so the reader turns it on again to read the definition as a document

#### Scenario: A not-yet-materialized table is untouched

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders
- **THEN** the toggle authors the draft exactly as before — it opens the editable JSON editor, not a read-only view — and the column-by-column schema-definition surface, the changed-entity header and the toggle's own `canModify` gate are all as before

### Requirement: The displayed definition is copyable in one action

While the read-only JSON view of an `ACTIVE` table is shown, a copy control SHALL be offered **in the header**, immediately before the JSON-editor toggle that opened the view, so it is reachable without scrolling the document and sits beside the control the reader just used. Its accessible name SHALL state that it copies and name the value it copies, and that name SHALL be unchanged by a copy. The control SHALL be shown **only while the document is** — it copies what is displayed, so it has no meaning when nothing is, and a permanent control in the header would offer to copy a document that is not on screen.

The read-only view itself SHALL carry no toolbar and no heading of its own: it is reached by a labelled toggle that names the surface, and the copy control travels with that toggle, so the whole body below the header is the document.

Activating the control SHALL place the **entire** document on the clipboard — the same text the read-only view displays, character for character including its indentation, whatever part of the document is scrolled into view and whatever the editor's own selection happens to be. The control SHALL be offered to every caller the view itself is offered to, including one the table reports `permissions {write: false, modify: false}` for.

A successful copy SHALL be confirmed by a notification raised through the console's notification container, which is itself a polite live region (`role="status"`, `aria-live="polite"`) distinct from the control's own accessible name, so the outcome is announced without the reader having to see a transient visual cue. The change SHALL introduce no new error path: a clipboard write the browser rejects is the shared copy control's existing behaviour and raises no notification.

#### Scenario: The copy control is offered with the document

- **WHEN** a reader opens the JSON view of an `ACTIVE` table
- **THEN** a control whose accessible name states that it copies the table's JSON definition is offered in the header, between **Connect** and the JSON-editor toggle
- **AND** it is offered to every caller the view is offered to, including one the table reports `permissions {write: false, modify: false}` for

#### Scenario: The copy control is absent while the JSON view is off

- **WHEN** the detail view of an `ACTIVE` table renders with the JSON view off, and again after a reader turns the view on and then off
- **THEN** no copy-definition control is present in the header in either case, and the JSON-editor toggle is still the header's last control
- **AND** on a `PENDING` or `FAILED` table no copy-definition control is present in any state, whether that table's own JSON editor is open or closed

#### Scenario: Copying places the whole displayed document on the clipboard

- **WHEN** the reader activates that control
- **THEN** the clipboard holds the entire document the view displays — the paste-ready shape, complete and identically formatted — whatever part of it is scrolled into view and whatever the editor's own selection is

#### Scenario: The copy is announced to assistive technology

- **WHEN** the copy succeeds
- **THEN** a confirmation naming the copied value is announced politely through the console's notification container, a live region distinct from the control's own accessible name
- **AND** the control's accessible name is unchanged by the copy

## MODIFIED Requirements

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Manage access** SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system).
- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown regardless of permission, as the header's primary action, for every `ACTIVE` **source** table and for every `ACTIVE` **enrichment** table whose payload names a source table (see "Table detail Connect panel").
- The **JSON-editor toggle** SHALL be shown on every `ACTIVE` table regardless of permission, because there it opens a read-only view of the stored definition and writes nothing (see "An ACTIVE table's definition is readable as JSON"); on a `PENDING`/`FAILED` table it SHALL be shown only when `canModify`, because there it authors the schema (see "JSON editor for a table draft"). It follows that an `ACTIVE` table always presents at least one header action, whatever the viewer's permissions are and whether or not Connect can be offered for it.
- **Add rows** SHALL NOT be offered for an **enrichment** table whatever its `write` permission reports: those rows come from the enrichment process, so a hand-written insert is not a path this UI offers.
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header controls SHALL be ordered **Manage access, Delete table, Add columns, Add rows, Connect, copy JSON definition, JSON-editor toggle** — the **JSON-editor toggle last**, after the primary **Connect**, with the copy-definition control immediately before the toggle and present only while the JSON view is on (see "The displayed definition is copyable in one action"). **Connect** remains the header's only primary action, and it remains the last **action**; it is no longer the last control, because the two controls that follow it act on the view rather than on the table. The rule that replaces "primary action last" is therefore: **actions on the table come before Connect, view controls after it**, so a later header addition has a rule to follow rather than a precedent to guess at. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema"; its own JSON-editor toggle is likewise the last control of its row, where no primary action precedes it.

Because the backend reports `permissions {false,false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Manage access** and **Delete table** are gated on `FULL_ADMIN`, which the backend does not scope per-table, so each carries its own explicit `!table.system` check. The JSON-editor toggle is deliberately outside that set on an `ACTIVE` table: it mutates nothing, and a system table is exactly the table whose definition an operator most often needs to read as a document.

#### Scenario: Write-capable, not modify-capable

- **WHEN** a table reports `permissions {write:true, modify:false}`
- **THEN** the header shows an **Add rows** button and no **Add columns** button, and the per-column action column and inline rename are absent

#### Scenario: Modify-capable, not write-capable

- **WHEN** a table reports `permissions {write:false, modify:true}`
- **THEN** the schema-edit affordances and per-column action column are present, and the header shows an **Add columns** button and no **Add rows** button

#### Scenario: Neither capability hides the Add dropdown entirely

- **WHEN** a table reports `permissions {write:false, modify:false}`
- **THEN** neither **Add columns** nor **Add rows** is rendered, and no **Add** dropdown is rendered in their place either

#### Scenario: Add actions keep a fixed emphasis

- **WHEN** a table reports both permissions, and separately when it reports only one
- **THEN** **Add columns** and **Add rows** each render as a neutral action whenever present, and neither is promoted to primary by the other's absence
- **AND** **Connect** is the only primary action in the header

#### Scenario: Delete stays admin-only

- **WHEN** a non-system table reports edit permissions but the user is not `FULL_ADMIN`
- **THEN** the "Delete table" button is absent

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the "Manage access" button is absent

#### Scenario: A system table still offers Connect

- **WHEN** a user opens an `ACTIVE` system table's detail page
- **THEN** **Connect** is present while **Add rows**, **Add columns**, **Manage access**, and **Delete table** are all absent
- **AND** the JSON-editor toggle is present, since it writes nothing

#### Scenario: An enrichment table offers Connect but never Add rows

- **WHEN** a user opens an `ACTIVE` enrichment table's detail page and its payload names a source table
- **THEN** **Connect** is present as the header's primary action
- **AND** no **Add rows** action is present, whatever the table's `write` permission reports

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the controls appear in the order Manage access, Delete table, Add columns, Add rows, Connect, JSON-editor toggle — the toggle last, after the primary Connect
- **AND** with the JSON view on, the copy-definition control appears between Connect and the toggle, leaving the toggle last

#### Scenario: A not-yet-active table shows Save in their place

- **WHEN** the detail header renders for a `PENDING` or `FAILED` table and the user has `canModify`
- **THEN** **Save** is shown, and none of **Connect**, **Add columns**, or **Add rows** is

### Requirement: JSON editor for a table draft

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the table detail view SHALL offer a JSON-editor toggle among the header's ordinary actions while the draft has no unsaved changes — once either surface has been edited the toggle is withdrawn with the header's other ordinary actions, as "A changed table draft's header offers Discard and Save" specifies — and the two authoring surfaces SHALL be mutually exclusive: while the editor is the active surface the column-by-column schema-definition surface SHALL NOT be rendered, and toggling the editor off SHALL restore it. The **authoring** editor specified here SHALL NOT be offered on an `ACTIVE` table, whose schema is patched through the scoped add/drop/rename/update surface instead; the same toggle on an `ACTIVE` table's header opens the **read-only** view specified in "An ACTIVE table's definition is readable as JSON", which authors nothing and submits nothing.

The edited document SHALL be the schema body the column form would submit for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the table's catalog metadata `description` and `tag_order`, which the column form presents no field for. A member the column form would omit (an unset partition, an unset scan-metadata pair) SHALL be absent from the seeded document rather than present and empty.

The document SHALL be seeded **once**, when the editor is first opened, from the current column-form state and the table's stored `description`/`tag_order`. It SHALL NOT be re-seeded thereafter — not on a re-render, and not on a later entry into the editor — so an in-progress document is never silently replaced. The single action that does re-seed it is **Discard**, specified in "A changed table draft's header offers Discard and Save"; nothing else replaces the author's document. After the first seed the two surfaces hold independent state: an edit to the document SHALL NOT change the column form, and an edit to the column form SHALL NOT change the document.

Two consequences of the toggle's withdrawal, stated because they bound what the two paragraphs above can be observed to mean. A later entry into the editor is reachable only from an **unchanged** draft — once either surface has been edited the toggle is gone — so seeding once and re-seeding from the stored state are indistinguishable on every reachable path, and the seed-once rule is a statement about the implementation rather than an observable one. For the same reason the two surfaces can never be visited in sequence after a change, so their independence is observable only in what a save from each surface submits: "Saving from the column form sends only the schema request" and "A successful save sends the metadata update before the schema" are what pin it.

While the editor is the active surface, the column form's own completeness rules (at least one valid column, a non-empty ordering key, a complete-or-absent scan-metadata pair, a non-empty grain key, no invalid column row) SHALL NOT gate Save. The only client-side gate SHALL be that the document parses as JSON, reported by the editor's own parse markers: with markers present, Save SHALL send neither request and SHALL surface the parse errors as notifications. No client-side validation of the document's *content* SHALL be performed — an incomplete or otherwise unacceptable document is a service rejection (the data-access service parses request bodies strictly and answers 422 on an unknown property or a missing required field), and that rejection SHALL be shown as-is.

#### Scenario: The editor toggle takes over the draft surface

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders for a caller who may modify it
- **THEN** a JSON-editor toggle is offered among the header's ordinary actions, and activating it replaces the column-by-column schema-definition surface with the JSON document
- **AND** on an `ACTIVE` table the same toggle offers no authoring surface at all — it opens the read-only view of the stored definition, from which no save is reachable

#### Scenario: A source draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for a source draft whose column form declares columns, an ordering key and a partition, and whose scan-metadata pair is unset
- **THEN** the seeded document carries `columns`, `ordering_key`, `partition_by`, `description` and `tag_order`
- **AND** it carries neither `identity_column` nor `version_column`, and no `grain_key` or `cardinality`

#### Scenario: An enrichment draft's document is its schema plus catalog metadata

- **WHEN** the editor is first opened for an enrichment draft whose column form declares columns and a grain key
- **THEN** the seeded document carries `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it carries none of `ordering_key`, `partition_by`, `identity_column`, `version_column`

#### Scenario: An in-progress document survives a re-render

- **WHEN** the author has edited the document and the surrounding view re-renders from an unrelated state change
- **THEN** the editor still shows the author's edited document, not a fresh seed

#### Scenario: Opening the editor and leaving it does not change what the column form submits

- **WHEN** the author opens the editor on an unchanged draft, makes no edit, toggles the editor off, then edits the column form and saves
- **THEN** the draft still reads as unchanged while the editor is open and after it is closed, so the toggle stays offered throughout
- **AND** the save sends `defineTableSchema` alone, carrying the column form's own body and no `updateTable`

#### Scenario: The column form's completeness rules do not gate Save in the editor

- **WHEN** the editor is the active surface, the author has edited the document, and it parses but omits a member the column form requires — a source document with no `ordering_key`
- **THEN** the Save the changed header offers is enabled, and submitting it sends the requests, so the service's answer decides the outcome

#### Scenario: A document that does not parse blocks the save

- **WHEN** the editor is the active surface, the document carries parse-error markers, and the author submits Save
- **THEN** neither the metadata request nor the schema request is sent, and the parse errors are surfaced as notifications

### Requirement: A changed table draft's header offers Discard and Save

For a table that is not yet materialized (`status` `PENDING` or `FAILED`) and that the caller may modify, the detail view SHALL adopt this console's changed-entity header convention, which every other entity view already follows: while the draft has unsaved changes the header's ordinary actions give way to **Discard** and **Save**.

A draft SHALL be treated as **changed** when either authoring surface differs from the table's stored state:

- the **column-by-column surface**, when the schema body it would submit differs from the schema body the table's stored definition yields — so a `PENDING` table whose form has not been touched and a `FAILED` table freshly seeded from its stored definition are both *unchanged*;
- the **JSON document**, when it differs from the document that same stored state seeds.

While the JSON editor is the active surface, unresolved parse markers SHALL additionally count as changed, because a marker suppresses the parse and the last successfully parsed document therefore cannot be compared — leaving the header in its ordinary state would offer no way out of a broken document but to fix it.

While the draft is changed the header SHALL present **Discard** and **Save**, and SHALL withdraw its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle. Discard SHALL be confirmed through this console's shared discard confirmation before it takes effect. Both actions SHALL be presented only to a caller who may modify the table; a caller who may only view, delete or manage access SHALL never see them, and SHALL keep whichever ordinary actions its permissions already allow.

While the draft is **unchanged** the header SHALL present its ordinary actions — **Manage access**, **Delete table** and the JSON-editor toggle — and SHALL offer **neither Save nor Discard**, exactly as this console's convention behaves on every other entity view. Save is therefore reachable only while the draft is changed. One consequence is accepted deliberately: an untouched `FAILED` draft SHALL NOT be re-submittable as-is — its author must first make an edit that either surface registers as a change.

Save's **disabled** state SHALL follow the active surface, and SHALL be the convention's:

- from the **column-by-column surface**, Save SHALL be disabled while that surface's own completeness rules are unmet — the rules "Define and materialize a table schema" states;
- from the **JSON editor**, Save SHALL NOT be disabled; its only client-side gate SHALL be the parse markers "JSON editor for a table draft" specifies.

Save SHALL send from each surface exactly the requests that surface already sends: "Saving a table draft as metadata then schema" in the editor, `defineTableSchema` alone from the column form.

**Discard** SHALL restore both surfaces to the table's stored state: the column form to the values the stored definition seeds, and — if a document has been seeded — the JSON document to the document that stored state yields. Any parse markers and the notifications they raised SHALL be cleared first, so a stale marker cannot hold the changed header up on its own. The active surface SHALL NOT change: an author who discards while the editor is open stays in the editor, looking at the restored document.

No **authoring** behaviour of an `ACTIVE` table SHALL change. The changed-entity header SHALL NOT be presented there, and that view's own actions — Add columns, Add rows, Connect — SHALL be presented exactly as today. The one control that view's header gains is the read-only JSON-view toggle of "An ACTIVE table's definition is readable as JSON": it is not an authoring surface, it never marks the table changed, and neither Save nor Discard is reachable from it.

#### Scenario: Editing the JSON document swaps the header's actions

- **WHEN** the JSON editor is the active surface on a modifiable draft and the author edits the document
- **THEN** the header offers Discard and Save
- **AND** Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: Editing the column form swaps the header's actions

- **WHEN** the author changes a value on a modifiable draft's column-by-column surface
- **THEN** the header offers Discard and Save, and Manage access, Delete table and the JSON-editor toggle are no longer offered

#### Scenario: An untouched draft keeps its ordinary header actions

- **WHEN** a modifiable draft renders and neither surface has been edited
- **THEN** the header offers Manage access, Delete table and the JSON-editor toggle
- **AND** it offers neither Save nor Discard

#### Scenario: An untouched FAILED draft offers no Save

- **WHEN** the detail view of a `FAILED` table renders for a caller who may modify it, both surfaces seeded from the table's stored definition and neither edited
- **THEN** no Save action is offered, so the stored definition cannot be re-submitted until an edit makes the draft changed

#### Scenario: Unresolved parse markers hold the changed header up

- **WHEN** the JSON editor is the active surface and the document carries parse-error markers
- **THEN** the header offers Discard and Save even though the last successfully parsed document is unchanged

#### Scenario: Discard restores both surfaces to the stored state

- **WHEN** the draft is changed and the author confirms Discard
- **THEN** the column form shows the values the table's stored definition seeds, the JSON document shows the document that stored state yields, the editor is still the active surface if it was, and the header returns to its ordinary actions

#### Scenario: Discard is confirmed before it takes effect

- **WHEN** the author activates Discard on a changed draft
- **THEN** a discard confirmation is presented, and dismissing it leaves both surfaces and the header as they were

#### Scenario: The changed header is offered only to a caller who may modify

- **WHEN** a draft's detail view renders for a caller who may delete or manage access but may not modify
- **THEN** neither Discard nor Save is offered in any state, and the actions that caller's permissions do allow are presented as before

#### Scenario: An ACTIVE table's header offers neither Discard nor Save

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with full permissions
- **THEN** no Discard action and no Save action is offered, in any state that view can be put in — the read-only JSON view included
- **AND** Manage access, Delete table, Add columns, Add rows and Connect are presented exactly as before this change, alongside the read-only JSON-view toggle
