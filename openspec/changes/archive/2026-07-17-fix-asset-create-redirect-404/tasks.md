## 1. Normalize the write response

- [x] 1.1 In `AssetApi.put` (`src/server/core/asset-api.ts`), on a successful `putAction` result, parse the `path` argument with `parseVersionedPath` and merge `{ path, folderId, name, version }` onto `response`; leave failure results untouched.
- [x] 1.2 Keep existing Core-format response fields (`name`, `url`, etc.) intact — admin fields are added, not replaced.
- [x] 1.3 Guard the parse against a slashless path (`ROOT_FOLDER` = `'public'` with no trailing slash): if `parseVersionedPath` cannot parse, return the successful response unchanged rather than throwing.

## 2. Tests

- [x] 2.1 Unit test `AssetApi.put`: successful write resolves with `path`/`folderId`/`name`/`version` derived from the written path (versioned and unversioned cases).
- [x] 2.2 Unit test: a slashless path (e.g. `publicName`) does not throw — resolves with the response unchanged.
- [x] 2.3 Unit test: a failed `put` returns the error response unchanged (no path fields added).
- [x] 2.4 Component/redirect test: `CreateAsset.onSubmit` for the MCP-container → Asset Toolset flow pushes a valid `/assets-toolsets/<name>?path=<encoded path>` URL (no `undefined` segments).

## 3. Verification

- [x] 3.1 Manual/gate: MCP containers → open running container → Create → Asset Toolset → fill required fields → Create → redirected to the new toolset detail page, no 404. **Verified — works.**
- [x] 3.2 Regression check (no behavior change expected): assets-toolsets list create/duplicate and assets-applications create still redirect correctly — these build the redirect from local form data, so confirm the `put` change doesn't disturb them. **Verified — works.**
