## 1. Shared link cell

- [x] 1.1 Add `EntityLinkCell` in `apps/ai-dial-admin/src/components/Grid/CellRenderers/` rendering children inside `next/link` (`prefetch={false}`, `text-accent`, underline on hover and `focus-visible`, focus ring) per design D1
- [x] 1.2 Add `LinkCellRenderer` for plain-field name columns, rendering the formatted value as an `EntityLinkCell` with an href getter from `cellRendererParams`
- [x] 1.3 Give `DisplayNameCellRenderer` and `TitleSubtitleCellRenderer` an optional href (via `cellRendererParams`) that wraps only the title text in `EntityLinkCell`, keeping the icon/avatar and subtitle outside the link
- [x] 1.4 Unit tests for `EntityLinkCell`, `LinkCellRenderer` and both renderers: link role and accessible name equal the display name, `href` matches, plain text when no href

## 2. Entity, Deployments and Publications lists

- [x] 2.1 `EntityListView`: pass the name href (`getUrnForEntity(route, row)`) to the name column (including App Runners' plain column via `LinkCellRenderer`) and remove the navigating `onCellClicked`; keep `getHref`
- [x] 2.2 `Containers/List/ContainersList.tsx` and `Images/List/ImagesList.tsx`: name link, no navigating `onCellClicked`, keep `getHref`
- [x] 2.3 `Publications/List/List.tsx`: request-name link, no navigating `onCellClicked`, keep `getHref`
- [x] 2.4 Update unit tests of the touched lists: the name is a link with the right `href`; a cell click no longer calls `router.push`

## 3. Evaluation lists and nested tabs

- [x] 3.1 `ListView/Evaluation/List.tsx` (test suites, datasets, metrics, runs): name link per column, no navigating `onCellClicked`, keep `getHref`
- [x] 3.2 `TestSuites/Runs/Runs.tsx` and `Datasets/TestSuites/TestSuites.tsx`: name link (same tab by default), drop the `onOpenInNewTab` row click, add `getHref`
- [x] 3.3 Update unit tests for the Evaluation lists and both nested tabs

## 4. Analytics lists

- [x] 4.1 `Analytics/Queries/List/QueriesList.tsx`: name link, no navigating `onCellClicked`, keep `getHref`
- [x] 4.2 `Analytics/Tables/TablesView.tsx`: wrap the name in the Tables name renderer with `EntityLinkCell` (`tableDetailHref`), drop the navigating `onCellClicked`, add `getHref`
- [x] 4.3 `Analytics/Pipelines/PipelinesView.tsx`: name link (`pipelineDetailHref`), drop the navigating `onCellClicked`, add `getHref`
- [x] 4.4 `Analytics/SessionsTrace/List/SessionsList.tsx` and `SessionCellRenderer`: session-id link (`sessionDetailHref`), drop `onCellClicked` and the Enter `onCellKeyDown`, add `getHref`
- [x] 4.5 Update unit tests for Queries, Tables, Pipelines and Sessions lists

## 5. Assets lists

- [x] 5.1 Extract the item-URL building from `BaseAssetList.handleGridItemClick` (including `configFile=true` on the file root except Catalog Schemas) into a pure helper with unit tests
- [x] 5.2 `Assets/BaseAssetList/utils.tsx` `getAssetNameColumn`: pass the item href to `DisplayNameCellRenderer`; folder rows keep the package renderer
- [x] 5.3 `BaseAssetList.tsx`: stop passing `onTableFileClick`; delete `hooks/use-pointer-click-modifier.ts` and its test once unused
- [x] 5.4 Update `BaseAssetList` / `getAssetNameColumn` unit tests: an item name is a link with the right `href`; folder rows render no link

## 6. Cleanup and docs

- [x] 6.1 Delete whatever of `EntityListView/utils/on-cell-clicked.ts` (`onCellClicked`, `navigateEntityUrl`, `shouldOpenInNewTab`) no longer has a caller outside Activity Audit, with its tests
- [x] 6.2 Update any doc under `docs/` that describes row-click navigation

## 9. Activity Audit

- [x] 9.1 `EntityLinkCell` / `LinkCellRenderer`: add an `isNewTab` mode (`target="_blank"`, `rel="noopener noreferrer"`); `withNameLink` forwards extra link params; add `moveColumnFirst`
- [x] 9.2 `ActivityAudit/List/List.tsx`: Activity ID as a new-tab link placed first after the expander, one `getActivityHref` applying the old click guards, passed to the column and the grid; remove `onCellClicked` and the clickable-row class
- [x] 9.4 Keep the expander and Activity ID first in restored layouts via `LEADING_COLUMN_IDS` (`mergeColumnOrder` and `applyColumnStateOrderToColDefs`), with tests
- [x] 9.3 Update `ActivityAudit/List/tests/List.spec.tsx`: link params, first position, no `onCellClicked`, no link for Rollback/Import rows

## 7. Verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled): name link opens details in the same tab, a row click outside the name does not navigate, Cmd/Ctrl-click opens a new tab, a folder row opens the folder; resolve every `fail` verdict

## 8. Quality checks

- [x] 8.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs` and the full test suite; fix every failure
