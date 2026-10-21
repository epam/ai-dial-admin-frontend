## 1. FrameRenderer protocol adapter

- [x] 1.1 Add `models.ts` and `constants.ts` next to `components/FrameRenderer/FrameRenderer.tsx`: an enum for the bare message types (`DIRTY_STATE`, `SAVE_SUCCESS`, `SAVE_ERROR`, `TRIGGER_SAVE`, `RESET`), message payload interfaces, and the `FrameRendererHandle` interface (`triggerSave()`, `reset()`)
- [x] 1.2 Extend `FrameRenderer` with `onDirtyChange`, `onSaveSuccess`, `onSaveError` props; accept bare messages only when `event.source` is the iframe window and `event.origin` equals the iframe URL origin; leave the prefixed path and `onMessage` forwarding unchanged
- [x] 1.3 Expose `triggerSave()` (no `general`) and `reset()` through the forwarded handle, posting bare messages to the iframe with the iframe URL origin as target; no-op on an unparsable URL
- [x] 1.4 Track bare-protocol activation on the first `DIRTY_STATE`; clear activation, dirty and saving state when `iframeUrl` changes; extract `SAVE_ERROR` text as `payload.error ?? error`; ignore all other bare types
- [x] 1.5 Confirm `ParametersTab` (the only `FrameRenderer` caller) compiles against the new handle type
- [x] 1.6 Handle `VALIDITY_STATE` in `FrameRenderer` (boolean `isValid` only, same source/origin checks), report it through `onValidityChange` and reset to valid on unmount or URL change

## 2. Guard hook state and save lifecycle

- [x] 2.1 In `components/EntityView/hooks/use-parameters-tab-guard.ts` (or a sibling hook it consumes), add `isIframeDirty`, `isIframeSaving`, a `FrameRenderer` ref, `onSaveIframe`, `onDiscardIframe` and the 30 s pending-save timeout
- [x] 2.2 Implement the lifecycle: `onSaveIframe` sends `TRIGGER_SAVE` and sets saving; `SAVE_SUCCESS` clears saving and dirty, shows the entity-save success notification and calls `router.refresh()`; `SAVE_ERROR`/timeout clears saving, keeps dirty and shows an error notification (generic i18n fallback when no text)
- [x] 2.3 Add the generic iframe save error i18n key (reuse an existing key if one fits) in `locales/en.ts` and the i18n enum
- [x] 2.4 Make the parameters save-then-switch path await `SAVE_SUCCESS` for bare-protocol iframes (stay on tab on error/timeout), keep the `saveChanges` request plus 2 s wait for legacy iframes, and include `isIframeDirty` in the tab-leave unsaved check
- [x] 2.5 Keep `isIframeValid` (default `true`) in the guard hook; make `onSaveIframe` a no-op while invalid and have the save-then-switch confirm stay on the tab with the generic error

## 3. Wire the application views

- [x] 3.1 Pass the `FrameRenderer` ref and callbacks through `Applications/View/TabsContent.tsx` and `Applications/ParametersTab/ParametersTab.tsx`
- [x] 3.2 In `Applications/View/View.tsx`, pass `isChanged || isIframeDirty` to `SimpleEntityHeader`, disable Save while `isIframeSaving`, and branch `onTryToSave` / `onDiscard` to `onSaveIframe` / `onDiscardIframe` when the Parameters tab shows a dirty bare-protocol iframe
- [x] 3.3 Extract the iframe save success/error feedback into `EntityView/hooks/use-iframe-save-feedback.ts` and use it from `Applications/View/View.tsx`
- [x] 3.4 Wire `Assets/Platform/Applications/View.tsx` the same way as the Applications view (header `isChanged`/`isSaving`, Save/Discard branching, ref and callbacks to `TabsContent`)
- [x] 3.5 Wire `Assets/Apps/View.tsx` the same way, keeping the entity path when Save carries a new version; thread `isSaving` through `AssetButtonsWrapper` and `AssetChangedEntityButtons`
- [x] 3.6 Pass `isSaveDisabled={!isIframeValid}` from the three views; add `isSaveDisabled` to `SimpleButtonsWrapper`, `AssetButtonsWrapper` and `AssetChangedEntityButtons` (Save only there)

## 4. Tests

- [x] 4.1 `FrameRenderer` spec: bare messages accepted/ignored by source and origin, `SAVE_ERROR` text fallbacks, legacy prefixed path unchanged, activation reset on URL change, `triggerSave`/`reset` post bare messages to the correct origin, unhandled types ignored
- [x] 4.2 Guard hook spec: dirty/saving state, success/error/timeout lifecycle, save-then-switch for bare and legacy iframes, tab-leave check
- [x] 4.3 `Applications/View/View` spec: header `isChanged` and Save/Discard branching for dirty iframe, entity-dirty, and legacy cases; `typecheck:specs` stays at zero
- [x] 4.4 `use-iframe-save-feedback` spec: success notification, `onSaved` and refresh; error notification with and without text
- [x] 4.5 Specs for `Assets/Platform/Applications/View` and `Assets/Apps/View`: header Save/Discard for a dirty iframe, `isSaving`, entity path for a versioned Save, `onSaved` folder refetch; spec for `AssetChangedEntityButtons` disabling Save while `isSaving`
- [x] 4.6 Cover `VALIDITY_STATE`: `FrameRenderer` (accept/ignore/reset), guard hook (blocked save and save-then-switch), the three views (Save disabled, Discard enabled) and the header buttons
- [x] 4.7 Rewrite the specs written earlier in this change to the current `.claude/rules/testing.md` (shared notification mock, no inline duplicates of `test-setup.tsx`, role/title queries instead of `querySelector`, `toBeDisabled`, real hook and header instead of mocked ones, `lint:specs` clean)

## 5. Quality checks

- [x] 5.1 Run lint, `npm run lint:specs`, format check, `npm run typecheck`, `npm run typecheck:specs` and the affected-area tests; fix any failures
