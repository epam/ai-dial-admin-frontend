## 1. Shell surface and gutter

- [x] 1.1 Set the page background in `src/app/[lang]/global.scss` to `bg-layer-base`, and the left menu (`src/components/SideBar/SideBar.tsx`) and its hover overlay (`src/components/Menu/MenuContent/MenuContent.tsx`) from `bg-layer-3` to `bg-layer-base`, with a 1px `border-r border-tertiary` on both (design Decision 1)
- [x] 1.2 Change the page slot padding in `src/components/Content/Content.tsx` to `px-4 pt-4 md:px-6 md:pt-6` with `pb-4 md:pb-6`, `pb-0` while the bottom sidebar is open (Decision 2)
- [x] 1.3 Remove `bg-layer-2 rounded` and the `mainListEntitiesViewClassName` padding from `src/components/ListView/List.tsx`, then delete the `isMainListView` and `isEmbedToModal` props and their call sites (Decision 3)
- [x] 1.4 Update `Content.spec.tsx` and `ListView/tests/List.spec.tsx` to assert the gutter and the absence of card classes on the list

## 2. Page cards

- [x] 2.1 In every entity view root using `bg-layer-2 rounded p-4 pb-14 lg:pb-4`, replace those classes with `pb-14 lg:pb-0`, keeping the layout classes (entity views under `*/View/`, `Assets/Platform/*/View.tsx`, `Assets/Entities/*`, `Assets/Artifacts/*/View/View.tsx`, `Containers/View/ContainerView.tsx`, `Images/View/ImageView.tsx`, `SystemProperties`, `Analytics/Pipelines/Common/PipelineDetailFrame.tsx`)
- [x] 2.2 Remove the card from `ImportConfig`, `ExportConfig`, `FoldersStorage`, `ActivityAudit/Rollback/SystemRollback.tsx`, `ActivityAudit/View/AuditView.tsx` (non-modal branch only), `Telemetry/DashboardView.tsx`, `Runs/Compare/CompareView.tsx`, `Analytics/Tables/TableDetailView.tsx`, `Analytics/SessionsTrace/SessionsTraceView.tsx`, `Analytics/SessionsTrace/Detail/SessionDetailView.tsx`, `Analytics/SessionsTrace/Detail/SessionDetailError.tsx`
- [x] 2.3 Remove the page background from `Page403`, `Page404`, `PageMaintenance`, keeping their centering and inner card
- [x] 2.4 Flatten the pages framed without the shared wrapper: `Common/FileManager/FileManager.tsx` (asset lists), `Analytics/QueryBuilder/QueryBuilder.tsx` and `Result/ResultArea.tsx`, `Analytics/Usage/UsageDashboard.tsx`, `Analytics/CustomDashboards/CustomDashboardView.tsx`
- [x] 2.5 Grep `src/components` for the card patterns (`bg-layer-2 rounded`, `rounded bg-layer-2`, `rounded p-4 bg-layer-2`, `bg-layer-2 rounded py-`) and confirm every remaining match is a nested surface, not a page root

- [x] 2.6 Switch the border of `Common/Accordion/Accordion.tsx` from `border-primary` to `border-secondary`, the stroke ui-kit inputs use, and the same for the section frames inside entity view tabs listed in Decision 5

- [x] 2.7 Align the remove buttons next to labelled kit inputs (`Routes/Paths/Path.tsx`, `InterfacesField/InterfaceEndpointRow.tsx`, `UpstreamEndpoints/Endpoint/Endpoint.tsx` remove and expand buttons, `TestSuites/Metrics/ScoreSettings/WeightRow.tsx`, `Keys/View/Properties/RangeItems.tsx`) with the input through one `LABELLED_FIELD_TOP_OFFSET` (`mt-6`) in `src/constants/main-layout.ts`, replacing the `mt-7` copies (Decision 6)

- [x] 2.8 Switch every one-sided separator line in `src/components`, including class constants in `.ts` files (`Runs/Details/RowDetails/constants.ts`, `Runs/View/RowDetails/constants.ts`), from `border-primary` / `border-secondary` to `border-tertiary`, except the `DiffMiniMap` viewport frame (Decision 7)

- [x] 2.9 Move the in-page collapsible side panels (App Routes in `EntityView/AppRoute` and `Assets/ObjectAppRoutes`, entity Audit, Conversations, test-suite Requests, container Execution log, Folders Storage) from `bg-layer-3` to `bg-layer-2`, the surface the dashboard widgets use; give the upstream endpoint row `bg-layer-2` with the kit input border (`border-secondary`)
- [x] 2.10 Make the 34 entity view scroll containers vertical-only (`overflow-y-auto overflow-x-hidden`): hidden `sr-only` switch inputs overflowed them by 2px once the card padding was gone; wrap long unbroken message text in `Assets/Artifacts/Conversations/View/Conversations.tsx` (`min-w-0 break-words`)

- [x] 2.11 In `Grid/AgGridWrapper.tsx`, apply the 56px icon-name row height also when the columns arrive through the grid API (`onGridColumnsChanged`), so grids like the Entities tab match the listings; restore the kit height when the icon column goes away and skip the reset when nothing changes

- [x] 2.12 Remove the card the Usage Log page passes through `className` (`app/[lang]/usage-log/page.tsx`) and the global error page's `bg-layer-2` (`app/error.tsx`), and drop the extra frame around the Usage Log grid in `UsageLog/UsageLog.tsx`

- [x] 2.13 Keep small screens inside the margin: the entity header tab list scrolls horizontally (`tabListClassName="overflow-x-auto"` in `EntityHeaderControls/Tabs/HeaderTabs.tsx`), and `Content.tsx` puts the page in a `flex-1 min-h-0` box under the mobile breadcrumbs so a `size-full` page no longer overflows by the breadcrumbs' height

## 3. Verification

- [ ] 3.1 Run the `spec-browser-verify` skill for this change against the local app in both the dark and the light theme and resolve every `fail` verdict; in the same run, compare the ui-kit grid colors on a list page with the mockup and file an upstream ui-kit issue for any mismatch instead of overriding the kit theme
- [ ] 3.2 Check the `bg-layer-1` insets that used to sit inside the card (session trace panes, run row-detail header cells) in the browser and add a border only where one loses its boundary (Decision 4)
- [x] 3.3 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`
