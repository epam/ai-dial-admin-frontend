## Why

Catalog → Keys (the flat platform view at `/platform-keys`) is missing the **Duplicate** context-menu action that all sibling flat platform views (Models, AppRunners, Interceptors, Routes, Roles) already expose. This leaves users with no shortcut to clone a key when they need one with a slightly different name or role set, a gap that surfaced as issue #4355.

## What Changes

- **Restore the context-menu item**: `getGridActionLabels` for `ApplicationRoute.PlatformKeys` gains `'duplicate'` alongside the existing `'delete'` and `'openInNewTab'` entries.
- **New duplicate modal for PlatformKeys**: A dedicated `DuplicatePlatformKeyModal` component replaces the generic `DuplicatePlatformAsset` for this route. It presents a 2-step flow:
  1. **Name step** — user edits the cloned key's name (pre-filled from source); `project` and `roles` are silently copied.
  2. **Reveal step** — after submission the modal generates a new key client-side, calls `createKey`, then shows the generated key value with a copy button (same UX as `CreateKeyModal`).
- **Routing in `Modals.tsx`**: The duplicate-modal render in `BaseAssetList/Modals.tsx` adds a branch for `PlatformKeys` that renders the new modal instead of `DuplicatePlatformAsset`.

## Capabilities

### New Capabilities

_None — this is purely a bug fix / missing affordance in an existing flow._

### Modified Capabilities

- `platform-keys`: The Catalog Keys list view gains a Duplicate action that did not previously exist.

## Impact

- **`src/components/Assets/utils.ts`** — one-line fix in `getGridActionLabels`.
- **`src/components/Assets/Platform/Keys/DuplicatePlatformKeyModal.tsx`** — new file (~80 LOC), mirrors the structure of `CreateKeyModal` but without the Roles step.
- **`src/components/Assets/BaseAssetList/Modals.tsx`** — add a `PlatformKeys` branch in the duplicate-modal block.
- No changes to server actions, specs, API contracts, or other routes.
- `DuplicatePlatformAsset` is unmodified; `CreateKeyModal` is unmodified.

## Non-goals

- Editing roles or project during the duplicate flow (they are copied silently).
- Adding a validity period or displayName field (Keys do not surface those in creation).
- Applying this pattern to the security-keys route (`/keys`, `ApplicationRoute.Keys`) — that is a separate list backed by a different list infrastructure.
