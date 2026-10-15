## 1. Upstream authentication configuration

- [x] 1.1 Add the Core-aligned `UpstreamAuthType` enum and optional `authType` field to `apps/ai-dial-admin/src/models/dial/model.ts`, with i18n labels in `src/constants/i18n.ts` and `src/locales/en.ts`.
- [x] 1.2 Extend `src/components/UpstreamEndpoints/UpstreamEndpoints.tsx` and `Endpoint/Endpoint.tsx` with an explicit opt-in for route upstream authentication, rendering the accessible `API_KEY`/`BEARER` selector only when enabled and enforcing key validation only for new or newly converted Bearer upstreams.
- [x] 1.3 Enable the upstream-authentication opt-in only from `src/components/Assets/Platform/Routes/Properties.tsx`; keep all entity, platform-model, application, and App Runner callers unchanged.

## 2. Platform route persistence and duplication

- [x] 2.1 Normalize route create and update payloads in `src/app/[lang]/platform-routes/actions.ts` with `stripEmptyUpstreamSecrets`, preserving non-empty replacement keys while omitting empty write-only secrets.
- [x] 2.2 Extend `src/components/Assets/Modals/DuplicatePlatformAsset.tsx` so a platform route with Bearer upstreams collects one replacement password value per upstream, keeps submission disabled until all required values are present, and injects only those supplied values into the clone before invoking `onDuplicate`.
- [x] 2.3 Update `src/components/Assets/BaseAssetList/BaseAssetList.tsx` only as needed to preserve the existing success-only redirect contract and surface failed duplicate responses without navigation.

## 3. Automated coverage

- [x] 3.1 Extend `src/components/UpstreamEndpoints/Endpoint/Endpoint.spec.tsx` to cover the platform-route-only selector, Core default rendering, Bearer key validation, and unchanged hidden Bearer-key behavior.
- [x] 3.2 Extend `src/components/Assets/Modals/tests/DuplicatePlatformAsset.spec.tsx` to cover required replacement-key fields, secret-free initial state, disabled duplicate submission, and the cloned Bearer payload.
- [x] 3.3 Add or extend focused `BaseAssetList` duplicate-flow tests to assert Core rejection displays an error and does not redirect, while a successful duplicate still redirects.
- [x] 3.4 Extend `src/app/[lang]/platform-routes/actions.spec.ts` and `src/utils/models/tests/upstream-secrets.spec.ts` to verify platform-route create/update omit empty secrets and retain non-empty replacement keys.

> Automated browser verification was offered for the browser-observable route-editor and duplicate scenarios and was declined; component and server-action coverage above will verify them.

## 4. Final quality checks

- [x] 4.1 Run the focused Vitest files for the upstream editor, duplicate modal/list flow, route actions, and upstream-secret utility from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` from `apps/ai-dial-admin/`; resolve any failures caused by this change.
