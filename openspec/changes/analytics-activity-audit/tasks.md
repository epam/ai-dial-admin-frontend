# Tasks — analytics-activity-audit

Every path below is relative to `apps/ai-dial-admin/`. Run vitest from that directory or `@/` will
not resolve. Per `openspec/config.yaml`, unit tests for new and updated code are part of each task
below and are named explicitly in it — a task is not done until the spec file it names passes.

Notes for EM before dispatch:

- **`TableDetailView.tsx` must keep its name and its path.** Issue #3977 (Tables RBAC) edits the same
  file; design.md D6 deliberately extracts the body downward rather than moving the file, so the two
  conflict on as little as possible. Do not "tidy" it into a `View/` folder.
- Tasks 2.1 and 2.3 both touch shared audit code that the `Config` and `Deployments` views depend on.
  The existing tests in `src/components/ActivityAudit/List/tests/` and
  `src/constants/grid-columns/tests/formatters.spec.ts` are the regression check — they must be kept
  and stay green, not rewritten to fit the new shape.
- **Section 5 is the diff-presentation work the owner added after the first pass** (design.md D11).
  It touches the diff engine every resource type renders through. The existing specs under
  `src/components/ActivityAudit/View/utils/tests/` and
  `src/components/ActivityAudit/View/DiffReport/tests/` are the regression check for containers,
  images, roles and the firewall; keep them and keep them green.
- Three files attract more than one task each and are therefore never in the same batch:
  `List/List.tsx` (6.1 and 6.5; 6.1 also depends on 2.3's new modules),
  `List/tests/utils.spec.tsx` (2.3 adds the analytics column block, 4.2 adds the D5 guard case) and
  `List/tests/List.spec.tsx` (6.1 writes it, 6.4 extends it, 6.5 extends it again — in that order).
- **6.5 is the owner's addition after the first implementation pass** (design.md D13): a table
  `Delete`'s per-column child activities are not listed. It is numbered inside section 6 on purpose,
  so the browser-verification task (7) and the quality-checks task (8) still come after every
  implementation task without renumbering anything already done. It also means **7.1 needs a further
  pass**: the verification round that ran before 6.5 existed could not have checked its scenarios.
- Two scenarios were reworded after browser verification because the delta was wrong about the
  shipped product, not because the code was: the row body opens the detail page in a **new** tab
  (design.md D5), and the diff filter's option is labelled `Changes only`, never `Diff only`
  (design.md D11). No behaviour requirement changed, and no source file needs to change for either.

## 1. Analytics activity source and types

- [x] 1.1 In `src/types/activity-audit.ts`, add `ActivityAuditView.Analytics = 'Analytics'`, add the
      four resource types the analytics backend emits to `ActivityAuditResourceType` (`TABLE = 'Table'`,
      `TABLE_COLUMN = 'TableColumn'`, `PIPELINE = 'Pipeline'`, `SAVED_QUERY = 'SavedQuery'`), and add an
      `isAnalyticsResource` predicate backed by an `ANALYTICS_RESOURCE_TYPES` set, colocated with the
      existing `isDeploymentManagerResource` / `isContainerDeploymentResource` predicates as
      `activity-audit-deployments-detail`'s "Resource-type predicates colocated with the type enum"
      requires. Extend `src/types/tests/activity-audit.spec.ts` with an `isAnalyticsResource` describe
      block covering the four types, a deployment type, an admin type, and `undefined`. Verify with
      `npx vitest run src/types/tests/activity-audit.spec.ts`.

- [x] 1.2 Add `src/server/analytics/audit-api.ts` exporting `AnalyticsAuditApi extends BaseApi` with
      `getActivitiesList(pageSize, pageNumber, token, sorts, filters)` (`POST v1/activities`),
      `getActivityById(id, token)` (`GET v1/activities/{id}`) and
      `getRevisionDetails(url, token)` (`GET v1{url}`) — the same three methods
      `src/server/deployments/audit-api.ts` and `src/server/entities/activity-audit-api.ts` expose,
      with the analytics `v1/` prefix rather than `api/v1/` (see `src/server/analytics/analytics-data-api.ts`
      for the prefix convention). Register `analyticsAuditApi` in `src/app/api/api.ts` on
      `process.env.DIAL_ANALYTICS_API_URL`, beside `analyticsDataApi`. Add `getAnalyticsActivities` to
      `src/app/[lang]/activity-audit/actions.ts` alongside `getActivities` / `getDeploymentActivities`,
      authenticating through `getUserToken` exactly as they do. Add
      `src/server/analytics/tests/audit-api.spec.ts` asserting the called URL, the request body shape
      (`pageNumber`, `pageSize`, `sorts`, `filters`), the parsed `{total, totalPages, data}` response and
      the failure path; extend `src/app/[lang]/activity-audit/actions.spec.ts` with a case asserting
      `getAnalyticsActivities` delegates to the client with the token. Verify with
      `npx vitest run src/server/analytics/tests/audit-api.spec.ts "src/app/[lang]/activity-audit/actions.spec.ts"`.

- [x] 1.3 In `src/constants/i18n.ts` and `src/locales/en.ts`, add every new i18n key this change
      needs — the four for the view option and the new resource-type labels, and the four the analytics
      revision diff needs for its column group headings and status markers (design.md D11). No field
      labels are added: `AnalyticsTablesI18nKey` already defines every table and column field label the
      diff uses, and `EntitiesI18nKey.Table` already exists for the `Table` resource-type label. This
      task adds keys only; nothing consumes them until 2.1, 5.2 and 6.1.

## 2. Shared audit utilities

- [x] 2.1 In `src/constants/grid-columns/formatters.ts`, extend `getFormattedResourceType` so the four
      analytics resource types return their localized labels (`Table` → `EntitiesI18nKey.Table`,
      `TableColumn` → `EntitiesI18nKey.AnalyticsTableColumn`, `Pipeline` →
      `EntitiesI18nKey.AnalyticsPipeline`, `SavedQuery` → `EntitiesI18nKey.AnalyticsSavedQuery`), adding
      them to the existing `switch` rather than a new branch chain. Extend
      `src/constants/grid-columns/tests/formatters.spec.ts` with a case per new type **and** the guard
      test design.md D7 requires, naming its expected sets rather than asserting "unchanged": after the
      additions the built label map still resolves `global firewall` to exactly
      `[IMAGE_BUILD_DOMAIN_WHITELIST]`, the image label to exactly the four `*_IMAGE_DEFINITION`
      members, the model-serving label to exactly `[NIM_DEPLOYMENT, INFERENCE_DEPLOYMENT]`, each of the
      four container labels to exactly one member, and no analytics label equals any pre-existing label.
      Verify with `npx vitest run src/constants/grid-columns/tests/formatters.spec.ts`.

- [x] 2.2 Add `src/utils/audit/analytics-resource-id.ts` with two pure functions:
      `getTableNameFromAnalyticsResourceId(resourceId)` (the part before the first `:`, or the whole
      value when there is none) and `isResourceIdInTableScope(resourceId, tableName)` (true when
      `resourceId` equals `tableName` or starts with `` `${tableName}:` ``). In
      `src/utils/audit/get-revision-route.ts`, add the analytics cases to
      `getRevisionRouteForEntityType`: `TABLE` → `` `/tables/${id}/revision/` ``, `TABLE_COLUMN` →
      the same route built from `getTableNameFromAnalyticsResourceId(id)`, `PIPELINE` →
      `` `/pipelines/${id}/revision/` ``, `SAVED_QUERY` → `` `/saved-queries/${id}/revision/` ``.
      Add `src/utils/audit/tests/analytics-resource-id.spec.ts` (positive, no-separator, empty,
      similarly-named-table, and `undefined` cases) and extend
      `src/utils/audit/tests/get-revision-route.spec.ts` with the four new routes. Verify with
      `npx vitest run src/utils/audit/tests/analytics-resource-id.spec.ts src/utils/audit/tests/get-revision-route.spec.ts`.

- [x] 2.3 Replace the fetcher ternary at `src/components/ActivityAudit/List/List.tsx:211` with a
      per-view lookup, per design.md D2: add `src/components/ActivityAudit/List/models.ts` with the
      `ActivityAuditViewConfig` interface and `src/components/ActivityAudit/List/view-config.ts`
      exporting `ACTIVITY_AUDIT_VIEW_CONFIG: Record<ActivityAuditView, ActivityAuditViewConfig>` whose
      fields are `fetchActivities`, `getColumns`, `hasParentChildAggregation`, `hasRollback`,
      `isRowNavigable` and `getEntityActivityHref` — the `Config` and `Deployments` entries being exact
      transcriptions of today's behavior, including the entity-mode `isSingleEntity` column set and its
      row Rollback action, which must survive for those two views. In
      `src/components/ActivityAudit/List/utils.tsx` add `getAnalyticsActivityAuditColumns(t, open)`
      returning `[...ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Analytics), ACTION_COLUMN([openInNewTab])]`
      — no rollback action, and `ACTIVITY_AUDIT_COLUMNS` itself needs no edit, since that view value
      already yields no expander, no `Version`, and a visible `Resource type` / `Resource identifier`
      pair. Add `src/utils/audit/entity-audit-filters.ts` exporting
      `getEntityAuditFilters(entity, entityType, view)`, returning today's
      `resourceId eq` + `resourceType eq` pair for `Config` and `Deployments` and, for `Analytics`,
      `resourceType in "Table,TableColumn"` + `resourceId co <table name>` per design.md D3. Add
      `src/components/ActivityAudit/List/tests/view-config.spec.ts` (every enum member has an entry;
      the `Config` and `Deployments` entries name today's fetchers and column factories; `Analytics`
      has `hasRollback: false` and `hasParentChildAggregation: false`) and
      `src/utils/audit/tests/entity-audit-filters.spec.ts`; extend
      `src/components/ActivityAudit/List/tests/utils.spec.tsx` with a
      `getAnalyticsActivityAuditColumns` block asserting the column ids and the absence of a rollback
      action. Verify with
      `npx vitest run src/components/ActivityAudit/List/tests/view-config.spec.ts src/components/ActivityAudit/List/tests/utils.spec.tsx src/utils/audit/tests/entity-audit-filters.spec.ts`.

## 3. Audit detail resolution

- [x] 3.1 In `src/utils/audit/get-activity-audit-detail-data.ts`, add analytics as the third and last
      step of the `getActivityById` fallback chain, issued only when
      `isValueTruthy(process.env.ANALYTICS_ENABLED)` — the helper from `@/src/utils/types`, which is
      `value === 'true'` and is how `layout.tsx:61` reads this same variable. A bare truthiness check on
      `process.env.ANALYTICS_ENABLED` reads the string `"false"` as enabled and would make this resolver
      disagree with the client flag (design.md D8). Add an `analyticsHandlers` entry to
      `pickActivityHandlers` using `filterByResourceId`, `makeRouteSnapshotFetcher(analyticsAuditApi)`
      and `makeListActivities(analyticsAuditApi)`. Leave the admin and deployment branches untouched.
      Add `src/utils/audit/tests/get-activity-audit-detail-data.spec.ts` covering: an admin activity
      resolving with neither of the other two lookups issued; a deployment activity resolving with no
      analytics lookup issued; an analytics activity resolving after both miss, with its current,
      previous and latest-revision snapshots fetched in parallel; no analytics lookup when
      `ANALYTICS_ENABLED` is unset **and** a second case with it set to the string `"false"`; and a
      snapshot the backend answers as absent producing a `null` revision rather than a throw. Verify
      with `npx vitest run src/utils/audit/tests/get-activity-audit-detail-data.spec.ts`.

## 4. Audit detail page chrome

Both tasks in this section fix controls in `src/components/ActivityAudit/View/**` that are
unconditional on resource type today, and that the change's own scenarios require the analytics
detail page to render past.

- [x] 4.1 In `src/components/ActivityAudit/View/AuditView.tsx`, stop rendering the `Rollback resource`
      button for analytics activities: the button at `:221` is conditional only on `!isReadOnlyAdmin`,
      and `resourceRollback` (`:133`) falls through to `rollbackEntityPerRevision` against the **admin**
      backend for a resource it does not own (design.md D9). Gate the button on
      `!isAnalyticsResource(activity.resourceType)` in addition to the existing condition; render no
      disabled control in its place; change nothing else — the confirmation popup, the notifications and
      the post-rollback navigation stay as they are for the types that still offer it. Extend
      `src/components/ActivityAudit/View/tests/AuditView.spec.tsx`, keeping every existing case, with:
      no `Rollback resource` button for a `Table` and for a `TableColumn` activity given a non-read-only
      viewer; the button still rendered for a `Model` activity given the same viewer; and no disabled
      rollback control present in the analytics case. Verify with
      `npx vitest run src/components/ActivityAudit/View/tests/AuditView.spec.tsx`.

- [x] 4.2 Fix the header's resource external link for analytics activities, per design.md D10. In
      `src/components/ActivityAudit/View/Header/utils.ts` add a pure
      `getAuditResourceHref(resourceType, resourceId)` returning a path or `undefined`: analytics types
      resolve through a local `ANALYTICS_RESOURCE_ROUTE` map (`TABLE` and `TABLE_COLUMN` →
      `ApplicationRoute.AnalyticsTables` with `getTableNameFromAnalyticsResourceId(resourceId)` from
      2.2, `PIPELINE` → `ApplicationRoute.AnalyticsPipelines`, `SAVED_QUERY` →
      `ApplicationRoute.AnalyticsQueries`), every other type through `auditResourceRoute` as today, and
      `undefined` when nothing resolves. In `src/components/ActivityAudit/View/Header/Header.tsx`, build
      `openResourceInNewTab` from that helper and render the external-link `DialIconButton` only when it
      returns a path — today an unregistered type produces `/{locale}/undefined/{resourceId}`.
      **Do not add analytics entries to `auditResourceRoute`**: `getAuditActivityHref`
      (`List/utils.tsx:184`) reads the same map, and an entry there would make every analytics row's
      href `/tables/{name}/{activityId}`, the entity-namespaced route design.md D5 deliberately does not
      create — a 404 on every row click, undoing D5 silently. Add a comment above `auditResourceRoute`
      in `src/constants/activity-audit.ts` saying that, and extend the existing
      `returns empty href for a resource type not registered in auditResourceRoute` case in
      `src/components/ActivityAudit/List/tests/utils.spec.tsx` with `TABLE` and `TABLE_COLUMN`, naming
      D5 in the test name so a later edit to the map fails here. Add
      `src/components/ActivityAudit/View/Header/test/utils.spec.ts` cases for the four analytics types,
      the `<table>:<column>` split and the unresolvable case, and extend
      `src/components/ActivityAudit/View/Header/test/Header.spec.tsx` with: a `Table` activity's link
      opening `/en/tables/orders`, a `TableColumn` activity with `resourceId` `orders:total` opening
      `/en/tables/orders`, and no link button rendered for an activity whose type has no route. Verify
      with `npx vitest run src/components/ActivityAudit/View/Header/test/utils.spec.ts src/components/ActivityAudit/View/Header/test/Header.spec.tsx src/components/ActivityAudit/List/tests/utils.spec.tsx`.

## 5. Analytics revision diff

Design.md D11 is the whole specification of this section; read it before starting. The reason it is
engine work and not styling: `compareObjectTypes` / `fillObjectTypes` in `generate-diffs.ts` are
`else if` chains over known key sets with no final `else`, and `createSectionFromDiffs` iterates a
fixed list of section names — so a table snapshot's `columns`, `grain`, `partition_by`,
`ordering_key` and `tag_order` are not rendered badly today, they are not rendered at all.

- [x] 5.1 Add `src/components/ActivityAudit/View/utils/analytics-diffs.ts` with the pure builder for
      an analytics snapshot diff: a snapshot walker projecting any snapshot object to `FlatRow[]`
      (scalar → one row; nested object → one row per leaf with a dotted parameter such as
      `grain.grain_key`; array of scalars → one row joining the elements **in the snapshot's order**,
      never sorted, because `ordering_key` and `tag_order` mean their order); a `columnRows(column)`
      projector emitting `name`, `type`, `element_type`, `enum_values`, `nullable`, `tag`,
      `display_name`, `description`, `sensitive`; and a builder that fills the `properties` bucket from
      every non-`columns` field and one `columns:<name>` bucket per column name present in **either**
      revision, ordered by name. No hidden-key set — every field is shown. Compare each bucket with
      `compareNestedFlatObject` and fill it with `fillNestedFlatObject` from
      `View/utils/create-simple-diffs.ts`, which already emits the `MIRROR` placeholder on the side a
      field is missing from; unlike `compareMetadataEnvs` (`generate-diffs.ts:433`) this builder must
      emit in **both** directions, so a column present only on one side still produces a group on both.
      Add `COLUMNS = 'columns'` to `EntityParameterKeys` in
      `src/components/ActivityAudit/constants.ts`. In
      `src/components/ActivityAudit/View/utils/generate-diffs.ts`, branch
      `generateCurrentResource` to the new builder when `isAnalyticsResource(type)`, and add an
      analytics branch to `createSectionFromDiffs` beside the existing `setRolesDiffs` /
      `setObjectsArrayDiff` ones that collects the `columns:<name>` buckets in name order into
      `sections.columns`, plus an `ANALYTICS_SECTION_ORDER` appended after the container and admin
      orders. Every non-analytics resource type must take exactly the path it takes today. Add
      `src/components/ActivityAudit/View/utils/tests/analytics-diffs.spec.ts` covering: every snapshot
      field producing a row; a nested object flattened to dotted parameters; an ordered array joined in
      declared order and not sorted; one bucket per column, name-ordered; a column present only in the
      newer revision producing rows marked added on one side and placeholders on the other; the same for
      a column present only in the older revision; a changed attribute marked changed with the column's
      unchanged rows still emitted; and an empty/absent snapshot on one side. Extend
      `src/components/ActivityAudit/View/utils/tests/generate-diffs.spec.ts` with the analytics branch
      and a case proving a container snapshot's sections are unchanged. Verify with
      `npx vitest run src/components/ActivityAudit/View/utils/tests/analytics-diffs.spec.ts src/components/ActivityAudit/View/utils/tests/generate-diffs.spec.ts`.

- [x] 5.2 Render the grouped diff, per design.md D11 parts 3 and 4. In
      `src/models/activity-audit.ts` add two optional fields to `ActivityAuditDiffSection` —
      `label?: string` and `diffStatus?: DiffStatus` — and thread them through
      `filterNotEmptySections` in `src/components/ActivityAudit/View/DiffReport/utils.ts`, which today
      discards everything but `current` / `compare`. In
      `src/components/ActivityAudit/View/DiffReport/DiffSection.tsx`, prefer a section entry's `label`
      over the `EntityFieldsI18nKey[name]` title lookup for the per-index heading — generalizing the
      existing `name === METADATA ? 'Variable N ' : ''` prefix — render the status word
      (`CompareI18nKey.Added` / `Removed` / `Changed`) as visible text beside it, and wrap each
      per-index block in a `role="group"` whose `aria-label` carries both the column name and the
      status, as `.claude/rules/a11y.md` requires for a collection with per-item visual treatments.
      Do not change the row-level colour treatment of any diff, and do not add a status column to the
      grids. In `src/components/ActivityAudit/EntityGrid/constants.ts` add an exported
      `ANALYTICS_ROW_LABEL_KEYS` map beside `CONTAINER_ROW_LABEL_KEYS` and consult it in
      `formatParameter`, mapping each analytics field name to the `AnalyticsTablesI18nKey` label that
      already exists for it; keep the existing fall-back to the raw field name so an unmapped field
      renders unlabelled rather than being hidden. Add
      `src/components/ActivityAudit/View/DiffReport/tests/DiffSection.spec.tsx` asserting: a labelled
      section rendering its label as the per-index heading; the status word present as text; the group
      queryable by role and accessible name carrying column name and status; an unlabelled section
      still using the existing title lookup; and with `DiffView` set to diff-only, a section whose rows
      carry no `diffStatus` not rendered while one that does is. Add
      `src/components/ActivityAudit/EntityGrid/tests/constants.spec.ts` asserting the analytics label
      map covers every field `columnRows` emits and every table-definition field, and extend
      `src/components/ActivityAudit/View/DiffReport/tests/utils.spec.ts` with the label/status
      pass-through. Verify with
      `npx vitest run src/components/ActivityAudit/View/DiffReport/tests/DiffSection.spec.tsx src/components/ActivityAudit/View/DiffReport/tests/utils.spec.ts src/components/ActivityAudit/EntityGrid/tests/constants.spec.ts`.

## 6. Surfaces

- [x] 6.1 Rewire `src/components/ActivityAudit/List/List.tsx` onto `ACTIVITY_AUDIT_VIEW_CONFIG`:
      replace `isDeploymentsView` at the datasource, the `rowClassRules`, `onCellClicked`, `columnDefs`
      and the system-rollback condition with reads from the resolved view config. **The `entity`
      short-circuit in `columnDefs` (`:353-360`) must resolve through the view config too** — today it
      returns early with the `isSingleEntity` column set *and* a Rollback row action, which would break
      *A column activity states which column it refers to* and *No rollback action is offered* while
      every other test still passed (design.md D2). `Config` and `Deployments` entity mode keeps its
      current columns and its row Rollback. Build the entity-mode filters through
      `getEntityAuditFilters`; apply `isResourceIdInTableScope` to narrow rows before they enter the row
      buffer when the view is `Analytics` and an entity is present; add the `Analytics` option to
      `activityViewOptions` only when `useAppContext().featureFlags.analyticsEnabled` is true; use the
      view's `getEntityActivityHref` so an `Analytics` row (in the tab as well as on the global page)
      opens `/activity-audit/{activityId}` rather than an entity-namespaced URL; and make the
      `storageKey` continue to derive from the active view so analytics column state lands under
      `activity-audit:analytics`. Extend `src/components/ActivityAudit/List/tests/List.spec.tsx`,
      keeping every existing case, with: the `Analytics` option present/absent by feature flag; the
      analytics fetcher invoked under `viewMode={ActivityAuditView.Analytics}` and the dropdown hidden;
      no page-level `Rollback` button in the Analytics view; **no Rollback row action in the analytics
      entity view, and one still present in the `Config` entity view**; the entity-mode analytics
      request carrying the `in` / `co` filter pair; a row for a similarly named table being excluded;
      and the `Resource identifier` column present in the analytics entity view. Verify with
      `npx vitest run src/components/ActivityAudit/List/tests/List.spec.tsx`.

- [x] 6.2 Add `src/components/Analytics/Tables/TableAudit.tsx` — a component taking the
      `AnalyticsTable` and rendering `EntityAudit` with
      `entity={{ name: table.name, description: table.description }}` (a valid `BaseEntity`; do not cast
      and do not widen `EntityAudit`'s props — design.md D4), `view={ApplicationRoute.AnalyticsTables}`
      and `viewMode={ActivityAuditView.Analytics}`. In `src/constants/activity-audit.ts` add
      `[ApplicationRoute.AnalyticsTables]: ActivityAuditResourceType.TABLE` to `routeAuditResource` so
      `resolveEntityAuditType` resolves the tab's entity type with no new branch. Add
      `src/components/Analytics/Tables/tests/TableAudit.spec.tsx` mocking `EntityAudit` and asserting
      the three props it receives, including that the projected entity carries the table's name. Verify
      with `npx vitest run src/components/Analytics/Tables/tests/TableAudit.spec.tsx`.

- [x] 6.3 Turn `src/components/Analytics/Tables/TableDetailView.tsx` into the tab shell described in
      design.md D6, without renaming or moving the file: keep every piece of state, every handler and
      every modal where they are; keep the header (title, status badge, kind tag, system tag,
      description row and the entire action row) above a new `DialTabs` strip carrying
      `EntityViewTab.Properties` and `EntityViewTab.Audit` (labels `TabsI18nKey.Properties` /
      `TabsI18nKey.Audit`, both of which already exist), with `Properties` selected initially; move the
      read-only key summary and the `isActive ? <GridView …> : <DraftSchemaEditor …>` body verbatim into
      a new presentational `src/components/Analytics/Tables/TableProperties.tsx`; render `TableAudit`
      under the Audit tab. **Render the tab strip only when
      `useAppContext().featureFlags.analyticsEnabled` is true AND the table is active** — that is, only
      when `featureFlags.analyticsEnabled && isActive`, reusing the `isActive`
      (`table.status === TableStatus.Active`) boolean the component already computes. When either
      condition is false the view renders `TableProperties` directly, with no tab strip and no Audit
      tab, so no analytics activity request is issued. Both halves matter for a different reason: a
      draft table has no audit history at all (design.md D12 records the measurement), and
      `src/app/[lang]/tables/[id]/page.tsx` has no feature-flag guard, so a bookmarked link reaches
      this view on an analytics-disabled install and the flag half is the only gate there. Do not add
      a guard to the route, and do not render a one-tab strip or a disabled Audit tab in the
      non-active case. Split `src/components/Analytics/Tables/tests/TableDetailView.spec.tsx` so the
      summary/grid cases move to a new `src/components/Analytics/Tables/tests/TableProperties.spec.tsx`
      against the extracted component (assertions unchanged), and add to `TableDetailView.spec.tsx`:
      `Properties` selected on open of an `ACTIVE` table, the header actions rendered while the `Audit`
      tab is selected, **no tab strip and no `Audit` tab on a `PENDING` table with the draft schema
      editor rendered directly and no analytics activity request issued**, the `Audit` tab present on
      an `ACTIVE` table for a viewer whose permissions report `write: false, modify: false`, and no tab
      strip and no `Audit` tab with `analyticsEnabled` false on an `ACTIVE` table. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/TableDetailView.spec.tsx src/components/Analytics/Tables/tests/TableProperties.spec.tsx`.

- [x] 6.4 Close the one acceptance criterion the browser cannot reach, in
      `src/components/ActivityAudit/List/tests/List.spec.tsx` only — no source file changes, and keep
      every existing case. The local analytics feed carries no `Pipeline` or `SavedQuery` activity, so
      *Pipeline and saved-query rows are shown* can never be observed in a browser on this stack; it
      has to be a unit assertion or it is nothing. What exists today is two halves that never meet:
      `renders a row for every resource type the analytics feed returns` (the same file) feeds a page
      of all four resource types through `viewMode={ActivityAuditView.Analytics}` and asserts all four
      reach the grid's `successCallback`, and `formatters.spec.ts` asserts
      `getFormattedResourceType(PIPELINE|SAVED_QUERY, t)` resolves to
      `EntitiesI18nKey.AnalyticsPipeline` / `AnalyticsSavedQuery` — but nothing asserts that a
      `Pipeline` or `SavedQuery` row reaching the **analytics column set** renders its type. Join them:
      in that test (or a sibling beside it) also pull the `resourceType` column out of
      `lastColumnDefs()` and assert its `valueFormatter` resolves `PIPELINE` →
      `EntitiesI18nKey.AnalyticsPipeline` and `SAVED_QUERY` → `EntitiesI18nKey.AnalyticsSavedQuery`,
      the way the entity-tab block at `ActivityAuditList :: Analytics entity audit tab` already does
      for `TABLE_COLUMN`. While in the file, rename the case currently called
      `navigates to the global detail page on a row body click` to say what it actually asserts — that
      the row body opens the detail page in a **new** tab (`window.open('/activity-audit/abc-123',
      '_blank')`, which is what it already expects); its assertions do not change, only the name, which
      contradicts the corrected scenario and is the sort of stale label that invites someone to
      "fix" the component instead. Verify with
      `npx vitest run src/components/ActivityAudit/List/tests/List.spec.tsx`.

- [x] 6.5 Stop listing the per-column child activities of a table `Delete`, per design.md D13. **The
      filtering belongs in the list, at view level — not in a server action, not in the detail
      resolver, and not in a new backend query.** The analytics datasource already narrows its own
      feed (`isResourceIdInTableScope`) and `ACTIVITY_AUDIT_VIEW_CONFIG` already declares the per-view
      facets, so this is one more facet plus a pure module plus a step in the buffer loop.

      **The crux — how a child's parent activity type is obtained.** A child row carries
      `parentActivityId` and nothing about the parent, and nothing on the child distinguishes "column
      of a deleted table" from "column dropped from a living table": both are `TableColumn` / `Delete`
      with a parent. Do not try to infer it from the child, from the sibling count, or from whether
      the parent happens to be in the same page. Resolve the parent, by mirroring the parent/child
      machinery `List.tsx` already runs for the `Config` view (`:229-260`), in the other direction:
      cache every fetched row by `activityId` in a ref first (a parent that arrived in the same page
      then costs nothing), collect the page's still-unresolved `parentActivityId` values, and fetch
      them in **one** call — `fetchActivities(PAGE_SIZE, 0, sorts, [{ column: 'activityId', operator:
      FilterOperatorDto.INCLUDES, value: ids.join(',') }])` — carrying no other filter, because a
      `Resource type` filter the reader applied would otherwise hide the parent being resolved.
      `activityId` is on the analytics feed's filter allow-list and `in` is valid on it (design.md D13
      names where that was read); a `400 invalid_filter_column` here would mean the allow-list moved.
      **One request per page is enough** — a page holds at most `PAGE_SIZE` rows and therefore at most
      `PAGE_SIZE` distinct parent ids. Do not copy the children lookup's inner paging loop; it exists
      because one parent has many children, which is the opposite direction.

      Files: add `src/utils/audit/deleted-parent-suppression.ts` with the pure half —
      `getUnresolvedParentIds(rows, parents)` (distinct `parentActivityId` values not already in the
      cache), `isChildOfDeletedTable(activity, parents)` (true only when the resolved parent's
      `resourceType` is `TABLE` **and** its `activityType` is `Delete`) and
      `filterOutDeletedTableChildren(rows, parents)`. Add `hasDeletedParentSuppression: boolean` to
      `ActivityAuditViewConfig` in `src/components/ActivityAudit/List/models.ts` and set it in
      `src/components/ActivityAudit/List/view-config.ts`: `true` for `Analytics`, `false` for `Config`
      and `Deployments`. In `src/components/ActivityAudit/List/List.tsx`, add a parent cache ref
      alongside `childrenCacheRef` (reset with it at `startRow === 0`) and, inside the existing
      `while` loop when the facet is on, seed the cache from the page, resolve what is missing, and
      filter the rows **before** they are pushed into `rowBufferRef` — at the same point
      `analyticsTableScope` already filters them, so the refill-until-`endRow` and `lastRow` behaviour
      is unchanged. Wrap the resolution call in its own `try`/`catch` that leaves the page's rows
      listed: a failed lookup must not reach `params.failCallback()` and must not raise a
      notification. An unresolved parent likewise leaves its child listed — a row is hidden only on
      positive evidence about its parent.

      Tests: add `src/utils/audit/tests/deleted-parent-suppression.spec.ts` (a child whose parent is
      `Table`/`Delete` is dropped; one whose parent is `Table`/`Update` is kept; one with no
      `parentActivityId` is kept; one whose parent is absent from the cache is kept; unresolved-id
      collection is distinct and skips cached ids and rows with no parent). Extend
      `src/components/ActivityAudit/List/tests/view-config.spec.ts` with the new facet's value for all
      three views. Extend `src/components/ActivityAudit/List/tests/List.spec.tsx`, keeping every
      existing case, with: a page of one `Table`/`Delete` plus several child `TableColumn`/`Delete`
      rows reaching `successCallback` as the parent row only; a `Table`/`Update` plus its child
      `TableColumn`/`Delete` both reaching it with the child's `parentActivityId` intact; a page whose
      parents are all in the same page issuing **no** second fetch; a page with an unresolved parent
      id issuing exactly one lookup call and still listing the child; a rejected lookup call listing
      the page's rows rather than calling `failCallback`; and the `Config` and `Deployments` views
      issuing no lookup and dropping no row. Verify with
      `npx vitest run src/utils/audit/tests/deleted-parent-suppression.spec.ts src/components/ActivityAudit/List/tests/view-config.spec.ts src/components/ActivityAudit/List/tests/List.spec.tsx`.

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill against this change's browser-observable scenarios on a
      local stack booted with `ANALYTICS_ENABLED=true` and `DIAL_ANALYTICS_API_URL` pointing at a
      running analytics service that has at least one table with recorded history, including a revision
      that added a column and one that dropped one. Verify: the `View` dropdown on `/activity-audit`
      offering `Config`, `Deployments` and `Analytics`; the Analytics view rendering rows for more than
      one resource type with no expander column, no `Version` column and no page-level `Rollback`
      button; a row-body click opening `/activity-audit/{activityId}` **in a new tab** — the shared,
      pre-existing behaviour of this list (design.md D5), with the list's own tab staying put; on that
      page — no `Rollback resource` button, the header's resource link reaching the table's own page,
      the diff showing every snapshot field with one group per column, an added column's group marked
      `Added`, a dropped column's group still present and marked `Removed`, and the `View` control's
      `Changes only` option (`All parameters` is the other; there is no option named `Diff only`)
      hiding the unchanged column groups; the table
      detail view opening on `Properties` with its header actions above the tab strip; the `Audit` tab
      listing the table's own and its columns' activities with the `Resource identifier` column
      populated; and — the regression half — the `Config` and `Deployments` views still behaving as they
      do today, and a container audit detail page still rendering its Environment variables, Compute and
      Autoscaling sections. Resolve every `fail` verdict before the change is complete; the flag-off
      matrix stays with the unit tests in 3.1, 6.1 and 6.3.

      **After 6.5 lands this task needs a further pass** for the three scenarios design.md D13 added,
      which an earlier round could not have checked. Additional precondition: the analytics service
      must hold a revision in which a whole table was deleted **and** a revision in which one column
      was dropped from a table that still exists. Verify: the Analytics view listing that table's
      `Delete` row with none of its per-column child rows; the dropped-column row still listed, with
      its parent identifier in the `Parent ID` cell; and that `Delete` row's detail page still showing
      one group per column of the previous revision, each marked `Removed`. The remaining D13
      scenarios — an unresolvable parent, a page that issues no lookup, and the `Config` /
      `Deployments` views issuing none — are network and fail-open assertions the booted stack cannot
      produce, and stay with 6.5's unit tests.

## 8. Quality checks

- [x] 8.1 From `apps/ai-dial-admin/`, run `npx vitest run --coverage` and confirm the coverage gate in
      `vitest.config.ts` is not regressed; from the repository root run `npm run lint` and
      `npm run format`, and resolve any findings. Note for whoever runs this: `tsc` is red repo-wide
      (~205 pre-existing errors on `development`) and `*.spec.tsx` files are eslint-ignored, so compare
      typecheck error counts against `development` rather than expecting zero, and treat lint as a
      statement about source files only. Anything this turns up is a new dispatch to the role that owns
      the file, not an edit from this task.

## 9. Follow-up: the Pipelines Audit tab (issue #4475)

Sections 1–8 are shipped (PR #4456, commit `6eefaf287`); nothing in them is reopened or renumbered.
This section is the second iteration of the **same** change — one branch, one pull request. Read
**design.md D14** before starting, and only D14: its four sub-sections (D14.1 the column set, D14.2
the gate, D14.3 the tab shell, D14.4 why D13 is left alone) name the files each one governs in its
first lines, so an item can find its part without reading the other thirteen decisions.

Notes for EM before dispatch:

- **The spec delta moved.** `specs/analytics/spec.md` under this change held the *tables* requirements
  and is now `specs/analytics/tables/spec.md`, relocated verbatim — same requirement titles, same
  scenario titles, same text. The analytics capability was split into a root index plus nine
  sub-capabilities after this change was written, and `analytics/spec.md` now carries only what every
  Analytics page shares, so archiving the delta where it sat would have folded table requirements into
  that index. No task implements the move; it is already done. D1 carries a correction line.
- **Nothing about Analytics → Queries enters this section.** `/queries/{id}` renders `QueryBuilder`,
  not an entity detail view; it is issue #4476, filed and deliberately not worked. The proposal's
  Non-goals say so, and that is binding.
- **Do not touch D13's suppression** (`src/utils/audit/deleted-parent-suppression.ts` and its facet).
  A pipeline row can never be suppressed by it — see D14.4 — and widening it would go past what the
  analytics backend's own spec says happens. No task in this section has it in scope.
- **9.2 is the shared-code item and is the whole regression surface of this iteration.** It changes
  what `isSingleEntity` means on a list that serves `Config`, `Deployments` and the shipped Tables
  Audit tab. Every existing assertion in `src/components/ActivityAudit/List/tests/List.spec.tsx` and
  `src/components/ActivityAudit/List/tests/view-config.spec.ts` must be kept and stay green, with
  exactly **one** exception named in the task — the assertion that pins today's behaviour of Analytics
  ignoring the flag. Its four source files move together; do not split them across items or batches.
- **`PipelineDetailFrame.tsx` must keep its name and its path** (9.4), for the same reason D6 kept
  `TableDetailView.tsx`: other work edits this area, and a move-plus-diff is not reviewable. There is
  no `PipelineProperties.tsx` extraction — D14.3 says why.
- Two files attract two items each and are therefore never in the same batch:
  `src/constants/activity-audit.ts` (6.2 added the tables entry, 9.3 adds the pipelines one — 6.2 is
  shipped, so this only matters if 6.2 is ever re-run) and nothing else. 9.1/9.3 and 9.2/9.4 have
  disjoint scopes and are batched in pairs.

- [x] 9.1 In `src/types/activity-audit.ts`, add `hasChildResourceActivities(type?: string): boolean`
      beside the existing `isAnalyticsResource` / `isDeploymentManagerResource` /
      `isContainerDeploymentResource` predicates, backed by a module-level
      `PARENT_RESOURCE_TYPES` set holding **exactly** `ActivityAuditResourceType.TABLE`. It answers one
      question — does this resource type own activities of another resource type? — and `Table` owns
      `TableColumn`. Nothing else is in the set: a `Pipeline` resource id is its name and the analytics
      backend records no child type under a pipeline, and no admin or deployment-manager type has a
      child type either. Do not name it after pipelines or tables; it is consumed three times in 9.2
      and the name has to say what it tests (design.md D14.1). Extend
      `src/types/tests/activity-audit.spec.ts` with a `hasChildResourceActivities` describe block:
      true for `TABLE`; false for `TABLE_COLUMN`, `PIPELINE`, `SAVED_QUERY`, `MODEL`,
      `MCP_DEPLOYMENT` and `undefined`; and one case asserting no member of the set is a
      deployment-manager or admin type, so a later addition to it fails here rather than in the
      `Config` view. Verify with `npx vitest run src/types/tests/activity-audit.spec.ts --reporter=dot`.

- [x] 9.2 Thread that predicate through the shared audit list so an Audit tab whose resource type owns
      no child activities asks an exact question and renders as a single-entity view (design.md D14.1).
      Four source files, which move together:

      1. `src/utils/audit/entity-audit-filters.ts` — apply the `Analytics` branch (the
         `resourceType in "Table,TableColumn"` + `resourceId co <name>` pair D3 needs) only when
         `hasChildResourceActivities(entityType)` is true; otherwise fall through to the exact
         `resourceId eq` + `resourceType eq` pair the function already builds for `Config` and
         `Deployments`. For a pipeline that is the whole query — no `co` widening, no client-side
         narrowing. Update the function's doc comment, which currently states the analytics shape
         unconditionally.
      2. `src/components/ActivityAudit/List/utils.tsx` — give
         `getAnalyticsActivityAuditColumns(t, open, isSingleEntity?)` a third parameter and pass it to
         `ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Analytics, isSingleEntity)`. **No edit to
         `ACTIVITY_AUDIT_COLUMNS`**: that call with the flag true already yields no expander, no
         `Version`, and no `Resource type` / `Resource identifier`.
      3. `src/components/ActivityAudit/List/view-config.ts` — the `Analytics` entry's `getColumns`
         stops discarding `isSingleEntity` and forwards it. Replace the comment above it, which says
         the entry deliberately ignores the flag.
      4. `src/components/ActivityAudit/List/List.tsx` — compute
         `isSingleEntity: !!entity && !hasChildResourceActivities(entityType)` in `columnDefs`, and gate
         `analyticsTableScope` on the same predicate so `isResourceIdInTableScope` does not run for a
         tab where nothing can be narrowed. For `Config` and `Deployments` the computed value is
         identical to today's `!!entity` — no entity type of theirs is in the predicate's set — so
         both views are unchanged by construction.

      Tests. Extend `src/utils/audit/tests/entity-audit-filters.spec.ts` with the `Analytics` +
      `PIPELINE` case (exact `eq` pair, no `co`, no `in`) while keeping the `Analytics` + `TABLE` cases
      exactly as they are. Extend `src/components/ActivityAudit/List/tests/utils.spec.tsx` with a
      `getAnalyticsActivityAuditColumns` single-entity case (no `resourceType` / `resourceId` column,
      still no rollback action) beside the existing multi-type one. Extend
      `src/components/ActivityAudit/List/tests/List.spec.tsx` with a
      `ActivityAuditList :: Analytics pipeline audit tab` describe block mirroring the existing
      `Analytics entity audit tab` one, rendered with
      `entity={{ name: 'daily_rollup' }} entityType={ActivityAuditResourceType.PIPELINE}
      viewMode={ActivityAuditView.Analytics}`, asserting: the request carrying
      `{resourceType eq Pipeline}` + `{resourceId eq daily_rollup}` and **neither** a `co` nor an `in`
      filter; every row of a page reaching `successCallback` unfiltered, including a `Create` row;
      `lastColumnDefs()` carrying neither `resourceType` nor `resourceId` nor `version` nor
      `expanderColumn`, and carrying `activityType`, `epochTimestampMs`, `initiatedEmail`, `activityId`
      and `parentActivityId`; a row whose `parentActivityId` is set reaching the grid with it intact; a
      `Pipeline` `Delete` row with no `parentActivityId` still listed (D13 suppresses nothing here);
      the row action menu offering `Open in a new tab` and no `Rollback`; a row-body click calling
      `window.open('/activity-audit/abc-123', '_blank')` and never a `/pipelines/` URL; an empty page
      leaving the grid empty with no notification; and a time-period change re-requesting with the
      updated `ge` / `le` filters.

      **The one existing assertion that changes, and the only one:** in
      `src/components/ActivityAudit/List/tests/view-config.spec.ts`, the case
      `Analytics delegates to the analytics column factory and passes it no rollback handler` expects
      `getAnalyticsActivityAuditColumns` to have been called with exactly `(t, open)` while passing
      `isSingleEntity: true`. That expectation *is* the behaviour being changed, so its argument list
      gains the flag — keep the case, keep its name's meaning (no rollback handler is still the point),
      and add a second case for the flag-false call. Everything else in that file and in
      `List.spec.tsx` stays as written, including the entire existing
      `ActivityAuditList :: Analytics entity audit tab` block: it renders with
      `entityType={ActivityAuditResourceType.TABLE}`, so the predicate answers true for it and the
      Tables tab's request, columns and narrowing are untouched. Verify with
      `npx vitest run src/utils/audit/tests/entity-audit-filters.spec.ts src/components/ActivityAudit/List/tests/utils.spec.tsx src/components/ActivityAudit/List/tests/view-config.spec.ts src/components/ActivityAudit/List/tests/List.spec.tsx --reporter=dot`.

- [x] 9.3 Add `src/components/Analytics/Pipelines/PipelineAudit.tsx` — the exact analogue of
      `src/components/Analytics/Tables/TableAudit.tsx`: it takes the `Pipeline`
      (`src/models/analytics/pipeline.ts`) and renders `EntityAudit` with
      `entity={{ name: pipeline.name }}` memoized on `pipeline.name` (a valid `BaseEntity`; do not cast
      and do not widen `EntityAudit`'s props — design.md D4, and the memo is load-bearing because
      `ActivityAuditList` keys its AG Grid datasource on the `entity` reference),
      `view={ApplicationRoute.AnalyticsPipelines}` and `viewMode={ActivityAuditView.Analytics}`. A
      `Pipeline` has no `description`, so the projection carries `name` alone. In
      `src/constants/activity-audit.ts` add
      `[ApplicationRoute.AnalyticsPipelines]: ActivityAuditResourceType.PIPELINE` to
      `routeAuditResource` — the forward, route → resource-type map that `resolveEntityAuditType` reads
      — and **not** to `auditResourceRoute`, the reverse map beneath it, which the audit list's
      entity-namespaced href builder also reads and which design.md D5/D10 deliberately keep free of
      analytics entries. `getAuditTabs` needs no edit: `ApplicationRoute.AnalyticsPipelines` matches
      none of its telemetry branches, so it already returns `[activitiesTab(t)]` alone. Add
      `src/components/Analytics/Pipelines/tests/PipelineAudit.spec.tsx`, modelled on
      `src/components/Analytics/Tables/tests/TableAudit.spec.tsx`: mock `EntityAudit`, assert the three
      props it receives, that the projected entity carries the pipeline's name, that the reference is
      stable across a re-render with an equal pipeline, that
      `resolveEntityAuditType(entity, ApplicationRoute.AnalyticsPipelines)` resolves to
      `ActivityAuditResourceType.PIPELINE`, and that
      `getAuditTabs(t, {dashboardEnabled: true, analyticsEnabled: true}, ApplicationRoute.AnalyticsPipelines)`
      is `[EntityViewTab.Activities]` and nothing else. Verify with
      `npx vitest run src/components/Analytics/Pipelines/tests/PipelineAudit.spec.tsx --reporter=dot`.

- [x] 9.4 Turn `src/components/Analytics/Pipelines/Common/PipelineDetailFrame.tsx` into the tab shell
      described in design.md D14.3, without renaming or moving the file and without extracting a
      Properties component. `PipelineDetailView.tsx`, `EnrichDetailView.tsx` and
      `AggregateDetailView.tsx` are **not** in scope and need no edit: the strip goes inside the frame,
      so both kinds get it in one place and the form hook that owns the draft stays mounted above it.
      Add a `DialTabs` strip carrying `EntityViewTab.Properties` and `EntityViewTab.Audit` (labels
      `TabsI18nKey.Properties` / `TabsI18nKey.Audit`, both of which already exist — no new i18n key in
      this section) between the identity row and the existing body container, with `Properties`
      selected initially, and render `PipelineAudit` from 9.3 under the Audit tab in place of the
      `PipelineReadOnlyFacts` + `children` + `PipelineStateSection` body. The identity row is
      unchanged: badge, name, copy control, `ChangedEntityButtons`, the enable/disable control and
      `JsonToggle` all stay above the strip and stay visible from either tab, so a pending edit is
      still discardable and savable while the history is on screen. Two conditions decide the strip,
      and one fallback serves both: render it only when `useAppContext().featureFlags.analyticsEnabled`
      is true **and** `isEditorEnabled` is false; otherwise render exactly what the component renders
      today. There is **no** pipeline-status condition — `enabled` is a runtime toggle and not a
      lifecycle state, and gating on it would hide the history of the toggle itself (design.md D14.2).
      Turning the JSON editor off must leave `Properties` selected. Add
      `src/components/Analytics/Pipelines/tests/PipelineDetailTabs.spec.tsx` — a new file, because
      `tests/PipelineDetailView.spec.tsx` uses the global `AppContext` mock from `test-setup.tsx`,
      whose `featureFlags` is `{ deploymentsEnabled: true }`, so the strip is off in all of its cases
      and in `tests/PipelineDetailPermissions.spec.tsx` (`featureFlags: {}`) and both files stay green
      unmodified; the new file mocks `@/src/context/AppContext` locally with `analyticsEnabled: true`
      and stubs `PipelineAudit` the way `TableDetailView.spec.tsx` stubs `TableAudit`, so its absence
      stands for "no analytics activity request issued". Cases: `Properties` selected on open with the
      read-only facts and runtime state beneath it; the badge, name and enable/disable control still
      above the strip while `Audit` is selected; the strip rendered and `Audit` selectable on a
      pipeline whose `enabled` is false; `Audit` present for a caller who is not a full admin (a local
      `isFullAdmin: false`, as `PipelineDetailPermissions.spec.tsx` does); an edited field still
      presented with the `Discard` / `Save` bar after switching to `Audit` and back; no strip rendered
      while the JSON editor is enabled, and the strip back with `Properties` selected after it is
      disabled; and, with `analyticsEnabled: false`, no strip, no `Audit` tab and the audit stub never
      rendered. Verify with
      `npx vitest run src/components/Analytics/Pipelines/tests/PipelineDetailTabs.spec.tsx src/components/Analytics/Pipelines/tests/PipelineDetailView.spec.tsx src/components/Analytics/Pipelines/tests/PipelineDetailPermissions.spec.tsx src/components/Analytics/Pipelines/tests/PipelineJsonEditor.spec.tsx --reporter=dot`.

- [x] 9.5 Run the `spec-browser-verify` skill against the three scenarios of this section that cross a
      boundary the unit tests mock away, and against those only. Local stack booted with
      `ANALYTICS_ENABLED=true` and `DIAL_ANALYTICS_API_URL` pointing at a running analytics service
      that holds at least one registered pipeline; the app is on `http://localhost:4200`. Verify:
      (1) `/pipelines/{name}` opening on `Properties` with a `Properties` / `Audit` strip below the
      identity row and the enabled badge, name and enable/disable control above it; (2) the `Audit`
      tab listing that pipeline's activities from the real analytics feed, with no `Resource type` and
      no `Resource identifier` column and no `Rollback` in the row menu; (3) a pipeline registered
      during the session showing its `Create` row in the tab — the one fact BA could only take from
      the backend's spec text. Everything else in section 9 is a component or filter assertion the
      unit tests in 9.1–9.4 already settle, and is deliberately **not** sent to the browser.
      **Nothing in this task deletes anything in the live stack**: the scenario *A pipeline delete
      recorded by its target table's deletion is listed* is accepted on the ADAS spec's text (see
      design.md D14.4) and stays with 9.2's unit tests. Resolve every `fail` verdict before the change
      is complete.

- [x] 9.6 From `apps/ai-dial-admin/`, run
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary` and confirm the
      coverage gate in `vitest.config.ts` is not regressed; from the repository root run
      `npm run lint 2>&1 | tail -30` and `npm run format`, and resolve any findings. The cheap forms
      are deliberate: the default reporters print ~3 900 lines to say "0 failures", and the dot
      reporter still prints every failure in full while the thresholds live in the config rather than
      in the reporter. Same caveats as 8.1: `tsc` is red repo-wide, `*.spec.tsx` files are
      eslint-ignored, so compare against `development` rather than expecting zero. Anything this turns
      up is a new dispatch to the role that owns the file, not an edit from this task.
