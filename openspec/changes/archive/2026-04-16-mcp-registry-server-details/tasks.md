## 1. i18n Keys

- [x] 1.1 Add `ServerDetails`, `LastUpdate`, `Repository`, `Remotes`, `ViewFullServerJson`, `NoServerDetails` to `ContainersI18nKey` in `src/constants/i18n.ts` (reuse `EntityFieldsI18nKey.version` for the Version label — no duplicate key added)
- [x] 1.2 Add matching strings to `src/locales/en.ts`

## 2. API Layer

- [x] 2.1 Add `MCP_REGISTRY_SERVER_VERSIONS` URL constant (`${API}/mcp-registry/servers/versions`) in `src/server/deployments/mcp-registry.ts`
- [x] 2.2 Add `getMcpServerVersion(serverName: string, version: string, token: Token)` method to `McpRegistryApi` using `postAction` with body `{ serverName, version }`
- [x] 2.3 Add unit tests to `src/server/deployments/tests/mcp-registry.spec.ts` covering request body shape and URL

## 3. Server Action

- [x] 3.1 Add `getMcpServerVersion(serverName: string, version: string)` server action to `src/app/actions/deployments.ts` — authenticate via `getUserToken`, delegate to `mcpRegistryApi.getMcpServerVersion`
- [x] 3.2 Add helper `unwrapSingleServerResponse(response)` (local to the action or in `utils/deployments/mcp-registry.ts`) that extracts `response.servers[0]` as an `McpServerResponse` and returns `{ success, response: { server, _meta } | null, errorHeader?, errorMessage? }` — BE returns a single-item list when `version` is set
- [x] 3.3 Unit test for the unwrap helper covering: single-item response, empty array, failed upstream call

## 4. ExternalUrlCellRenderer

- [x] 4.1 Create `src/components/Grid/CellRenderers/ExternalUrlCellRenderer.tsx` — accepts `ICellRendererParams`, uses `isValidHttpUrl` from `utils/validation/url-error.ts`, renders `<a target="_blank" rel="noopener noreferrer">` with `IconExternalLink` from `@tabler/icons-react` when valid; plain text otherwise; empty cell when value is falsy
- [x] 4.2 Use DIAL link color token (`text-accent-primary` with `hover:underline`) — no hardcoded colors
- [x] 4.3 Add unit tests in `src/components/Grid/CellRenderers/tests/ExternalUrlCellRenderer.spec.tsx` covering: valid HTTPS URL, valid HTTP URL, invalid URL (renders plain text), empty/undefined value, click opens in new tab with correct rel attributes
- [x] 4.4 Do not use `data-testid` — query by role/text per `tasks` config rule

## 5. Column Definitions

- [x] 5.1 Update `MCP_REGISTRY_COLUMNS` in `src/constants/grid-columns/grid-columns.tsx`:
  - `websiteUrl` column → `cellRenderer: ExternalUrlCellRenderer`
  - `repository.url` column → `cellRenderer: ExternalUrlCellRenderer` (keep existing `valueGetter`)
- [x] 5.2 Verify column width fits anchor + icon without clipping; adjust `minWidth` if needed

## 5.5 CodeViewer `hideFullscreen` prop

- [x] 5.5.1 Add optional `hideFullscreen?: boolean` prop to `src/components/Common/CodeViewer/CodeViewer.tsx` (default `false` preserves existing behavior for all other callers)
- [x] 5.5.2 When `hideFullscreen`, do not render the maximize `DialGhostIconButton` or the `FullscreenViewer`
- [x] 5.5.3 Add a unit test in `CodeViewer.spec.tsx` asserting the maximize button and `FullscreenViewer` are absent when `hideFullscreen` is passed

## 6. Shared SidePanel Chrome

- [x] 6.1 Create `src/components/Common/SidePanel/SidePanel.tsx` — props: `label: ReactNode`, `isOpen: boolean`, `onClose: () => void`, `children: ReactNode`, `className?: string`
- [x] 6.2 Render outer container: `flex flex-col lg:w-[420px] p-4 border border-primary rounded h-full` (escape-hatch via optional `className`); header row: `flex flex-row justify-between items-center mb-4` with `<span className="dial-tiny-text text-secondary">{label}</span>` and `DialCloseButton` (size 24); children below
- [x] 6.3 Open-gating: when `!isOpen`, component returns `null` (mirror `ModelDescription.tsx:36-38`)
- [x] 6.4 Component owns ONLY chrome — no data-fetching, no loading/empty states, no i18n lookups (all handled by consumers)
- [x] 6.5 Add unit tests in `src/components/Common/SidePanel/tests/SidePanel.spec.tsx`: renders nothing when `isOpen=false`, renders label and children when `isOpen=true`, invokes `onClose` when close button clicked, applies `className` override, no `data-testid` usage (query by role/text)
- [x] 6.6 Refactor `src/components/Deployments/Modals/HFRegistryModal/ModelDescription.tsx` to compose `SidePanel` — preserve existing behavior (fetch `getModelDetails`, render `MdViewer`/`DialLoader`/`DialNoDataContent` inside `children`, pass `isDescriptionShown` as `isOpen`, `onChangeIsDescriptionShown(false)` as `onClose`, `t(ContainersI18nKey.ModelDetails)` as `label`)
- [x] 6.7 Verify HF existing tests still pass; update mocks only if test setup requires it (no existing tests for ModelDescription)

## 7. McpServerDetails Sidebar Component

- [x] 7.1 Create `src/components/Deployments/Modals/McpRegistryModal/McpServerDetails.tsx` — props: `server?: McpServer` (initial row data), `serverResponse?: McpServerResponse` (full payload with _meta, when loaded), `isLoading: boolean`, `isOpen: boolean`, `onClose: () => void`
- [x] 7.2 Compose `SidePanel` with `label={t(ContainersI18nKey.ServerDetails)}`, `isOpen`, `onClose`; body children wrapped in `flex flex-col gap-4` with `overflow-y-auto`
- [x] 7.3 Body blocks in order: `<h3 className="dial-h3">` (name) → `<p className="dial-small-text text-primary">` (description) → flex-row with two `DialLabelledText` (Version, Last Update — format `updatedAt` with the same date formatter used in the column) → `DialLabelledText` with children for Repository (renders `<a>` when url is valid)
- [x] 7.4 Render empty inline tag chips for `remotes` using the same visual style as the Remotes grid column (reuse `TagsCellRenderer` static rendering or DIAL tag token styles)
- [x] 7.5 "View full server.json" — render `CodeViewer` with `title={t(ContainersI18nKey.ViewFullServerJson)}`, `content={JSON.stringify(serverResponse ?? { server }, null, 2)}`, and `hideFullscreen` to suppress the maximize affordance inside the modal; show `DialLoader` placeholder when `isLoading`
- [x] 7.6 When no `server`, skip rendering body blocks (SidePanel's `isOpen` still controls chrome visibility)
- [x] 7.7 All user-facing strings via `useI18n()` — no hardcoded text
- [x] 7.8 Add unit test covering: renders name/description/version/updatedAt from `server`, renders repository link when url is valid, renders `CodeViewer` with stringified payload, `SidePanel` close callback propagates

## 8. McpRegistryGrid Wiring

- [x] 8.1 Extend `McpRegistryGrid` props: add `infoPanel?: ReactNode`, `onShowDetails?: (server: McpServer) => void`
- [x] 8.2 Build `columnDefs` inside the component: `[...MCP_REGISTRY_COLUMNS, { ...UTILITY_COLUMN, field: 'detailsColumn', cellRenderer: () => <IconFileDescription className="text-secondary" />, cellClass: 'relative', pinned: 'right', lockPinned: true }]` (mirror `HFRegistryGrid.tsx:122-132`)
- [x] 8.3 Add `onCellClicked: (event) => { if (event.colDef.field === 'detailsColumn' && event.data) onShowDetails?.(event.data) }` to `gridOptions`
- [x] 8.4 Pass `infoPanel` through to `ListEntities`
- [x] 8.5 Ensure clicking the details column does NOT mutate selection (verify `onRowSelected` guard ordering)
- [x] 8.6 Update existing grid unit tests if any, or add one confirming `onCellClicked` dispatches to `onShowDetails` only for the details column (no existing tests)

## 9. McpRegistryModal Wiring

- [x] 9.1 Add state to `McpRegistryModal`: `detailsServer: McpServer | undefined`, `detailsResponse: McpServerResponse | undefined`, `isDetailsOpen: boolean`, `isDetailsLoading: boolean`
- [x] 9.2 Add `onShowDetails` callback: sets `detailsServer`, opens panel, kicks off `getMcpServerVersion(server.name, server.version)` and stores result in `detailsResponse`; on error clears `detailsResponse` and keeps the sidebar open showing the instant row data
- [x] 9.3 Construct `infoPanel = <McpServerDetails server={detailsServer} serverResponse={detailsResponse} isLoading={isDetailsLoading} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />`
- [x] 9.4 Pass `infoPanel` and `onShowDetails` into `<McpRegistryGrid>`
- [x] 9.5 Verify modal layout container (`flex h-full bg-layer-2 py-4 px-6 gap-4`) accommodates the sidebar without horizontal scroll — adjust padding/gap only if visibly broken (layout unchanged — deferred to smoke-test)

## 10. Tests

- [x] 10.1 Unit test for `SidePanel` (see 6.5) — covers open-gating, close callback, label/children rendering, className override
- [x] 10.2 Unit test for `ExternalUrlCellRenderer` (see 4.3) — covers URL validity branches and anchor attributes
- [x] 10.3 Unit test for `McpRegistryApi.getMcpServerVersion` — verifies URL and body
- [x] 10.4 Unit test for `getMcpServerVersion` server action — verifies token acquisition and delegation
- [x] 10.5 Unit test for `unwrapSingleServerResponse` helper
- [x] 10.6 Unit test for `McpServerDetails` (see 7.8)
- [x] 10.7 Verify HF `ModelDescription` existing tests still pass after `SidePanel` refactor (no existing tests)
- [x] 10.8 Reuse mocks from `test-setup.tsx` — do not add new mocks for `useI18n`, `useSession`, or context providers
- [x] 10.9 Ensure `McpRegistryGrid` and `McpRegistryModal` existing tests still pass with new props (add fallback behavior when `infoPanel`/`onShowDetails` are undefined) — new props are optional

## 11. Quality Checks

- [x] 11.1 Run `npm run lint` and fix issues
- [x] 11.2 Run `npm run format:write`
- [x] 11.3 Run `npm run test` from `apps/ai-dial-admin/` — all tests pass (4107 passed, 16 skipped)
