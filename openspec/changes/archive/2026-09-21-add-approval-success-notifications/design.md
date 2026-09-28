## Context

See `proposal.md` - Why. The four Publications review actions (Delete, Decline, Publish, Unpublish)
are all handled in one component,
`apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/PublicationsButtonsWrapper.tsx`
(`onApprove`, `onDecline`, `onDelete`), which already has `useNotification()` wired in for the error
path (`showNotification(getErrorNotification(...))`). The app-wide success-toast pattern is
`showNotification(getSuccessNotification(title, description))`
(`src/utils/notification.ts`), already used by the entity delete flow
(`src/components/EntityView/Modals/Delete/`) and the entity/publication update flow
(`src/utils/entities/update-entity.ts`, `src/components/Publications/View/View.tsx`). `NotificationProvider`
is mounted in `apps/ai-dial-admin/src/app/[lang]/layout.tsx`, above route content, so a toast already
survives the `router.push`/`router.refresh` these handlers do after a successful action — no new
plumbing needed there.

## Goals / Non-Goals

**Goals:**
- Add the missing success toast for Delete/Decline/Publish/Unpublish, reusing the existing
  notification mechanism exactly as-is.
- Give each toast a publication-type-specific entity label instead of the generic "Publication".

**Non-Goals:**
- No change to the publication server actions, their `ServerActionResponse` contract, or the Core
  API calls they make (`publications-core-api` is untouched).
- No change to the existing error-toast behavior on failure.
- No new notification component, hook, or context — this only adds call sites to
  `getSuccessNotification`.

## Decisions

**Wording deviates from the app-wide convention, by explicit product decision.** Every other
success toast in the app reads `"{entity} deleted successfully"` (no "was"). This change instead
uses `"{entity} was deleted successfully."` (and the equivalent for declined/published/unpublished),
matching the issue's literal suggested text. This was raised and confirmed during design review: it
is a deliberate one-off wording choice for the Publications approval flow, not an oversight to fix
later.

**New, symmetric i18n keys for all four actions — Delete does not reuse `DeleteI18nKey`.** Because
the wording differs from the generic `DeleteEntity.Notification.Title` (`"{entity} deleted
successfully"`), reusing it for Delete would either fork the shared key's meaning or require a
second key anyway. Instead, all four actions get their own `PublicationsI18nKey` entries
(`NotificationDeleteTitle/Description`, `NotificationDeclineTitle/Description`,
`NotificationPublishTitle/Description`, `NotificationUnpublishTitle/Description`), keeping the four
notifications symmetric and scoped to the Publications feature, and keeping the shared
`DeleteEntity.Notification.*` keys untouched for every other entity-delete call site.

**New type-specific entity labels, not the generic `Publication` label.** Today
`UpdateI18nKey.Publication` collapses every publication route to the string "Publication" (used only
by the save/update flow, not approval actions). The issue explicitly wants "Application Publication",
"Toolset Publication", etc. Six new `PublicationsI18nKey` entries are added, resolved via a new
`getPublicationEntityLabel(route, t)` helper in `src/utils/publications.ts`, mirroring the existing
`deleteEntityMap` / `getNotificationTitle` pattern in
`src/components/EntityView/Modals/Delete/utils.ts`. Alternative considered: reuse the generic
`Publication` label to avoid new keys — rejected because it doesn't match what the issue asked for
and the app already has an established per-route-label-map pattern to follow instead of inventing a
new one.

**No rollback wording, for all four actions.** The existing entity-delete notification has two
description variants — with and without a rollback mention — chosen per view
(`isAssetView`/`isEvaluationView`). A publication *request* (as opposed to the underlying entity) has
no rollback path once deleted, declined, published, or unpublished, so all four new descriptions use
the no-rollback phrasing unconditionally; there's no per-view branching needed here since none of the
six publication routes support rollback for these actions.

**Description names the specific request via `entity.requestName`.** This mirrors the existing
Publications update-success notification (`src/components/Publications/View/View.tsx`, already uses
`publication.requestName` as the `entityId`), so the new toasts are visually and structurally
consistent with the one success toast this flow already has.

## Risks / Trade-offs

- **Wording inconsistency with the rest of the app** ("was X successfully" here vs "X successfully"
  everywhere else) → Accepted trade-off, per explicit product decision; scoped to exactly these four
  strings so it doesn't spread.
- **No existing test coverage for this component or util** (`PublicationsButtonsWrapper.tsx`,
  `src/utils/publications.ts`) → New tests are added as part of this change rather than left for
  later, per `utils.md`'s "every util needs unit tests" rule.
