## 1. Flat segment for neither-bucket rows (design D1)

- [x] 1.1 In `getEntityPath`'s dual-bucket branch (`apps/ai-dial-admin/src/utils/open-in-new-tab.ts`), add the second flat condition after the platform check — `path == null && folderId == null` returns the bare `encodeURIComponent(name)`, mirroring the platform branch's return — and extend the branch comment to name the config-file row shape it serves
- [x] 1.2 Extend `apps/ai-dial-admin/src/utils/tests/open-in-new-tab.spec.ts`: `{name}`-only rows for `AssetsApplications` and `AssetsToolsets` produce the bare encoded name with no `?path=`; existing platform- and public-bucket assertions for both routes stay green as regression cover

## 2. Suffix join helper (design D2)

- [x] 2.1 Add the pure `appendUrlQuery(url, query)` helper to `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` (joins with `&` when the URL already has a `?`, `?` otherwise), with unit tests for both separators
- [x] 2.2 Change `CONFIG_FILE_URL_SUFFIX` in `apps/ai-dial-admin/src/components/EntityListView/EntityListView.tsx` to the bare `'configFile=true'`, separator supplied by the helper

## 3. Apply the helper at the three concat sites (design D2)

- [x] 3.1 Route `onCellClicked`'s `urlSuffix` through `appendUrlQuery` (`apps/ai-dial-admin/src/components/EntityListView/utils/on-cell-clicked.ts`); extend `utils/tests/on-cell-clicked.spec.ts` for a suffix on a query-carrying URN
- [x] 3.2 Route `onOpenInNewTab`'s `urlSuffix` through `appendUrlQuery` (`apps/ai-dial-admin/src/utils/open-in-new-tab.ts`); update the existing suffix call at `src/utils/tests/open-in-new-tab.spec.ts:336` to assert a correctly joined URL
- [x] 3.3 Route `EntityListView`'s `getHref` through `appendUrlQuery` (`EntityListView.tsx:162`); extend `components/EntityListView/tests/EntityListView.spec.tsx` so a config-file-sourced dual-bucket list renders hrefs of `{route}/{id}?configFile=true` with no `path` param

