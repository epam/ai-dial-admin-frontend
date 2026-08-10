## 1. Header action on the app-runner asset detail view

All production work lands in `apps/ai-dial-admin/src/components/Assets/AppRunners/View.tsx`. No shared component,
util, server action, or i18n key changes — see `design.md`.

- [x] 1.1 Derive the seeded `applicationProperties` in `View.tsx`: in a `useEffect` keyed on `originalRunner.$id`,
      call `getResolvedRunnerSchema(toCoreRunnerName(originalRunner.$id ?? ''))`
      (`@/src/app/[lang]/assets-app-runners/actions`) and store
      `getSchemaDefaults(scheme as JSONSchema7) as Record<string, unknown>` in state; when the read fails or returns
      nothing, fall back to `originalRunner` as the scheme so the modal still opens with usable defaults.
- [x] 1.2 Add `isCreateAssetAppModalOpen` state and render a `DialNeutralButton` as `children` of
      `SimpleEntityHeader`, labelled `` `${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.AssetApplication)}` `` with
      `iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}` — the `Adapter/View/View.tsx` shape. No change to
      `EntityHeaderControls/SimpleHeader.tsx` or `Wrappers/SimpleButtonsWrapper.tsx`; the `children` slot already
      renders after `Delete` and already hides for a read-only admin, while `isChanged`, and while the JSON editor
      is open.
- [x] 1.3 Portal `CreateAsset` (`@/src/components/Assets/Deployments/CreateAsset`) into `document.body` when the
      modal is open, with `view={ApplicationRoute.AssetsApplications}`, `onCreate={createApp}`
      (`@/src/app/[lang]/assets-applications/actions`), `context={useAppsFolder}`, and
      `initialValues={{ source: createSchemaSource(toRunnerReference(originalRunner.$id)), applicationProperties }}`
      — guarding on `$id` being present, and using `toRunnerReference`
      (`@/src/utils/app-runners/runner-reference`), never the bare `$id`.
- [x] 1.4 On modal close, clear the flag and dispatch `{ type: ValidationActionType.Reset }` from
      `useSaveValidationContext()` so the modal's field registrations do not leak into the runner's own save
      gating; the page already provides the context (`app/[lang]/assets-app-runners/[id]/page.tsx`).

## 2. Unit tests

- [x] 2.1 Add `apps/ai-dial-admin/src/components/Assets/AppRunners/tests/create-asset-application.spec.tsx` with
      its own stubs — `EntityHeaderControls/SimpleHeader` rendering `{children}`,
      `Assets/Deployments/CreateAsset` capturing its props, `../TabsContent` inert. The existing `View.spec.tsx`
      stubs `SimpleHeader` down to a save button and must stay untouched, so it cannot observe header children.
      `useAppsFolder` is already mocked in `apps/ai-dial-admin/test-setup.tsx`.
- [x] 2.2 Cover: the header offers the `Create Assets Application` action; clicking it mounts `CreateAsset` with
      `view === ApplicationRoute.AssetsApplications`; `initialValues.source` is exactly
      `{ $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'schemas/platform/https%3A%2F%2Fhost%2Frunner' }`
      for `$id` `https://host/runner` — the assertion that guards the reference form.
- [x] 2.3 Cover the defaults source: with `getResolvedRunnerSchema` mocked to resolve a schema carrying a defaulted
      property, `initialValues.applicationProperties` reflects that schema's defaults; with it mocked to fail, the
      defaults come from the runner resource instead and the modal still mounts.

## 3. Browser verification

- [x] 3.1 Run the `spec-browser-verify` flow over the scenarios in
      `openspec/changes/app-runner-create-asset-application/specs/assets-app-runners/spec.md`, against the local app
      with the local stack running and auth disabled. Cover the browser-observable scenarios: the header offers
      `Create Assets Application` and no entity `Create Application`; the modal opens with no source field; creating
      an application navigates to it and its App Runner field shows the originating runner as selected; the action
      disappears while the runner has unsaved changes and while the JSON editor is open. Resolve every `fail`
      verdict before treating this change as complete.

## 4. Quality checks

- [x] 4.1 Run `npx vitest run src/components/Assets/AppRunners` from `apps/ai-dial-admin/`, then `npm run lint` and
      `npm run format` from the repo root; fix everything they report.
