## 1. Restore the Duplicate menu item

- [x] 1.1 In `apps/ai-dial-admin/src/components/Assets/utils.ts`, add `'duplicate'` to the `getGridActionLabels` filter for `ApplicationRoute.PlatformKeys` (alongside `'delete'` and `'openInNewTab'`)

## 2. New DuplicatePlatformKeyModal component

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Assets/Platform/Keys/DuplicatePlatformKeyModal.tsx` — a 2-step modal (`name` → `reveal`):
  - **Name step**: `DialFormPopup` with an `IdControl` pre-filled via `getClonedEntityName(entity.name, true)`, `names` prop for uniqueness validation, submit button disabled when `!isValid`; `project` and `roles` copied from the source entity silently.
  - On submit: call `generateKey()`, call `createKey({ ...entity, name, key: generatedKey })`, then transition to the Reveal step (same layout as `CreateKeyModal`'s Step 3).
  - **Reveal step**: show the generated key value in a `CopyButton`-wrapped display with a description; Close button calls `fetchFiles(entity.folderId)`, navigates to the new entity via `router.push(getUrnForEntity(...))`, then calls `onClose`.
  - Wrap in `SaveValidationContextProvider` (needed by `IdControl` / `useSaveValidationContext`).

## 3. Route PlatformKeys duplicate to the new modal

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/BaseAssetList/Modals.tsx`, add a `view === ApplicationRoute.PlatformKeys` guard before the `isFlatPlatformView` branch in the `ModalType.duplicate` block, rendering `<DuplicatePlatformKeyModal>` with `entity={duplicateItem}`, `names`, `isModalOpen`, and `onClose`.

## 4. Tests

- [x] 4.1 Add unit tests for `DuplicatePlatformKeyModal` in `apps/ai-dial-admin/src/components/Assets/Platform/Keys/tests/DuplicatePlatformKeyModal.spec.tsx`:
  - Name step: pre-fills cloned name, blocks submit on duplicate name, enables submit on valid name.
  - Reveal step: renders after a successful `createKey` call, shows key value, Close triggers `onClose`.
- [x] 4.2 Add/extend a unit test for `getGridActionLabels` in its existing spec (or create one) asserting that `PlatformKeys` now returns `duplicate`, `delete`, and `openInNewTab` for a non-read-only admin, and an empty array for a read-only admin.

## 5. Quality checks

- [x] 5.1 Run `npm run lint` and `npm run format` from the repo root; fix any issues.
- [x] 5.2 Run `npx vitest run src/components/Assets/Platform/Keys/tests/DuplicatePlatformKeyModal.spec.tsx` from `apps/ai-dial-admin/`; confirm all tests pass.
- [x] 5.3 Run the full test suite (`npm run test`) from the repo root; confirm no regressions.
