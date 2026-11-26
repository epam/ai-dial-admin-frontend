## 1. Confirm the assumptions the group changes rely on

- [x] 1.1 Re-run the `AssetApi` caller audit: list every `ResourceType` each caller passes (`app/[lang]/*/actions.ts`, `server/assets/*`, `server/folders/*`, `server/*/exim.ts`, `app/api/api.ts` `EnrichmentClients`) and record the type-to-group table in `design.md` if it differs from the proposal
- [x] 1.2 Confirm each SDK operation named in the design exists in `@epam/ai-dial-typescript-sdk ^0.3.1` (re-checked 2026-11-26) for every type in groups 1-5 (content get, metadata get, save, delete), and note any type with a missing verb before its group change is written

## 2. Write the group changes, one per PR

Tick each item when that group's PR is merged, not when its change is drafted.

- [ ] 2.1 `core-sdk-assets-seam`: op table, `AssetApi` routing with fallback, DELETE adapter fix (#5642), `Partial` URL maps with a guarded lookup (and the `FILE`-unreachable comment fix), encoded-path fixture spec (including an empty path and a trailing `/`), 304 equivalence and literal-envelope spec, `MODEL`, MODIFIED `core-client` requirement
- [ ] 2.2 `core-sdk-assets-platform-config`: `ROUTER`, `ROLE` (read and write; fix the stale `ResourceType.ROLE` comment), `ROUTE`, `PROJECT_KEY`, `INTERCEPTOR`, `TRANSLATOR`, `PLUGIN` (SDK ops new in 0.3.1; its `platform-plugins` actions are the caller), `APP_TYPE_SCHEMA`, `CATALOG_SCHEMA`
- [ ] 2.3 `core-sdk-assets-policies`: `POLICY`, `POLICY_ASSIGNMENT` (platform bucket with one folder level, the cost object)
- [ ] 2.4 `core-sdk-assets-folder-nested`: `PROMPT`, `CONVERSATION`, `ALIAS` (versionless, folder-nested, prompt `id` injection kept; D4 bucket split with old-vs-new URL assertions for an omitted path, a bare bucket and a nested folder)
- [ ] 2.5 `core-sdk-assets-versioned`: `APPLICATION`, `TOOLSET` (platform vs custom dispatch, D7 spec and data-flow check), `moveResource`, and deleting both URL maps and the URL fallback (D6)
- [ ] 2.6 Each group change: deletes its URL entries from `CORE_RESOURCE_URL` / `CORE_RESOURCE_METADATA_URL` and the admin DTOs that only duplicate its SDK content type; audits its callers for a `null` versus `undefined` branch (D9); MODIFIES `core-client` "Calls the SDK cannot express stay on the hand-written client" by copying the whole block, extending the list and keeping every scenario name; and its `tasks.md` has a dedicated unit-test task and ends with the gate task in 4.1

## 3. Follow-ups and close-out

- [x] 3.1 Record the out-of-scope clients (`ConfigFileApi`, `CatalogSchemasApi`, `AppRunnerSchemaApi`, `ComplexResourceCoreApi`) in `design.md` or an issue draft the user can file, so the epic does not drop them silently
- [ ] 3.2 Archive this umbrella change with the last group change (`openspec archive core-sdk-assets --yes`), once the follow-up issue for the 3.1 clients exists (filed by the user)
- [x] 3.3 No browser-verification task is added to any group: every scenario's THEN is a request URL, a body, an envelope or a resolved value, not UI state. A group that adds a UI-observable scenario asks first

## 4. Gates

This change adds no code, so it has no gate of its own; 4.1 is the gate every group change copies as its final task (2.6).

- 4.1 Each group change runs, from `apps/ai-dial-admin/`: targeted `npx vitest run <file>`, `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run lint:specs` and `npx prettier --check <touched files>`; the full `npm run test` last in the background (rerun `EditableCellRenderer.spec.tsx`, `RequestsSidebar.spec.tsx` and `publications-enrichment.spec.ts` alone before treating a failure as real)
