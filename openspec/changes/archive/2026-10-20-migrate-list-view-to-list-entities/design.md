## Context

`ListView` (`components/ListView/ListView.tsx`) is a thin shell: padded container, optional `<h1>`, a `children` slot and a `GridView`. `ListEntities` (`components/ListView/List.tsx`) wraps the same `GridView` and additionally owns the columns-panel state, the Columns button, `ResetFiltersButton` and the `window` click handler that closes the panel. Consumers of `ListView` therefore duplicate all of that:

| Consumer | Duplicated today |
|---|---|
| `EntityListView/EntityListView.tsx` (`BaseEntityList`) | `showColumnsPanel` state, `gridApi` state, click listener; `HeaderButtons` renders Reset + Columns |
| `Images/List/ImagesList.tsx` | same; `Images/List/HeaderButtons.tsx` renders Reset + Columns |
| `ActivityAudit/List/List.tsx` | `ResetFiltersButton` and `gridApi` state; two header layouts (see decision 5) |

Precedent: #5107 moved Tables and Pipelines to `ListEntities` the same way.

## Goals / Non-Goals

**Goals:**
- `BaseEntityList` and `ImagesList` render through `ListEntities` with no consumer-owned columns-panel state, `gridApi` state or click listener.
- Header-button components contain only entity-specific actions (Create / Add / Global firewall).
- `ActivityAudit` renders through `ListEntities` and `ListView.tsx` is deleted.
- Same title, padding, empty state, column-persistence key and click-through behaviour as today.

**Non-Goals:**
- Changing `ListEntities` itself.

## Decisions

**1. Prop mapping, applied identically in both lists.**

| `ListView` | `ListEntities` |
|---|---|
| `data` | `rowData` |
| `title` | `listLabel` |
| `emptyDataTitle` | `emptyDataProps={{ title }}` |
| `view` / `storageKey` | `storageKey` (`BaseEntityList` passes `route`, which `ListView` used as the fallback; `ImagesList` keeps `` `${route}/${DEPLOYMENT_ENTITY.images}` ``) |
| (always padded) | `isMainListView` |
| `showColumnsPanel` / `toggleColumnsPanel` | dropped; `isEnableColumnPanel` |

`storageKey` must stay byte-identical, otherwise operators lose their saved column layout.

**2. `showColumnsButton` becomes `isEnableColumnPanel`.** `BaseEntityList` keeps its existing `showColumnsButton` prop (callers set it per entity) and forwards it as `isEnableColumnPanel={showColumnsButton}`. `ListEntities` already hides the button when the grid has no rows, which matches the old `showColumnsButton && data.length > 0`. *Alternative considered:* rename the prop on `BaseEntityList` — rejected, it widens the diff across ~10 callers for no behaviour gain.

**3. Header buttons shrink rather than get wrapped.** `EntityListHeaderButtons` loses `gridApi`, `toggleColumnsPanel` and `showColumnsButton` plus the Reset/Columns markup; `Images/List/HeaderButtons` loses `gridApi` and `toggleColumnsPanel`. They stay as `children` of `ListEntities`. *Alternative:* pass them via `toolbar` — rejected, `toolbar` renders on its own row below the header.

**4. `gridApi` state is dropped from both lists.** `ListEntities` tracks it internally for `ResetFiltersButton`; neither list uses it otherwise. `onGridReady` is removed unless something else reads it (verify when editing).

**5. `ActivityAudit` fits the shell's existing slots.** It has two modes:

- *Page mode* (no `entity`): `listLabel` is the Activity Audit title and Refresh (plus nothing else) is `children`. The row with the view select, time filter, Reset filters and system-rollback button moves to `toolbar`. The shell's header now also renders Reset filters, so the toolbar copy is dropped rather than shown twice.
- *Embedded mode* (`entity` set, e.g. inside an entity's audit tab): there is no title, and `ListEntities` renders `children` only inside the `listLabel` block, so the time filter, Reset filters and Refresh row goes into `toolbar` and `listLabel` is omitted. `isMainListView` keeps the padding and background both modes have today.

`ListEntities` is not changed. *Alternative considered:* let the shell render `children` without a `listLabel` — rejected here because it widens a shared component for one consumer; revisit only if the `toolbar` fit looks wrong in review.

**6. Delete `ListView.tsx` last.** Once nothing imports it, the file is removed. `constants.ts` and `Header/ResetFiltersButton` stay (shared).

## Risks / Trade-offs

- **Button order on Images** — `ListEntities` renders Reset and Columns before `children`, so "Global firewall" now sits after them instead of before. Acceptable, and consistent with the other lists; flag in the PR.
- **Images Columns button on an empty grid** — it was always shown; it will now hide when there are no rows, as on every other list.
- **Layout differences** — `ListView` used `flex-1 min-h-0` and a `flex-wrap` header; `ListEntities` uses `size-full` and a fixed 40px header. → Visually check a list with a long title/narrow viewport and the Images list; adjust only by passing `className`, not by editing `ListEntities`.
- **Audit header layout** — the page-mode second row loses `flex-wrap` and `mt-4`, and the embedded row moves from the header to the `toolbar` slot (`mb-4` below). → Check both modes at a narrow width; fix via classes inside Audit, not the shell.
- **Header accessibility** — `ListEntities` marks the Columns button `aria-pressed` and the icon `aria-hidden`; this is an improvement over the removed buttons, not a regression.
- **Test churn** — `EntityListView.spec.tsx` and `HeaderButtons.spec.tsx` assert on the removed props/buttons. → Update them to the new contract; assert the Columns/Reset buttons through the real `ListEntities` or a mock added to `test-setup.tsx`.
