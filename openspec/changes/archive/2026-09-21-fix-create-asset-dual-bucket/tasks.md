## 1. Folder sidebar loads both roots

- [x] 1.1 Add an optional `rootPaths?: string[]` prop to `Common/FolderList/FolderList.tsx` (default
      `[`${ROOT_FOLDER}/`]`); the empty-state auto-fetch calls
      `fetchFiles(rootPaths.length > 1 ? rootPaths : rootPaths[0])`, mirroring
      `Common/FileManager/FileManager.tsx:145-146`. No other behavior change.
- [x] 1.2 Extend `FolderList`'s tests to cover: default single-root auto-fetch unchanged;
      dual-root auto-fetch passes both roots as an array to `fetchFiles`; a non-empty `files` state
      still suppresses auto-fetch.

## 2. CreateAsset becomes dual-bucket aware

- [x] 2.1 In `Assets/Deployments/CreateAsset.tsx`, compute the dual-root list via
      `getRootFolders(view, featureFlags.catalogEnabled)` and pass it to `FolderList` as
      `rootPaths` (design D2).
- [x] 2.2 Add the bucket-reactive version gating (design D3): an effect on the context's
      `filePath` flips `isPlatformDualBucketCreate`
      (`DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(filePath)`) — platform
      destination hides the version field (`hideVersionField` on `AssetProperties`), strips
      `version` from the entity, seeds `user_roles: []` if absent; public destination restores
      `DEFAULT_NEW_ENTITY_VERSION` and the field. Initial state seeding follows the same
      condition so a modal opened on a platform folder starts versionless.
- [x] 2.3 Move the write dispatch inside the modal (design D1): resolve the create action from
      `CreateAssetActionMap` / `PlatformCreateAssetActionMap` by
      `isPlatformDualBucketView(view, destinationFolder)` and remove the `onCreate` prop. Submit,
      notification, `fetchFiles` refresh, and redirect logic are otherwise untouched.
- [x] 2.4 Add/extend a `CreateAsset` spec covering: version field hidden and submit enabled with
      no version when the platform root is selected; version field restored when switching back to
      a public folder; platform submit calls `createPlatformApplication` (not `createApp`);
      public submit still calls `createApp`; redirect URL is the bare
      `/assets-applications/{name}` (no `?path=`) after a platform create and the
      `name?path=...` form after a public create; both roots requested from the folder context on
      a cold open.

## 3. Call sites drop their local dispatch

- [x] 3.1 `Assets/Platform/AppRunners/View.tsx`: remove the local `onCreate`/`createApp` wiring
      from the `CreateAsset` render; keep `initialValues` seeding as is.
- [x] 3.2 `ApplicationRunners/View/View.tsx` (legacy entity-runner view): same removal for its
      Assets Application create.
- [x] 3.3 `ContainersButtonsWrapper.tsx` + its callers (`ContainerView.tsx`,
      `mcp-containers/[id]/page.tsx`): remove the `createEntityAsAsset` prop chain now that
      `CreateAsset` resolves the toolset create action itself.
- [x] 3.4 Update the affected specs: `Assets/Platform/AppRunners/tests/create-asset-application.spec.tsx`
      (dispatch moved into the modal — assert the platform/public action choice there),
      `ContainersButtonsWrapper.spec.tsx`, and any spec referencing the removed props.

## 4. Gates

- [x] 4.1 `npm run typecheck` and `npm run typecheck:specs` both at zero (spec fixtures for the
      changed `CreateAsset`/`FolderList` props included).
- [x] 4.2 `npm run lint` clean; full `npm run test` (coverage gate) run from
      `apps/ai-dial-admin/` and passing.
