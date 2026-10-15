## Context

Three components implement `onImport` for the Import modal, each with its own copy of "fire request, close modal, show results": Files (`Assets/Files/List.tsx`), the shared asset list (`Assets/BaseAssetList/BaseAssetList.tsx`) and the entity-list header (`EntityListView/HeaderButtons/HeaderButtons.tsx`). Only the last showed an in-progress notification, and it removed it in a bare `.then`. Files' request is a raw `fetch` + `res.json()` and none of the three has a `.catch`, so a thrown request would leave the notification (or, for the notification-less routes, any trace of the failure) dangling. See proposal.md for motivation.

`NotificationContext` already supports what is needed: `showNotification` returns an id, `removeNotification(id)` dismisses it, and `getPrepareNotification` defaults to `duration: null` (persistent) with a `DialLoader` spinner.

## Goals / Non-Goals

**Goals:**
- One place that owns the lifecycle "show spinner → await request → always remove spinner".
- Leave each caller's result handling, request function, and auth wrapping exactly as they are.

**Non-Goals:**
- Unifying result handling (`getImportNotificationContent` vs `getImportResults` plus the archive `error` branch).
- Cancellation or progress percentages — the Files upload is a single `fetch` with no progress events.

## Decisions

**D1 — A small hook, not a shared `onImport`.** `useImportProgress()` returns `(folderName, request) => Promise<ServerActionResponse>`. The request is a callback so HeaderButtons keeps `useProtectedRequest` (401 refresh) and Files/BaseAssetList keep calling their action directly. *Alternative:* extract the whole `onImport` block. Rejected — the three result paths differ (archive `error` field, `getImportResults`, `skipped` notification gated on the conflict policy), so a unified function would need a callback per difference and hide them.

**D2 — Always clear in `finally`, convert a throw into a failure response.** A thrown request resolves to `{ success: false, errorHeader: <generic "Import failed"> }` and the raw error goes to `console.error`, so the user sees a plain title instead of a bare browser message such as "Failed to fetch". Every caller already routes this to its existing error-notification branch. *Alternative:* rethrow and add `.catch` at each caller. Rejected — three more places to forget it, and the point of the hook is that the spinner can't leak.

**D3 — Indicator is a notification, not an in-modal spinner.** Chosen by the user in the grill session: the modal still closes immediately. The notification container is itself a live region (a11y.md), so no extra `aria-live` is added. *Alternative:* keep the modal open with `StepperModalButtons`' existing `isLoading`. Rejected by the user; it would also have required making `onApply` async across three call paths.

**D4 — No entry-point disabling.** Also a user decision (acceptance criterion dropped). Concurrent imports remain possible; each gets its own notification and its own result.

**D5 — New i18n keys instead of reusing `PrepareTitle`/`PrepareDescription`.** The old title was `'Importing {type}'` but its only caller passed `{ folder }`, and `getImportTitle` returns `''` for several routes, so a `{type}` title would read badly. The new title is parameter-free (`Import in progress`) and the description takes `{folder}`. The old keys had one caller and are removed.

## Risks / Trade-offs

- [Notification can be dismissed by the user via its close button while the request is still running] → Accepted; the request completes and the result notification still appears. `removeNotification` of an already-removed id is a no-op filter.
- [Several concurrent imports stack several spinners] → Accepted per D4; each is cleared by its own request.
- [HeaderButtons behaviour change: a thrown request now shows an error instead of a stuck spinner] → Intended; covered by the hook spec.
- [The synthesized failure carries no description and no `requestId`] → Acceptable: a request that never got a response has no trace id, and the underlying error is logged to the console for diagnosis.
