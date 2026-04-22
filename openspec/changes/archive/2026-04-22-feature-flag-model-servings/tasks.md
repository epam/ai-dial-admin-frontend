## 1. Feature flag plumbing

- [x] 1.1 Add `nimEnabled: boolean` and `hfEnabled: boolean` fields to the `FeatureFlags` interface in `apps/ai-dial-admin/src/models/feature-flags.ts`.
- [x] 1.2 Initialize both fields in `apps/ai-dial-admin/src/app/[lang]/layout.tsx` using `isValueTruthy(process.env.NIM_ENABLED)` and `isValueTruthy(process.env.HF_ENABLED)`.

## 2. UI gating

- [x] 2.1 In `apps/ai-dial-admin/src/components/Containers/List/HeaderButtons.tsx`, update `servingsDropdownItems` (currently lines 63–77) to use the spread-filter pattern so the HF row appears only when `featureFlags.hfEnabled` and the NIM row appears only when `featureFlags.nimEnabled`; add both flags to the `useMemo` dependency array.
- [x] 2.2 In `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx`, wrap the `MenuI18nKey.ModelServings` entry inside the Deployments group (currently lines 102–105) in a spread-filter that includes it only when `featureFlags.nimEnabled || featureFlags.hfEnabled`.

## 3. Route guard

- [x] 3.1 In `apps/ai-dial-admin/src/app/[lang]/model-servings/page.tsx`, read `NIM_ENABLED` and `HF_ENABLED` at the top of the server component and call `redirect('/')` from `next/navigation` when both evaluate falsy, before invoking `getContainers()`.

## 4. Documentation

- [x] 4.1 Add commented `NIM_ENABLED='false'` and `HF_ENABLED='false'` rows to `.env.template` under the existing `# Deployments` section. Do not modify `.env.local`.
- [x] 4.2 Add two rows to the environment-variables table in top-level `README.md` documenting `NIM_ENABLED` and `HF_ENABLED`, placed adjacent to `MCP_REGISTRY_ENABLED` (around lines 90–91) and following the same column format.

## 5. Tests

- [x] 5.1 Update `apps/ai-dial-admin/src/components/Containers/List/tests/HeaderButtons.spec.tsx`: extend the `useAppContext` mock so `featureFlags` includes `nimEnabled` and `hfEnabled`, and add four scenarios for the Model Servings route — both flags on → both rows; only HF on → HF row only; only NIM on → NIM row only; both flags off → neither row appears.
- [x] 5.2 Add a new spec file `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts` that exercises `MENU_CONFIGURATION(iconSize, featureFlags)` directly, asserting the Model Servings item is present when either flag is enabled and absent when both are disabled.
- [x] 5.3 Reuse mocks from `apps/ai-dial-admin/test-setup.tsx` where available; do not introduce `data-testid` attributes.

## 6. Quality checks

- [x] 6.1 Run `npm run lint` from the repository root and fix any issues introduced by the change.
- [x] 6.2 Run `npm run format:write` from the repository root to apply Prettier formatting.
- [x] 6.3 Run `npm run test` from the repository root and confirm all suites pass.
