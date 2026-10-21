## Context

The query page's save flow lives in `use-saved-query-page.tsx`: it captures the live payload
(`liveRequest`) through `captureFrom(meta, input)`, which lays the stored query's metadata over the
current builder state. Save and Discard render through the shared `ChangedEntityButtons`, which already
accepts extra controls through `children` — the asset pages put "Save as new version" there.
`DuplicateQuery` already implements the create-copy modal: seeding (`copiedName`, scope downgrade for
non-administrators), error reporting through `describeSavedQueryError`, notification, and navigation.
What differs for Save as is where the request body comes from and what happens after a create succeeds.
`Notification.description` is typed `string`, though the renderer would accept any node, and
`NotificationPortal` is a `role="status"` live region.

## Goals / Non-Goals

**Goals:**

- One modal for Duplicate and Save as, so seeding, validation, and error handling cannot diverge.
- The Save as payload is built by the same `captureFrom` that drives Save and the dirty check, so Save
  as writes exactly what Save would have written, under different metadata.

**Non-Goals:**

- No change to `ChangedEntityButtons` or any other `Common`/shared component.

## Decisions

**Reuse `DuplicateQuery` with an injected request builder and success handler.** It gains optional
`buildRequest(meta: QueryMetadataForm) => SavedQueryRequest`, `onCreated(created: SavedQuery) => void`,
and `header` / `submitLabel` overrides. Without `buildRequest` it keeps
`toMetadataReplaceRequest(query, meta)`; without `onCreated` it keeps today's notify-close-navigate, so
the grid's Duplicate is untouched. With `onCreated` the modal hands the created query over and leaves
notification, closing, and navigation to the caller. Alternative: a new `SaveQueryAs` modal — rejected, it would copy ~80 lines of
seeding and error handling that the spec requires to behave identically.

**A transport failure is reported, not swallowed.** Browser verification found that a create rejected
in transport left the submit disabled with no notification, because `setIsSaving(false)` ran only after
a resolved call. The modal now wraps the call in `try/catch/finally`: `finally` re-enables submit, and
`catch` shows `ErrorI18nKey.Error` over `QueriesI18nKey.ErrorGeneric`, since a rejection carries no
error envelope to branch on. The modal is shared, so the grid's Duplicate gets the same fix. The page's
own Save had the same gap in `onSave`; it predates this change but is fixed here the same way, so
Save and Save as recover identically on one page.

**The hook owns the payload, the page owns the button.** `useSavedQueryPage` returns
`isSaveAsOpen`, `onOpenSaveAs`, `onCloseSaveAs`, and `buildSaveAsRequest(meta)`, which returns
`toSavedQueryRequest(captureFrom(meta, inputRef.current))`. Reading through `inputRef` keeps the
callback stable and reads the values at submit time, not at modal-open time. `QueryBuilder` renders a
`DialNeutralButton` labelled `ButtonsI18nKey.SaveAs` as `ChangedEntityButtons`' child, disabled on
`runDisabled || isSaving` — the same expression as Save — and mounts the modal. On tablet and mobile it
takes the `w-1/2 flex justify-center` width `ChangedEntityButtons` gives Discard and Save, set after
mount as that component does, matching the `AssetChangedEntityButtons` child-slot precedent.

**Header and label.** The modal header reads "Save query as" and submit reads "Save"; the toolbar
button reads "Save as". New keys go under `ButtonsI18nKey` and `QueriesI18nKey` in
`src/constants/i18n.ts` and `src/locales/en.ts`.

**Stay on the source and keep it dirty.** The hook's `onSaveAsCreated` closes the modal and shows the
notification; it touches neither `savedQuery` nor `baseline`, so `isDirty` keeps comparing against the
stored source and Discard / Save / Save as stay available. Alternative: revert the page to the stored
source, since the edits now live in the new query — rejected by the product decision to let the user
keep iterating on the same edits.

**The link goes in the notification body.** `Notification.description` widens from `string` to
`ReactNode` in `src/models/notification.ts`. The renderer already outputs `{description}` inside a `<p>`
and nothing else reads the field, so no consumer changes; the `get*Notification` helpers keep their
`string` parameter. The Save as notification is built with `getNotification` and the standard create
title; its body is a short lead-in followed by a Next `Link` to
`getUrnForEntity(ApplicationRoute.AnalyticsQueries, created)` labelled with the new query's name, styled
`text-accent-primary underline` so it does not rely on colour alone. Alternative: the existing
`customTitle` slot — rejected by product decision, the link belongs in the body where the entity is
named on every other create toast. The default 6 s duration is kept, matching every other success
toast. The portal's live region announces the body, so no second region is added.

**Following the link drops the source's edits.** The page has no leave-guard today, and none is added:
the user has just chosen to keep the edits in the new query, which the link opens.

## Risks / Trade-offs

- [The live payload holds a body the service refuses] → create revalidates and the failure is reported
  as a body refusal with the service's message, as on Save; the modal stays open.
- [The toast leaves before the user follows its link] → the new query is also listed in the Queries
  grid; accepted.
- [`DuplicateQuery`'s name now understates its role] → kept: renaming touches the grid and its spec for
  no behavioural gain; the prop docs state the second use.
