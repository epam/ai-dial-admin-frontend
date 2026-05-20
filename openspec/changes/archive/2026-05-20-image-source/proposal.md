## Why

Issue [#3322](https://github.com/epam/ai-dial-admin-frontend/issues/3322) — "Support source code source type for non-MCP images". Today, image definitions for Adapter, Application, and Interceptor types can only be created from a Docker image URI. The data model (`IMAGE_SOURCE_TYPE.CODE`, `ImageSource.url`, `branchName`, `sha`, `baseDirectory`) already supports git-source builds, and the downstream UI components (`CodeURL`, `Branch`, `BaseDirectory`) render purely off `source.$type === CODE` — they are not gated by image type. The only blockers are two `image.$type === IMAGE_TYPE.MCP` conditions in `ImageSource.tsx` and `ImageSource/SourceType.tsx` that hide the source-type dropdown for non-MCP image types. The backend is already prepared to accept code-source image definitions for all four image types.

A secondary issue is the orphaned `components/Deployments/Fields/ImageSourceFields/` directory — a pre-refactor copy of the live `ImageSource/` tree (older timestamps, missing newer wiring like `isReadOnlyAdmin`, the `disabled` prop, registry-server logic, and `ImageMcpRegistry.tsx`). It has zero imports across the source tree and should be removed in this change to avoid future confusion.

## What Changes

- **Unblock source-type dropdown for all image types.** Remove the `image.$type === IMAGE_TYPE.MCP` gate in `ImageSource/SourceType.tsx` and the corresponding gate in `ImageSource.tsx`'s `showSourceType` computation. The existing registry-disabled logic continues to suppress the dropdown when `externalRegistryRef` is present and the registry server only supports one capability — that behavior is preserved.
- **Preserve source fields across image-type switches.** Change `onImageTypeChange` so that switching image type does NOT wipe `source` to `DEFAULT_IMAGE_SOURCE`. Instead:
  - Preserve `source.$type`, `url`, `imageUri`, `branchName`, `sha`, `baseDirectory`.
  - Drop `externalRegistryRef` when the user leaves `IMAGE_TYPE.MCP` (non-MCP types cannot reference the MCP Registry).
  - Continue to delegate transport adjustment to the existing `setTransport` utility (LOCAL for MCP, deleted for others).
- **Source-type switch remains a clean cut.** Switching `source.$type` between DOCKER and CODE continues to drop the other family's fields — the new source object is built without spreading the old one, mirroring today's behavior for non-registry switches.
- **Delete orphaned `ImageSourceFields/` directory.** Confirmed dead code (zero imports, older copy than `ImageSource/`). Remove the directory and any associated test stubs.
- **i18n:** No new keys required. `ImagesI18nKey.SourceDocker`, `ImagesI18nKey.SourceCode`, `EntitiesI18nKey.SourceType`, `EntityFieldsI18nKey.SourceURL`, `EntityFieldsI18nKey.BranchName`, `EntityFieldsI18nKey.SHA`, and `EntityFieldsI18nKey.BaseDirectory` already exist and are used by the same components in the MCP flow.

## Non-goals

- No changes to the MCP Registry flow. The `mcp-registry-images` capability remains the home for registry-specific behavior (`ImageMcpRegistry`, `externalRegistryRef`, dual-capability switching). This change does not modify any registry scenarios.
- No changes to `ImageTransport`. Transport stays MCP-only — code-source builds for non-MCP image types do not introduce a transport setting.
- No changes to `ImageBuildPrivileges`. The rootless/root builder choice is already visible in the Properties view for all image types and is independent of source type.
- No new API surface. Existing `updateImage` / `getImage` endpoints already accept the full `ImageSource` shape.
- No changes to image listing, audit views, or installation log.
- No backend changes.

## Capabilities

### New Capabilities

- `image-source`: Source-type chooser (Docker vs Source code) and the URL / Docker URI / Branch / SHA / Base directory fields, available for every image type (`MCP`, `INTERCEPTOR`, `ADAPTER`, `APPLICATION`). Excludes MCP-Registry-specific behavior, which remains in `mcp-registry-images`.

## Impact

- **Components**:
  - `components/Deployments/Fields/ImageSource.tsx` — relax `showSourceType` gate.
  - `components/Deployments/Fields/ImageSource/SourceType.tsx` — relax MCP gate around `DialSelectField` for `sourceType`; rewrite `onImageTypeChange` to preserve source fields and drop `externalRegistryRef` when leaving MCP.
- **Dead code removal**:
  - `components/Deployments/Fields/ImageSourceFields/` — entire directory removed.
- **Tests**:
  - `components/Deployments/Fields/tests/ImageSource.spec.tsx` — add cases for Adapter / Application / Interceptor image types.
  - `components/Deployments/Fields/ImageSource/tests/SourceType.spec.tsx` (or extend existing tests directory) — cover dropdown visibility for all image types, type-switch preservation, and `externalRegistryRef` clearing on MCP exit.
- **Behavior**:
  - Create modal for Adapter / Application / Interceptor now shows the "Source type" dropdown.
  - Properties view for the same image types shows the same dropdown plus Branch (and Base directory in the view-only layout) when CODE is selected.
  - Switching image type within the modal no longer resets the source — users can pre-pick "Source code" and then change image type without losing input.
