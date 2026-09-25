## 1. Config-file asset navigation

- [x] 1.1 Update `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx` to append the `configFile=true` marker with `appendUrlQuery` in both details navigation and the action-menu new-tab path.

## 2. Regression coverage

- [x] 2.1 Add focused tests for BaseAssetList config-file versioned application/toolset rows that verify same-tab and modifier-click detail navigation retains `?path=` and appends `&configFile=true`.
- [x] 2.2 Add a focused BaseAssetList test that verifies the action-menu new-tab callback opens the same corrected URL.

## 3. Verification

- [x] 3.1 Run the focused BaseAssetList tests from `apps/ai-dial-admin/`.
- [x] 3.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` suite.

No browser-verification task is included because the user declined the optional automated Playwright verification task for the browser-observable navigation scenarios.
