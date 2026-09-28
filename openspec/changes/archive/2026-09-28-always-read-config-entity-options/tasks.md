## 1. Config-file option reads

- [x] 1.1 Update `apps/ai-dial-admin/src/server/config-entities/read.ts` so `getConfigEntityOptions` always invokes `configFileApi.listNames` when composing picker options, without consulting `DIAL_ADMIN_API_URL`.

## 2. Automated coverage

- [x] 2.1 Add focused unit coverage for `getConfigEntityOptions` showing that an unset `DIAL_ADMIN_API_URL` still invokes the config-file listing and includes its successful results in the union.
- [x] 2.2 Preserve or add coverage that a config-file listing failure without `DIAL_ADMIN_API_URL` is reported as a partial failure while the API-written population remains available.

## 3. Quality checks

- [x] 3.1 Run the focused config-entity unit tests, `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, and `npm run format`.

> No browser-verification task is needed: every acceptance scenario covers server-side Core reads and their returned result, not browser-observable UI state.
