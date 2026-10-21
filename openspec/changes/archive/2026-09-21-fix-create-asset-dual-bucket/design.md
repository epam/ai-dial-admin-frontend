## Context

`CreateAsset` (`components/Assets/Deployments/CreateAsset.tsx`) is the shared "create asset"
modal with a folder-picker sidebar. It has three call sites, all for dual-bucket views
(`assets-applications`, `assets-toolsets` — the two views whose resources live in both the flat
`platform` bucket and the versioned `public` tree, see `utils/files/root-folder.ts`):

1. Platform app-runner detail → `Create Assets Application` (Issue #4566)
2. Legacy `Entities > Application Runners` detail → same action
3. MCP container detail → `Create Asset Toolset` (`ContainersButtonsWrapper`)

None of them is dual-bucket aware, while the list-page create (`CreateEntity` +
`BaseAssetList.handleCreateAsset`) already is: it hides the version field for a platform
destination (`CreateEntity.tsx:77`), and dispatches the write through
`CreateAssetActionMap` / `PlatformCreateAssetActionMap` by destination bucket
(`BaseAssetList.tsx:293`). The runner/container flows bypass that machinery, so a platform-bucket
create is written through the public action with a seeded version — landing at
`platform/{name}__0.0.1`, a path no URL ever links to (Issue #4566's two 404s).

The server actions already exist and are correct: `createPlatformApplication`
(`assets-applications/actions.ts:178`) pins `folderId` to `platform/`, clears the version, and
strips read-only fields; `createPlatformToolset` mirrors it. The prior
`fix-asset-create-redirect-404` change already normalized `AssetApi.put`'s response to carry
admin-format identity fields, so `getEntityPath` builds the right URL once the write itself is
right.

## Goals / Non-Goals

**Goals:**

- A platform-bucket create from any `CreateAsset` call site writes the flat, unversioned
  `platform/{name}` resource and navigates to a detail URL that resolves.
- The modal's folder sidebar offers both bucket roots on a cold visit, gated on
  `featureFlags.catalogEnabled` exactly like the list page.
- The version field follows the destination bucket (hidden and unseeded for `platform`), matching
  the `platform-applications` / `platform-toolsets` spec requirements.
- Public-bucket creates from all three call sites behave exactly as before.

**Non-Goals:**

- No changes to the list-page create flows, server actions, wire contract, or `getEntityPath`.
- No refetch-on-every-open policy for the folder tree (see D2).
- No redesign of the `${initialValues ? '/' : ''}` redirect prefix quirk.

## Decisions

### D1 — Bucket dispatch moves inside `CreateAsset`, resolved from the existing action maps

`CreateAsset` already knows everything the dispatch needs — `view` and the selected destination
(`folderId` synced from `folderContext.filePath`). It resolves the write action itself from the
existing `CreateAssetActionMap` / `PlatformCreateAssetActionMap` (`BaseAssetList/utils.tsx`),
picking the platform map when `isPlatformDualBucketView(view, destinationFolder)`, and the
`onCreate` prop is removed.

- Why not keep caller-injected `onCreate` and dispatch per call site (the `handleCreateAsset`
  pattern)? Because that split is what caused this bug: the version-field gating lives in the
  modal while the bucket decision would live in the caller, and a caller that forgets one half
  re-creates the versioned-path-into-flat-bucket write silently. Keeping both halves in the same
  component makes them impossible to disagree.
- Why is removal safe? All three current callers pass exactly the map entries
  (`createApp`, `createApp`, `createToolset`) — nothing caller-specific is lost. The modal stays
  within the `Assets` feature tree, so importing the sibling `BaseAssetList` maps is not a
  cross-feature dependency.
- The `initialValues` seeding (runner source, container template, schema defaults) stays
  caller-side — it is genuinely per-call-site.

### D2 — Folder roots via a `rootPaths` prop on `FolderList`, not a parallel fetch in `CreateAsset`

`FolderList`'s auto-fetch hardcodes `${ROOT_FOLDER}/` (`FolderList.tsx:56`). It gains an optional
`rootPaths?: string[]` prop (default: the current single `public/` root) and auto-fetches
`rootPaths.length > 1 ? rootPaths : rootPaths[0]` — the exact shape `FileManager.tsx:145-146`
already uses. `CreateAsset` computes it from `getRootFolders(view, featureFlags.catalogEnabled)`
and passes it down.

- Why not have `CreateAsset` fetch the roots itself on open? Child effects fire before parent
  effects, so `FolderList`'s existing empty-state fetch would race `CreateAsset`'s root fetch into
  the shared context — the exact two-independent-fetches race `AssetsFolderContext`'s
  `fetchRoots` comment warns about. Routing the one fetch through the component that already owns
  the empty-state condition avoids the race entirely.
- Why is refresh-on-open unnecessary? The only states that can show a public-only tree are cold
  mounts (empty `files` → auto-fetch, now dual-root). A stale tree can only come from a prior
  visit to the same dual-bucket view, which fetches both roots already; folder contents refresh on
  expand via `toggleFolder`'s existing fetch-when-unfetched behavior. The global
  `AppsFolderProvider`'s persisted `filePath` also means "last browsed folder" stays the default
  destination — pre-existing behavior, kept.
- `FolderList` is shared with `RuleFolderContext` consumers and single-root views; the prop
  defaults preserve their behavior exactly.

### D3 — Version gating reacts to the selected folder, not just the initial one

`CreateEntity` computes `isPlatformDualBucketCreate` once at mount because its destination is
fixed before the modal opens. `CreateAsset` has a folder sidebar, so the user can switch buckets
mid-modal: an effect on `filePath` flips the form — platform destination hides the version field
(`hideVersionField` → `AssetProperties`, already supported), strips `version` from the entity, and
seeds `user_roles: []` if absent; public destination restores `DEFAULT_NEW_ENTITY_VERSION` and the
field. Switching buckets after typing a version discards it — acceptable, and the only coherent
reading of "the bucket has no versioning concept".

The version field's validation entry follows the same flip: a platform destination dispatches
`RemoveField('version')` (clearing whatever validity a public interlude registered) and a public
destination re-registers the restored default as valid. `SetField('version', false)` would be
wrong — `SaveValidationContext` ANDs every registered field into the form-wide `isValid`, so a
hidden-but-invalid entry would disable the Create button under the real context (the centralized
test mock always reports `isValid: true`, which is why only a spec asserting the dispatch shape
catches this). `CreateEntity` skips the dispatch entirely for a hidden field; `RemoveField` is the
mid-modal-switch equivalent of that skip.

### D4 — Navigation needs no new logic

With D1 in place, `createPlatformApplication`'s response carries `folderId: 'platform/'`
(from `AssetApi.put`'s path-derived fields), so `getEntityPath`'s existing dual-bucket branch
emits the flat `/assets-applications/{name}` URL, and the `[id]` page's no-`path`-param branch
fetches `platform/{name}` — which now matches the written resource. Same for toolsets. The
redirect line in `CreateAsset.onSubmit` is untouched.

### D5 — Spec deltas touch the three owning capabilities

- `platform-app-runners`: the detail-view requirement that owns the `Create Assets Application`
  scenarios — modal now offers both bucket roots, version field is bucket-conditional, navigation
  resolves per bucket.
- `platform-applications` / `platform-toolsets`: their "no version field" requirements widen from
  "while browsing the platform bucket" (the list-page form) to any create form whose destination
  is the platform bucket, gaining the runner-seeded / container-seeded modal scenarios.

## Risks / Trade-offs

- [Removing `CreateAsset`'s `onCreate` prop changes its contract] → All three call sites are
  updated in this change and each has an existing spec (`create-asset-application.spec.tsx`,
  `ContainersButtonsWrapper.spec.tsx`) that will fail loudly if a call site is missed.
- [`FolderList` is shared beyond assets views] → The new prop is optional with the current
  behavior as its default; single-root and rule-context consumers are covered by `FolderList`'s
  existing tests staying green unchanged.
- [Mid-modal bucket switch discards a typed version (D3)] → Announced implicitly by the field
  disappearing; the platform bucket has no version to keep. Public→public folder switches never
  touch the field.
- [Legacy `Entities > Application Runners` view silently gains platform-bucket support] → This is
  the same fix reaching the same modal; its public-bucket path is byte-for-byte the previous
  behavior. Called out in the proposal so reviewers see it is intentional.
- [Spec typecheck gate (`typecheck:specs`) at zero] → Fixture/typing updates for the changed
  `CreateAsset` props are part of the tasks, not an afterthought.
