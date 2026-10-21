## Why

A Query Builder state that took real effort to author — the right source, a filter tree, a sort, a chart —
survives exactly as long as the browser tab. There is no way to name it, return to it next week, or hand it
to a colleague. `/query-builder` is a stateless scratchpad, and it is the only Analytics surface that is not
an addressable object.

The analytics data-access service has since shipped a `saved-queries` capability that closes the storage
half of this, and nothing in the admin frontend consumes it. This change builds the client — and builds it
as the repo's standard entity workflow (list grid, create modal, addressable detail page with Save and
Discard) rather than as a dialog bolted onto the existing page, so a query is managed the same way a model,
a dataset, or a test suite is.

## What Changes

- **New `/queries` list page.** A grid of the saved queries visible to the caller, with a Create button and
  a per-row actions column offering Open in new tab, Edit, and Delete. Backed by
  `GET /v1/saved-queries`, fetched for both scopes and shown as one list with `scope` as a column.
- **New create modal.** Name (required), Description, and Tag. The source is not asked for: it defaults to
  the first available entity, and the query is created with a minimal executable body because the service
  refuses a saved query that could not run as stored.
- **New `/queries/[id]` page — today's Query Builder, unchanged in layout**, plus Save, Discard, and Edit
  controls in the toolbar's existing actions slot. Loading the page rehydrates the builder from the stored
  query: structured bodies open in the Builder view, non-representable ones in JSON, SQL bodies in SQL.
- **Metadata is edited in one modal** shared by create and edit, reachable from the detail page's Edit
  button and from the grid's Edit row action. Scope is offered only to a full admin, because the service
  restricts `common` writes to `FULL_ADMIN`.
- **The authored time range is saved as intent, not as instants.** A relative period is stored as its token
  and never resolved, so a query saved as "last 7 days" still means last 7 days next month.
- **BREAKING: `/query-builder` is removed.** Its menu entry is replaced by Queries, its route redirects to
  `/queries`, and its server actions relocate to `src/app/[lang]/queries/actions.ts`. Every query is now a
  named, persisted row; there is no unsaved builder session.
- **The query assistant is told which source is selected and what its columns are.** Today it receives
  only the conversation, so it invents table and column names. Requests now lead with a system message
  naming the selected entity and listing each field's name, type, and schema labels — schema only, never
  row data. The selected source is stated as a preference, not a restriction, so a generated query
  targeting another entity still loads as it does today.
- **The selected source is read from the builder context everywhere**, including the SQL editor's
  autocomplete, which previously took the entity, fields, and function catalog as props.
- **Server persistence layer added**: five saved-query methods on the existing `AnalyticsDataApi` client,
  a saved-query model, and five server actions covering list, read, create, replace, and delete.

## Capabilities

### New Capabilities

None. Per this project's spec organization, all Analytics behavior is consolidated into the existing
`analytics` master spec rather than split into per-feature capability folders.

### Modified Capabilities

- `analytics`: Saved queries become a first-class entity. Adds requirements for the saved-query server API
  layer, the write payload's shape, the `/queries` list page and its grid, the create and edit modals, the
  `/queries/[id]` page's load / save / discard behavior, time intent persistence, result-view and chart
  round-tripping, scope-based permission gating, and failure handling per machine error code. Modifies the
  requirements that describe the Analytics menu group, the Query Builder page's layout, its initial data
  loading, its toolbar, how the time range is serialized, and the guarded mode switch — all of which
  currently describe a standalone `/query-builder` route that this change retires.

## Impact

**Backend**: consumes `/v1/saved-queries` on the analytics data-access service
(`DIAL_ANALYTICS_API_URL`). No backend change; the contract is shipped and treated as frozen. No new
environment variables — the feature rides the existing `ANALYTICS_ENABLED` gate and the
`isAnalyticsForbidden()` page guard.

**New code**: `models/analytics/saved-query.ts`, the saved-query methods on
`server/analytics/analytics-data-api.ts`, `app/[lang]/queries/` (both pages plus `actions.ts`), `components/Analytics/Queries/` (list, properties,
create and edit modals), and the capture/restore mapping under
`components/Analytics/QueryBuilder/utils/`.

**Modified shared code**: `QueryBuilder.tsx` gains save/discard/edit wiring and a query-name heading,
`Result/ResultArea.tsx`'s view and chart config become controlled so they can be captured, and
`Sql/SqlEditor.tsx` and `Ai/AiPanel.tsx` read the selected source from the builder context. Because the
result area is shared only within the builder, the blast radius is contained to Analytics.

**Registration points**: `types/routes.ts`, `components/Menu/menu-configuration.tsx`,
`components/Breadcrumbs/constants.ts`, `utils/open-in-new-tab.ts`, `components/ListView/constants.ts`,
`utils/entities/create-entity.ts` and `update-entity.ts`,
`components/EntityView/Modals/Delete/utils.ts`, `constants/grid-columns/grid-columns.tsx`,
`constants/i18n.ts`, and `locales/en.ts`.

**Tests affected by the retirement**: `QueryBuilder.spec.tsx` and `Ai/tests/AiPanel.spec.tsx` mock
`@/src/app/[lang]/query-builder/actions` and must be repointed; `components/Menu/tests/menu-configuration.spec.ts`
asserts the ordered menu key list.

## Non-goals

- **Deep-link query params** on the builder (`?savedQuery=…`). Addressability comes from the route itself.
- **An unsaved or draft builder session** — no `/query-builder` scratchpad and no `/queries/new`. A
  consequence worth stating: a query the service refuses to store (for example, a literal bound to a
  `sensitive` column) can no longer be run at all, where previously it could be run without saving.
- **Optimistic concurrency.** The service returns `generation` but accepts no precondition header, so
  concurrent writes are last-write-wins by contract. No `If-Match` round-trip, unlike other entities here.
- **Query parameters or templates.** The service refuses a parameterized body outright.
- **Run history, a last-run stamp, scheduling, or pinning to a dashboard.**
- **Server-side paging, sorting, or filtering** of the list. The service returns every visible row unpaged;
  the grid sorts and filters client-side.
- **Bulk selection and bulk delete.** Not part of this entity family in this repo.
- **A Delete control on the detail page.** Delete is a grid row action only.
- **The unavailable-field treatment** for a stored query that references a since-dropped or restricted
  column. It needs its own design pass and is deferred.
