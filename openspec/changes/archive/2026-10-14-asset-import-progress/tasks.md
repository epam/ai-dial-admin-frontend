## 1. Shared hook and copy

- [x] 1.1 Add `apps/ai-dial-admin/src/hooks/use-import-progress.ts`: show a persistent `getPrepareNotification`, await the request, always `removeNotification` in `finally`, and turn a thrown error into `{ success: false, errorHeader }` with the generic `Import.ImportFailed` title (raw error logged to the console)
- [x] 1.2 Replace `ImportI18nKey.PrepareTitle` / `PrepareDescription` with `InProgressTitle` / `InProgressDescription`, and add a generic `ImportFailed`, in `src/constants/i18n.ts` and `src/locales/en.ts`

## 2. Adopt the hook at every import route

- [x] 2.1 `Assets/Files/List.tsx`: run `importFiles(body, fileType)` through the hook, keeping `setFolderToRefetch`, `fetchFiles` and the result notifications unchanged
- [x] 2.2 `Assets/BaseAssetList/BaseAssetList.tsx`: run `importAssetAction(body, fileType)` through the hook, result handling unchanged
- [x] 2.3 `EntityListView/HeaderButtons/HeaderButtons.tsx`: replace the inline prepare/remove pair with the hook, keeping the client-side size check before it so no spinner shows for a request that is never sent

## 3. Tests

- [x] 3.1 `src/hooks/tests/use-import-progress.spec.ts`: notification is persistent and shown while pending; removed on success, on `success: false`, on a thrown `Error` and on a non-Error rejection; response passed through
- [x] 3.2 Component test for the `onImport` path of `HeaderButtons.tsx` (and Files if cheap): the in-progress notification is removed before the result notification is shown, and a thrown request produces an error notification

## 4. Browser verification

- [ ] 4.1 Run the `spec-browser-verify` skill for this change's scenarios (archive and separate-files imports on Files, one asset-list route, one entity-list route, a server-rejected import, and the network-failure case) against the local app, and resolve any `fail` verdicts

## 5. Quality gates

- [x] 5.1 Run `npm run typecheck` and `npm run typecheck:specs` at zero errors, plus `npm run lint`, `npm run format` and `npm run test`
