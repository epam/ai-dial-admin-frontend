No browser-verification task: the added acceptance scenario is an internal server-action payload contract and does not alter browser-observable behavior. The existing UI scenarios retained in the modified requirement are unchanged.

## 1. Sanitize platform create-map inputs

- [x] 1.1 In `apps/ai-dial-admin/src/components/Assets/BaseAssetList/utils.tsx`, add a shared wrapper for flat platform `CreateAssetActionMap` entries that removes transient `folderId` and `_metadata` before delegating to the server action, preserving all remaining entity content and identity fields.
- [x] 1.2 Apply the wrapper to the Models, App Runners, Catalog Schemas, Interceptors, Translators, Routes, Roles, and Keys entries only; leave the public and `PlatformCreateAssetActionMap` application/toolset entries unchanged.

## 2. Add map-boundary coverage

- [x] 2.1 Add a focused spec beside `apps/ai-dial-admin/src/components/Assets/BaseAssetList/utils.tsx` that mocks every delegated platform create action and verifies each map entry strips `folderId` and `_metadata` while preserving representative content and its required `name` or `$id` identity.

## 3. Quality checks

- [x] 3.1 From `apps/ai-dial-admin/`, run the focused Vitest spec, `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run format`, and the full `npm run test` coverage suite.
