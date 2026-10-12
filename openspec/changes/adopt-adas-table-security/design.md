## Context

See proposal.md — Why. The service contract this design builds on, as read from the data-access
service's `table-access-control` spec (development branch):

- `GET` / `PUT /v1/tables/{name}/access` — five role lists (`get`, `read`, `sensitive`, `write`, `modify`).
  `PUT` **merges by key**: an absent key is left alone, `[]` revokes. The response carries the stored lists,
  the caller's `permissions`, and `ineffective_grants` (`role`, `key`, `reason`, `message`).
- `GET /v1/tables/{name}/row-policies`, `PUT` / `DELETE …/row-policies/{role}` — at most one policy per
  role, body `{"filter": <filter node>}` in the structured query's filter grammar, validated against the
  table's own stored columns. `DELETE` of an absent policy is `404`.
- Both need `TABLE_GRANT`; in practice `FULL_ADMIN`. `permissions` on every table read carries
  `get`, `read`, `sensitive`, `write`, `modify`, `rows_restricted`.
- A row policy narrows a read and never grants one. Implication (`read`→`get`, `modify`→`get`) is derived
  by the service when it checks and is never stored.

Console state today: `TableAccessPanel` (a popup over `write` / `modify`), `useAnalyticsTablePermissions`
(`canManageRoles = isFullAdmin && !system`), a two-tab `DialTabs` strip in `TableDetailView`, a
`sensitiveDisabled` prop on `EditColumnPopup`, and a Query Builder whose filter editor mutates a node tree
in place and calls `refresh()` from a `useQueryBuilder()` context.

## Goals / Non-Goals

**Goals:**
- The Access tab, drawer, row-limit editor, Remove role, the Rows restricted badge and the sensitive lock
  of proposal.md, following the supplied design and the ui-kit 2.0 components, creating our own only where
  the kit has none.
- One tested filter-condition editor shared by the Query Builder and the row-limit editor.
- A change that ships in PR-sized steps, the first of which changes no behaviour.

**Non-Goals:**
- Anything the proposal lists as a non-goal.
- Rewriting the filter editor's in-place-mutation model, or its operator and value rules.
- A function operand, parameter or aggregate in a row limit (the service refuses them).

## Decisions

### D1. All behaviour goes into `analytics/tables`; the Query Builder gets no spec delta
Access management is table behaviour. The filter extraction (D7) is a refactor whose observable behaviour
is the Query Builder's existing spec, which must stay green, so it gets tests, not a requirement.
*Alternative:* a new `analytics/table-access` sub-capability — rejected: the project rule is to extend the
sub-capability that owns the behaviour, and the Access tab sits on the table detail page.

### D2. Access state is owned by the detail view, loaded with it
The tab's presence depends on the data, so a hook `use-table-access` (kebab-case file, beside the
tab) loads `GET /access` and `GET /row-policies` when the detail view of an `ACTIVE` table mounts for a
viewer with `canManageRoles` and analytics enabled. It exposes the role rows, a status
(loading / ready / forbidden / failed), and the save and remove operations; the tab and the drawer are
consumers. A `403` sets `forbidden` and removes the tab silently (spec: Access tab lists a table's roles).
*Alternative:* load on first open of the tab — rejected: the 403-hides-tab behaviour
both need the data first, and a tab that vanishes after a click is worse than one that never appears.

### D3. The role-level rules are pure functions
Under `components/Analytics/Tables/access/` (`utils.ts`, `models.ts`, `constants.ts`, per the
constants/models split):
- `buildRoleRows(access, policies)` → rows with, per privilege, `stored | implied | none`, the sensitive
  flag, and the Rows cell kind (`policy | all | none`).
- `planAccessSave(lists, role, desired)` → the keys whose membership of `role` changed and their new full
  lists; `planRoleRemoval(lists, role)` → the keys that name it.
- `isStepOffered` helpers for the drawer (sensitive needs a verb; rows need `read`).

They are the whole of the access arithmetic, so the tests are plain unit tests with no rendering.

### D4. Save is two requests; the drawer is a small state machine
`PUT /access` then the row-policy request cannot be made atomic. The drawer holds an enum phase
(`Editing`, `GrantsSavedWithBanner`, `RowLimitFailed`): a failed row-policy request moves it to
`RowLimitFailed`, where the footer action repeats only that request and the note states what was saved;
`ineffective_grants` moves it to `GrantsSavedWithBanner` (banner + **Done**). The row-policy request is sent
even when the grants response carried a banner, because a policy applies to its role by any read path.

### D5. Read-modify-write, narrowed but not closed
The service has no version on the lists, and its `PUT` merges per key, so a key we send replaces that whole
list. The drawer therefore reads the lists again immediately before `planAccessSave` and sends only changed
keys. A concurrent edit of the *same* list inside that window still loses. *Accepted:* grant editing is
rare, by few admins, and an ETag is a service change outside this one.

### D6. A new domain-free `Common/Drawer`, not `Popup`
ui-kit has no drawer and its `Popup` is a centred modal with a different anatomy. `Common/Drawer` renders in
a portal over the right edge at a fixed width, is `role="dialog"` with `aria-modal`, an accessible name,
focus moved in on open and returned to the trigger on close, Escape and a close control, and makes the rest
of the page `inert` while open (a11y.md). Header, scrolling body and footer are slots; it knows nothing about
access. It must also paint ui-kit 2.0 tokens and sit above the grid. *Alternatives:* `Popup` pinned right —
rejected, it fights the kit's own layout; the existing `Common/SidePanel` — rejected, it is an in-flow panel
that does not overlay, trap focus or close on Escape.

### D7. Extract the filter editor behind a context seam, keep in-place mutation
`FilterGroup` and `FilterCondition` need three things from `useQueryBuilder()`: the function catalog, the
field list and `refresh`; `FnArgEditor` needs the catalog. A `FilterTreeContext` (`{ fields, functions,
refresh }`) and a `useFilterTree()` hook replace those calls. The hook returns the provided context value if
there is one and otherwise derives the same three members from `QueryBuilderContext`, so the Query Builder
provides nothing and its sections and specs are untouched, while the row-limit editor provides its own
(a catalog of `[]`, the table's columns, a force-update). Files are not moved: the `Common` pieces they
import are shared with every other builder section, so a move would churn more than the seam is worth, and
the Tables feature imports the two filter components from where they are. The mutate-then-`refresh` model
and every operator, value and enum rule stay as they are, which is what makes this a no-behaviour-change
PR. *Alternatives:* moving the components to `Analytics/Common/` (the first version of this design) —
rejected after reading their import graph; rewriting to a controlled `value` / `onChange` — rejected, it
changes how both the Having and Filter sections edit their trees for no user benefit.
Passing an empty function catalog is what removes function operands; `isFunctionOperandOffered` is already a
prop.

### D8. The row-limit editor is a thin wrapper plus two exports
`RowLimitEditor` holds a `FilterGroupNode`, maps the table's `columns` to `FieldOption`s (every stored
column, sensitive included, no dotted enrichment field), and renders the shared tree. Serialization uses the
existing `serializeNode`; the reverse — the filter parse and the "can the visual editor hold this" test
(`isFilterRepresentable`, currently private in `deserialize.ts`) — is exported and reused, which is what
makes the deep-nesting-opens-as-JSON rule the Query Builder's own rule. The JSON view reuses the existing
`JsonEditorBase`. A stored policy whose predicate is not representable opens in JSON, unchanged.

### D9. The roles table is a ui-kit 2.0 `Grid`
components.md §5/§11 forbid building tabular data from CSS grid. The Role / Get / Read / Write / Modify /
Rows columns are `ColDef`s (the kit's `Grid` takes `columnDefs`, `rowData`, `getRowId`, `ariaLabel`, and
`additionalGridOptions` for the row-click handler; its floating column filters are switched off, because the
tab has its own search); the marks are cell renderers (a full mark, a lighter implied mark, a
placeholder) each with an accessible name; a row is activated by Enter or click. Search and the two filter
chips drive a client-side filter. The kit's `FilterChips` (single choice) does not model two independent
toggles, so the two chips are `Tag`s in the `Selectable` appearance.

### D10. Tabs move to the 2.0 `Tabs`
The detail view's strip becomes `Tabs` (2.0). Its contract differs from `DialTabs`: items are
`{ id, label, count?, icon? }` and selection is `activeTabId` / `onTabChange(tabId)`. `EntityViewTab` gains `Access`; an `accessTab` factory sits beside `propertiesTab`
/ `auditTab`, and the shared `TabModel` is mapped to the 2.0 item shape at the call site rather than
changing the factories every other entity view uses. The selected tab stays in component state like every
other entity view; the supplied design says the Access tab "has its own URL", which no other entity tab here
does, so this change follows the app's convention and does not add routing. Only this view moves; the rest
of the app stays on `DialTabs`.

### D11. Types, API client and actions grow by the contract, no more
`TablePermissions` gains `get`, `read`, `sensitive`, `rows_restricted`; `TableAccess` becomes the five-key
shape with `PUT` taking a partial; a `TableAccessUpdateResult` adds `ineffective_grants`; `RowPolicy` and a
row-policy map are new. `AnalyticsDataApi` gains `getRowPolicies`, `putRowPolicy`, `deleteRowPolicy`, and
`replaceTableAccess` is renamed for what it now does (`updateTableAccess`); server actions follow, each
returning the usual `ServerActionResponse`. Error notifications are built with the existing
`getErrorNotification(header, message, requestId)`.

### D12. Banner versus notification
Server errors and refusals are notifications through `NotificationContext`, which the a11y rule counts as
the live region. Non-errors (`ineffective_grants`) are a ui-kit 2.0 `Notification` with
`type={NotificationType.SectionMessage}` and a warning or info variant, rendered statically inside the
drawer next to the card they concern, text from the service's `message`. The kit gives `warning` the
assertive `role="alert"`; a banner that is on screen after a save and not an interruption passes
`role="status"` explicitly, as the kit documents for static content.

### D13. Small pieces
- **Rows restricted badge**: a `Tag` + `Tooltip`, one component used by the detail header and the catalog
  row, fed by `isRowsRestricted`; the existing `TableStatusBadge` is untouched.
- **Sensitive lock**: `EditColumnPopup` already takes `sensitiveDisabled`; the detail view passes
  `!canChangeSensitive` and the popup adds the lock icon and a `Tooltip` with the reason. The 2.0 `Switch`
  takes `labelProps`, `isOn`, `onChange` and `disabled` and has no reason slot, so the lock and tooltip sit
  beside it; a tooltip never stands as the only name, the switch keeps its label.
- **Permission cards**: a bordered `<label>` around the 2.0 `Checkbox`, so the input is real and the whole
  card is the target; the kit has no card-checkbox.
- **Remove role**: `ConfirmationPopup` (2.0) with the list of what is removed as custom content.

## Risks / Trade-offs

- **Lost update on a grant list** (D5) → read-before-write and per-key sending narrow the window; documented
  as accepted.
- **Half-saved role** (D4) → the drawer never hides it: the roles table shows the saved grants and the
  footer offers to retry only the row limit.
- **Regression in the Query Builder from the extraction** (D7) → PR 1 changes no behaviour, moves the
  existing specs with the components, and must leave `QueryBuilder` and its Filter/Having specs green with
  no edits to their assertions.
- **"All rows" can be wrong for a role that reads through the service's global role mapping.** The mapping
  is not exposed, so the console cannot know. *Accepted* (proposal non-goal); the Rows column states what
  the table's own lists say.
- **The tab can be hidden by a `403` for a legitimate `FULL_ADMIN`** whose provider role lacks
  `TABLE_GRANT` → no remedy in the console; consistent with the service refusing the read.
- **ui-kit surface**: `Tabs`, `Notification`, `Tag`, `Grid`, `Switch`, `Select`, `RadioGroup`,
  `Checkbox`, `Tooltip`, `Popup` and `ConfirmationPopup` (all 2.0) are exported by the installed package
  and their props are as used above; the kit has no drawer. The installed `node_modules` version
  (`0.15.0-dev.24`) is not the one `package.json` pins (`0.15.0`) → run `npm install` before starting, and
  re-check a prop only if the pinned release moves it.
- **Service version**: the request and response shapes were checked against the service's development
  branch source — `PUT /access` answers the five lists plus `permissions` and `ineffective_grants`
  (`role`, `key`, `reason`, `message`); the row-policy body is `{"filter": …}`; `rows_restricted` is a
  member of `permissions` — but whether the stand the console talks to already serves them was not
  checked, since the stand's MCP endpoint failed to connect. Treat a `404` on `GET /row-policies` for a
  table that exists as a failed load, not as "no policies", and confirm the stand before merging step 4.

## Migration Plan

No data migration. Ship in order, each step mergeable on its own: (1) the filter extraction, no behaviour
change; (2) types, API client, actions, permissions model; (3) `Common/Drawer`; (4) Access tab, drawer,
row-limit editor, Remove role, replacing `TableAccessPanel` and the *Manage access* button and moving the
strip to `Tabs`; (5) the badge and the sensitive lock. Rollback is a revert of the relevant step; none
leaves persisted state behind, because every write goes to the service.
