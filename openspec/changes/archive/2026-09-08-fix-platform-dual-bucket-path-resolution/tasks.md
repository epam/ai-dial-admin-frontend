## 1. Investigation

- [x] 1.1 Grep every read of `.path` on a toolset/application entity under `apps/ai-dial-admin/src/components/Assets/` and `apps/ai-dial-admin/src/utils/` (in addition to `getEntityPath`, `Tools.tsx`, `getToolsetBasicBody` already identified) to confirm no other call site relies on the current bare-name value for a platform-bucket resource.

## 2. Bug A — `flatMetadataFields` platform-bucket path

- [x] 2.1 In `apps/ai-dial-admin/src/server/core/asset-metadata.ts`, change `flatMetadataFields`'s `isDualBucketPlatform` branch to return `path: `${PLATFORM_ROOT_FOLDER}/${name}`` instead of the bare name (`folderId` stays as-is).
- [x] 2.2 Update the two existing tests in `asset-metadata.spec.ts` that assert a bare-name `path` for a platform-bucket resource (`mergeApplicationResource`/`mergeToolsetResource`) to expect `platform/{name}`.
- [x] 2.3 Add/update tests confirming `getEntityPath`'s `AssetsApplications`/`AssetsToolsets` branch (`open-in-new-tab.spec.ts` or equivalent) resolves a platform-bucket entity's delete path to `platform/{name}`, and is unchanged for a public-bucket entity. (Already covered by existing tests at `open-in-new-tab.spec.ts:259-290`, which assert exactly this shape — no gap found.)
- [x] 2.4 ~~Add/update a test for `discoveredTools`/`getAssetTools` (toolset and application) confirming a platform-bucket path now produces `toolsets/platform/{name}`/`applications/platform/{name}` instead of the bucket-less path.~~ **Superseded by 2.6** — that shape turned out to be wrong (see 2.6); the test now added under 2.6 asserts the correct bare-name shape instead.
- [x] 2.5 ~~Add/update a test for `getToolsetBasicBody` confirming the sign-in/sign-out request `url` is `toolsets/platform/{name}` for a platform-bucket toolset.~~ **Superseded by 2.7** — same correction as 2.4.
- [x] 2.6 **Correction:** `ToolSetToolsController`/`ResourceCredentialsController` resolve a platform-bucket `{id}` via `DeploymentService.findDeployment`'s config-store lookup by bare name, not the resource-path parse `getEntityPath`/delete needs — so `ToolsetOpsApi.discoveredTools` must send the bare name (no `platform/` segment, no resource-type prefix) for a platform-bucket path, and the prefixed path only for a public-bucket one. Fixed in `apps/ai-dial-admin/src/server/core/toolset-ops-api.ts`; updated `toolset-ops-api.spec.ts` to assert `/v1/toolset/{name}/tools` (bare) for platform-bucket toolset and application paths.
- [x] 2.7 **Correction:** same fix for `getToolsetBasicBody` (`apps/ai-dial-admin/src/utils/toolset/toolset-auth.ts`) — the sign-in/sign-out `url` for a platform-bucket toolset is now the bare name, with neither the `toolsets/` prefix nor the `platform/` segment. Updated `toolset-auth.spec.ts` accordingly.

## 3. Bug B — OAuth redirect separator

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/Resources/utils.ts`, change `setUrl` to choose `?` when the computed URN has no existing query string and `&` when it does (e.g. check `getUrnForEntity(...).includes('?')`), instead of always appending `&`.
- [x] 3.2 Add/update unit tests for `setUrl` covering a platform-bucket toolset URN (no existing `?`, separator must be `?`) and a public-bucket toolset URN (existing `?path=`, separator stays `&`), matching the shape already tested in `components/Toolsets/Auth/tests/utils.spec.ts`'s `setUrl` suite.

## 4. Quality gate

- [x] 4.1 Run lint, format check, and the full test suite (`npm run test`) from the repo root. (Lint: 0 errors. Format: applied Prettier to touched files after each round of edits. Full suite: flaky timeouts under parallel load in unrelated files each time — `Analytics/QueryBuilder` specs, then `Runs/Compare/ExecutionResultsTab` — every failing file re-run passes cleanly in isolation; all files touched by this change pass every run, 106/106 in isolation on the final round.)
