## Context

`ai-dial-core` gives `toolsets` the identical `public`/`platform` duality already given to
`applications` (see archived change `add-platform-applications`, capability `platform-applications`):
`RouteTemplate.PLATFORM_APP_TOOLSET_RESOURCE` (`^/v1/(applications|toolsets)/(?<bucket>platform)/(?<path>.*)$`)
routes both entity types to `ConfigResourceController` ahead of the generic resource route, which
delegates PUT/DELETE business logic to `ToolSetService.putToolSet`/`deleteToolset`/
`getToolSetWithDecryptedAuthSettings` — the same pattern `ApplicationService` gets.

Unlike Applications, this is the *second* dual-bucket view, not the first. The Applications change
built two things that need to generalize rather than duplicate:

1. **The multi-root fetch mechanism** (`getRootFolders`, `createFolderContext`'s `fetchFiles`/
   `fetchRoots`) — already written generically (`fetchFiles(path: string | string[], ...)`,
   `getRootFolders(view): string[]`). Only `getRootFolders`'s own body special-cases
   `AssetsApplications`; the mechanism underneath needs no change at all.
2. **The bucket-detection/action-label branching** (`isPlatformApplicationsBucket`,
   `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels` in `Assets/utils.ts`,
   `getGridColumns` in `BaseAssetList/utils.tsx`) — written as a named, Applications-specific helper
   with its own `switch` arm. This one **does** need generalizing per the user's decision below,
   rather than adding a second near-identical arm for Toolsets.

Confirmed against `ai-dial-core`'s `ToolSetService`: `ToolSet extends SecuredResource` has no
platform-incompatible field the way `function`-type `Application`s were rejected outright for the
platform bucket — so Toolsets need no equivalent of that carve-out. `ToolSetService`'s auth-secret
encrypt/decrypt (`resourceAuthSettingsEncryptionService.encrypt/decrypt`) and credential-locator scope
(`CredentialsLocatorFactory.fromAnyUrl`) both derive from the resource descriptor's own bucket, and
`ToolsetOpsApi`'s discovered-tools/sign-in/sign-out client calls resolve a toolset by its path/name
generically — none of this is public-bucket-specific. Toolsets do have one restriction Applications
never had: `ConfigResourceController` additionally rejects a toolset PUT/DELETE up front when the name
fails `ConfigPostProcessor.isValidToolSetKey` (a stricter pattern than the generic `ENTITY_NAME_PATTERN`
Applications uses), returning 400 with a message naming the required pattern.

## Goals / Non-Goals

**Goals:**
- Show `platform/` as a bucket above `public/` in the existing `Assets ▸ Toolsets` grid
  (`/assets-toolsets`), with no new menu entry and no new top-level list route — mirroring
  `platform-applications` exactly.
- Generalize `isPlatformApplicationsBucket` and the four functions that branch on it into a
  view-agnostic dual-bucket check, so a third future dual-bucket entity needs no new arm either.
- Add server actions and a detail view for platform-bucket toolsets, following the
  `Assets/Platform/Applications/` precedent (reuse the existing `Assets/Toolsets/View/TabsContent`
  and `ResourceAuthButtons` unmodified — confirmed full field/tab/auth parity against Core, see
  Context) rather than writing new tab components.
- Land this without changing the single-root behavior of any other view and without any
  `ai-dial-core` change.

**Non-Goals:**
- Any other entity gaining dual-bucket status. Applications and Toolsets are the two entities Core
  gives this duality to; the generalized helper is sized for "a small, explicit set of dual-bucket
  views," not an open-ended mechanism.
- Client-side toolset-name validation before submit. Core's `isValidToolSetKey` rejection surfaces
  through the existing error-notification path, the same way Applications' "Code" source gap and
  `FilePath`-for-a-flat-bucket gap already do — not a silent failure, just not pre-validated.
- Folders or versioning inside the `platform` bucket for toolsets. Confirmed flat, matching
  `platform-applications` and every other platform entity.
- Any change to `ai-dial-core`.

## Decisions

### D1 — Multi-root fetch needs no new code; only `getRootFolders`'s condition grows

`getRootFolders(view)` already returns `[PLATFORM_ROOT_FOLDER, ROOT_FOLDER]` for one view and
`[getRootFolder(view)]` for every other. The mechanism consuming it (`FileManager.tsx`'s
`getRootFolders(view).map(...)`, `isMultiRootView`, `createFolderContext`'s `fetchRoots`) is already
keyed purely off the returned array's length/order, not off which view produced it. Adding Toolsets
is exactly:

```ts
export const getRootFolders = (view: ApplicationRoute): string[] =>
  DUAL_BUCKET_VIEWS.includes(view) ? [PLATFORM_ROOT_FOLDER, ROOT_FOLDER] : [getRootFolder(view)];
```

where `DUAL_BUCKET_VIEWS` is the same small array D2 introduces (kept in `root-folder.ts`, imported by
`Assets/utils.ts` and `BaseAssetList/utils.tsx` rather than redeclared). No test in
`root-folder.spec.ts` beyond adding a Toolsets case to the existing Applications-shaped assertions.

### D2 — Generalize `isPlatformApplicationsBucket` into a view-agnostic `isPlatformDualBucketView` (per user decision)

Confirmed with the user: generalize rather than duplicate. Today's helper:

```ts
export const isPlatformApplicationsBucket = (view: ApplicationRoute, currentPath?: string): boolean =>
  view === ApplicationRoute.AssetsApplications && isPlatformBucketPath(currentPath);
```

becomes:

```ts
// root-folder.ts — lives next to isFlatPlatformView/isPlatformBucketPath, the other bucket predicates
export const DUAL_BUCKET_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

export const isPlatformDualBucketView = (view: ApplicationRoute, currentPath?: string): boolean =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(currentPath);
```

`Assets/utils.ts`'s `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels` and
`BaseAssetList/utils.tsx`'s `getGridColumns` each replace their `isPlatformApplicationsBucket(view,
currentPath)` check with `isPlatformDualBucketView(view, currentPath)` — no new `switch` arm, since
the check is already view-agnostic once renamed. `getToolbarOptionLabels`'s single-entry-menu branch
(`{ key: 'newItem', label: FileManagerI18nKey.Application, icon: null }`) needs to become
per-view — replace the hardcoded `FileManagerI18nKey.Application` with a small
`view === ApplicationRoute.AssetsToolsets ? FileManagerI18nKey.Toolset : FileManagerI18nKey.Application`
lookup, since that's the one place the old helper's caller assumed "the dual-bucket view" meant
Applications specifically.

Every other call site of the old name (tests, `BaseAssetList/utils.tsx`'s imports) is mechanically
renamed. `isPlatformApplicationsBucket` is deleted, not kept as a deprecated alias — it has no
external consumers outside this codebase.

Rejected alternative: keep `isPlatformApplicationsBucket` and add a sibling
`isPlatformToolsetsBucket`, then OR them at each call site. Rejected per the user's explicit
instruction to generalize; it would also mean every future dual-bucket entity adds another OR clause
at four call sites instead of one array entry.

### D3 — Platform-bucket toolset writes reuse `createToolset`/`updateToolset`'s existing conditional path, with their own field-stripping helper

Mirrors `application-resources-core-api`'s D3 exactly. New server actions in
`assets-toolsets/actions.ts` — `getPlatformToolset`, `createPlatformToolset`, `updatePlatformToolset`,
`removePlatformToolset`, `bulkDeletePlatformToolsets` — call `assetApi` directly with
`ResourceType.TOOLSET` against a `platform/`-prefixed path, never setting `version` and never
computing a folder-prefixed path. A `toPlatformToolsetPayload` helper strips `status`/
`validationWarnings`/`author`/`createdAt`/`updatedAt`/`reference` before write, matching
`toPlatformApplicationPayload` — `ConfigResourceController`'s strict deserialization
(`FAIL_ON_UNKNOWN_PROPERTIES`) rejects these the same way it did for Applications.

### D4 — `Assets/Platform/Toolsets/View.tsx` reuses `Assets/Toolsets/View/TabsContent` and `ResourceAuthButtons` directly

Per the user's decision to check reuse feasibility first: confirmed above (Context) that
`ToolSetService`'s secret encryption and `ToolsetOpsApi`'s sign-in/out/discovered-tools calls are
bucket-agnostic — nothing in Core gates auth or MCP tool discovery to the `public` bucket. So
`Assets/Platform/Toolsets/View.tsx` reuses `Assets/Toolsets/View/TabsContent` (Properties, Tools,
Audit) and `ResourceAuthButtons` (sign-in/out) exactly as written, passing
`view={ApplicationRoute.AssetsToolsets}` through — the same shape `Assets/Platform/Applications/
View.tsx` uses for the public Apps `TabsContent`. Only a new `View.tsx` wrapper (`SimpleEntityHeader`
instead of `AssetHeader`; the new platform server actions instead of `updateToolset`/`removeToolset`;
no move/version logic) and the detail route/page are new — no new `Properties.tsx`/`TabsContent.tsx`.

`Assets/Toolsets/View/Properties.tsx`'s `FilePath` control gets the same guard
`Assets/Apps/Properties.tsx` already has: wrap it in `!isPlatformBucketPath(selectedToolset.folderId)`
so a platform-bucket toolset (no folders to move into) doesn't show an inert move control.

`CreateEntity.tsx`'s `isPlatformApplicationCreate` (skips seeding/requiring `version` when creating
into a platform bucket) generalizes the same way D2 does — rename to
`isPlatformDualBucketCreate` and drop the `route === ApplicationRoute.AssetsApplications` check in
favor of `DUAL_BUCKET_VIEWS.includes(route)`, since the underlying reason (no version field, no
folder placement in the platform bucket) applies identically to Toolsets.

### D5 — Detail route is the existing `/assets-toolsets/[id]` route, told apart the same way as Applications

Both buckets share the existing `/assets-toolsets/[id]/page.tsx`: a `?path=` query param present means
public bucket (`getToolset(path, etag)` + public `ToolsetView`); absent means platform bucket
(`platform/{id}` + `getPlatformToolset`, rendering `PlatformToolsetView`). This sidesteps the
breadcrumbs crash the Applications change hit and reverted away from (a nested route indexes a
`configSegment` `Breadcrumbs.getBreadcrumbs` doesn't have) by construction — no nested route is
introduced here in the first place.

`getEntityPath`'s `AssetsToolsets` case (`utils/open-in-new-tab.ts`) needs the same platform-bucket
branch Applications' case already has: a platform-bucket toolset resolves to the bare
`{encodedName}` segment with no `?path=`, landing on this same shared route.

## Risks / Trade-offs

- **[Risk]** Renaming `isPlatformApplicationsBucket` touches every existing call site
  (`Assets/utils.ts`, `BaseAssetList/utils.tsx`, and their tests) even though none of their
  *behavior* changes for the Applications view.
  → **Mitigation**: mechanical rename plus a `DUAL_BUCKET_VIEWS` array; existing Applications-bucket
  tests keep asserting the same outcomes under the new name, and new tests add only the Toolsets
  case rather than re-testing Applications from scratch.
- **[Risk]** `getToolbarOptionLabels`'s dual-bucket branch was hardcoded to the "Application" label;
  generalizing it to pick a label per view is a second small branch inside what was previously a
  single-line return.
  → **Mitigation**: a one-line ternary (or a `Record<ApplicationRoute, FileManagerI18nKey>` lookup if
  a third dual-bucket view ever appears) — no structural change to the function's control flow.
- **[Risk]** Toolsets' stricter name-key validation (`isValidToolSetKey`) means a platform-bucket
  toolset create can fail for a reason (invalid characters in the key) Applications' platform bucket
  never surfaces, and the 400's message is Core-specific wording ("must match ...").
  → **Mitigation**: accepted per Non-Goals — surfaced through the existing error-notification path,
  same as every other accepted Core-side rejection in this surface (e.g. Applications' "Code" source
  gap). No new client-side pattern check added; revisit only if this proves confusing in practice.

## Open Questions

None outstanding. The three questions raised during exploration were resolved before this design was
written:
1. Generalize the bucket-detection/action-label helpers rather than duplicate them for Toolsets (D2).
2. Handle Core's stricter toolset-name rejection the same way Applications' accepted gaps are handled
   — surfaced via the existing error path, no new client-side validation (Non-Goals, Risks).
3. Reuse `Assets/Toolsets/View/TabsContent` and `ResourceAuthButtons` unmodified — confirmed against
   `ToolSetService`/`ToolsetOpsApi` that auth and MCP tool discovery are bucket-agnostic (D4).
