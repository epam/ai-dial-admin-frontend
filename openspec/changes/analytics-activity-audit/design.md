# Design — analytics-activity-audit

## Context

See `proposal.md` — *Why* for motivation, and `<state>/changes/analytics-activity-audit/ba-review.md`
for the near-duplicate analysis and the long-form open questions. This document covers only what the
implementation needs decided.

Five facts from the code and from the analytics backend's own specification shape everything below.
They were read, not assumed:

1. **`ActivityAuditList` branches on a boolean, not on the view.** `List.tsx:211` is
   `isDeploymentsView ? getDeploymentActivities : getActivities`, and the same `isDeploymentsView`
   boolean gates the row-class rule, the cell-click handler, the column set, and the
   parent/child-aggregation bypass. A third view does not extend that shape.
2. **`buildResourceTypeLabelMap` iterates the whole enum** (`formatters.ts:53`), so its map — and the
   `contains` → `equals` narrowing that `expandResourceTypeFilter` performs from it
   (`List/utils.tsx:26`) — is shared by the `Config` and `Deployments` views. Its existing tests
   (`src/components/ActivityAudit/List/tests/utils.spec.tsx`, `resourceType label-aware filter
   transform`) cover the mechanism but pin no specific label, so nothing currently fails if adding
   enum members widens an existing needle from one match to two.
3. **`BaseEntity` is entirely optional fields** (`name?`, `displayName?`, `description?`, `intro?`,
   `topics?`, `createdAt?`, `updatedAt?`). An `AnalyticsTable` is not one, but `{ name, description }`
   *is* a valid `BaseEntity`. So the `EntityAudit` reuse needs no cast, no widened prop, and no lie —
   just a projection at the analytics call site.
4. **A column activity is not a table activity.** The analytics backend's `AuditResourceMapper`
   names a column `TableColumn` with `resourceId = "<table>:<column>"`, and its own spec states
   outright, under *Activity feed listing → Filter by resource*, that filtering `resourceType eq Table`
   + `resourceId eq <name>` returns "only activities for that table definition … and none for its
   columns". Its *Child activities link to their parent* requirement further states that a revision
   which changes a column but not the definition row produces a **parentless** `TableColumn` activity.
5. **A `viewMode`-driven entity Audit tab resolves its row-click href through `auditResourceRoute`**
   (`getAuditActivityHref`, `List/utils.tsx:184`), which returns `''` for an unregistered type. The
   existing test `returns empty href for a resource type not registered in auditResourceRoute`
   (`List/tests/utils.spec.tsx:392`, asserted with `ADMIN_PROPERTIES`) pins that, so a blanket
   fallback there would break an existing assertion.
6. **The diff engine silently drops an object-valued field it has no handler for.**
   `compareObjectTypes` / `fillObjectTypes` (`View/utils/generate-diffs.ts:214, :293`) are chains of
   `else if` over known key sets — `arrayParameterKeys`, `arrayStringParameterKeys`,
   `arrayObjectParameterKeys`, `SOURCE`, `separateObjectParameterKeys` — with **no final `else`**. A
   table snapshot's `columns` array, its `grain` / `partition_by` objects and its `ordering_key` /
   `tag_order` arrays match none of them, so the generic path does not render them *badly*: it does
   not render them at all. `createSectionFromDiffs` compounds this — it iterates a fixed list of
   section names, so a bucket whose key is not in that list never reaches a renderer. This is why
   the owner's requirement is a change to the engine and not a styling pass.
7. **The engine already has the two mechanisms the owner's grouping needs.** Container environment
   variables fan a repeated item out into numbered buckets (`metadata0`, `metadata1`, …) via
   `compareMetadataEnvs`, are collected by `setObjectsArrayDiff`, and are rendered by `DiffSection`
   as one accordion whose per-index blocks carry a `Variable N ` prefix. Container compute, scaling
   and probe sections project an object to `FlatRow[]` and compare it through
   `compareNestedFlatObject` (`View/utils/create-simple-diffs.ts:198`), which emits
   `isCurrent ? MIRROR : REMOVED` and `isCurrent ? MIRROR : ADDED` — i.e. it already keeps a field
   visible on the side where it does not exist, as a placeholder row. Together these are exactly
   "one group per column, with added and removed entries still visible and marked".
   One caveat that must **not** be copied: `compareMetadataEnvs` returns early when the compare side
   has no rows (`generate-diffs.ts:433`), so an env var present only on side one emits nothing. That
   is the failure mode the owner is objecting to; the analytics comparator must emit in both
   directions.
8. **Status is currently conveyed by row colour only.** `DIFF_ROW_CLASS_RULES`
   (`src/constants/ag-grid.ts:129`) maps `DiffStatus` to background/border classes, and `DiffLegend`
   shows counts against colour swatches labelled with the `Create` / `Update` / `Delete` button
   strings. There is no text or ARIA statement of a row's or a group's status anywhere in the diff,
   which is why the owner's "marked as such" needs `.claude/rules/a11y.md`'s grouping rule applied,
   not just a class.
9. **Every label the analytics diff needs already exists.** `AnalyticsTablesI18nKey`
   (`src/constants/i18n.ts:2513`) already defines `Name`, `Description`, `Type`, `SourceTable`,
   `Status`, `System`, `OrderingKey`, `PartitionColumn`, `Granularity`, `IdentityColumn`,
   `VersionColumn`, `GrainKey`, `TagOrder`, `Columns`, `ColumnName`, `Tag`, `DisplayName`,
   `ElementType`, `EnumValues`, `Nullable` and `Sensitive`. The diff needs no new field labels — only
   the three status words and one group-heading pattern.

## Goals / Non-Goals

**Goals**

- One coherent replacement for the boolean fetcher branch, so a fourth backend later is an entry, not
  another `if`.
- An Audit tab on the table detail view that actually answers the questions in the ticket — who
  dropped a column, who marked one sensitive.
- A revision diff that answers the same questions on the detail page: the whole snapshot, grouped,
  with the added and removed columns marked where they are (D11).
- No change to what the `Config` and `Deployments` views do, and a test that proves the shared
  resource-type filter did not shift under them.
- No affordance anywhere in the audit capability that writes to a backend which does not own the
  resource (D9).

**Non-Goals** (design-level; the proposal's own Non-goals still hold)

- **Rollback of any kind for analytics resources.** The analytics backend exposes no mutating audit
  endpoint and no rollback route. Not buildable here; a disabled control would be worse than absence.
  This now covers three affordances, not two — see D9.
- **Guarding the `/tables/{name}` route itself.** The Audit tab is gated on the analytics flag and on
  an active table status (D12); the route is not. Guarding it is a statement about the whole tables
  feature, not about audit.
- **Reshaping the diff for non-analytics resource types.** D10 adds an analytics branch to the diff
  engine; the container, image, firewall and admin paths are untouched, and their row-level status
  treatment is not revisited.

**Reversed non-goal.** Earlier revisions of this design put analytics *diff readability* out of
scope — "the diff must open and be correct; whether a `columns` array reads well is a follow-up".
The owner has reversed that: every field of the snapshot must be shown, grouped where grouping
helps, with added and removed entries marked as such. Diff presentation is therefore in scope and
specified — see D10. What remains out of scope is any per-field formatting beyond labelling and
grouping: no bespoke cell renderers, no type-aware value formatting for analytics fields.
- **Splitting the change.** One change, one pull request. The batches below exist for parallel
  dispatch, not for a PR split.
- **Restructuring the tables feature onto the `View/` + `TabsContent/` entity pattern.** See D6.

## Decisions

### D1 — Where the spec delta lives: a new `activity-audit-analytics-view` capability

The audit-page side of this change (the third view option, its fetcher, its labels, its rollback
absence, its detail-page resolution) goes into a **new** capability spec,
`openspec/specs/activity-audit-analytics-view/`, named to mirror `activity-audit-deployments-view`.
The Analytics-**feature** side — the tables detail view's tab set and the Audit tab's content — goes
into the analytics master spec, `openspec/specs/analytics/spec.md`, per `openspec/config.yaml`.

**Corrected by D14 (the Pipelines follow-up): the path in the paragraph above is stale.** The analytics
capability was split into a root index plus nine sub-capabilities after this decision was written, and
`openspec/specs/analytics/spec.md` now carries only what every Analytics page shares. The tables
requirements therefore live in `specs/analytics/tables/spec.md` under this change, and the pipelines
ones in `specs/analytics/pipelines/spec.md`. Everything else in D1 — the split between the audit
capability and the Analytics feature, the cross-reference line, and the rule about not modifying a
requirement whose every statement stays true — is unchanged. See D14.

*Alternatives rejected:*

- **Amend `activity-audit-deployments-view` in place with the analytics requirements.** Rejected: it
  puts requirements about analytics into a spec whose Purpose paragraph says it defines the
  Deployments view, and it makes that spec grow a second subject every time a backend is added. Its
  precedent argues the other way — deployments got its own capability rather than being folded into
  the pre-existing audit specs.
- **Put the audit-page analytics requirements into the analytics master spec.** Rejected: the master
  spec covers the Analytics *feature* (its menu group, its tables, pipelines, queries, dashboards).
  The `/activity-audit` page is the Audit feature; a reader looking for the audit view selector's
  behavior would not find it under Analytics, and the config rule that keeps Analytics feature specs
  consolidated is about the feature, not about every requirement containing the word.
- **Move the selector's requirements to a new view-neutral capability and leave the deployments spec
  to its own view.** Rejected as a bigger refactor than this change earns: it would mean a REMOVED +
  ADDED pair across two capabilities to relocate text that is already correct. Only the one sentence
  that literally becomes false is modified.

Three existing requirements are `MODIFIED` because their text becomes false rather than merely
incomplete: *View selector exposes a Deployments option* ("exactly these two views"),
*`ActivityAuditList` accepts a `viewMode` prop…* (two modes enumerated), and *A single unified
resolver loads activity audit detail for every page* (a two-step fallback chain enumerated). Nothing
else in those specs is touched.

Because a reader of the analytics master spec would otherwise never learn that part of the analytics
audit story lives elsewhere, the master spec's new Audit-tab requirement opens with one
cross-reference line naming `activity-audit-analytics-view` as the owner of the global page's
`Analytics` view. That satisfies `openspec/config.yaml`'s consolidation rule at archive time without
moving any requirement; the split itself is not reopened.

The analytics master spec's *Table detail column schema management* requirement is deliberately **not**
modified. It is ~40 lines of prose about the columns grid, and every statement in it stays true; the
new *Table detail view is organized into Properties and Audit tabs* requirement scopes it additively
by naming which tab its content now renders inside. Copying that block into a `MODIFIED` section to
change one preposition would risk losing detail at archive time for no gain.

### D2 — The fetcher ternary is replaced by a per-view lookup, not a third branch

A new module `src/components/ActivityAudit/List/view-config.ts` exports
`ACTIVITY_AUDIT_VIEW_CONFIG: Record<ActivityAuditView, ActivityAuditViewConfig>` with the per-view
type in an adjacent `models.ts` (per `code-standards.md` — const values and types split). Each entry
declares:

| field | Config | Deployments | Analytics |
|---|---|---|---|
| `fetchActivities` | `getActivities` | `getDeploymentActivities` | `getAnalyticsActivities` |
| `getColumns` | `getActivityAuditColumns` | `getDeploymentActivityAuditColumns` | `getAnalyticsActivityAuditColumns` |
| `hasParentChildAggregation` | `true` | `false` | `false` |
| `hasRollback` | `true` | `true` | `false` |
| `isRowNavigable` | always | `isDeploymentManagerResource` | always |

`List.tsx` reads `ACTIVITY_AUDIT_VIEW_CONFIG[effectiveViewType]` once and uses it everywhere
`isDeploymentsView` is consulted today. The `Config` and `Deployments` entries are transcriptions of
current behavior, so the two existing views are unchanged by construction, and `List.spec.tsx`'s
existing view-aware tests are the regression check.

*Alternatives rejected:* a nested ternary (`code-standards.md` forbids nesting, and it would need
four more of them); a `switch` per call site (the same knowledge restated in five places, which is
how the current boolean got out of step with itself); a strategy object passed in as a prop (pushes
the decision to every caller and widens a shared component's props to fit one caller, which
`use-don't-edit-shared-components` forbids).

`Record<ActivityAuditView, …>` rather than `Partial<Record<…>>` is deliberate: adding a fourth enum
member without an entry then fails to compile instead of falling through to `undefined` at runtime.

**The `entity` short-circuit must yield to the view config.** `columnDefs`
(`List.tsx:353-360`) returns early whenever `entity` is present, with
`getActivityAuditColumns(t, openInNewTabForEntity, onOpenConfirmationModal, void 0, true)` — the
`isSingleEntity` column set, which hides `Resource type` and `Resource identifier`, **plus** a
Rollback row action. Leaving that branch first would break two specified scenarios at once (*A column
activity states which column it refers to* and *No rollback action is offered*) while every unit test
named in the surfaces task still passed. So the branch resolves through
`ACTIVITY_AUDIT_VIEW_CONFIG[effectiveViewType]` like every other one: the config's `getColumns` and
`hasRollback` decide, and `isSingleEntity` becomes an argument the `Config` and `Deployments` entries
pass and the `Analytics` entry does not. Entity-mode row Rollback must survive for `Config` and
`Deployments`, which is what the kept existing tests are for.

### D3 — The table Audit tab shows the table **and its columns**

The tab requests `resourceType in "Table,TableColumn"` + `resourceId co "<name>"` and then narrows
client-side to rows whose `resourceId` is exactly `<name>` or starts with `<name>:`. The narrowing
predicate is a pure function in `src/utils/audit/analytics-resource-id.ts`, unit-tested.

This refines the proposal's phrasing ("filtered to this table's `(resourceType, resourceId)` pair").
The reason is fact 4 above: that pair is specified by the analytics backend to return *no* column
activities, so the literal reading produces an Audit tab that cannot answer either question the
ticket names, while the backend deliberately models columns as children so a client can show them
with their table. **EM/BA should veto this if the narrower reading was intended** — it is the one
place where this design does not do what the proposal's sentence says.

Why not something simpler:

- **`resourceId eq <name>` only (the proposal's literal reading).** Rejected: hides column history;
  see above.
- **`resourceId co <name>` with no client-side narrowing.** Rejected: `co` is a substring match, so
  the tab for `orders` would show rows belonging to `my_orders` — an audit surface showing another
  resource's history is worse than one showing too little.
- **Two paged requests merged in the datasource.** Rejected: merging two independently paged,
  independently sorted streams into AG Grid's infinite row model is a correctness problem
  (`lastRow`, ordering, dedupe) far larger than the feature.
- **Reuse the `Config` view's parent/child child-fetch to pull columns in under their table.**
  Rejected as insufficient rather than wrong: it only surfaces columns changed in the *same revision*
  as a table change, and the backend's spec has an explicit scenario for the column-only revision
  that produces no parent at all.

Consequence for the tab's columns: because the list now carries two resource types, it uses the
Analytics column set (`Resource type` and `Resource identifier` visible, no expander, no `Version`)
rather than the `isSingleEntity` set that hides both — a row reading only "Update / 14:02 / ana@…"
would not say *which column*. `ACTIVITY_AUDIT_COLUMNS` needs no edit: called with
`view = Analytics, isSingleEntity = false` it already produces exactly that set.

### D4 — Reuse `EntityAudit`; adapt at the call site

The Audit tab renders `EntityAudit` with `entity={{ name: table.name, description: table.description }}`,
`view={ApplicationRoute.AnalyticsTables}`, `viewMode={ActivityAuditView.Analytics}`. This is BA's Q5
recommendation and I keep it, for two reasons beyond consistency:

- `getAuditTabs(t, featureFlags, ApplicationRoute.AnalyticsTables)` already returns `[Activities]`
  and nothing else — the route matches none of the telemetry branches — so the Activities-only rail
  the deployment Audit tabs established comes for free, with **no edit to `getAuditTabs`**.
- Fact 3 means the projection is a literal object, not a cast. The `AnalyticsTable → BaseEntity`
  adaptation lives in one small component, `TableAudit.tsx`, which is the "adaptation at the call
  site" the review demanded.

`routeAuditResource` gains `[ApplicationRoute.AnalyticsTables]: ActivityAuditResourceType.TABLE` so
`resolveEntityAuditType` resolves the entity type without a new branch.

*Alternative rejected:* calling `ActivityAuditList` directly and skipping the single-item rail. It
saves one visual element and costs the consistency every other Audit tab in the app has; and
`ActivityAuditList`'s `entity` prop has the same `BaseEntity` typing, so it saves no adaptation
either.

### D5 — Row click in the Analytics view goes to the global detail page, in a new tab

Both in the global Analytics view and in the table's Audit tab, a row opens
`/activity-audit/{activityId}`. In the tab this is a per-view behavior (`view-config`'s
`getEntityActivityHref`), **not** a general fallback inside `getAuditActivityHref`.

**The row opens a new tab, and that is deliberate — do not "fix" it.** The first draft of this
capability's spec said a row-body click navigates the *current* tab, and browser verification
(item 7.1) found that it does not: `location.href` stays on the list and the detail page opens in a
new tab. That is pre-existing shared behaviour of this list, not something this change introduced —
the shipped `Config` view does the same, the row's own menu item is literally labelled
`Open in a new tab`, and `onCellClicked` in `List.tsx` has always called `openInNewTab`
(`onOpenInNewTab` → `window.open(url, '_blank')`, `src/utils/open-in-new-tab.ts:16`). This change
touched only the navigability guard (`isDeploymentsView && !isDeploymentManagerResource(…)` →
`viewConfig.isRowNavigable(…)`), never the navigation target. The owner's call was that the scenario
moves and the code stays, so the requirement now states the new-tab behaviour for both entry points
— the row body and the menu item — and names them separately so the two are not read as one.

A future reader who finds the older, current-tab reading in a review comment or a stale spec should
correct that text, not the component: making a row-body click navigate in place would change the
`Config` and `Deployments` views for every user, which is out of scope for this change and was never
asked for.

*Alternatives rejected:* registering `Table → ApplicationRoute.AnalyticsTables` in
`auditResourceRoute` would produce `/tables/{name}/{activityId}`, a route this change deliberately
does not create (proposal Non-goal), i.e. a 404 on every row click. A blanket "if no namespaced route,
fall back to the global page" inside `getAuditActivityHref` would change behavior for the
Assets-Toolsets and Platform-Models Audit tabs, whose entity type is likewise unregistered, and would
break the existing test named in fact 5 — an out-of-scope behavior change disguised as a default.

### D6 — Tabs are added to `TableDetailView.tsx` as a shell; the body is extracted

`TableDetailView.tsx` keeps its route wiring, its props, and ownership of all state (table, draft
form, permissions, every modal). It renders, in order: the existing header (title, badges,
description, **the whole action row, unchanged**), then a `DialTabs` strip, then the active tab's
content, then the modals. The body it renders today — the read-only key summary plus the columns grid
or the draft schema editor — moves verbatim into `TableProperties.tsx` (presentational, ~5 props).
The Audit tab is `TableAudit.tsx` from D4.

Header actions stay **above** the tab strip (BA's Q3 answer, accepted): Manage access and Delete are
table-wide, and moving Add columns / Add rows / Connect into Properties would relocate controls for
every user who never opens Audit, for no benefit. It also keeps the modal state where it already is.

*Alternatives rejected:*

- **Full house `View/` + `TabsContent/` restructure.** Rejected: the tables feature has no `View/`
  directory, no etag/save/discard lifecycle, and no `originalEntity` handoff — the three things the
  entity pattern exists to organize. Adopting the folder shape without the lifecycle would be
  cargo-cult, it would rename the file every open PR touching this area conflicts on (issue #3977
  edits `TableDetailView`), and it converts a reviewable diff into a move-plus-diff. The in-repo
  precedent for a shell with an inline `activeTab === …` switch is `EntityAudit.tsx` itself.
- **`DialTabs` bolted on with no extraction.** Rejected: it leaves a ~650-line component with two
  unrelated bodies inline, which `components.md` §3 calls out directly.

### D7 — The label-map blast radius is accepted, and pinned by a test

Adding four enum members changes `buildResourceTypeLabelMap` for the `Config` and `Deployments`
views too. That is accepted rather than scoped, because:

- the map's values are **arrays** precisely so several enum members may share one label — the
  structure was built to tolerate additions;
- the four new labels (`Table`, `Table column`, `Pipeline`, `Saved query`) are equal to no existing
  label, so no existing key is widened;
- the residual risk is narrower than it looks: `expandResourceTypeFilter` narrows a `contains` needle
  to `equals` only when exactly one label matches. If a new label makes some needle match two, that
  needle degrades to the plain `contains` filter — still correct filtering, merely less narrow — and
  it never resolves to the *wrong* type;
- scoping the map per view would mean threading the active view through `getFormattedResourceType`,
  the column definitions, and the filter transform: more code changed, in the very files the risk
  lives in, than the risk warrants.

The mitigation is a guard test in `src/constants/grid-columns/tests/formatters.spec.ts` pinning the
single-match resolutions that other capabilities depend on — `global firewall` above all, since
`global-firewall-audit-shortcut` requires that needle to reach one type.

### D8 — The third detail-page fallback is gated on the analytics flag

`getActivityAuditDetailData` gains `analyticsAuditApi.getActivityById` as a third and last fallback,
issued **only** when analytics is enabled in the environment the resolver runs in (the resolver is
server-side, so it reads the environment directly rather than the client `featureFlags`). Without the
gate every non-admin activity's detail page would pay a third sequential round trip on an install
that has no analytics at all.

The check is `isValueTruthy(process.env.ANALYTICS_ENABLED)` — the helper in
`src/utils/types.ts`, which is `value === 'true'` — and **not** a bare truthiness test on the
variable. `layout.tsx:61` reads this same variable through that helper for
`featureFlags.analyticsEnabled`, so a bare test would make the server resolver and the client flag
disagree on any install that sets `ANALYTICS_ENABLED=false` explicitly: the string is truthy, so the
resolver would call a backend the rest of the app treats as absent. The test covers both the unset
and the `"false"` case for that reason.

*Alternative rejected:* probing the three backends in parallel and taking the first hit. It would cut
latency but issues two guaranteed-useless requests for every admin activity — the common case — and
turns a `404` from an unrelated service into noise in every detail-page load.

`getRevisionRouteForEntityType` gains the four analytics routes. `TableColumn` has no snapshot
endpoint of its own, so it resolves to its owning table's snapshot at the same revision by splitting
its `<table>:<column>` identifier — a snapshot that genuinely contains the column change, obtained
with a documented route rather than invented shaping.

### D9 — The detail page's `Rollback resource` button is suppressed by resource type

`AuditView.tsx:221` renders the `Rollback resource` button for every activity whenever the viewer is
not a read-only admin. There is no resource-type condition on it: `blockReason` is only ever set by
`resolveDeploymentRollbackBlockReason`, and `resourceRollback` (`:133`) dispatches
`isDeployment ? rollbackDeploymentEntity : rollbackEntityPerRevision` — so for an analytics activity
it falls through to the **admin** backend's per-revision rollback, aimed at a resource that backend
does not own. This is a third rollback affordance beyond the list's page-level button and the row
menu, and suppressing it is the only reason the detail page is reachable at all for analytics.

The condition is `isAnalyticsResource(activity.resourceType)` — the predicate the types task already
creates — wrapped around the existing `!isReadOnlyAdmin` condition. Nothing else in `AuditView`
changes: the confirmation popup, the notifications and the navigation after a successful rollback
stay exactly as they are for the resource types that still offer it.

*Alternatives rejected:*

- **Render it disabled with a tooltip explaining that analytics has no rollback endpoint.** Rejected
  for the same reason the proposal rejects it in the list: a disabled control advertises a capability
  that does not exist and never will from this frontend.
- **Set `blockReason` for analytics resource types and let the existing `disabled` path handle it.**
  Rejected: same visible outcome as above, and it overloads a state that today means "this deployment
  is mid-lifecycle, try again later" with "this can never work".
- **Leave it and rely on the backend rejecting the call.** Rejected: the call goes to the *admin*
  backend with an analytics resource id, so what it rejects — or worse, matches — is not predictable
  from here.

### D10 — The header's resource link resolves per resource type, and `auditResourceRoute` is left alone

`View/Header/Header.tsx:25-30` builds `/{locale}${auditResourceRoute[resourceType]}/{resourceId}`
unconditionally for any type outside three named exemptions, so an analytics activity gets
`/en/undefined/orders`. All three analytics detail routes exist (`/tables/[id]`, `/pipelines/[name]`,
`/queries/[id]`), so the answer is to resolve the link rather than to hide it.

A new pure helper in `View/Header/utils.ts` — `getAuditResourceHref(resourceType, resourceId)` —
returns the path or `undefined`: analytics types resolve through a small local
`ANALYTICS_RESOURCE_ROUTE` map (`Table` and `TableColumn` → `ApplicationRoute.AnalyticsTables` with
`getTableNameFromAnalyticsResourceId(resourceId)`, `Pipeline` → `AnalyticsPipelines`, `SavedQuery` →
`AnalyticsQueries`), everything else through `auditResourceRoute` as today. `Header.tsx` renders the
external-link button only when the helper returns a path, which also retires the `/en/undefined/...`
link for any other unregistered type.

**This is the fix that cannot be undone by accident, and that is the point.** The obvious one-line
fix — `[TABLE]: ApplicationRoute.AnalyticsTables` in `auditResourceRoute` — has a second consumer:
`getAuditActivityHref` (`List/utils.tsx:184`) reads the same map to build a row's `Open in new tab`
href, so the entry would make every analytics row point at `/tables/{name}/{activityId}`, the
entity-namespaced audit route D5 deliberately does not create. A developer fixing the header in
isolation would silently undo D5 and ship a 404 on every row click, and no existing test would catch
it. So: the map is not touched, a comment above it says why analytics is absent, and the existing
`returns empty href for a resource type not registered in auditResourceRoute` test is extended with
`Table` and `TableColumn` and a note naming D5. The guard lives on the *other* consumer, because
that is the one a future edit would break.

*Alternatives rejected:*

- **Add the entry to `auditResourceRoute` and special-case `Table` inside `getAuditActivityHref`.**
  Rejected: it puts the knowledge in two places and inverts the safe default — the map would then
  contain a route that one of its two readers must remember to ignore.
- **Suppress the header link for analytics types, as the three existing exemptions do.** Rejected as
  a worse product answer for the same effort: the resource pages exist and the link is useful. Kept
  as the fallback if the tables route is ever removed.
- **Create the entity-namespaced routes so the map entry becomes correct.** Rejected: that is the
  proposal's Non-goal, and it is a bigger change than the header link that motivates it.

### D11 — The analytics revision diff: all fields, grouped, with added and removed marked

This is the owner's reversal of the readability non-goal, and per fact 6 it is not a styling task:
the fields the owner wants shown are the ones the generic engine drops on the floor. Four pieces:

**1. An analytics branch in the builder.** `generateCurrentResource` gains an
`isAnalyticsResource(type)` branch that delegates to a new module,
`View/utils/analytics-diffs.ts`. That module owns three pure functions: a snapshot walker that
projects any snapshot object to `FlatRow[]` (scalars as rows; nested objects flattened one row per
leaf with a dotted parameter; scalar arrays joined **in declared order**, because `ordering_key` and
`tag_order` mean their order); a `columnRows(column)` projector; and a `buildAnalyticsDiff` that
fills the `properties` bucket from every non-`columns` field and one `columns:<name>` bucket per
column name present in either revision, sorted by name. No hidden-key set: analytics resources have
no `$type` / `id` / `createdAt` noise to suppress, and "show everything" is the requirement.
Each bucket is compared with `compareNestedFlatObject` and filled with `fillNestedFlatObject` — the
existing container compute/scaling/probe machinery, which already emits the MIRROR placeholder on
the side a field is missing from. Fact 7's caveat applies: unlike `compareMetadataEnvs`, this
comparator emits in both directions, so a removed column is never simply absent.

**2. The section fan-out.** `EntityParameterKeys` gains `COLUMNS = 'columns'`, and
`createSectionFromDiffs` gains an analytics branch beside the existing `setRolesDiffs` and
`setObjectsArrayDiff` ones, collecting the `columns:<name>` buckets in name order into
`sections.columns`. An `ANALYTICS_SECTION_ORDER` list is appended to the two existing ordered lists,
so `properties` renders first and `columns` after it.

**3. The group heading and the marker.** `ActivityAuditDiffSection` gains two optional fields,
`label?: string` and `diffStatus?: DiffStatus`, threaded through `filterNotEmptySections` (which
today discards everything but `current` / `compare`). `DiffSection` prefers `label` over its
`EntityFieldsI18nKey[name]` title lookup for the per-index heading — generalizing the hardcoded
`name === METADATA ? 'Variable N ' : ''` prefix it already has — and renders the status word beside
it. Four new i18n keys on `CompareI18nKey`, the diff vocabulary's existing home: `Added`, `Removed`,
`Changed`, and `ColumnGroup` (`'Column {name}'`). Field labels need nothing new (fact 9); the
parameter formatter gains an `ANALYTICS_ROW_LABEL_KEYS` map beside the `CONTAINER_ROW_LABEL_KEYS` it
already consults, and falls back to the raw field name as it does today — so a pipeline or
saved-query field this repo does not model still renders, unlabelled rather than hidden.

**4. Accessibility.** Per fact 8, status is colour-only today, and `.claude/rules/a11y.md` requires
that a collection rendering different visual treatments per item kind expose the distinction with
`role="group"` + `aria-label` on each item root. Each per-index block in `DiffSection` becomes that
group, its accessible name carrying the column name and its status. The status word is also visible
text, so the marker is not colour alone for a sighted user either. Scope discipline: this applies to
the per-index group wrapper `DiffSection` already renders, for every section type — the row-level
colour treatment of the container/image/admin diffs is not revisited, because doing that properly
means a status column in every diff grid and that is its own change.

**The filter's real label is `Changes only`.** The option beside `All parameters` in the diff view's
`View` control is `ActivityAudit.Differences` = `Changes only`
(`apps/ai-dial-admin/src/locales/en.ts`). An earlier draft of the delta called it `Diff only`, which
is not a label the product has ever shown; browser verification (item 7.1) confirmed the shipped
strings on a container activity's detail page. The control is pre-existing and this change neither
renames nor moves it — the analytics groups simply flow through it. Any new text about it quotes
`Changes only`.

**The removed-column edge, recorded so it can be reversed cheaply.** A column present in the older
revision and absent from the newer stays visible on both sides with a `Removed` marker, rather than
disappearing from the newer side. Both revisions show the full column set; the difference is carried
by the marker. This is the manager's default, stated to the owner and not contradicted. Reversing it
is one branch in `buildAnalyticsDiff` (drop the group instead of emitting placeholders) and two
scenarios; nothing else depends on it.

*Alternatives rejected:*

- **Register `columns` in `arrayObjectParameterKeys` and write a `compareColumns` beside
  `compareUpstreams`.** Rejected: `compareObjectArray` dispatches on key name inside a function
  shared by upstreams, defaults and env vars, and `columns` is a generic-enough name that an
  analytics entry there would fire for any future resource with a `columns` field. The analytics
  branch keys on the resource type, which is the thing that is actually true.
- **One group for all columns, with the column name as a row inside it.** Rejected: it is the shape
  the owner objected to. A ten-column table becomes ninety undifferentiated rows and "which column
  changed" is back to reading colours.
- **A dedicated analytics diff component instead of extending `DiffSection`.** Rejected: it
  duplicates the accordion, the legend, the before/after pair and the `All parameters` /
  `Changes only` filter, and it would drift from them. `DiffSection` already carries per-type title
  resolution and a per-index prefix; analytics adds entries to those mechanisms rather than a
  parallel renderer.
- **Encode the column name in the bucket key and have `DiffSection` parse it out.** Rejected: it
  makes the renderer parse a key format, and `setObjectsArrayDiff`'s `key.includes(sectionName)`
  filter makes the format load-bearing in two places. Two optional fields on the section model say
  the same thing in the type system.
- **Type-aware value formatting for analytics fields** (rendering `enum_values` as chips, `nullable`
  as a checkmark). Rejected as beyond the reversal: the owner asked for every field to be shown,
  grouped and marked, not for per-field presentation. `formatValue` already handles the generic
  cases.

### D12 — The table Audit tab is gated on the client flag **and on an active status**; the route is not

Two conditions, both in `TableDetailView`, and the tab strip renders only when both hold:

1. `featureFlags.analyticsEnabled` (from `useAppContext`) is true;
2. the table's status is active — `table.status === TableStatus.Active`, the `isActive` boolean the
   component already computes for its header actions and its body branch.

When either is false the component renders the Properties content directly — no tab strip, no Audit
tab, no analytics activity request. One fallback for both conditions, not two.

**The status condition is a reversal.** Earlier revisions of this design specified the opposite: both
tabs present at every lifecycle status, on the reasoning that "a draft's history is as auditable as a
live table's". The owner reversed it after checking the live analytics backend, and that check is the
whole argument:

- both `pending` tables in the stack report `column_count: 0` — a draft has no materialized columns;
- an exact-match activity query (`resourceId eq <name>`) returns `total: 0` for each of them.

So a draft table has **no** audit history at all — not "sometimes empty", empty in every observed
case. A control that can never carry information is worse than its absence: it invites a click, costs
a request, and answers nothing. `FAILED` and an absent `status` take the same branch, because the
condition is `isActive`, not `!isPending`; a table whose materialization failed has no more history
than one that never started, and treating an unreported status as inactive keeps this consistent with
the body branch that already renders the draft editor in that case.

**The falsifier, so a future reader knows the limit of the evidence.** If an `active` table can ever
return to `pending`, hiding the tab conceals history exactly when it matters most — a table that lost
its schema is the case an auditor most wants to read. That transition was **not** observed in the
data and was **not** verified in the status-transition code; the evidence above is about tables that
have never been materialized, and it does not extend to a table that was. If the transition turns out
to exist, the fix is to widen condition 2 (to "active, or has ever been active") rather than to drop
it, and the D12 scenarios are the two that change.

*Alternatives rejected:*

- **A tab strip with a single `Properties` tab on a draft table.** Rejected: a one-tab strip is chrome
  with no function — nothing to switch to — and it costs vertical space on the very view (the draft
  schema editor) that needs the most. It would also mean two distinct no-Audit renderings, one for the
  flag and one for the status, where the product outcome is identical.
- **Render the Audit tab disabled with a tooltip on a draft table.** Rejected for the same reason the
  proposal rejects a disabled Rollback: a disabled control advertises something that does not exist
  for this resource, and here the user cannot act to enable it except by materializing the table.
- **Keep the tab at every status and let the empty grid state carry the message.** Rejected — this is
  the reversed decision. It is defensible in the abstract and it is what the empty state exists for,
  but it was measured: the tab is empty for *every* draft table, not for some, so the empty state
  would be the only thing it ever showed.

The earlier version of this design's Migration Plan claimed the change was inert with the flag off
because "`/tables` is unreachable while the menu group is hidden". That is **false** and has been
corrected: `src/app/[lang]/tables/[id]/page.tsx` reads only `ANALYTICS_PUBLIC_URL` and
`ANALYTICS_FLIGHT_SQL_PUBLIC_URL`, `analyticsEnabled` is consumed in exactly one place today
(`menu-configuration.tsx:267`), and a hidden menu item is not a route guard — a bookmark still opens
the detail view. Without the tab condition, an analytics-disabled install would issue analytics
activity requests from a page it still renders.

*Alternative rejected:* guarding the route in `page.tsx` with a `notFound()` on
`!isValueTruthy(process.env.ANALYTICS_ENABLED)`. It is arguably the more correct guard, and it is
out of scope: it changes what the whole tables feature does when analytics is off, on every one of
its routes, and it belongs to whoever owns that decision. Named here so the next reader knows it was
considered rather than missed.

### D13 — A child activity of a table `Delete` is not listed; the rule is keyed on the parent

The owner's addition after the first pass: deleting a table floods the audit list, and the per-column
child rows are to be hidden. This is one rule, applied in one place, and its narrowness is what makes
it safe.

**The evidence, checked against the live analytics backend rather than reasoned about.** Described as
a shape, per the house rule that no record-specific data enters an OpenSpec artifact:

- deleting one table produced exactly **one** parent `Table`/`Delete` activity and **one**
  `TableColumn`/`Delete` activity per column of that table, all in the one revision, each child
  carrying `parentActivityId` pointing at the parent;
- the parent's own detail view already shows every one of them: the deleting revision has no snapshot
  (`HTTP 404 revision_not_found` — the table is gone), the previous revision holds the table with all
  of its columns, so D11's diff renders one `Removed` group per column. **The child rows carry no fact
  the parent's view lacks**, and each child's own detail view is that same whole-table diff reached
  from a row that names one column;
- the rule separates noise from signal exactly, because a column `Delete` does **not** always sit
  under a table `Delete`: a single column dropped from a living table is a `TableColumn`/`Delete`
  whose parent is a `Table`/**`Update`**. That row stays, because "who dropped a column" is one of the
  two questions the ticket names.

**Why the parent's activity type is the only usable key.** Nothing on the child distinguishes the two
cases — both are `TableColumn`/`Delete`, both carry a parent identifier, both name `<table>:<column>`.
Sibling count does not distinguish them either (dropping every column one at a time would look
identical). The distinguishing fact lives entirely on the parent, so the implementation has to hold
the parent.

**How the implementation gets the parent's `activityType`, which a child row does not carry.** A batch
lookup on the same feed, mirroring the parent/child machinery `List.tsx` already runs for the `Config`
view — which fetches *children* by `parentActivityId in <ids>` and caches them in a ref. The analytics
suppression is its mirror image:

1. every fetched row is cached by `activityId` first, so a parent that arrived in the same page costs
   nothing — the common case, since a revision's activities share a timestamp and the feed's total
   ordering is `epochTimestampMs desc, revision, activityId`;
2. the still-unresolved `parentActivityId` values of that page are requested in **one** call,
   `{ column: 'activityId', operator: 'in', value: ids.join(',') }`, with no other filter;
3. rows whose resolved parent is `{ resourceType: Table, activityType: Delete }` are dropped before
   the row buffer, at the same point the existing table-scope narrowing already drops rows.

Three facts make step 2 safe, and all three were read rather than assumed:

- **`activityId` is filterable.** The analytics backend's feed allow-list is
  `AuditActivityService.PAGE_MAPPER`, and it binds `activityId` as `FilterableColumn.uuid("activityId")`.
  A column outside that list is a `400 invalid_filter_column`, so this had to be checked, not guessed.
- **`in` applies to a UUID column.** `PageEntityMapper.in(...)` splits the value on commas, trims each
  member and coerces it through the column's own type; only `co`/`nc` (non-textual) and
  `lt/gt/le/ge` (unordered) are rejected for a UUID.
- **One request suffices per page.** A page holds at most `PAGE_SIZE` rows, hence at most `PAGE_SIZE`
  distinct parent ids, so a single `PAGE_SIZE` request returns all of them. Do **not** copy the
  children lookup's inner paging loop — that loop exists because one parent can have many children,
  which is the opposite direction.

**Where it belongs: the view, not the backend and not the resolver.** `ACTIVITY_AUDIT_VIEW_CONFIG`
already declares the per-view facets (`hasParentChildAggregation`, `hasRollback`, `isRowNavigable`),
and the analytics datasource already narrows its own feed (`isResourceIdInTableScope`). So this is one
more declared facet — `hasDeletedParentSuppression`, true for `Analytics` only — plus a pure module
under `src/utils/audit/`, plus the resolution step inside the existing buffer loop. No backend change
is possible in this change and none is needed: the feed cannot express "whose parent is a delete" in
one query, because filters are conjunctive over a single row's own columns with no join to the parent.

**Fail-open, deliberately.** An unresolved parent leaves its child listed, and a failed resolution
request leaves the whole page listed rather than failing the grid. Hiding a row on the absence of
evidence is the failure mode an audit surface must not have; showing a redundant row is the one it can
afford.

*Alternatives rejected:*

- **Turn on parent/child aggregation for the Analytics view** (`hasParentChildAggregation: true`, the
  `Config` view's mechanism). Superseded by the owner. It keeps every child row and only nests it, so
  the flood becomes an expander the reader still has to reason about, and it leaves the nonsensical
  per-column detail page reachable from inside the group. It also costs a children lookup per page for
  *every* parent, delete or not.
- **Narrow a child column activity's diff to its own column** on the detail page. Superseded by the
  owner, and it is the more expensive half of a two-mechanism answer: it needs a second shaping path
  in the diff engine D11 just finished, and it does nothing about the list. The owner's rule is better
  precisely because one rule removes the noise from the list **and** removes the nonsensical detail
  page with it — the row that led there no longer exists.
- **Suppress by resource type: hide `TableColumn`/`Delete` rows.** Rejected: it deletes the answer to
  "who dropped a column", the case the manager measured on a living table. This is the mistake the
  parent-keyed rule exists to avoid.
- **Suppress by co-presence in the page** — hide a child whose parent `Table`/`Delete` row happens to
  be in the same fetched page. Rejected: no request, but it is wrong under a page boundary, under a
  non-default sort and under any column filter, and it fails *silently* and *intermittently*, which is
  the worst shape a bug in an audit list can have.
- **Do it in the server action or a new backend query.** Rejected: the feed cannot express it (no join
  to the parent), so the server action would run the same two calls, one process further from the
  buffer that needs the answer, and the `Config`/`Deployments` fetchers would have to grow a flag they
  never use.

*Residual risk, accepted:* **a deep link to a hidden child's detail URL still renders the whole-table
`Removed` diff**, because only the list filters. I accept it, for four reasons. Nothing in the product
links there any more — the row that produced the link is gone, so reaching it takes a pasted URL or an
old bookmark. What it renders is *truthful*, merely redundant: it is the parent's diff, and the
activity is a real one, so answering `404` for an activity the backend knows would be a worse lie than
showing it. Blocking it means a second mechanism — a parent lookup inside
`getActivityAuditDetailData`, on the detail page's critical path for every analytics activity — which
is exactly the two-mechanism answer the owner's rule replaced. And it is cheaply reversible if it ever
matters: the same pure predicate, applied server-side in the resolver, is the whole fix.

*Falsifier, so a future reader knows the limit:* the rule hides **any** child of a table `Delete`, not
only a `TableColumn` one. Today those are the same set — the analytics backend's parent rules give a
`Table` activity exactly two kinds of child, `TableColumn` activities and bulk-bumped `Pipeline`
activities, and the latter's parent is always a `version_column` repoint, i.e. a `Table` `Update`; a
pipeline deleted because its target table was deleted is recorded with **no** parent at all. If the
backend ever gives a table `Delete` a child of a kind whose state the table's own snapshot does not
carry, this rule would hide it, and the fix is to narrow the predicate to `TableColumn` children.

*Second residual, named because it looks like a bug:* filtering the `Resource type` column to
`Table column` while a table delete is in range shows neither the children (suppressed) nor the parent
(filtered out), so that deletion is invisible under that filter. That is what a filter does, and
clearing it shows the parent row; no mitigation is specified.

### D14 — The Pipelines Audit tab (follow-up, issue #4475)

Files this section governs: `src/components/Analytics/Pipelines/PipelineAudit.tsx` (new),
`src/components/Analytics/Pipelines/Common/PipelineDetailFrame.tsx`,
`src/types/activity-audit.ts`, `src/constants/activity-audit.ts`,
`src/utils/audit/entity-audit-filters.ts`, `src/components/ActivityAudit/List/List.tsx`,
`src/components/ActivityAudit/List/view-config.ts`,
`src/components/ActivityAudit/List/utils.tsx`. Spec deltas:
`specs/analytics/pipelines/spec.md` and the column-set paragraph of
`specs/activity-audit-analytics-view/spec.md`.

This is one further iteration of the same change, not a second change: one branch, one pull request,
tasks numbered from 9. Nothing in sections 1–8 is reopened. Three things are settled here and
nothing else: the column set (D14.1), the gate (D14.2), and where the tab strip goes (D14.3).
`/queries/{id}` is out (issue #4476 — `QueryBuilder` is not an entity detail view), evaluators are
out permanently (the analytics backend does not audit them), and **D13 is not touched** — see D14.4.

**Where the delta lives.** `specs/analytics/spec.md` under this change held the tables requirements;
it was relocated **verbatim** to `specs/analytics/tables/spec.md`, and the new requirements go to
`specs/analytics/pipelines/spec.md`. The reason is the analytics split that happened after D1 was
written: `analytics/spec.md` is now the index and carries only what every Analytics page shares, so
archiving the delta where it was would have folded table requirements into that index. D1 carries a
correction line pointing here.

#### D14.1 — The Pipelines tab reads as a single-entity view, decided from the resource type

The Pipelines tab's feed carries exactly one resource type and one resource identifier, so
`Resource type` / `Resource identifier` would print the same pair (`Pipeline` / `<name>`) on every
row. The tab therefore uses the single-entity column set — the one every other per-entity Audit tab
in the app uses — while still offering no `Rollback`, which no other view's single-entity set can say.

**The mechanism: one predicate over the resource type, consulted where `isSingleEntity` is already
derived.** Add `hasChildResourceActivities(type?: string)` to `src/types/activity-audit.ts`, beside
`isAnalyticsResource` and `isDeploymentManagerResource`, backed by a set holding exactly
`ActivityAuditResourceType.TABLE`. It answers "does this resource type own activities of another
resource type?" — true for `Table`, which owns `TableColumn`; false for everything else, including
every admin and deployment-manager type. Then:

- `List.tsx` computes `isSingleEntity: !!entity && !hasChildResourceActivities(entityType)` instead of
  `!!entity`. For `Config` and `Deployments` the value is **identical** — none of their entity types
  is in the set — so those two views are unchanged by construction, and the existing
  `Config entity audit tab :: keeps the single-entity column set` test is the check.
- `ACTIVITY_AUDIT_VIEW_CONFIG[Analytics].getColumns` stops discarding `isSingleEntity` and forwards
  it: `getAnalyticsActivityAuditColumns(t, open, isSingleEntity)`, which passes it to
  `ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Analytics, isSingleEntity)`. No edit to
  `ACTIVITY_AUDIT_COLUMNS`: that call already yields no expander, no `Version`, and — with the flag
  true — no `Resource type` / `Resource identifier`.
- The same predicate decides the **request**. `getEntityAuditFilters`' `Analytics` branch (the
  `resourceType in "Table,TableColumn"` + `resourceId co <name>` pair D3 needs) applies only when
  `hasChildResourceActivities(entityType)`; otherwise the function falls through to the exact
  `resourceId eq` + `resourceType eq` pair it already builds for `Config` and `Deployments`. That is
  the whole query for a pipeline: a `Pipeline` resource id is its name and is never compound, so
  there is nothing to widen and nothing to narrow back.
- The same predicate gates `analyticsTableScope` in `List.tsx`, so `isResourceIdInTableScope` does not
  run for a pipeline tab. It would be harmless there (a pipeline's id matches its own name exactly),
  but a narrowing predicate that runs where nothing can be narrowed is a trap for the next reader.

**This changes `isSingleEntity`'s meaning, deliberately.** It becomes "this list is about a single
entity — one resource type, one identifier" rather than "an entity was passed". A table Audit tab is
genuinely not that: it is about a table *and its columns*, which is exactly why D3 keeps both columns
visible there. The sharpened meaning is what makes one flag serve both tabs.

*One existing assertion changes and it must:*
`view-config.spec.ts :: Analytics delegates to the analytics column factory and passes it no rollback
handler` asserts `getAnalyticsActivityAuditColumns` is called with exactly `(t, open)` while passing
`isSingleEntity: true`. That assertion encodes the behaviour being changed — Analytics ignoring the
flag — so its argument list gains the flag. **Every other assertion in `view-config.spec.ts` and
`List.spec.tsx` stays, unmodified, and must stay green**, including the whole
`ActivityAuditList :: Analytics entity audit tab` block: that block renders with
`entityType={ActivityAuditResourceType.TABLE}`, so the predicate answers true for it and the Tables
tab's request, columns and narrowing are untouched.

*Alternatives rejected:*

- **Live with the two redundant columns.** Rejected: it is not wrong, but it makes the one tab in the
  app that is about a single resource look like a multi-resource list, and it wastes the two widest
  columns on constants. It is also the cheapest to reverse if this is judged wrong — delete the
  predicate's use in three places.
- **Thread an `isSingleEntity` argument per call site, from `PipelineAudit`/`TableAudit` through
  `EntityAudit` down to the list.** Rejected twice over: it widens a shared component's props to fit
  one caller, which `use-don't-edit-shared-components` forbids, and it puts a presentation decision in
  the hands of every future caller, so the next Analytics tab gets it wrong by omission. The fact is
  about the resource type, not about the caller.
- **A second Analytics-scoped entry in `ACTIVITY_AUDIT_VIEW_CONFIG`.** Rejected: the config is keyed
  by `ActivityAuditView`, which is the `View` selector's enum — a fourth member would add a fourth
  option to that dropdown and to the per-view storage keys. Making the key a pair (view, resource
  type) would grow the record from three entries to a dozen to express one boolean.
- **Branch inside `getAnalyticsActivityAuditColumns` on the entity.** Rejected: the column factory
  takes `t` and a callback and knows nothing about entities; giving it one would make it the second
  place that knows which resource types have children.

*What would falsify this:* the analytics backend giving `Pipeline` a child resource type — a
per-binding or per-measure activity, say. Then a pipeline tab carries two resource types, the two
columns are needed again, and the fix is one member added to the predicate's set, plus the `co`
branch in `getEntityAuditFilters` and the scope narrowing that member then inherits. That is the whole
reason the decision is keyed on a predicate over the type rather than on `resourceType === 'Pipeline'`
spelled out at each site.

#### D14.2 — The gate is the analytics flag alone; there is no pipeline-status condition

`featureFlags.analyticsEnabled` from `useAppContext`, and nothing else. D12's second condition —
`table.status === TableStatus.Active` — has no analogue, and BA's finding is confirmed against
`PipelineDetailFrame` and the pipelines spec:

- there is no registration lifecycle to gate on. `POST /v1/pipelines` creates a pipeline whole
  (*The create modal collects a complete pipeline of one kind in one request*), so there is no
  `pending` state in which a pipeline exists with no history. Every registered pipeline carries at
  least a `Create` activity;
- `enabled` is **not** that condition and must not be used as one. It is a runtime toggle; a disabled
  pipeline is fully registered, and toggling it is itself an audited `Update`
  (`PATCH /v1/pipelines/{name}`, with no exception for the flag). Gating on it would hide history
  exactly when someone asks who turned the pipeline off;
- `state` (last run, lag, failures) describes execution, not registration, and a pipeline that has
  never run still has a `Create`.

The **route** is not guarded, for the same reason as D12: `/pipelines/[name]/page.tsx` guards on
`isAnalyticsForbidden()`, which is an authorization probe against the analytics service
(`analyticsDataApi.checkAccess` → `403`), not a read of `ANALYTICS_ENABLED`. So a bookmarked link
opens this view on an analytics-disabled install, and the tab condition is the only thing that keeps
it from issuing an activity request. Do not add a `notFound()` on the flag — that is a decision about
the whole pipelines feature, out of scope here exactly as it was in D12.

*Alternatives rejected:* a status-shaped condition invented from `enabled` (see above — it hides the
history of the toggle itself); rendering the Audit tab disabled with a tooltip on some pipelines
(there is no pipeline for which it would be empty by construction, so there is nothing to explain);
gating on `isFullAdmin` (the analytics backend authorizes a pipeline's activity feed at exactly the
bar reading the pipeline already requires — the ADAS *Resource-specific narrowing of the audit
surface* requirement — so a permission gate here would hide history from readers the backend serves).

*What would falsify this:* a pipeline the analytics feed answers with `total: 0` for. The tab then
shows an empty grid, which is specified (*Pipeline with no recorded history*) and is a real case for a
pipeline registered before the audit trail existed — but if it turns out to be the *common* case, D12's
argument applies and the gate needs a second condition. It was **not** measured against a live backend
in this iteration: it rests on the ADAS `audit-trail` spec's text that a `Create` is recorded
synchronously on `POST /v1/pipelines`. That is why *A newly registered pipeline lists its Create
activity* is one of the two scenarios sent to the browser.

#### D14.3 — `PipelineDetailFrame` becomes the shell; the tab strip sits below the identity row

The strip goes **inside `PipelineDetailFrame`**, between the identity row and the body, and the Audit
tab replaces only the body. `PipelineDetailView` (31 lines, the kind switch) and the two kind views
are untouched, so both kinds get the tab in one place and the file every open PR on this area touches
stays where it is.

Two facts force it inside the frame rather than above it:

1. **The draft lives above the frame.** `useEnrichForm` / `useAggregateForm` are called in
   `EnrichDetailView` / `AggregateDetailView` and passed down as `form`. A strip in
   `PipelineDetailView` that swapped out `<EnrichDetailView/>` for the Audit tab would unmount the
   hook and silently discard a pending edit — and take the `Discard` / `Save` bar with it.
2. **The identity row is the header.** The badge, the name, the change bar, the enable/disable control
   and the JSON toggle all live in the frame's top row, and D6's rule applies unchanged: header
   actions stay above the strip and are visible from either tab. There is nothing to extract — unlike
   `TableDetailView`, the frame's body is already three components deep, so the Properties content
   needs no new file.

**The JSON editor and the strip are never on screen together.** *The pipeline JSON editor takes the
whole view* already requires that everything below the identity row is withdrawn while the editor is
open; the strip is below that row, so it is withdrawn with the rest, and leaving the editor brings it
back with `Properties` selected. That reading needs no modification to the JSON requirements and it
keeps their invariant intact: the strip cannot become a second way to park a pending document edit
behind a presentation the caller switched away from.

*Alternatives rejected:*

- **The strip above the frame, in `PipelineDetailView`.** Rejected: it discards pending edits (see
  above) and hides the header, the status badge and the save bar behind the Audit tab.
- **A new `PipelineDetailShell` wrapping the frame.** Rejected: it would have to receive `form` and
  the pipeline to render the identity row, i.e. it would be the frame with a different name, and it
  would split one 229-line component into two files that only ever appear together.
- **Extract a `PipelineProperties.tsx` the way D6 extracted `TableProperties.tsx`.** Rejected as
  unnecessary here: `TableDetailView` had ~350 lines of body inline, while the frame's body is already
  `PipelineReadOnlyFacts` + `children` + `PipelineStateSection`. Extracting would be a move with no
  reader benefit and would collide with the same open PRs.
- **Withhold the JSON toggle while the Audit tab is selected.** Rejected: *The pipeline detail page
  can be edited as JSON instead of as fields* says the toggle is offered to every caller, and making
  it depend on the selected tab would narrow a shipped requirement to buy a smoother transition.
  Enabling the editor from the Audit tab withdrawing the strip is abrupt but coherent, and it is the
  same rule read from the other direction.
- **Keep the strip visible while the editor is open.** Rejected: it makes *the page presents the
  document and nothing else below the identity row* literally false, for no gain.

#### D14.4 — D13 is not extended, and that is a decision rather than an omission

A pipeline row can never be suppressed by D13, structurally. D13 fires only on a resolved parent whose
`resourceType` is `Table` **and** whose `activityType` is `Delete`. A `Pipeline` activity has a parent
in exactly one case — the bulk generation bump — and that parent is always a `Table` **`Update`**; the
`Pipeline` `Delete` recorded when its *target* table is deleted carries **no** `parentActivityId` at
all, because a pipeline's owner for this purpose is the table it reads, not the one it writes. An
unparented row is never looked up against the predicate, and D13 is fail-open on an unresolved parent
anyway.

So no code change, and none should be made: widening the suppression to catch the target-table case
would extend it past what the ADAS spec says happens, which is the failure mode D13's own rejected
alternative (*suppress by resource type*) exists to avoid. The pipelines delta states the
non-suppression as a requirement so a later edit to D13 has something to fail against.

*Not verified live, accepted on the spec's text:* that the target-table `Delete` genuinely carries no
parent in a real response. Reproducing it means deleting a table in a live stack, which no task in
this change will do; the risk is bounded because D13 is fail-open — if the parent were present and
resolved to a `Table` `Delete`, one row would be missing from one tab, and the falsifier is a
`Pipeline` `Delete` row absent from a tab whose pipeline's target table was just dropped.

## Risks / Trade-offs

- **D3 contradicts one sentence of the proposal.** → It is called out here and in the return, so EM
  or BA can reverse it before dispatch. Reversing it deletes one util, one filter branch and three
  scenarios; nothing else in the design depends on it.
- **`ActivityAuditList` is on the regression surface of two shipped views, and D2 rewrites its
  branching.** → The `Config` and `Deployments` entries in `view-config.ts` are transcriptions, the
  existing `List.spec.tsx` view-aware tests are kept and must stay green, and the browser
  verification task exercises both existing views, not only the new one. First place a mistake would
  show: the Deployments view losing its flat rendering or its rollback row action.
- **The `co` + client-side narrowing in D3 over-fetches** when many table names share a substring.
  → Bounded by the page size and by how many such tables exist; the alternative (two merged streams)
  is a correctness risk, and this one is only a throughput one. Would show first as a table Audit tab
  that scrolls slowly on an install with dozens of similarly named tables.
- **A `TableColumn` diff is the whole table's diff.** → Correct but broad: dropping one column is
  shown as a change to the table's column set. With D11 that is now legible rather than invisible —
  the dropped column is its own group carrying a `Removed` marker — but the page still shows the
  whole table, not just the column named in the activity. First place a complaint would surface: a
  reviewer opening a `TableColumn` activity and asking why the other nine columns are on screen.
  Not narrowed deliberately: an audit reader needs the surrounding state to judge the change.
- **D11 touches the diff engine that every resource type renders through.** `generateCurrentResource`,
  `createSectionFromDiffs`, `filterNotEmptySections`, `DiffSection` and the parameter formatter are
  shared by models, roles, containers, images and the firewall. → Every change is additive and keyed
  on the analytics resource type or on a new optional field: a new branch, a new section-order list,
  two optional model fields, one extra title source. The existing `generate-diffs`,
  `create-simple-diffs`, `create-complex-diffs`, `domain-diffs` and `DiffReport/utils` specs are the
  regression check and must stay green unmodified. First place a mistake would show: a container
  detail page losing its Environment variables section, or the firewall diff losing its
  added/removed domain rows.
- **The `role="group"` wrapper lands on every section's per-index block, not only analytics ones.**
  → That is the intended generalization (a11y.md's grouping rule applies to all of them), but it
  changes the accessibility tree of shipped diff pages, so the existing `getByRole` queries in the
  audit specs are where a break would surface first. The alternative — an analytics-only wrapper —
  would mean two markup shapes for one component, which is worse.
- **`AnalyticsTableColumn` is this repo's model of a column, and the snapshot is the backend's.** The
  snapshot walker is written against whatever keys arrive, not against the interface, so a field the
  backend adds later shows up unlabelled rather than being dropped. → If the model and the wire ever
  disagree, the diff is right and the label is missing; that is the failure direction to prefer.
- **Snapshots 404 legitimately.** The analytics backend answers `404 revision_not_found` for a table
  whose creation predates its audit trail — so on an existing install, older tables will show an
  empty comparison side. → Specified as an accepted outcome (render, don't error), and covered by a
  scenario. If a reviewer sees an empty diff on a pre-existing table, that is the spec, not a bug.
- **D13 adds a second request to some analytics pages.** A page containing rows with parents the
  cache does not hold costs one extra `activityId in …` call before its rows reach the buffer. →
  Bounded: at most one per page, none at all for a page whose rows have no parent or whose parents
  arrived in the same page (the common case, since a revision's activities share a timestamp and the
  feed's ordering is total). First place it would show: the analytics list feeling slower than the
  `Deployments` one while scrolling through a range dense in schema patches.
- **D13 changes how many rows a page yields, and the buffer loop is shared.** Suppression drops rows
  before the row buffer, at the same point the entity-tab table-scope narrowing already does. → The
  loop already refills until `endRow` and derives `lastRow` from the buffer, so the mechanism is
  proven; but a mistake here shows as a short last page or an infinite refill, in the analytics view
  first and in the table Audit tab second.
- **`tsc` is red repo-wide (~205 pre-existing errors on `development`) and spec files are
  eslint-ignored.** → Neither a green typecheck nor a clean lint proves anything about this change;
  the quality-checks task compares error counts and relies on vitest for the real signal.
- **D12's active-only condition rests on evidence about tables that were never materialized.** The
  measurement (zero activities, zero columns for every `pending` table in the stack) says nothing
  about a table that was active and returned to `pending`, and that transition was not verified in
  the status-transition code. → If it exists, the Audit tab disappears from the table whose history
  an auditor most needs. First place it would show: a user reporting that a table's audit history
  vanished, or a `pending` table whose activity feed answers a non-zero `total`. The widening fix is
  named in D12; nothing else in the change depends on the condition.
- **Merge conflict with issue #3977 (Tables RBAC) in `TableDetailView.tsx`.** → D6 keeps the file in
  place and moves the body rather than the header, so the header/permissions region #3977 edits is
  the region least disturbed.
- **This delta describes shared, pre-existing surfaces it does not own, and it was wrong about two of
  them.** The row-body click's tab target (D5) and the diff filter's label (D11) were both written
  from the change's own diff rather than from the shipped product, and browser verification caught
  both. → The pattern to distrust is a sentence about a control this change does not touch: the
  `View` selector's options, the row action menu's labels, the empty-state string. First place the
  next one would show: a QA `fail` whose evidence is a screenshot of the app behaving reasonably.
  One such is still open and deliberately unresolved — the empty grid renders AG Grid's default
  `No Rows To Show`, while *Table with no recorded history* names the existing empty state without
  quoting a string, so the scenario holds; adopting the localized `No Activities` label would be a
  behaviour change and is not in this change.

## Migration Plan

None. No data migration, no new environment variable (`DIAL_ANALYTICS_API_URL` and `ANALYTICS_ENABLED`
already exist in `.env.template`), no backend change, and no new route.

With `ANALYTICS_ENABLED` unset or `false` the change is inert, but by three explicit conditions
rather than by the route being unreachable:

1. the `Analytics` option is absent from the `View` selector, so the global page issues no analytics
   request (client flag, `useAppContext`);
2. the detail-page resolver skips its third fallback (`isValueTruthy(process.env.ANALYTICS_ENABLED)`,
   server-side — D8);
3. the table detail view renders no tab strip and no Audit tab (client flag — D12; the same
   condition also hides the tab on a non-active table whatever the flag says);
4. the pipeline detail view renders no tab strip and no Audit tab (client flag — D14.2; there is no
   second condition, and `/pipelines/{name}` is no more route-guarded on the flag than
   `/tables/{name}` is).

Condition 3 is load-bearing and was previously assumed away: `/tables/{name}` has **no** feature-flag
guard, so a bookmarked link renders the detail view on an analytics-disabled install. A hidden menu
group is not a route guard. See D12.
