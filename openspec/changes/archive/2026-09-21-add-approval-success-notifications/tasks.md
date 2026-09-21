## 1. i18n keys and strings

- [x] 1.1 In `apps/ai-dial-admin/src/constants/i18n.ts`, extend `PublicationsI18nKey` with six
      publication-type entity labels (`ApplicationPublicationEntity`, `ToolsetPublicationEntity`,
      `PromptPublicationEntity`, `FilePublicationEntity`, `ConversationPublicationEntity`,
      `SkillPublicationEntity`) and eight notification strings (`NotificationDeleteTitle`,
      `NotificationDeleteDescription`, `NotificationDeclineTitle`, `NotificationDeclineDescription`,
      `NotificationPublishTitle`, `NotificationPublishDescription`, `NotificationUnpublishTitle`,
      `NotificationUnpublishDescription`), following the enum's existing `'Publications.<Group>.<Name>'`
      key convention.
- [x] 1.2 In `apps/ai-dial-admin/src/locales/en.ts`, under the existing `Publications` object, add
      an `Entities` map for the six labels (`Application Publication`, `Toolset Publication`, `Prompt
      Publication`, `File Publication`, `Conversation Publication`, `Skill Publication`) and a
      `Notification` map with the four title/description pairs, using `"{entity} was <verb>
      successfully."` for titles and `"{entity} {entityId} has been <verb>."` for descriptions (no
      rollback wording), per `design.md` - Decisions.

## 2. Route-to-label helper

- [x] 2.1 In `apps/ai-dial-admin/src/utils/publications.ts`, add a `publicationEntityMap: Record<string,
      PublicationsI18nKey>` mapping each of the six publication routes
      (`ApplicationPublications`, `ToolsetPublications`, `PromptPublications`, `FilePublications`,
      `ConversationPublications`, `SkillPublications`) to its new entity-label key, mirroring
      `deleteEntityMap` in `src/components/EntityView/Modals/Delete/utils.ts`.
- [x] 2.2 Add `getPublicationEntityLabel(route: ApplicationRoute, t: (str: string) => string): string`
      in the same file, returning `t(publicationEntityMap[route])`.
- [x] 2.3 Add `src/utils/tests/publications.spec.ts` (or extend the existing utils test location)
      covering `getPublicationEntityLabel` for all six publication routes, per `.claude/rules/utils.md`
      and `.claude/rules/testing.md`.

## 3. Success notifications in the review actions

- [x] 3.1 In `apps/ai-dial-admin/src/components/EntityHeaderControls/Wrappers/PublicationsButtonsWrapper.tsx`,
      import `getSuccessNotification` (extend the existing `@/src/utils/notification` import) and
      `getPublicationEntityLabel` (extend the existing `@/src/utils/publications` import).
- [x] 3.2 In `onDelete`'s success branch, call `showNotification(getSuccessNotification(title,
      description))` using `PublicationsI18nKey.NotificationDeleteTitle` /
      `NotificationDeleteDescription`, with `entity` from `getPublicationEntityLabel(view, t)` and
      `entityId` from `entity.requestName`, before `router.push(view)`.
- [x] 3.3 In `onDecline`'s success branch, do the same using `NotificationDeclineTitle` /
      `NotificationDeclineDescription`.
- [x] 3.4 In `onApprove`'s success branch, branch on the existing `isAddAction(action)` check to pick
      `NotificationPublishTitle`/`NotificationPublishDescription` (add action → Publish) or
      `NotificationUnpublishTitle`/`NotificationUnpublishDescription` (delete action → Unpublish).
- [x] 3.5 Add `t` to the `useCallback` dependency arrays of `onApprove`, `onDecline`, and `onDelete`
      (currently missing, since none of them reference `t` yet).

## 4. Component tests

- [x] 4.1 Add `PublicationsButtonsWrapper.spec.tsx` co-located with the component, asserting that on a
      mocked successful `approvePublication` response, `showNotification` is called with the expected
      i18n keys and `{ entity, entityId }` params for both the add-action (Publish) and delete-action
      (Unpublish) cases — asserting keys per this repo's convention (mocked `t()` returns the key
      as-is), not translated text.
- [x] 4.2 In the same spec, cover `onDecline` and `onDelete` analogously against mocked successful
      `declinePublication` / `deletePublication` responses.
- [x] 4.3 In the same spec, cover the existing failure path for all three actions (mocked unsuccessful
      response) asserting `showNotification` is called with the error notification and never with a
      success notification, so the new code doesn't regress the current error-toast behavior.

## 5. Verification

- [x] 5.1 ~~Run the `spec-browser-verify` skill against this change's scenarios~~ — the automated gate
      was blocked by an auth-wall in the local instance (all 6 scenarios reported `blocked`, not
      `pass`/`fail`); skipped per explicit user decision after they verified the six scenarios
      manually in the browser themselves.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the
      full `npm run test` (coverage), and fix any failures.
