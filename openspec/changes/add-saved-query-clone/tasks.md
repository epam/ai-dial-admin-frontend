> **Design**: no `design.md`. None of its trigger conditions apply — the change touches one module, adds
> no dependency, changes no data model, and carries no security, performance, or migration complexity.
> Every technical decision was settled during exploration and is recorded in `proposal.md`.

> **Browser verification**: the user was asked whether to add a `spec-browser-verify` task and declined.
> The browser-observable scenarios are covered by component tests in task 5.

## 1. i18n and shared duplicate metadata

- [x] 1.1 Add `DuplicateI18nKey.Query = 'DuplicateEntity.Entities.Query'` to `src/constants/i18n.ts` and
      its string to `src/locales/en.ts`, alongside the existing `TestSuite` / `Dataset` entries.
- [x] 1.2 Add `[ApplicationRoute.AnalyticsQueries]: DuplicateI18nKey.Query` to `duplicateEntityMap` in
      `src/utils/entities/duplicate-entity.ts`, so `getCloneTitle` resolves a title for the Queries view.
      Add no `duplicateModalDescriptionMap` entry — the modal needs no description banner.

## 2. Payload helper

- [x] 2.1 In `src/components/Analytics/QueryBuilder/utils/saved-query.ts`, rename
      `toMetadataUpdateRequest` to `toMetadataReplaceRequest` and update its doc comment: it assembles a
      payload that carries a stored body, time intent, and chart across while replacing metadata, and it
      now serves both a replace (edit) and a create (duplicate). Update the call site in
      `Modals/EditQuery.tsx` and the util's existing spec.

## 3. Duplicate modal

- [x] 3.1 Add `src/components/Analytics/Queries/Modals/DuplicateQuery.tsx`, modelled on the sibling
      `EditQuery.tsx`: `DialFormPopup` (`PopupSize.Md`, `portalId="DuplicateQueryModal"`, submit label
      `ButtonsI18nKey.Duplicate`, header `getCloneTitle(ApplicationRoute.AnalyticsQueries, t)`) wrapping
      `QueryProperties` with `isModal`.
- [x] 3.2 Seed its `QueryMetadataForm` from the source query: description and tag carried over, name from
      `getClonedEntityName(query.name, false, ' ')` so the suffix reads `Name (copy)` rather than
      `Name_(copy)`, and scope = `isFullAdmin ? query.scope : SavedQueryScope.Personal` per the spec's
      scope rule. Read `isFullAdmin` from `useAppContext`.
- [x] 3.3 Submit via `createSavedQuery(toMetadataReplaceRequest(query, form))`. Block submission while the
      name is blank, while `useSaveValidationContext().isValid` is false, or while a request is in
      flight. Do not pre-check the name against the existing list — the service enforces no uniqueness.
- [x] 3.4 On success: success notification built with `getCreateNotificationTitle` /
      `getCreateNotificationDescription` for `ApplicationRoute.AnalyticsQueries`, close the modal, then
      `router.push(getUrnForEntity(...))` to the **created** query. On failure: notification from
      `describeSavedQueryError(res)` following the same branch `EditQuery` uses, leaving the modal open
      with the entered values.

## 4. Wire into the Queries listing

- [x] 4.1 In `src/components/Analytics/Queries/List/QueriesList.tsx`, add a `duplicatedQuery` state and
      insert `getDuplicateOperation(setDuplicatedQuery)` into the `ACTION_COLUMN` operations between
      Open in new tab and Edit. Pass **no** `hidden` predicate — unlike Edit and Delete, Duplicate is not
      gated by `isWritable`.
- [x] 4.2 Render `{duplicatedQuery && <DuplicateQuery query={duplicatedQuery} onClose={...} />}` next to
      the existing Create and Edit modals.

## 5. Tests

- [x] 5.1 Add `Modals/tests/DuplicateQuery.spec.tsx` covering: the form is seeded from the source
      (description, tag, copy-suffixed name); submit is disabled on a blank name; a name already in use is
      accepted without a uniqueness error; the create payload carries the source's body, time intent,
      result view, and chart unchanged; success navigates to the created query's id, not the source's;
      failure keeps the modal mounted.
- [x] 5.2 Cover the scope rule in the same spec: a non-admin duplicating a common query gets no scope
      field and a personal payload; a full admin gets the field seeded with the source's scope.
- [x] 5.3 Extend `List/tests/QueriesList.spec.tsx`: Duplicate appears in the row actions menu, and it
      appears on a common-scope row for a non-admin even though Edit and Delete do not.
- [x] 5.4 Update the `saved-query` util spec for the rename in task 2.1.

## 6. Queries list empty state

- [x] 6.1 Drop the `description` from `emptyDataProps` in `List/QueriesList.tsx` so the empty state shows
      only its title, and delete the now-uncalled `QueriesI18nKey.NoQueriesDescription` from
      `src/constants/i18n.ts` and `src/locales/en.ts`.

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; resolve any
      failures before the change is considered complete.
