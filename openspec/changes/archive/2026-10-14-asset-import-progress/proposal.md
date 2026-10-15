## Why

Importing files through the Import modal gives no feedback while the request runs — the modal closes at once and the only evidence of an upload is the DevTools Network tab (Issue #4648, raised on #4607). Large archives make the silence long enough that users re-submit.

## What Changes

- Show a persistent "Import in progress" notification (spinner) from the moment an import request starts until its response arrives, then replace it with the existing success/error/skipped notifications.
- Cover every route that uses `ImportModal`: Files (`Assets/Files/List.tsx`), the shared asset list (`Assets/BaseAssetList/BaseAssetList.tsx`) and the entity-list header (`EntityListView/HeaderButtons/HeaderButtons.tsx`, which already had an ad-hoc copy).
- Add a shared `useImportProgress` hook that owns only the progress lifecycle; callers keep their own result handling.
- The notification is cleared even when the request throws (network failure), so a spinner can never get stuck.
- Replace the unused-after-migration `Import.PrepareTitle` / `Import.PrepareDescription` i18n keys (whose `{type}` placeholder was never supplied by its only caller) with `Import.InProgressTitle` / `Import.InProgressDescription`.
- The modal keeps closing immediately on confirm.

**Deliberate deviation from the issue's acceptance criteria:** the issue asks for the spinner *inside* the modal and for the import button to be disabled during the request. Instead the modal closes as today and the indicator is a notification; the Finish button disappears with the modal, and the toolbar/drag-and-drop upload entry points are intentionally **not** disabled.

## Capabilities

### New Capabilities
- `asset-import-progress`: an in-progress indicator is shown for the lifetime of an asset/file import request on every import route, and is always cleared when the request settles.

### Modified Capabilities

(none — no existing spec covers import progress; `deployment-import*` are deployment-specific and `asset-list-route-composition` is route wiring)

## Non-goals

- Keeping the Import modal open or rendering a spinner inside it.
- Disabling the Import button, toolbar action, or drag-and-drop while an import runs; guarding against concurrent imports.
- Merging the differing result-notification handling of the three call sites.
- Client-side file-size validation on Files/BaseAssetList (only HeaderButtons has it).
- Wrapping Files/BaseAssetList imports in `useProtectedRequest`.

## Impact

- Code: new `src/hooks/use-import-progress.ts`; `Assets/Files/List.tsx`, `Assets/BaseAssetList/BaseAssetList.tsx`, `EntityListView/HeaderButtons/HeaderButtons.tsx`; `src/constants/i18n.ts`, `src/locales/en.ts`.
- Behavior: HeaderButtons now clears its spinner on a thrown error (previously it would stick); its notification text changes.
- No API, dependency, or backend changes. The issue is labelled `to-be-documented`; no user-facing import doc exists under `docs/`.
