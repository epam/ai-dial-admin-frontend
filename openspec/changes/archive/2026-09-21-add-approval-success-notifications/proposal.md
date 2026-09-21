## Why

The Approvals review flow (Application, Toolset, Prompt, File, Conversation, and Skill Publications)
gives no feedback when Delete, Decline, Publish, or Unpublish succeeds — the request just disappears
from the list. Every other write flow in the app (entity delete, entity update) shows a success toast;
Publications only shows a toast on failure. [Issue #3775](https://github.com/epam/ai-dial-admin-frontend/issues/3775)
asks for the missing success feedback so reviewers get clear, consistent confirmation.

## What Changes

- Add a success toast after each of the four Publications review actions completes:
  - Delete → "\{entity\} was deleted successfully." / "\{entity\} \{requestName\} has been deleted."
  - Decline → "\{entity\} was declined successfully." / "\{entity\} \{requestName\} has been declined."
  - Publish (approve, add action) → "\{entity\} was published successfully." / "\{entity\} \{requestName\} has been published."
  - Unpublish (approve, delete action) → "\{entity\} was unpublished successfully." / "\{entity\} \{requestName\} has been unpublished."
- `{entity}` is a new, publication-type-specific label — "Application Publication", "Toolset
  Publication", "Prompt Publication", "File Publication", "Conversation Publication", "Skill
  Publication" — replacing the generic "Publication" label for this notification only.
- No rollback wording in any of the four toasts: a publication request that has been
  deleted/declined/published/unpublished cannot be rolled back, unlike an entity delete.
- Reuses the existing `useNotification()` / `getSuccessNotification()` pattern already used by the
  entity delete and entity update flows — no new notification mechanism.

## Capabilities

### New Capabilities

- `publication-approval-notifications`: user-facing success-notification behavior for the four
  Publications review actions (Delete, Decline, Publish, Unpublish) in the Approvals flow. No
  existing spec covers this — `publications-core-api` documents the server/Core API contract for
  these same actions, not the client-side toast feedback.

### Modified Capabilities

_None._ This does not change the behavior documented by `publications-core-api` (the approve/reject/
delete API contract itself is untouched) or by `skill-publications` (Skill continues to reuse the
generic publication actions, now with the same notification behavior as every other type).

## Impact

- `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/PublicationsButtonsWrapper.tsx` —
  `onApprove`, `onDecline`, `onDelete` handlers gain a `showNotification(getSuccessNotification(...))`
  call on the success path.
- `apps/ai-dial-admin/src/utils/publications.ts` — new route→label helper
  (`getPublicationEntityLabel`), mirroring the existing `deleteEntityMap` pattern in
  `src/components/EntityView/Modals/Delete/utils.ts`.
- `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` — new
  `PublicationsI18nKey` entries for the six entity labels and the four notification title/description
  pairs.
- No API, server-action, or route changes. No impact on other consumers of `PublicationsI18nKey`,
  `useNotification`, or `getSuccessNotification`.
