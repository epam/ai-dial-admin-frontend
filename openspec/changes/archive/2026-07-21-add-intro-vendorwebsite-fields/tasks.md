## 1. Investigation (completed during apply — see design.md "Corrected architecture")

- [x] 1.1 Inspected `asset-metadata.ts`'s merge functions — full spread, no field whitelist, so new content fields pass through automatically.
- [x] 1.2 Checked admin-BE DTOs — no length/format validation annotation on `intro`/`vendorWebsite`; `MAX_INTRO_SYMBOLS` mirrors `MAX_DESCRIPTION_SYMBOLS`'s frontend-only convention (2048). Confirmed `EndpointControl`'s existing `getUrlError` (plain http(s) check) is the right validator to reuse for `vendorWebsite` — no new validator file needed.
- [x] 1.3 Traced the real component tree for Asset Application and Asset Toolset properties views — both are separate, snake_case-typed components (`Assets/Apps/Properties.tsx`, `Assets/Toolsets/View/Properties.tsx`), not the shared `DeploymentProperties.tsx`. Corrected file paths and mount points below.

## 2. Shared `intro` field — model, validation, control

- [x] 2.1 Add `intro?: string` to `BaseEntity` in `apps/ai-dial-admin/src/models/dial/base-entity.ts`.
- [x] 2.2 Add `MAX_INTRO_SYMBOLS = 2048` to `apps/ai-dial-admin/src/constants/validation.ts` and a `getErrorForIntro` validator in `apps/ai-dial-admin/src/utils/validation/intro-error.ts`, mirroring `description-error.ts`.
- [x] 2.3 Add `EntityFieldsI18nKey.intro`, `EntityPlaceholdersI18nKey.Intro`, and `ErrorI18nKey.IntroLength` keys to `apps/ai-dial-admin/src/constants/i18n.ts` and corresponding strings in `apps/ai-dial-admin/src/locales/en.ts`.
- [x] 2.4 Create `IntroControl` in `apps/ai-dial-admin/src/components/BaseControls/Intro.tsx`, generic over `T extends { intro?: string }`, mirroring `Description.tsx` exactly (validation on change, `SaveValidationContext` dispatch, `onChangeEntity` spread).

## 3. Mount `intro` (four locations)

- [x] 3.1 Mount `IntroControl` next to `DescriptionControl` in `apps/ai-dial-admin/src/components/EntityMainProperties/Properties/DeploymentProperties.tsx` (covers Model, regular Application, regular Toolset).
- [x] 3.2 Mount `IntroControl` next to `DescriptionControl` in `apps/ai-dial-admin/src/components/EntityMainProperties/Properties/EntityProperties.tsx`, gated to `view === ApplicationRoute.Interceptors` (Routes' backend DTO has no `intro`, so it must not show here).
- [x] 3.3 Mount `IntroControl` next to `DescriptionControl` in `apps/ai-dial-admin/src/components/Assets/Apps/Properties.tsx` (Asset Application).
- [x] 3.4 Mount `IntroControl` next to `DescriptionControl` in `apps/ai-dial-admin/src/components/Assets/Toolsets/View/Properties.tsx` (Asset Toolset).

## 4. `vendorWebsite` field — model, control, mounts (Toolset only, two variants)

- [x] 4.1 Add `vendorWebsite?: string` to `Toolset` in `apps/ai-dial-admin/src/models/dial/toolset.ts`.
- [x] 4.2 Add `vendor_website?: string` to `DialToolsetResource` in `apps/ai-dial-admin/src/models/dial/resource.ts` (snake_case, matching Core's wire format for resource entities).
- [x] 4.3 Add `EntityFieldsI18nKey.vendorWebsite` and `EntityPlaceholdersI18nKey.VendorWebsite` i18n keys.
- [x] 4.4 Create `VendorWebsiteControl` in `apps/ai-dial-admin/src/components/BaseControls/Endpoint/VendorWebsite.tsx`, a thin wrapper around the existing `EndpointControl` (same pattern as `EditorUrl.tsx`/`ViewerUrl.tsx`) — bare `{endpoint, onChange}` props, not entity-generic, so it fits both the camelCase and snake_case call sites.
- [x] 4.5 Mount `VendorWebsiteControl` in `apps/ai-dial-admin/src/components/Toolsets/Properties/Properties.tsx` (regular Toolset, `vendorWebsite`).
- [x] 4.6 Mount `VendorWebsiteControl` in `apps/ai-dial-admin/src/components/Assets/Toolsets/View/Properties.tsx` (Asset Toolset, `vendor_website`).

## 5. Tests

- [x] 5.1 Add unit tests for `getErrorForIntro` (`apps/ai-dial-admin/src/utils/validation/tests/intro-error.spec.ts`), mirroring `description-error.spec.ts`'s cases.
- [x] 5.2 Add component tests for `IntroControl` and `VendorWebsiteControl` (render, edit, validation error display, `onChangeEntity`/`onChange` call).
- [x] 5.3 Update/add component tests for `DeploymentProperties.tsx`, `EntityProperties.tsx` (including the Interceptors-only gating), `Toolsets/Properties/Properties.tsx`, `Assets/Apps/Properties.tsx`, and `Assets/Toolsets/View/Properties.tsx` to cover the new field(s) rendering and wiring.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, and full `vitest run` and fix any failures. Lint: clean (0 errors). Format: auto-fixed 2 new test files. Full suite: 6308 passed, 2 failed in `publications-enrichment.spec.ts` — confirmed pre-existing/unrelated (passes in isolation both before and after this change; this change never touches that file's dependencies).
