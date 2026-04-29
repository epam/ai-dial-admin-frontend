## Context

Issue #3080 reports false-positive "Conflict with Display Name" errors when creating entities from inside a Container, introduced after PR #3051 (`feat(application): support container source`). Two distinct flows are affected:

1. **Application Container → Create Application** (`ContainersButtonsWrapper` → `CreateEntity` → `Properties` → `DeploymentProperties`). The page (`app/[lang]/application-containers/[id]/page.tsx`) was passing `applications.map(a => a.name)` as `entityNames`. Inside `DeploymentProperties`, `getNamesConfigurations` parses this list and `getDisplayNameError` checks user-entered `displayName` against it. Since the validator's intended affordance (allow same `displayName` if `version` differs — `&& !version` branch in `getDisplayNameError`) requires the list to be in `displayName___displayVersion` format, feeding bare `name` values defeats the disambiguation entirely. Result: any name collision fires, even when the user has supplied a unique version.

2. **MCP Container → Create as Asset Toolset** (`ContainersButtonsWrapper` → `CreateAsset` → `AssetProperties` → `IdControl`). `getAssetTemplate` pre-fills `entity.name` with a value derived from the container, so on the second create-attempt the prefill collides with the previously-saved asset. Independently, `IdControl`'s mount-time validation runs against `useToolsetFolder.data` which starts as `[]` (treated as "loaded empty") — so the prefilled colliding name is judged unique. By the time `FolderList`'s mount effect kicks off the actual fetch and `data` populates, `IdControl`'s `useEffect` has already settled and never re-runs (its dep array is `[isUniqueNameError]`, not `[names]`). Net effect: the form mounts with a stale-but-passing validation result, then later renders the inline error after another render cycle without the matching button-disable.

## Goals / Non-Goals

**Goals:**
- Eliminate the false-positive Display Name conflict for Application Container creation by feeding the validator the format it expects.
- Eliminate the race in MCP Container "Create as Asset" so validation runs against the real folder contents from the very first render.
- Ship as a single PR for issue #3080.
- No edits to validation utilities (`getDisplayNameError`, `getErrorForName`), no edits to shared field components (`DeploymentProperties`, `AssetProperties`, `IdControl`), no edits to the entity templates (`getEntityTemplate`, `getAssetTemplate`).

**Non-Goals:**
- Fixing the Interceptor Container path — not reproducible per the issue and out of scope.
- Refactoring `IdControl` to make `validateName` re-run when `names` changes. That latent disjoint-deps issue is real but separable; logged informally for follow-up.
- Refactoring `getDisplayNameError` to handle asset views explicitly. Not needed once the timing issue is fixed.
- Changing duplicate-detection semantics. The check stays as-is — only its inputs are corrected.

## Decisions

### Decision 1: Application Container fix is a one-line source swap, not a deeper refactor

`page.tsx:67` already runs server-side and has the full `applications` list available. Switching `applications.map(a => a.name)` → `filterDisplayNamesWithVersions(applications)` produces the `displayName___displayVersion` strings that `getNamesConfigurations` already knows how to parse. Validation surface stays untouched.

**Alternatives considered:**
- Container-scope filter (`source.containerId === container.name`): rejected because the duplicate-check semantics are *displayName + version uniqueness across all applications*, not per-container. Filtering would loosen validation in ways that disagree with how Applications are stored on the backend.
- Empty `entityNames={[]}`: rejected — would fully disable inline FE detection on this path. The user explicitly wants FE-side catch.

### Decision 2: MCP Asset path is fixed by changing the folder-context initial state, not by gating components

`AssetsFolderContext` initializes `data` to `[]` and uses `null` only for fetch-error state. By flipping the initial value to `null`, "not fetched yet" becomes a distinct, semantically-correct state. Then `CreateAsset` can render `<DialLoader />` while `data == null` and `<AssetProperties />` once data arrives — `IdControl` mounts with the real `names` list and `validateName` runs against it.

**Alternatives considered:**
- New `<AssetReady>` gate component wrapping `<CreateAsset />` with a useEffect+useRef state machine to detect the fetching → done transition. Works but is more code than the context tweak, and adds a new component.
- Inline `useEffect` + `useRef` inside `CreateAsset` to track the transition. Rejected: solves a problem the context already has the right primitives to solve once `data` initializes correctly.
- Swap `CreateAsset` for `CreateEntity` at the call site (the modal used by the dedicated `/assets-toolsets` route via `BaseAssetList`). Considered seriously — `CreateEntity` ignores `initialValues` for asset routes (line 67-71 conditional on `versionsMap`), which would also kill the prefill collision. Rejected because it loses the folder-picker sidebar that `CreateAsset` provides via `FolderList`, and changes user-visible affordances beyond the scope of #3080.
- Edit `getAssetTemplate` to omit `name`/`displayName`. Rejected — the user wants the template untouched (it's useful for endpoint/transport defaults); also doesn't fix the underlying `IdControl` race for any future prefilled-name path.

### Decision 3: Existing readers of `data` already tolerate `null`

Verified by inspection of all consumers in the asset/folder area:
- `BaseAssetList` reads `let folderData = data; if (currentPath && fetchedFoldersData[currentPath]) folderData = fetchedFoldersData[currentPath];`. `filterNames(null)` returns `[]` via internal optional chaining; `getVersionsPerName((folderData || []) as ...)` has explicit `|| []` fallback.
- `CreateAsset` itself uses `folderContext?.data || []` then derives `names`/`versionsMap`.
- `FolderList` only conditions on `data` indirectly via `files`.

So the `useState<Asset[] | null>([])` → `useState<Asset[] | null>(null)` change has no breakage path. Confirmed via `grep` for `\.data\b` in folder-context consumers.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Other folder-context consumers (Apps, Prompts, Files providers) inherit the same initial-state change since they all use `createFolderContext`. | All four contexts use identical reducer logic and identical consumer patterns (BaseAssetList for each entity type). Verified by inspection. Final pre-merge check: full grep for `\.data\b` across asset/folder-touching components. |
| `<DialLoader />` flash on every modal open in the MCP container path adds a perceptible delay. | Initial fetch is a single API call, typically <200ms. Acceptable trade-off vs. the alternative (silent broken validation). |
| The Application Container fix is already applied to the working tree but is ad-hoc — the rationale (`displayName___displayVersion` format requirement) is non-obvious from the call site alone. | Captured in the spec scenarios and design.md so future readers understand why the format matters. |
| `IdControl`'s `validateName` useEffect dependency array (`[isUniqueNameError]`) is still missing `names` — the race is sidestepped, not fixed at the root. | Logged as a follow-up. Any future call site that prefills `name` *and* loads `names` asynchronously will hit the same issue. Documented in proposal Non-goals. |

## Open Questions

None. Backend uniqueness contract for Application Container child apps is verified by the existing version-disambiguation logic — same `displayName` is allowed when `displayVersion` differs.