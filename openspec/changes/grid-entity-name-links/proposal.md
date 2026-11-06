## Why

The Admin table rules in the design system make an ENTITY table open its second level through a link in
the entity-name cell, not through a click anywhere on the row. Today every entity list navigates on a
click in any cell except the actions column, so a click meant to select text, read a long value or reach
a tag opens the details page, the name looks like plain text, and "open in new tab" works only through
modifier tracking or a menu item instead of the browser's own link handling.

## What Changes

- In every ENTITY table the entity name renders as a link to that entity's details page; it is the only
  part of the row that navigates. A click elsewhere in the row does nothing.
- The link is a real link: a plain click opens the details page in the same tab, and Cmd/Ctrl-click,
  middle-click and the browser's link menu open it in a new tab. Keyboard users reach it with Tab and
  open it with Enter.
- The Evaluation nested tabs (a test suite's Runs tab, a dataset's Test Suites tab) stop forcing a new
  tab on a plain click and follow the same link behavior as every other list.
- The Assets lists (Prompts, Skills, Projects, Conversations, Entities and Platform asset lists) open an
  item through the link in its name; a folder row still opens the folder in place.
- Activity Audit (the `/activity-audit` page and every entity Audit tab) has no name column: its Activity ID
  column moves to the first place after the row expander and becomes the link. It keeps opening the activity
  in a new tab, as the row click did, so the list and the entity's Audit tab stay where they are.
- **BREAKING** (behavior): a row click outside the name no longer opens the details page. Row hover stays.
- The Pipelines listing renders the pipeline name as a link, reversing its earlier text-only rule.

## Non-goals

- Links to related entities in other columns (e.g. a run's target): only the row's own entity name links.
- Grids whose row click does something other than navigation (selection, expanding a row, opening a
  drawer or modal in place) and DATA / EDITABLE / HEAT MAP tables.
- The other Admin table rules on the same design page (row density, vertical dividers, borders).
- Row action menus: their "Open in new tab" entries stay.

## Capabilities

### New Capabilities

- `grid-entity-links`: the shared behavior of an ENTITY table — the name cell as the single navigation
  link, same-tab and new-tab opening, keyboard access, the rest of the row not navigating, row hover.

### Modified Capabilities

- `containers`: container rows open through the name link instead of a row click.
- `dataset-management`: a dataset opens through its name link.
- `platform-keys`: a key opens through its name link.
- `platform-catalog-schemas`: a URI-shaped schema name opens through its link.
- `platform-app-runners`: a URI-shaped runner name opens through its link.
- `platform-toolsets`: a platform-bucket toolset opens through its name link.
- `platform-applications`: a platform-bucket application opens through its name link.
- `config-file-entity-views`: the new-tab URL matches the name link, not a row click.
- `eval-runs-list`: a run opens through its name link; the same-tab / new-tab split follows the link.
- `dataset-test-suites`: a bound test suite opens through its name link, same tab by default.
- `analytics/tables`: a table opens through its name link; a table Audit tab row opens through its Activity ID link.
- `analytics/saved-queries`: a saved query opens through its name link.
- `analytics/sessions-listing`: a session opens through its title link (its id when untitled).
- `analytics/pipelines`: the pipeline name renders as a link and is the only navigating cell; a pipeline
  Audit tab row opens through its Activity ID link.
- `audit-row-open-in-new-tab`: the Activity ID link, first after the expander, opens the detail in a new tab.
- `activity-audit-analytics-view`, `activity-audit-deployments-view`, `activity-audit-deployments-tab`:
  their row-body click becomes the Activity ID link.

## Impact

- Grid name cells: `DisplayNameCellRenderer`, `TitleSubtitleCellRenderer`, `SessionCellRenderer`, the
  Tables name renderer, and the plain-field name columns of Images, Publications, Queries, Pipelines,
  test suites, datasets, metrics and App Runners gain a link.
- Row-click wiring removed or narrowed: `EntityListView` (`on-cell-clicked.ts`), `ListView/Evaluation`,
  `ContainersList`, `ImagesList`, `Publications/List`, `QueriesList`, `TablesView`, `PipelinesView`,
  `SessionsList`, `TestSuites/Runs`, `Datasets/TestSuites`, `BaseAssetList` (`onTableFileClick`).
- `AgGridWrapper` row-hover rule (`ag-grid-static-rows`) and `useCellContextMenu` (`getHref`) follow
  the new wiring; `usePointerClickModifier` may become unused.
- Unit tests of every touched list; no backend or API change.
