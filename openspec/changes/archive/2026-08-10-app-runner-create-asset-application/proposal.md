## Why

`Assets > App Runners > <runner>` offers only `Delete` in its detail header, while `Entities > Application
Runners` offers a `Create` action that seeds a new application with the runner as its source (Issue #4111).
Having configured an asset runner, an admin has to navigate away, create an asset application, and hunt the
runner down in the source picker — the one action the surface exists to enable is the one it does not offer.

The omission was deliberate when the surface shipped: nothing could point at an asset runner yet. Issue #4078
has since wired asset runners into the `Assets > Applications` source picker, so the deferral's precondition is
gone and the archived non-goal is now just a gap.

## What Changes

- Add a `Create Assets Application` action to the app-runner asset detail header, beside `Delete`, seeding the
  new application's source with the runner being viewed.
- Seed the source as the runner's Core resource reference — `schemas/platform/{encodeURIComponent($id)}` via the
  existing `toRunnerReference` — and its `applicationProperties` defaults from DIAL Core's resolved-schema read,
  so the created application reopens with the runner selected.
- Reuse the header's existing `children` slot (`SimpleButtonsWrapper`) and the shared `CreateAsset` modal, so the
  action inherits the established gating: hidden for a read-only admin, while the entity has unsaved changes, and
  while the JSON editor is open.

### Non-goals

- **No entity `Create Application` action**, despite Issue #4111 asking for a dropdown offering both. An entity
  application's `application_type_schema_id` is a foreign key into the admin backend's own runner table, and
  `Entities > Applications` deliberately offers admin-BE runners only — an asset runner has no row to point at, so
  the action could only produce a reference that reopens blank or is rejected on write. This restates the reason
  the archived `add-app-runner-asset-resource` proposal gave for excluding it; that half of the issue stays
  excluded, and the exclusion is now recorded as a spec scenario rather than only as a non-goal.
- **A single button, not a dropdown.** With one valid target, the shape follows `Adapters` (`Create Model`) and
  `Interceptor Templates` (`Create Interceptor`), not the two-item dropdown on the entity runner view.
- **No `Applications` tab** on the runner — the reverse association remains an admin-BE concept with no Core
  counterpart.
- **No change to `Entities > Application Runners`**, its create dropdown, or any other detail-view header.
- **No new i18n keys** — `ButtonsI18nKey.Create` and `CreateI18nKey.AssetApplication` already exist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `assets-app-runners`: the `App-runner asset detail view tab set` requirement currently forbids both outbound
  create actions (`Scenario: No outbound create-application actions`). That scenario is replaced: an
  `Assets Application` action is required, with the reference form and defaults source it must seed, and the
  entity `Application` action is required to stay absent for the foreign-key reason above.

## Impact

- **Changed**: `src/components/Assets/AppRunners/View.tsx` — the only production file. Adds the header action, the
  Core-resolved `applicationProperties` derivation, and the portalled `CreateAsset` modal.
- **Reused unchanged**: `toRunnerReference` (`utils/app-runners/runner-reference.ts`), `toCoreRunnerName`,
  `createSchemaSource` (`utils/entities/application-source.ts`), `getSchemaDefaults` (`utils/schema.ts`),
  `getResolvedRunnerSchema` (`app/[lang]/assets-app-runners/actions.ts`), `CreateAsset`
  (`components/Assets/Deployments/CreateAsset.tsx`), `createApp` (`app/[lang]/assets-applications/actions.ts`),
  and `useAppsFolder`, whose provider is already global in `app/[lang]/layout.tsx`.
- **Not touched**: `SimpleHeader.tsx` / `SimpleButtonsWrapper.tsx` (the `children` slot already renders after
  `Delete` under the right gating), every server action, and every other entity view. No new util, no new i18n key,
  no shared-component change — so no risk to the surfaces sharing `CreateAsset` or the header wrappers.
- **Tests**: one new spec under `src/components/Assets/AppRunners/tests/`. The existing `View.spec.tsx` stubs
  `SimpleHeader` down to a save button, so it cannot observe header children and stays as is.
