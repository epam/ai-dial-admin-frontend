## 1. Fix the redirect encoding

- [x] 1.1 In `apps/ai-dial-admin/src/utils/open-in-new-tab.ts`, in `getEntityPath`'s flat platform
  entity branch (`PlatformModels`/`PlatformAppRunners`/`PlatformInterceptors`/`PlatformRoutes`/
  `PlatformRoles`/`PlatformKeys`), change `resolvedName` from
  `name || ($id ? encodeURIComponent($id) : '')` to `name || $id || ''`, so the `$id` fallback
  relies solely on the branch's existing final `encodeURIComponent(resolvedName)` call instead of
  encoding twice.

## 2. Update tests

- [x] 2.1 In `apps/ai-dial-admin/src/utils/tests/open-in-new-tab.spec.ts`, update the App Runner
  `$id`-fallback assertions to expect a single-encoded URL segment (`encodeURIComponent($id)`)
  instead of the doubly-encoded one.
- [x] 2.2 In `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/path-round-trip.spec.ts`,
  update the round-trip expectations for the redirect/detail-page path to single-encoding, and
  verify the corrected chain still resolves to the same Core request path Core actually stores the
  resource under.
- [x] 2.3 In `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/review-fixes.spec.ts`,
  update the "post-create navigation" `describe` block's expectations (`getEntityPath` from `$id`
  alone, and the row-path-vs-$id-path agreement check) to single-encoding.
- [x] 2.4 Add a test asserting the `$id`-branch and `name`-branch of `getEntityPath` produce the
  same URL segment for the same underlying id, so the row-click and post-duplicate-redirect entry
  points can't diverge again.

## 3. Quality checks

- [x] 3.1 Run `npx vitest run src/utils/tests/open-in-new-tab.spec.ts src/components/Assets/Platform/AppRunners/tests/path-round-trip.spec.ts src/components/Assets/Platform/AppRunners/tests/review-fixes.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass.
- [x] 3.2 Run `npm run lint` and `npm run format` and fix any issues.
