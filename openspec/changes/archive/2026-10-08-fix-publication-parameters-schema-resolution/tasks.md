## 1. Publication schema-option loading

- [x] 1.1 Update `apps/ai-dial-admin/src/app/[lang]/application-publications/[id]/page.tsx` to load application schemes from the Admin API only when `DIAL_ADMIN_API_URL` is configured, otherwise load Core config schemas, and include platform app runners.
- [x] 1.2 Normalize the publication page's config-schema and platform-runner results through `buildAppRunnerOptions` before passing them to `PublicationView`, preserving option identity, origin, and path.

## 2. Publication resource schema resolution

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Applications/ParametersTab/utils.ts` so an entity carrying `application_type_schema_id` selects its matching runner option before the existing source/editor-based fallback.
- [x] 2.2 Preserve the existing resolver path and existing source-based behavior for application entities without a resource schema ID; remove the current diagnostic logging from `ParametersTab`.

## 3. Automated test coverage

- [x] 3.1 Add server-page tests adjacent to `apps/ai-dial-admin/src/app/[lang]/application-publications/[id]/page.tsx`, modeled on the Assets Applications Admin-API-gating coverage, for configured-Admin and Core-only schema loading and normalized platform-runner options.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/Applications/ParametersTab/tests/utils.spec.ts` with a publication `DialApplicationResource` whose `application_type_schema_id` resolves an available runner, while retaining source-based coverage.
- [x] 3.3 Add or extend `apps/ai-dial-admin/src/components/Applications/ParametersTab/tests/ParametersTab.spec.tsx` to assert that a matching publication resource schema renders the read-only generated configuration form.

Browser verification is deliberately omitted: the user selected unit tests only after being offered the automated `spec-browser-verify` task.

## 4. Quality checks

- [x] 4.1 Run the relevant focused Vitest suites from `apps/ai-dial-admin/`, then run formatting, linting, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite; investigate any change-related failures.
