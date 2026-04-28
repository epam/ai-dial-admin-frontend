## 1. Application Container fix (already in working tree — verify)

- [x] 1.1 Verify `apps/ai-dial-admin/src/app/[lang]/application-containers/[id]/page.tsx:67` reads `entityNames={filterDisplayNamesWithVersions(applications) || []}` and that the `filterDisplayNamesWithVersions` import is in place
- [x] 1.2 Confirm the unused `getApplications` import (now wrapped) and any stale type imports have not been left behind by the working-tree change

## 2. Asset folder context — initial data state

- [x] 2.1 In `apps/ai-dial-admin/src/context/assets/AssetsFolderContext.tsx`, change `useState<Asset[] | null>([])` to `useState<Asset[] | null>(null)` for the `data` state (line ~39)
- [x] 2.2 Grep for `\.data\b` consumers under `apps/ai-dial-admin/src/components/Assets/`, `apps/ai-dial-admin/src/components/Common/FolderList/`, and any spec files that snapshot the context — confirm each handles `null` via existing fallbacks (`folderData || []`, optional chaining inside `filterNames`, etc.)
- [x] 2.3 Add or update a unit test for `createFolderContext` (or its consumer) asserting `data` is `null` until the first `fetchFiles` resolves, then becomes `[]` for an empty folder and an `Asset[]` for a populated one

## 3. CreateAsset — render gate on data presence

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/Deployments/CreateAsset.tsx`, replace the unconditional `<AssetProperties ... />` render with a ternary: `{folderContext?.data == null ? <DialLoader /> : <AssetProperties ... />}`
- [x] 3.2 Import `DialLoader` (or whichever loading indicator the design system exports — verify via `@epam/ai-dial-ui-kit` exports)
- [x] 3.3 Confirm `<FolderList context={context} />` continues to render unconditionally so the user sees layout while data loads
- [x] 3.4 Update `apps/ai-dial-admin/src/components/Assets/Deployments/tests/CreateAsset.spec.tsx` (create if missing) with two cases: (a) renders loader when `folderContext.data` is `null`, (b) renders `AssetProperties` once `data` is non-null. Reuse existing context provider mocks from `apps/ai-dial-admin/src/test-setup.tsx`.

## 4. Code quality

- [x] 4.1 Run `npm run lint` and fix any reported issues
- [x] 4.2 Run `npm run format:write`
- [x] 4.3 Run `npm run test` from the workspace root and confirm all tests pass
