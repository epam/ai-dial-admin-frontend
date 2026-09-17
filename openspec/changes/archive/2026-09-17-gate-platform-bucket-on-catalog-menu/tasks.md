## 1. Feature flag

- [x] 1.1 Add `catalogEnabled: boolean` to `FeatureFlags` (`apps/ai-dial-admin/src/models/feature-flags.ts`) and set it in `apps/ai-dial-admin/src/app/[lang]/layout.tsx` to `!process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('catalog')`, alongside the existing `dashboardEnabled` line
- [x] 1.2 Fix every `FeatureFlags` literal the new required field breaks (surface them with `npm run typecheck` from `apps/ai-dial-admin/`) and add `catalogEnabled: true` to the mocked `featureFlags` in `apps/ai-dial-admin/test-setup.tsx` so existing FileManager/FilePath specs keep two-root semantics

## 2. Root-folder gate

- [x] 2.1 Add the optional `isPlatformBucketEnabled = true` parameter to `getRootFolders` in `apps/ai-dial-admin/src/utils/files/root-folder.ts` (design D2): dual-bucket views return `['platform', 'public']` only when the flag is true, otherwise `[getRootFolder(view)]`; update the doc comment
- [x] 2.2 Extend `apps/ai-dial-admin/src/utils/files/tests/root-folder.spec.ts`: `getRootFolders` returns both roots when the parameter is `true`/omitted, only `['public']` for `AssetsApplications`/`AssetsToolsets` when `false`, and non-dual views are unaffected by the parameter

## 3. Call sites

- [x] 3.1 In `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`, read `useAppContext().featureFlags.catalogEnabled` and pass it to both `getRootFolders` calls (the root-fetch `useEffect` and `isMultiRootView`)
- [x] 3.2 In `apps/ai-dial-admin/src/components/Common/FilePath/FilePath.tsx`, read `useAppContext().featureFlags.catalogEnabled` and pass it to the `getRootFolders` call in the root-fetch `useEffect`
- [x] 3.3 Add component-test coverage for the disabled path: with the mocked `featureFlags.catalogEnabled` set to `false`, the FileManager/FilePath root fetch requests only the `public` root (extend the existing specs in `FileManager/tests/` and `FilePath/tests/` rather than creating new files where they exist)

## 4. Quality gates

- [x] 4.1 Run `npm run lint` and `npm run format` from the repo root, and `npx vitest run src/utils/files/tests/root-folder.spec.ts` plus the touched FileManager/FilePath specs from `apps/ai-dial-admin/`
- [ ] 4.2 Run `npm run typecheck` from `apps/ai-dial-admin/` (app source only — the blocking gate) and `npm run test` as the full-suite gate

No browser-verification task: the user declined it when asked (the scenarios are browser-observable, but verification is covered by the component specs; the env-gated matrix — Catalog enabled vs disabled — is exercised through the mocked `featureFlags` rather than re-booting the app).
