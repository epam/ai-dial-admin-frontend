## 1. Unblock source-type dropdown

- [x] 1.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSource/SourceType.tsx`, remove the `image.$type === IMAGE_TYPE.MCP` condition wrapping the `DialSelectField id="sourceType"`. The field SHALL render whenever the source-type chooser is shown (the visibility decision moves entirely to the parent `ImageSource.tsx`).
- [x] 1.2 In `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSource.tsx`, simplify the `showSourceType` computation so that the dropdown is shown for all image types when there is no `externalRegistryRef`, and the existing registry-aware behavior is preserved when there is one. Suggested shape:
  ```ts
  const showSourceType =
    !hasExternalRegistryRef ||
    (image.$type === IMAGE_TYPE.MCP &&
      ((isModal && registryServer && serverHasBoth) || isRegistryView));
  ```
- [x] 1.3 Verify TypeScript compilation with no errors.

## 2. Preserve source fields across image-type switches

- [x] 2.1 In `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSource/SourceType.tsx`, rewrite `onImageTypeChange` so that:
  - `$type` is updated to the newly selected `IMAGE_TYPE`.
  - `source` is preserved from the current image (do NOT reset to `DEFAULT_IMAGE_SOURCE`).
  - When the new `$type` is not `IMAGE_TYPE.MCP` and `source.externalRegistryRef` is set, the `externalRegistryRef` field SHALL be dropped from the resulting source.
  - `setTransport` continues to be called to align `transportType` with the new image type (LOCAL for MCP, deleted for non-MCP).
  - `verifyVersion` continues to be called with the updated image.
- [x] 2.2 Confirm that `onSourceTypeChange` continues to produce a clean source object (no field leaks between DOCKER and CODE families) — current behavior is correct; no change expected.

## 3. Delete orphaned ImageSourceFields directory

- [x] 3.1 Re-confirm the directory is unreferenced:
  ```
  grep -rn "ImageSourceFields" apps/ai-dial-admin/src
  ```
  Expected: zero matches.
- [x] 3.2 Delete `apps/ai-dial-admin/src/components/Deployments/Fields/ImageSourceFields/` and all files inside it.
- [x] 3.3 Run lint and TypeScript checks to confirm no broken imports.

## 4. Tests

- [x] 4.1 Extend `apps/ai-dial-admin/src/components/Deployments/Fields/tests/ImageSource.spec.tsx` to cover Adapter, Application, and Interceptor image types:
  - The source-type dropdown SHALL be rendered in both modal and non-modal modes.
  - When `source.$type === CODE`, the `CodeURL`, `Branch`, and (non-modal only) `BaseDirectory` fields SHALL be rendered.
  - When `source.$type === DOCKER`, the `DockerURI` field SHALL be rendered and the code-source fields SHALL NOT.
- [x] 4.2 Add tests covering `onImageTypeChange` preservation:
  - Given an Adapter image with `source: { $type: CODE, url: 'https://...' }`, switching `$type` to `INTERCEPTOR` SHALL keep `source.$type === CODE` and `source.url === 'https://...'`.
  - Given an MCP image with `source: { $type: DOCKER, imageUri: 'x', externalRegistryRef: {...} }`, switching `$type` to `ADAPTER` SHALL preserve `$type: DOCKER` and `imageUri: 'x'` and drop `externalRegistryRef`.
  - Given an Adapter image with `source: { $type: CODE, url: '...', branchName: 'main', sha: 'abc', baseDirectory: 'sub' }`, switching `$type` to `MCP` SHALL preserve the source fields and SHALL set `transportType: IMAGE_TRANSPORT_TYPE.LOCAL`.
- [x] 4.3 If a test file exists for the duplicate `ImageSourceFields/` tree, remove it; otherwise no action.
