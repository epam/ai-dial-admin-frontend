## 1. Toggle component

- [x] 1.1 In `apps/ai-dial-admin/src/components/Common/ConfigFilesToggle/ConfigFilesToggle.tsx`, remove the `featureFlags.adminApiEnabled` early return and rewrite the doc comment for the always-visible behavior (with the admin API on, toggle-off keeps the admin-backend list, toggle-on swaps to the config-file list)
- [x] 1.2 In `apps/ai-dial-admin/src/components/Common/ConfigFilesToggle/tests/ConfigFilesToggle.spec.tsx`, flip the renders-null-when-`adminApiEnabled` assertion to assert the toggle renders, keeping the existing no-flag assertions intact

## 2. Spec

- [x] 2.1 Update the Purpose paragraph in `openspec/specs/config-file-entity-views/spec.md` to drop the "appears only when the admin backend is not configured" wording (the MODIFIED requirement itself folds in from this change's delta at archive)

## 3. Quality checks

- [x] 3.1 Sweep the touched feature's specs (`ConfigFilesToggle`, `ConfigFileListSwap`, `BaseAssetList`, the `PageList` specs, `EntityListView.spec`) for any other assertion that the toggle is hidden when `adminApiEnabled` is `true`, and update them to the new behavior
- [ ] 3.2 Run `npx vitest run src/components/Common/ConfigFilesToggle/tests/ConfigFilesToggle.spec.tsx` from `apps/ai-dial-admin/`, then the full gates: `npm run lint`, `npm run typecheck`, `npm run test`

## 4. Browser verification

No verification task, per the user's decision — the toggle's visibility and swap behavior are covered by the unit/component specs in task 1.2 and 3.1.
