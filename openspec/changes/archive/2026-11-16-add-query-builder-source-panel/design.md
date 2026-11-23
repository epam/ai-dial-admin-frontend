## Context

See `proposal.md` for motivation. What shapes the approach:

- `QueryBuilder` already takes `name` and `savedQuery` as optional props, and `useSavedQueryPage`
  already guards every saved-query path on `savedQuery` being present. The builder can render without a
  stored query today; nothing routes to it that way.
- A source switch is an in-place operation (`onSelectEntity` in `QueryBuilder.tsx`): it loads the schema
  client-side, replaces the builder state and resets the AI conversation. It is the only consumer of the
  toolbar's `Select`.
- Unsaved-change detection compares the payload the page would save against a stored baseline string
  (`liveRequest` vs `baseline` in `useSavedQueryPage`). It never compares builder state.
- The table list has two sources that do not carry the same data: `getEntities()` returns queryable
  names only; `getTables()` returns `description` and `tag_order` but is the catalog, not the queryable
  set. Column metadata (`tag`, `display_name`, `description`, `sensitive`, `type`) comes from
  `getEntitySchema(name)`.
- The right rail (`Rail/BuilderRail.tsx`, `Rail/CollapsedRail.tsx`) is the existing precedent for a
  collapsible panel whose state is kept in localStorage and applied after mount.

## Goals / Non-Goals

**Goals:**

- One builder component serving both a draft and a saved query, with the difference confined to
  `useSavedQueryPage` and the toolbar's action slot.
- Panel state that outlives navigation between query pages without the panel appearing on a 403 or
  not-found result.
- No new endpoint, no new shared (`Common/*`) component props.

**Non-Goals:**

- Horizontal resizing of the panel; it has a fixed width in this change.
- Sharing the panel's lazily read column schema with the builder's own schema state.
- Restructuring the header to the redesign's final shape (description line, scope badge, source chip,
  Save split button). The existing toolbar action slot is kept and extended.

## Decisions

### D1. `/queries` is the draft; no new route

`app/[lang]/queries/page.tsx` stops rendering the grid and renders `QueryBuilder` without `savedQuery`.
The menu item, `getUrnForEntity` deep links and the `/query-builder` redirect all already point at
`/queries` or `/queries/{id}` and need no change. Breadcrumbs change in one respect: the saved query's id
is no longer a crumb, because the id says nothing the heading does not and "Queries" now leads to the
builder, not to a list the id would be an entry of. The shared breadcrumb config gains an `isHidden`
segment flag for it, since segments are matched to the path by position and cannot simply be omitted.

*Alternative — a new `/query-builder` route with `/queries` kept as the grid.* Rejected: it keeps two
entry points and revives a route the spec retired on purpose.

### D2. The draft's table is a `table` search parameter, resolved on the server

The page reads `searchParams.table`, resolves it against `getEntities()` (absent or unknown → first
entity), and prefetches that entity's schema, exactly as the saved-query page prefetches its primary
source's. The client receives a resolved `initialEntityName`; it never resolves the parameter itself.

*Alternative — keep the table in client state or localStorage.* Rejected: a reload would silently
change the table, and a draft on a given table could not be linked or opened in a new tab.

An unknown name falls back rather than erroring because a table can be renamed or lose its role grant
between the link being made and being opened; the heading shows which table the draft actually landed
on.

### D3. `QueryBuilder` is remounted per target, not re-seeded

Both pages render `QueryBuilder` with a `key` — the saved query's `id`, or `draft:<table>`. Navigating
between two saved queries, or between two drafts, previously could not happen without leaving the page;
now it is the main interaction, and the same page component stays mounted across it. A key gives every
target a fresh state, a fresh AI conversation and a fresh baseline with no reset code.

`onSelectEntity`, the toolbar's `entities` / `selectedEntityName` / `onSelectEntity` props and the
`Select` are deleted with it — a source change is now a navigation, so the in-place path has no caller.
`resolveFieldsForEntity` stays: a JSON or SQL hydrate can still name another entity.

*Alternative — keep one instance and re-seed it from new props in an effect.* Rejected: it is the
"sync props to state" shape `components.md` warns against, and every piece of builder state (SQL
buffer, JSON buffer, result, chart config, AI key) would need its own reset line.

### D4. Draft mode lives in `useSavedQueryPage`

The hook gains a draft branch rather than a sibling hook, because dirty detection, Save as and the
payload capture are the same code:

- **Baseline.** For a draft the baseline is the payload of the builder's starting state, captured once
  after mount with empty metadata, through the same `captureFrom` → `toSavedQueryRequest` path the
  saved-query baseline uses. `isDirty` is then the existing string comparison. This is what "differs
  from its starting state" means in the spec, and it cannot disagree with what Save as query would
  write.
- **Reset.** Reuses the page's Discard confirmation (`EntityView/Modals/Discard`); on confirm the page bumps a reset counter that is part of the
  builder's `key`, so Reset and D3 share one mechanism.
- **Save as query.** Reuses `DuplicateQuery` with an unseeded field set and the scope defaulting to
  personal. On success it
  calls `router.push('/queries/{id}')` and `router.refresh()`; on a saved query the existing
  stay-on-page behaviour is unchanged.

The toolbar's action slot renders by mode: draft → Reset (when dirty) + Save as query; saved query →
the existing set, with Save as lifted out of the `isDirty` branch and Delete added.

### D5. Delete is a toolbar action, not a Save split-menu item

The redesign's header puts Delete under a Save split button. That button does not exist yet, and today
Save is rendered only while the page is dirty — a Delete nested under it would be unreachable on a
clean query. Until the header step lands, Delete is a `GhostButton` beside Edit, shown when
`isWritable`, opening the application's standard delete confirmation
(`components/EntityView/Modals/Delete`). The spec states only that Delete is offered on the page, so
moving it into the split button later needs no spec change.

### D6. Panel state in a layout-level provider; panel rendered by the pages

`app/[lang]/queries/layout.tsx` (server) fetches the panel's data and wraps `children` in a client
`SourcePanelProvider`, colocated with the panel as `QueryBuilder/context.tsx` is with the builder. The provider owns everything that must survive navigation: selected tab, both
search texts, scope filter, expanded tables and groups, the per-table column cache, and the collapsed
flag. The panel itself (`SourcePanel`) is rendered by a small shell that each page wraps its builder
in.

*Alternative — render the panel in the layout.* Rejected: a layout cannot know that its page resolved
to `Page403` or `notFound()`, so the panel would sit beside an access-denied page. With the shell, a
page that returns `Page403` or throws `notFound()` never renders the panel, and the provider is inert.
The layout also runs `isAnalyticsForbidden()` and skips its fetches when access is denied, so a
forbidden caller triggers no table or query read.

The cost is that the panel's DOM remounts on navigation. Everything a remount would lose is therefore
kept in the provider: search, expansion, loaded columns, and each tab's list scroll position, which is
restored on mount — without it the row the user just picked could scroll out of view and read as
"nothing was selected".

### D7. Table list = queryable entities, enriched by name from the catalog

The layout fetches `getEntities()`, `getTables()` and both `listSavedQueries` scopes in parallel. The
Tables tab iterates **entities** and looks up `description` and `tag_order` in a name-keyed map built
from the tables. Entities are the authority because picking a row must always yield a draft the builder
can load; the catalog can hold tables that are not queryable (pending, failed, or not granted to the
caller's role). A `getTables()` failure degrades to a tree without descriptions rather than an empty
panel.

### D8. Columns are read per table on first expansion and cached in the provider

Expanding a table calls the existing `getEntitySchema(name)` server action. The provider keeps a
`Record<tableName, ColumnLoad>` with a status enum (idle / loading / loaded / failed). Grouping reuses
the tag-grouping rule already in `QueryBuilder/utils/fields.ts` (`groupFieldOptions`, `UNTAGGED_KEY`);
if its signature is tied to dropdown options, the grouping core is extracted into a pure util both
callers use rather than duplicated. Ordering by `tag_order` is a pure function with its own unit test.

*Alternative — prefetch every table's schema in the layout.* Rejected: one request per table on every
page load, for columns most visits never look at.

The builder's own schema (for the open table) is a separate read. Sharing them would couple the panel
cache to builder state for the sake of one request that the server-side schema cache already makes
cheap.

### D9. Rows are links; the guard intercepts plain activation only

Table and query rows render as `next/link` anchors to `/queries?table=…` and `/queries/{id}`. That
gives open-in-new-tab, middle-click and copy-link for free and replaces the grid's "Open in new tab"
row action.

The unsaved-work guard is a registration in the provider: the mounted builder registers an
`isDirty` getter; the row's `onClick` lets modified clicks through untouched, and on a plain click with
dirty work calls `preventDefault()`, opens the Discard confirmation from the provider, and on confirm runs the
builder's registered discard and calls `router.push(href)`. The builder does not know about the panel, and the panel does not read builder
state — only the one boolean.

Picking the table an unchanged draft is already on is a no-op: the link's target equals the current
address. For a changed draft the registered discard is what resets it, since pushing the same address
navigates nowhere.

### D10. Accessibility shape of the tree

Nested lists of buttons and links, not an ARIA `tree`: each table row holds two controls — a toggle
`<button>` with `aria-expanded` + `aria-controls`, and the link that picks the table. An ARIA tree
would require roving tabindex and arrow-key handling the rest of the app does not have, and would make
the two controls per row awkward to express. Tag-group headers are toggle buttons with the same
attributes. The current row carries `aria-current`. The collapsed panel does not render its
content at all, as the collapsed rail does not. Tooltips come from the kit (`Tooltip`, `EllipsisTooltip` for truncation); the sensitive marker
icon is `aria-hidden` with the fact stated in the tooltip text. The scope filter's active indicator is
paired with a state in its accessible name.

## Risks / Trade-offs

- **Layout data goes stale until refreshed** → every write path that changes the list (draft save,
  Save as, edit, delete, the vanished-query redirect) calls `router.refresh()`; covered by the
  "Queries tab reflects saved-query writes" scenarios.
- **Entities and catalog disagree on names** → D7 makes entities authoritative; a missing catalog
  counterpart only loses the description and the tag order.
- **Remounting the builder on every navigation discards a running query's result** → intended; a result
  belongs to the query that produced it. The existing run cancellation on unmount covers the in-flight
  case.
- **A draft is lost on reload** → stated in the spec and the proposal's non-goals; the address keeps the
  table, which is the part that is cheap to keep.
- **Removing the grid drops the author and timestamp columns** → no replacement in this change; the
  REMOVED requirement records it.
- **Fixed panel width on narrow viewports** → below the tablet breakpoint the panel starts collapsed and
  opens as an overlay above the builder, with its own open flag so the remembered desktop state is not
  overwritten.
- **A failed list read looked like an empty list** → the layout hands the failure to the provider, which
  reports it through the shared `useReadFailureNotification`. The saved-query actions return no failure
  envelope, so that report carries only the fixed title.

## Migration Plan

Single frontend deploy, no data or API change. Links to `/queries` keep working and land on the draft
builder. Rollback is reverting the change; no stored query is written in a new shape.

## Open Questions

- Whether `v1/queries/entities` and `v1/tables` return the same set of names on a real deployment. D7
  is correct either way; the answer only tells how often a table shows without a description.
