## Context

Two `App Runner` detail views exist. `Entities > Application Runners`
(`components/ApplicationRunners/View/View.tsx`) offers a `Create` dropdown with `Application` and `Assets
Application`; `Assets > App Runners` (`components/Assets/AppRunners/View.tsx`) passes no `children` to
`SimpleEntityHeader` and so shows `Delete` alone. Issue #4111 reads the second as a regression against the first.

The two runner populations are referenced differently, and that is the whole of the technical content here:

- An **entity** runner is referenced by its bare `$id`, resolved against the admin backend's runner table.
- An **asset** runner is referenced by its Core resource name, `schemas/platform/{encodeURIComponent($id)}`, built by
  `toRunnerReference` (`utils/app-runners/runner-reference.ts`) and accepted by the `Assets > Applications` picker
  since Issue #4078.

So the entity view's `initialValues` — `createSchemaSource(selectedRunner.$id)` plus defaults from the admin BE's
`getResolvedApplicationScheme` — cannot be copied verbatim; both halves need the asset counterpart. The header slot
itself needs nothing: `SimpleButtonsWrapper` already renders `children` after `Delete`, and only when the viewer is
not a read-only admin, the entity is unchanged, and the JSON editor is off.

## Goals / Non-Goals

**Goals:**

- Add one header action, `Create Assets Application`, seeded so the created application reopens with the runner
  selected.
- Compose it from existing pieces — no new component, util, i18n key, or server action.
- Keep every shared component (`SimpleHeader`, `SimpleButtonsWrapper`, `CreateAsset`, `AssetProperties`) untouched,
  so no other surface can regress.

**Non-Goals:**

- No entity `Create Application` action (see the proposal's non-goals — the reference has no admin-BE row).
- No dropdown, no `Applications` tab, no change to `Entities > Application Runners`.
- No change to how the `Assets > Applications` picker resolves or renders runners.

## Decisions

**Seed the source with `createSchemaSource(toRunnerReference($id))`, not the bare `$id`.**
`createApp` maps `source.applicationTypeSchemaId` onto `application_type_schema_id`
(`app/[lang]/assets-applications/actions.ts`), and the picker resolves an asset runner only through the
`schemas/platform/…` form — `fromRunnerReference` is what turns a stored reference back into a runner. Writing the
bare `$id` would round-trip as unresolvable and the reopened application's App Runner field would be blank. Rejected
alternative: write the bare `$id` and broaden the picker's resolution — that would relax a contract two other
surfaces depend on to save one call to an existing helper.

**Derive `applicationProperties` from Core's `getResolvedRunnerSchema`, not the admin BE's resolver.**
This is the same origin-driven split `SourceField/Application/AppRunners.tsx` already makes when a user picks an
asset runner in the merged picker: `getResolvedRunnerSchema(toCoreRunnerName($id))` for asset, the admin BE's
`getResolvedApplicationScheme` for entity. Reusing that branch keeps one behaviour for "defaults for an asset
runner" rather than two. On failure, fall back to `getSchemaDefaults` over the runner resource as loaded — the same
fallback-to-self the entity view uses, so a resolver outage degrades the defaults instead of blocking the modal.

**Key the resolution effect on `originalRunner.$id`, not on `selectedRunner`.**
The entity view re-resolves on every `selectedRunner` change, which refires on each keystroke in the runner's own
tabs. Core resolves what is *stored*, so the saved resource is the correct input, and `$id` is immutable after
create — one fetch per runner, and the defaults match what Core would actually produce.

**Pass the action through the header's `children` slot as a single `DialNeutralButton`.**
`Adapters` (`Create Model`) and `Interceptor Templates` (`Create Interceptor`) already establish the
single-target shape, and the slot brings the read-only-admin / unsaved-changes / JSON-editor gating for free.
Label composed as `` `${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.AssetApplication)}` `` → "Create Assets
Application", matching the Adapter precedent, so no i18n key is added. Rejected alternative: a
`DialButtonDropdown` with one item — a menu that never offers a choice.

**Let `CreateAsset` keep owning the modal, including the source field's absence.**
`AssetProperties` already hides the source field when `initialValues` is present, so the runner cannot be
overridden inside a modal opened *from* that runner; `CreateAsset` already owns validation gating, the
success/error notification, folder refresh, and navigation to the new application. Reset the shared
`SaveValidationContext` on close, as the entity view does, so the modal's field registrations do not leak into the
runner's own save gating. Nothing new to write on either count.

## Risks / Trade-offs

- **The issue asks for two actions and gets one** → the proposal and the spec delta both record why the entity
  variant is impossible, and the exclusion moves from a buried non-goal to an asserted scenario, so the next reader
  of the issue does not re-open it as an oversight. Worth stating on the ticket.
- **The seeded reference is only correct as long as the picker's resolution rule holds** → the round-trip is asserted
  by a test on the exact `schemas/platform/…` string, so a change to either side fails loudly rather than silently
  producing blank App Runner fields.
- **Sharing `SaveValidationContext` between the runner view and the create modal** → already the pattern on the
  entity runner view; the `Reset` on close is what keeps it sound, and the runner's own save gating is covered by
  the existing `View.spec.tsx` validation tests.
- **`getResolvedRunnerSchema` adds one Core call per runner detail load** → unconditional so the modal opens
  instantly, matching the entity view's behaviour; it is one request against a resource the page has already read,
  and a failure is non-fatal.
