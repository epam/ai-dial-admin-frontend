## Why

Every Admin page sits on a rounded content card drawn on a page background that differs from the header and
the left menu. The card adds a second surface and a second gutter, around 40px per side in total, which spends
width on the dense grids and forms. The new design drops the card: page content sits directly on the same
surface as the header and the menu, and the content area gets wider.

## What Changes

- The page, the header and the left menu share one surface, the darkest page layer of the theme, so the shell
  reads as one plane. The page already uses it; the left menu moves to it from its lighter surface.
- Page-level content cards are removed from every page rendered inside the shell: entity lists, entity detail
  views, Import Config, Export Config, Folders Storage, System Rollback, System Properties, the Analytics pages
  (Query Builder, Tables, Pipelines, Sessions, session detail), the Telemetry dashboard, Run Compare, and the
  Usage Log, and the error, 403, 404 and maintenance pages.
- The content area has one 24px gutter between the menu or header and the page content, instead of the shell
  gutter plus the card padding. Small screens keep a 16px gutter, which the card used to provide.
- Elements inside pages keep a visible edge without the card: in-page side panels move to the card surface,
  section frames and metric cards take the kit input border, and separator lines take the header's stroke.
- Layout regressions the removed card exposed are fixed: a 2px horizontal scroll in entity views, long
  unbroken text scrolling a conversation sideways, and compressed rows in grids that receive their columns
  through the grid API.
- Entity view action bars that float at the bottom of the card on small screens keep their space at the
  bottom of the page.

## Capabilities

### New Capabilities

- `page-layout`: how page content sits inside the application shell — the shared surface of the page, header
  and menu, the absence of a page-level card, and the content gutter.

### Modified Capabilities

None. `entity-list-shell` keeps its requirements: the list header, heading and controls do not change, only the
surface around them.

## Non-goals

- Modals, drawers and the right and bottom sidebars keep their current surfaces, including lists embedded in a
  modal.
- No new color tokens and no changes to theme configuration: the change reuses the surface the header already
  uses, so custom themes need no update.
- No changes to the header, the breadcrumbs or the footer; the left menu changes only its background.
- The ui-kit grid keeps its own theme; any mismatch with the mockup is reported upstream.
- No redesign of page content beyond what the removed card forces or exposes; frames in modals, chips, editors
  and the hand-made compact controls keep their stroke.

## Impact

- Shell: `src/app/[lang]/global.scss` (page background token), `src/components/SideBar/SideBar.tsx` and
  `src/components/Menu/MenuContent/MenuContent.tsx` (menu background), `src/components/Content/Content.tsx`
  (gutter).
- Shared list shell: `src/components/ListView/List.tsx` and `mainListEntitiesViewClassName` in
  `src/components/ListView/constants.ts`.
- About 45 entity view roots that repeat the same card wrapper (`*/View/View.tsx`, `Assets/Platform/*/View.tsx`,
  `Assets/Entities/*`, `Containers/View/ContainerView.tsx`, `Images/View/ImageView.tsx`, and others).
- Page roots with their own card: `ImportConfig`, `ExportConfig`, `FoldersStorage`, `ActivityAudit`
  (`AuditView`, `SystemRollback`), `SystemProperties`, `Telemetry/DashboardView`, `Runs/Compare/CompareView`,
  `Analytics` (`QueryBuilder`, `Tables/TableDetailView`, `Pipelines/Common/PipelineDetailFrame`,
  `SessionsTrace`), `Page403`, `Page404`, `PageMaintenance`.
- Borders and surfaces inside pages: `Common/Accordion`, `Common/MetricCard/MetricCardShell`, telemetry cards,
  section frames inside entity view tabs, the Sessions pages, every one-sided separator line, and the in-page
  collapsible side panels.
- Layout fixes: entity view scroll containers, `Assets/Artifacts/Conversations/View/Conversations.tsx`, and the
  icon-row height in `src/components/Grid/AgGridWrapper.tsx`.
- No API, server action, routing or dependency changes. Component specs that assert the removed card classes
  need updating.
