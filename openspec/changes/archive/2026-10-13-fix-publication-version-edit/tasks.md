## 1. Version wiring

- [x] 1.1 In `components/Assets/Apps/Properties.tsx` and `components/Assets/Toolsets/View/Properties.tsx`, keep the `isPublication` VersionControl reading/writing `_metadata.version` (+ `display_version`); drop flat `version` writes
- [x] 1.2 In `components/Publications/Assets/Application/ApplicationDetails.tsx` and `.../Toolset/ToolsetDetails.tsx`, stop rebuilding a flat `path`; pass the edited resource into the publication as-is
- [x] 1.3 Delete `updatePathWithNameAndVersion` from `utils/files/path.ts` and its spec if no caller remains

## 2. Update plan

- [x] 2.1 In `server/publications/update.ts`, build the versioned `targetUrl` from `asset._metadata?.version ?? asset.version`
- [x] 2.2 In `buildUpdatePlan`, for application/toolset puts, return the asset with `_metadata.path` last segment replaced by `{name}__{version}`

## 3. Tests

- [x] 3.1 Update `server/publications/tests` for `buildUpdatePlan`: version from `_metadata`, flat fallback, rewritten `_metadata.path`, versionless types unchanged
- [x] 3.2 Update `ApplicationDetails.spec.tsx`, `ToolsetDetails.spec.tsx`, `ApplicationProperties.spec.tsx`, `ToolsetProperties.spec.tsx` for the `_metadata.version` flow and no flat `path`
- [x] 3.3 Update `path.spec.ts` if the util is removed

## 4. Quality checks

- [x] 4.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite
