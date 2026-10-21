## Why

Issue #4566: creating an Assets Application from a Platform App Runner's detail view ("Create →
Assets Application") with the Platform folder selected shows a success toast and then redirects to
a 404; the created app is visible under Assets → Applications → Platform, but opening it from there
404s too. The app is stored at `platform/{name}__0.0.1` — a versioned path inside the flat,
unversioned platform bucket — so every URL that links to it (`/assets-applications/{name}`, which
the detail page resolves as `platform/{name}`) points at a path Core never wrote.

The runner-details flow bypasses every piece of dual-bucket machinery the Assets → Applications list
already has:

- the shared `CreateAsset` modal's folder sidebar auto-fetches only the `public` root
  (`FolderList.tsx` hardcodes `ROOT_FOLDER`), so the `platform` folder appears only when the
  app-global `AppsFolderProvider` happens to hold stale state from a prior Assets → Applications
  visit;
- the runner view's `onCreate` unconditionally calls `createApp` (the public-bucket write) instead
  of dispatching to `createPlatformApplication` when the destination is the platform bucket;
- the modal still shows and seeds a Version field for a platform-bucket create, which the
  `platform-applications` spec forbids.

The same three defects exist in the sibling flow that creates an Assets Toolset from container
details (`ContainersButtonsWrapper` → `CreateAsset` with `AssetsToolsets`), the other dual-bucket
view — this change fixes both.

## What Changes

- **`CreateAsset` (the shared deployment create-asset modal) becomes dual-bucket aware**, mirroring
  what `CreateEntity` already does for the list-page create: when its view is a dual-bucket view
  (`assets-applications`, `assets-toolsets`) and the selected destination folder is in the `platform`
  bucket, it hides the version field, skips version seeding/validation, and seeds the
  platform-create defaults (`user_roles: []`).
- **The modal's folder sidebar loads both roots** for dual-bucket views — the same
  `getRootFolders(view, featureFlags.catalogEnabled)` fetch `FileManager`/`FilePath` already use —
  instead of the hardcoded `public/` auto-fetch, so a cold visit shows the Platform folder and a
  stale shared-context tree is refreshed.
- **Bucket-correct create dispatch**: the app-runner view's create action routes a platform-bucket
  destination to `createPlatformApplication` (and the container toolset flow to
  `createPlatformToolset`) instead of the public-bucket `createApp`/`createToolset`, so the resource
  is written at the flat `platform/{name}` path with no version suffix and the read-only-field
  stripping the platform actions already do.
- **Post-create navigation lands on the right detail view** — a platform-bucket create navigates to
  `/assets-applications/{name}` (no `?path=`, the platform-bucket detail form), which now resolves
  because the written path matches. No redirect-logic redesign; the existing `getEntityPath`
  platform branch already produces the right URL once the write is correct.

## Non-goals

- No change to the write path or wire contract in `core-asset-client` — `createPlatformApplication`
  / `createPlatformToolset` and `AssetApi.put`'s normalized response (added by the earlier
  `fix-asset-create-redirect-404` change) already do the right thing; this change only routes
  callers to them.
- No change to the list-page create flows (`CreateEntity`, `BaseAssetList.handleCreateAsset`) —
  they are already bucket-correct and are the pattern this change mirrors.
- No new capability, route, or menu entry; no BE changes.
- The `${initialValues ? '/' : ''}` prefix quirk in `CreateAsset`'s redirect is left alone unless
  the implementation makes touching it unavoidable.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `platform-app-runners`: the "Create Assets Application" header-action requirement's scenarios are
  amended — the create modal offers both bucket roots as destinations, hides the version field when
  the platform bucket is selected, and navigates to the new application's detail view in whichever
  bucket it was created (platform-bucket creates resolve to the flat, unversioned detail form).
- `platform-applications`: the "Creating a platform application has no version field" requirement is
  widened from "the create form while browsing the `platform` bucket" to any create form whose
  destination is the platform bucket — including the runner-seeded `CreateAsset` modal — and gains
  scenarios for the folder sidebar offering both roots and for the post-create navigation resolving.
- `platform-toolsets`: the same widening for toolsets — the container-details "Create Asset" flow's
  create form follows the same bucket-dependent version-field, folder-list, and navigation behavior.

## Impact

- **Shared modal**: `src/components/Assets/Deployments/CreateAsset.tsx` (version gating, root fetch,
  platform-create defaults) and its folder sidebar `src/components/Common/FolderList/FolderList.tsx`
  (dual-root auto-fetch — shared with other views, so the change must stay view-gated).
- **Call sites**: `src/components/Assets/Platform/AppRunners/View.tsx` (`onCreate` dispatch) and
  `src/components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper.tsx` /
  `createEntityAsAsset` callers (toolset dispatch).
- **Existing flows must not regress**: the legacy `Entities > Application Runners` detail view uses
  the same `CreateAsset` modal for public-bucket creates; single-root views (prompts, skills…) use
  `FolderList` and must keep their current behavior.
- **Specs**: deltas for the three capabilities above, folded in at archive time.
- **Tests**: `CreateAsset` behavior specs, the app-runner create-action spec
  (`create-asset-application.spec.tsx`), and the container toolset-create redirect spec.
