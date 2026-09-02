## Context

The Catalog Keys list (`/platform-keys`) is rendered by `BaseAssetList` with `view=ApplicationRoute.PlatformKeys`. Its file-manager context menu is built from `getGridActionLabels`, which deliberately omitted `'duplicate'`. Even if the menu item were present, the generic flat-platform duplicate path would silently produce a broken key: Core's `key` field is write-only (never returned on GET), so the duplicated entity would be created without a key value.

`CreateKeyModal` already contains the correct pattern: generate a new key client-side via `generateKey()`, write it to Core, then reveal the value in a copy-able Reveal step. The design goal is to reuse that pattern with as little new surface area as possible.

## Goals / Non-Goals

**Goals:**
- Expose `'duplicate'` in the PlatformKeys context menu.
- On duplicate, let the user rename the clone; silently carry `project` and `roles`.
- After a successful create, show the generated key value with a copy button.

**Non-Goals:**
- Editing `roles` or `project` during the flow.
- Sharing modal logic with `CreateKeyModal` (they have enough surface-area difference to keep separate).
- Applying this to the security-keys route (`/keys`).

## Decisions

### Decision 1 — Dedicated modal, not extending `DuplicatePlatformAsset`

`DuplicatePlatformAsset` calls `onDuplicate(entity)` and returns control to `BaseAssetList`, which calls `handleDuplicate → handleCreateAsset` and closes the modal immediately on success. There is no hook for a post-create Reveal step without restructuring the generic path.

**Alternative**: Add an `onCreateSuccess(keyValue)` callback to `DuplicatePlatformAsset` and let it optionally switch to a reveal step. Rejected — it adds a Keys-specific concern to a generic component.

**Decision**: A new self-contained `DuplicatePlatformKeyModal` manages its own create call (via the `createKey` server action) and its own step state (`name` → `reveal`), identical in shape to `CreateKeyModal`.

### Decision 2 — Route in `Modals.tsx`, not `BaseAssetList`

`Modals.tsx` already branches on `isFlatPlatformView(view)` for the duplicate modal. Adding a `view === PlatformKeys` guard before that branch localises the special-case to one file.

`BaseAssetList.handleDuplicateModalOpen` fetches the source entity and sets `duplicateItem` — that path is reused unchanged. The new modal receives `duplicateItem` as its `entity` prop.

### Decision 3 — No `handleDuplicate` call for PlatformKeys

`handleDuplicate` in `BaseAssetList` calls `getPlatformAssetDuplicate` (which returns `key: undefined`) and then `handleCreateAsset`, which calls the create action and closes the modal immediately. For `PlatformKeys`, this path is skipped entirely: the modal owns the create call.

After the modal's create succeeds it calls `fetchFiles` (to refresh the list) and navigates to the new entity, exactly as `CreateKeyModal` does.

## Risks / Trade-offs

- **Reveal step navigation**: `DuplicatePlatformKeyModal` needs `router` and `fetchFiles` from context. Both are already available inside `BaseAssetList/Modals.tsx` and can be passed as props, or the modal can use them directly via `useRouter` and `useFilesContext`. Using hooks directly keeps the modal self-contained. Risk: minor duplication of the pattern from `CreateKeyModal` — acceptable for the scope.

- **No test coverage added for the new modal** in this change. Component tests should be added in a follow-up, but are not blocking the bug fix.
