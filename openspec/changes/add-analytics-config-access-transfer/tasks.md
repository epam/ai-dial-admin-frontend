## 1. Contract

- [x] 1.1 Add `include_access?: true`, `CatalogLeftBehindItem`, `CatalogExportAccessItem` and `access?` to `models/analytics/catalog-export.ts`
- [x] 1.2 Add `CatalogAccessEntry` (widened `rows`), `CatalogAccessImportEntry` and `access` on `CatalogImportPreview` / `CatalogImportResult` to `models/analytics/catalog-import.ts`
- [x] 1.3 Add `CatalogAccessImportAction`, `CatalogAccessImportStatus` and `AnalyticsImportPreviewTab.ACCESS` to `types/analytics/import.ts`; add `AnalyticsExportPreviewTab.ACCESS` to `types/analytics/export.ts`
- [x] 1.4 Give `CATALOG_IMPORT_QUERY` an `isAccessIncluded` argument in `server/analytics/analytics-data-api.ts` and thread it through `previewCatalogImport` / `importCatalog` and `previewAnalyticsImportConfig` / `importAnalyticsConfig` in `app/[lang]/import-config/actions.ts`

## 2. Grant permission

- [x] 2.1 Add `hooks/use-analytics-access-grant.ts` over `getTables` from `app/[lang]/tables/actions.ts`, per design D1

## 3. Export

- [x] 3.1 Add `isAccessIncluded` to `buildCatalogExportRequest` in `components/ExportConfig/analytics-utils.ts` (D2)
- [x] 3.2 Add the access branch to `isExportableTable` and an `isSystem` marker to table grid rows in `utils/entities/analytics-entities-list-view.ts`; pass the flag through `getAnalyticsEntities` in `app/[lang]/export-config/actions.ts` (D3)
- [x] 3.3 Own `isAccessIncluded` in `components/ExportConfig/ExportConfig.tsx`: reset on scope change, force off when the grant hook says no, drop system tables from the selection when unchecked, feed `analyticsExportRequest`
- [x] 3.4 Render the Include access checkbox with its hint in the Structure panel of `components/ExportConfig/ExportConfig.tsx`; bind `loadCandidates` to the flag and remount `TabbedSelectionContent` on toggle in `components/ExportConfig/Content/AnalyticsConfigContent.tsx` (D3)
- [x] 3.5 Add Access rows, tab visibility, warning status and count, and the Required system tables Reason column to `components/ExportConfig/analytics-utils.ts` and `components/ExportConfig/Preview/AnalyticsExportPreview.tsx` (D4)

## 4. Import

- [x] 4.1 Own `isAccessIncluded` in `components/ImportConfig/ImportConfig.tsx`: reset effect, scope reset, preview dependency, import call, grant hook (D6)
- [x] 4.2 Render the Include access checkbox with its hint under the Analytics policy in `components/ImportConfig/Files/Files.tsx`
- [x] 4.3 Add `toAccessRow`, the Access tab and columns, Update label and styling for `REPLACE`, result statuses to `components/ImportConfig/ConfigurationPreview/analytics-import.utils.ts`; extend `isAnalyticsImportBlocked` to access entries (D5)
- [x] 4.4 Wire the Access tab and its Compare id into `AnalyticsImportGrid.tsx` / `AnalyticsImportPreview.tsx`; split the completed-import note in `AnalyticsImportNotices.tsx` (D7)

## 5. i18n

- [x] 5.1 Add `ExportI18nKey` / `ImportI18nKey` entries in `constants/i18n.ts` and `locales/en.ts`: checkbox labels and hints, Access tab titles, column headers, outcomes, Replaced status, split completed-import note

## 6. Tests

- [x] 6.1 `components/ExportConfig/tests/analytics-utils.spec.ts`: `include_access` present only when on, Full and Custom; Access rows flatten `roles` and `left_behind`; tab hidden without `access`
- [x] 6.2 `components/ExportConfig/Preview/tests/AnalyticsExportPreview.spec.tsx`: Access tab present only with `access`; left-behind rows flagged; Reason column on Required system tables
- [x] 6.3 `server/analytics/tests/analytics-data-api.spec.ts`: import query carries `include_access=true` only when set
- [x] 6.4 `components/ImportConfig/ConfigurationPreview/tests/analytics-import.utils.spec.ts`: access FAIL blocks; REPLACE maps to the changed style; statuses map; tab hidden when empty; ineffective grants do not invalidate
- [x] 6.5 `components/ImportConfig/tests/ImportConfig.analytics.spec.tsx`: toggling re-runs the preview and clears result and acknowledgement; flag sent on import; box disabled without grant
- [x] 6.6 Export page and picker specs (`components/ExportConfig/tests/ExportConfig.spec.tsx`, the export-config actions or list-view utils spec): system source tables offered only with the box on and dropped from the selection when it is turned off; box disabled without grant; `hooks/use-analytics-access-grant` fallback cases

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change against the local app with auth disabled and ADAS 0.24, covering the browser-observable scenarios of the delta except "Caller without the grant permission" (auth disabled always grants; unit tests cover it); resolve every `fail` verdict before moving on

## 8. Quality gate

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all green
