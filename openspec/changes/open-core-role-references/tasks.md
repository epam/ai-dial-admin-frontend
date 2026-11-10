## 1. Resolve role references

- [x] 1.1 In `src/app/[lang]/platform-roles/[id]/page.tsx` and its role actions or a role-scoped server resolver, distinguish a confirmed platform content 404 from authorization, service, transport and metadata failures without changing other `assetApi.getMergedWithEtag` callers.
- [x] 1.2 Resolve unqualified role names platform-first, fall back to `getConfigFileRole` only on confirmed platform absence, and render with the actual source flag and platform ETag; preserve explicit `configFile=true` file-only reads and existing file-root URLs.
- [x] 1.3 Route confirmed absence to not-found and surface other lookup failures through the established server error presentation; normalize encoded role names consistently and preserve role-view read-only cleanup and model-option warnings.

## 2. Add Core role navigation

- [x] 2.1 Update `src/components/Assets/Platform/Keys/KeyRoles.tsx` and `src/components/EntityView/Roles/AssetRoles.tsx` to offer the existing localized open-in-new-tab operation for every displayed Core role, including read-only and unrestricted views, while preserving mutation permissions.
- [x] 2.2 Pass explicit Core-versus-admin-backend context from `src/components/Assets/ObjectAppRoutes/ObjectAppRoutes.tsx` and other Core-backed callers through `src/components/EntityView/AppRoute/Content/RouteContent.tsx` to `RouteRoles.tsx`; open Core references via `ApplicationRoute.PlatformRoles` and preserve legacy `/roles` navigation even with empty or partial role options.
- [x] 2.3 Reuse `src/utils/open-in-new-tab.ts` for unqualified role URLs, ensuring a name-only synthetic row and supported reserved characters are handled correctly without changing role membership.

## 3. Unit tests

- [x] 3.1 Add role resolver/page and action tests for platform-only, file-only, duplicate names, both absent, explicit file mode, ETag and read-only source, plus 401/403, 5xx, network/cancellation, malformed or missing-status responses, and successful content with failed metadata; verify errors never trigger an unsafe fallback.
- [x] 3.2 Add or update `KeyRoles` and `AssetRoles` tests for open action targets and callbacks, synthetic name-only rows, editable/read-only/unrestricted states, and unchanged remove behavior; cover the shared consumers for models, routes, routers, applications and toolsets.
- [x] 3.3 Update embedded route-role and owning-component tests for Core application and app-runner routes with complete, partial and empty option lists, and for unchanged admin-backend role navigation; cover supported reserved-character URL round trips.
- [x] 3.4 Extend `src/components/Assets/Platform/Roles/tests/View.spec.tsx` as needed to cover file-source mutation controls, hidden format selector, cleanup and subsequent platform editability; reuse centralized mocks in `apps/ai-dial-admin/test-setup.tsx` and use accessible role/name queries.

## 4. Final quality checks

- [ ] 4.1 Run targeted tests from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` coverage gate; report any failures or skipped gates.
