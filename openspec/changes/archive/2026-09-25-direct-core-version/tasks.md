## 1. Direct Core version API

- [x] 1.1 Add the authenticated plain-text `GET /version` client method to `apps/ai-dial-admin/src/server/core/core-utility-api.ts`, returning the current Core version or `null` on failure.
- [x] 1.2 Extend `apps/ai-dial-admin/src/server/core/tests/core-utility-api.spec.ts` to verify the direct Core URL, token-backed request contract, plain-text result, and request-failure fallback.

## 2. Core-version action selection

- [x] 2.1 Update `apps/ai-dial-admin/src/app/actions.ts` so `getCoreVersions` preserves the Admin-backend client when `DIAL_ADMIN_API_URL` exists and otherwise adapts the direct Core version into `CoreVersions.autoDetectedVersion`.
- [x] 2.2 Update `apps/ai-dial-admin/src/app/actions.spec.ts` to cover both deployment configurations, including the direct-Core failure response.

## 3. Core-only footer refresh

- [x] 3.1 Update `apps/ai-dial-admin/src/components/Content/Content.tsx` so Core-version polling also runs without the Admin API, while backend-version and process-status polling remain Admin-only.
- [x] 3.2 Update `apps/ai-dial-admin/src/components/Content/Content.spec.tsx` and `apps/ai-dial-admin/src/components/Footer/tests/Footer.spec.tsx` as needed to cover Core-only version rendering, refresh behavior, and the absence of Admin-only version controls.

## 4. Verification

- [x] 4.1 Run targeted Vitest files for the Core utility API, app actions, Content, and Footer from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` suite.

No browser-verification task is included because the user declined the optional automated Playwright verification task for the browser-observable footer scenarios.
