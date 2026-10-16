## Why

The Application Parameters tab embeds a runner's custom UI (e.g. QuickApps) in an iframe. QuickApps now
reports its own dirty state and handles save/reset through bare `postMessage` types (`DIRTY_STATE`,
`TRIGGER_SAVE`, `RESET`, `SAVE_SUCCESS`, `SAVE_ERROR`) — a protocol `FrameRenderer` ignores today
because it only accepts `${name}/…`-prefixed types. As a result the page header's Save/Discard never
reflects iframe edits, and the tab guard saves through the legacy `saveChanges` request followed by a
blind 2-second `setTimeout` instead of a real completion signal.

## What Changes

- `FrameRenderer` understands the new bare protocol alongside the legacy one: it receives
  `DIRTY_STATE`, `SAVE_SUCCESS`, `SAVE_ERROR`, and sends `TRIGGER_SAVE` (without `general`) and `RESET`.
- `FrameRenderer` renders **no buttons**. It reports state upward and exposes `triggerSave()` / `reset()`
  through its ref.
- The header's existing Save/Discard are driven by the iframe's dirty state while the Parameters tab shows a
  new-protocol iframe, identically in the Application, Assets Application and Platform Application views.
- The embedded editor also posts `VALIDITY_STATE` with `{ isValid }` (separate from `DIRTY_STATE`; added in
  ai-dial-chat PR #9394 / quickapps-frontend PR #254). While `isValid` is `false` the header's Save is
  disabled, so a form with e.g. blank Instructions cannot be saved. The form counts as valid until told
  otherwise and resets to valid when the iframe changes.
- Saving through the header shows the usual success/error notification, refreshes the entity on success,
  and keeps the buttons visible on error. `SAVE_ERROR` text is read from `payload.error`, falling back to
  top-level `error`.
- The tab guard's "save, then switch tab" path awaits `SAVE_SUCCESS` / `SAVE_ERROR` for new-protocol
  iframes; legacy iframes keep the existing request and 2-second wait.
- `FrameRenderer` validates `event.source` and `event.origin` for the new messages and posts with an
  explicit target origin.
- Legacy runners are unaffected: new behavior activates only after the first `DIRTY_STATE` is received.

## Capabilities

### New Capabilities
- `application-parameters-iframe-editor`: Parameters-tab iframe protocol (new bare messages, coexistence
  with legacy), header Save/Discard driven by iframe dirty state, save/reset lifecycle and error handling.

### Modified Capabilities

None. No existing spec describes the iframe Parameters view.

## Impact

- `components/FrameRenderer/FrameRenderer.tsx` — protocol adapter, ref handle, new callbacks.
- `components/EntityView/hooks/use-parameters-tab-guard.ts` (or a sibling hook) — iframe dirty/saving state,
  awaited save-then-switch for new-protocol iframes.
- `components/EntityView/hooks/use-iframe-save-feedback.ts` — shared success/error notification and refresh,
  used by all three views.
- `components/Applications/View/View.tsx`, `components/Assets/Apps/View.tsx`,
  `components/Assets/Platform/Applications/View.tsx` — header `isChanged`/`isSaving`, Save/Discard branching.
- `components/EntityHeaderControls/Wrappers/AssetButtonsWrapper.tsx` and
  `Buttons/AssetChangedEntityButtons.tsx` — thread `isSaving` so the Assets Apps header disables Save while a
  save is pending (Platform and Applications use `SimpleEntityHeader`, which already supports it).
- `components/Applications/View/TabsContent.tsx`, `components/Applications/ParametersTab/ParametersTab.tsx` —
  pass ref and callbacks through (shared by all three views).
- `ParametersTab` is also rendered by `Publications/View`; it gets no header wiring and stays inert because
  the new behavior requires a subscriber.
- New i18n keys for the generic save error; `docs/` has no page covering this.
- Sibling contract: `ai-dial-quickapps-frontend/src/types/editor-messages.ts`; host reference:
  `ai-dial-chat` `AppEditorIframe.tsx`.

## Non-goals

- No buttons inside `FrameRenderer`, and no second Save/Discard bar.
- No removal or migration of the legacy `sendMessage` / `saveChanges` protocol.
- No `general` payload on `TRIGGER_SAVE`; Properties-tab fields keep their own save path.
- No handling of `TRIGGER_AUTO_SAVE`, `AUTO_SAVE_COMPLETE`, `HEIGHT_CHANGE` or toolset login/logout messages.
- No Save/Discard wiring for the Publications view.
- No change to the Assets Applications "Save as new version" action: it keeps the entity save path even when
  the iframe is dirty.
- No change to ai-dial-chat or ai-dial-quickapps-frontend (the flat-vs-nested `SAVE_ERROR` mismatch in chat
  is out of scope).
