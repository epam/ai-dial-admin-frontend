## Context

`FrameRenderer` wraps `VisualizerConnector` (`@epam/ai-dial-visualizer-connector`). The connector prefixes
every outbound type with `${visualizerName}/` and wraps it in a `DeferredRequest`; inbound handling in
`FrameRenderer` drops any `event.data.type` whose first `/` segment is not `name`.

Dirty/save state today (Applications view only):

- `use-parameters-tab-guard.ts` listens for the legacy `${name}/sendMessage` with `payload.isChanged`
  (`isIframeChanged`) and, on "save parameters", sends `visualizeData { saveChanges: true }` then waits a
  fixed 2 seconds before switching tabs.
- `Applications/View/View.tsx` owns `isChanged`, `onSave`, `onDiscard` and passes them to
  `SimpleEntityHeader`. `useParametersTabGuard` forces entity changes to be resolved before entering the
  Parameters tab, so entity-dirty and iframe-dirty do not overlap while the iframe is visible.

QuickApps (`ai-dial-quickapps-frontend`) additionally speaks a bare protocol over `window.parent.postMessage`:
out `DIRTY_STATE {payload:{isDirty}}` (only on change), `SAVE_SUCCESS {hasChanges, payload:{updatedApp}}`,
`SAVE_ERROR {payload:{error}}`; in `TRIGGER_SAVE {general?}`, `RESET`. Its `readyToInteract`, `readyToSave`
and `loggedOut` stay prefixed. `ai-dial-chat` consumes the same save messages from a raw iframe, validating
`event.origin` and `event.source` and posting with an explicit target origin.

## Goals / Non-Goals

**Goals:**
- Drive the existing header Save/Discard from the iframe's dirty state, with a real save-completion signal.
- Keep legacy runners working unchanged.
- Keep `FrameRenderer` free of UI chrome and domain logic (notifications, refresh).

**Non-Goals:** see the proposal.

## Decisions

### D1. Header owns the buttons; `FrameRenderer` is a protocol adapter
`FrameRenderer` gains `onDirtyChange`, `onSaveSuccess`, `onSaveError` props and exposes
`triggerSave()` / `reset()` through its forwarded handle. The existing `forwardRef<HTMLDivElement>` is
replaced by an imperative handle typed in a sibling `models.ts`.
*Alternative:* buttons inside `FrameRenderer` — rejected: duplicates the header bar and splits the tab
guard's notion of "unsaved".

### D2. Activate on first `DIRTY_STATE`, not on configuration
The bare protocol has no capability handshake, so a runner is treated as new-protocol once a bare
`DIRTY_STATE` arrives from the iframe window. Until then `isDirty` is `false` and nothing changes.
`FrameRenderer` resets this when `iframeUrl` changes.
*Alternative:* flag on the scheme/runner config — rejected: needs backend/schema change and drifts from the
runner's real behavior.

### D3. Raw `postMessage` for sends; `VisualizerConnector` untouched
`TRIGGER_SAVE` and `RESET` must be bare, but `VisualizerConnector.send` always prefixes and awaits a
reply. The adapter posts directly to the iframe obtained from the container
(`containerRef.current.querySelector('iframe')`, already used for the sandbox token) with
`targetOrigin = new URL(iframeUrl).origin`. An unparsable `iframeUrl` makes sends a no-op.
*Alternative:* extend the connector — rejected: it is a shared package with a different framing contract.

### D4. Validate source and origin for bare messages
Bare messages are accepted only when `event.source === iframe.contentWindow` and
`event.origin === new URL(iframeUrl).origin`. The existing prefixed path keeps its current check, so legacy
behavior does not change.

### D5. State and orchestration live in the guard hook
`use-parameters-tab-guard.ts` already owns `isIframeChanged` and the save-then-switch flow, so it also owns
`isIframeDirty`, `isIframeSaving`, a `frameRef`, and the pending-save timeout. It returns what `View.tsx`
needs: `isIframeDirty`, `isIframeSaving`, `frameRef`, `onSaveIframe`, `onDiscardIframe`.
*Alternative:* a new context — rejected: one consumer, and the codebase's pattern is hooks + props.

### D6. Header branching in the three application views
Applies identically to `Applications/View/View.tsx`, `Assets/Apps/View.tsx` and
`Assets/Platform/Applications/View.tsx`; all three already share `useParametersTabGuard`, `TabsContent` and
`ParametersTab`.
- `isChanged` passed to the header is `isChanged || isIframeDirty`, and `isSaving` is `isIframeSaving`.
- Save: if `isIframeDirty`, call `onSaveIframe`; else the existing entity save.
- Discard: if `isIframeDirty`, call `reset()` instead of rewinding entity state; else existing behavior.
- Assets Apps only: Save is called with an optional new version. A save that carries a version is an explicit
  entity action and keeps the entity path; only an unversioned Save is redirected to the iframe.
- Assets Apps uses `AssetHeader`, which did not honor `isSaving`; `AssetButtonsWrapper` and
  `AssetChangedEntityButtons` thread it through so Save (and Save as new version) disable while pending.

### D6a. Shared success/error feedback
`use-iframe-save-feedback.ts` owns the success notification, `router.refresh()` and the error notification so
the three views do not each repeat them. Views pass the entity name, the route, and an `onSaved` hook for
view-specific cleanup (validation reset and core-copy invalidation in Applications; folder refetch in the two
asset views).

### D7. Save lifecycle
On `onSaveIframe`: set `isIframeSaving`, send `TRIGGER_SAVE`, start a timeout (30 s). Header Save is disabled
while saving.
- `SAVE_SUCCESS`: clear saving, clear dirty immediately (a lost `DIRTY_STATE{false}` must not strand the
  buttons), show the success notification used by entity save, `router.refresh()`.
- `SAVE_ERROR`: clear saving, keep dirty, show an error notification. Message is
  `data.payload?.error ?? data.error`, else a generic i18n string.
- Timeout: clear saving, show the generic error, keep dirty.
The iframe's later `DIRTY_STATE{false}` is accepted idempotently.

### D8. Save-then-switch awaits the signal for new-protocol iframes
`onModalConfirm(ModalType.parameters)` branches: new-protocol iframe → `onSaveIframe`, switch tab only on
`SAVE_SUCCESS`, stay on `SAVE_ERROR`/timeout; legacy → current `saveChanges` send plus the 2-second wait.
The tab-leave check becomes `isIframeChanged || isIframeDirty || isChanged`.

### D10. Form validity gates Save
`VALIDITY_STATE` is accepted under the same source/origin checks as the other bare messages and only when
`payload.isValid` is a boolean. `FrameRenderer` reports it through `onValidityChange` and, like dirty state,
reports `true` again on unmount or iframe URL change. The guard hook keeps `isIframeValid` (default `true`).
- Views pass `isSaveDisabled={!isIframeValid}` to the header. It is a separate prop from `isSaving` so the two
  reasons stay distinct; `SimpleButtonsWrapper` and `AssetChangedEntityButtons` fold it into the Save
  disabled state. In the asset header it disables Save only, because Save as new version stays on the entity
  path and is not about the iframe form.
- Discard stays enabled while invalid, so the user can reset the form.
- `onSaveIframe` is a no-op while invalid, which also covers other entry points such as the view selector's
  save. Confirming "save, then switch tab" while invalid closes the prompt, stays on the tab and shows the
  generic error notification.
*Alternative:* treat invalid as not dirty — rejected: it would hide Discard and the unsaved-changes prompt
exactly when the user most needs them.

### D9. Ignored messages
`TRIGGER_AUTO_SAVE`, `AUTO_SAVE_COMPLETE`, `HEIGHT_CHANGE`, `REQUEST_TOOLSET_*`,
`REQUEST_APPLICATION_CREDENTIALS` and `READY` are not handled; unknown bare types fall through.

## Risks / Trade-offs

- [Dirty-never-arrives for a new-protocol iframe that loads already dirty] → The editor emits
  `DIRTY_STATE` only on change from the initial `false`; an initially-dirty form is out of contract.
- [`SAVE_SUCCESS` with `hasChanges: false`] → Treated as success; refresh is harmless.
- [Iframe auto-save races a header Save] → QuickApps serializes through its own save path and reports
  `AUTO_SAVE_COMPLETE`, which is ignored; a manual save still ends in `SAVE_SUCCESS`.
- [`Publications/View` renders `ParametersTab` and shows an editor with no Save/Discard] → Accepted per
  scope; inert without a subscriber, same as today.
- [`SAVE_ERROR` shape divergence between chat and QuickApps] → Both locations read; i18n fallback.
- [Hook grows] → If `use-parameters-tab-guard.ts` becomes unwieldy, split iframe state into a sibling hook
  consumed by the guard; decide during implementation, not a spec concern.

## Migration Plan

No data or API migration. Legacy runners keep their behavior; revert is reverting the change.

## Open Questions

- Exact i18n key names for the generic iframe save error (reuse an existing `ButtonsI18nKey`/notification
  key if one fits).
