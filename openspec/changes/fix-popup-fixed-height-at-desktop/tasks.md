## 1. Confirm the mechanism and the site list

- [x] 1.1 Confirm against the kit's `mergeClasses` that `md:h-auto` is replaced by `md:h-[800px]`, `md:h-[80vh]` and `md:h-[754px]`, and that an unprefixed `h-[800px]` leaves `md:h-auto` in place (the cause in #5197); checked by hand, no spec kept
- [x] 1.2 Grep for `Popup` heights outside a literal one-line `<Popup className="…">`: `classNames(...)`/variable `className`, and wrappers that forward `className` to `Popup` (e.g. `components/Common/InputPopup`); add any hits to the lists below
- [x] 1.3 Inspect `TestSuites/Modals/EditRequestWizard/EditRequestWizard.tsx:187` (`min-h-[800px]`): if its body relies on `h-full`/`flex-1`, change to `md:h-[800px]`; otherwise leave it and note why in the PR

## 2. Eval modals (the reported cases)

- [x] 2.1 `TestSuites/Metrics/AddMetric/AddMetricModal.tsx:196`: `h-[800px]` → `md:h-[800px]`, keeping `w-[1200px] max-w-[calc(100vw-2rem)]`
- [x] 2.2 `Runs/View/RowDetails/FullscreenValueViewer.tsx`, `Runs/Details/BottomDrawer/FullscreenDiffViewer.tsx`: `h-[80vh]` → `md:h-[80vh]`
- [x] 2.3 `Runs/Compare/SelectCompareRunModal.tsx` (`h-[750px]`), `TestSuites/EndpointSchema/Columns/DocumentationModal.tsx` (`h-[800px]`), `TestSuites/TestCases/AddTestCase.tsx` (`h-[660px]`): add `md:`

## 3. Source-field and entity pickers

- [x] 3.1 `SourceField/Adapters/SelectAdapterModal.tsx`, `SourceField/Application/SelectAppRunnersModal.tsx`, `SourceField/Containers/SelectContainerModal.tsx`, `SourceField/Template/SelectRunnerModal.tsx` (`h-[750px]`): add `md:`
- [x] 3.2 `Common/FileSelectInput/FileSelectInput.tsx` (`h-[800px]`), `EntityView/AddEntitiesGrid.tsx` (`h-[800px]`), `Applications/View/Dependencies/AddDependenciesModal/AddDependenciesModal.tsx` (`h-[800px]`), `CatalogProperties/SelectCatalogSchemaModal.tsx` (`h-[750px]`), `Tools/ManageToolsModal/ManageToolsModal.tsx` (`h-[800px]`): add `md:`

## 4. Remaining feature modals

- [x] 4.1 `Deployments/Modals/HFRegistryModal/HuggingfaceRegistry.tsx`, `Deployments/Modals/ImageAddContainer.tsx`, `Deployments/Modals/McpRegistryModal/McpRegistryModal.tsx` (`h-[800px]`), `Deployments/Modals/ContainerChangeImage.tsx` (`h-[600px]`, keep `lg:max-w-[55%] md:max-w-[75%]`): add `md:`
- [x] 4.2 `ActivityAudit/Modals/Details.tsx` (`h-[800px]`), `Analytics/QueryBuilder/Result/ResultValueDialog.tsx` (`h-[80vh]`), `Assets/Modals/CreateAsset.tsx` (`h-[750px]`), `EntityListView/Import/ImportModal.tsx` (`h-[660px]`): add `md:`
- [x] 4.3 `ExportConfig/AddEntities/AddEntitiesModal.tsx` (`h-[800px]`), `ExportConfig/Preview/PreviewModal.tsx` (`h-[754px]`), `ImportConfig/ConfigurationPreview/GlobalFirewallCompareModal.tsx` (`h-[800px]`): add `md:`
- [x] 4.4 `Common/FullscreenViewer/FullscreenViewer.tsx` (`h-[80vh]`, found in 1.2; its `header` JSX hid it from the first scan): add `md:`

## 5. Tests

- [x] 5.2 Update component specs that assert the old `h-[…]` class (grep specs for `h-\[` near `Popup`/modal names); none may be left asserting the unprefixed class
- [x] 5.3 Add a regression assertion to `AddMetricModal` and `FullscreenValueViewer` specs that the popup `className` carries the `md:`-prefixed height (specs mock `Popup` per `test-setup.tsx`, so assert the prop)

## 6. Row menu in file-manager lists (#5200)

- [x] 6.1 `src/scss/tailwind.css`: add `@source` for `@epam/ai-dial-react-file-manager/dist` with a comment saying why
- [ ] 6.2 Confirm the three dots appear on row hover in an AI Gateway list, Artifacts > Files and the Select document modal (Public tab), and that the lists and the Move to popup look unchanged

## 7. Quality checks

- [ ] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, then `npm run test` (full run last)

<!-- No browser-verification task: declined when asked. Acceptance of the height scenarios rests on 5.3 for the popups; 6.2 is a hand check by the reporter's flow for #5200. -->
