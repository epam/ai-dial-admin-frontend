## 1. Reference-form helpers

- [x] 1.1 Make `getConfigEntityReference` (`utils/config-entities/options.ts`) type-aware: for the five short-name-keyed types (Models, Interceptors, Roles, Applications, Toolsets) return `option.name` regardless of origin; for Routes and Keys keep the existing origin branch (ConfigFile → bare name, Api → `{type}/platform/{name}`). Introduce an explicit `SHORT_NAME_KEYED` set mirroring Core's `isShortNameKeyed`.
- [x] 1.2 Change `getModelDeploymentId` (`utils/models/deployment-id.ts`) to return the bare name (`name ?? ''`), dropping the `MODELS_PREFIX` composition.

## 2. Merge collapse

- [x] 2.1 Change `unionConfigEntityOptions` (`utils/config-entities/options.ts`) so a name present in both populations yields a single API-written (platform) option; drop the config-file duplicate. Duplicates within one population stay collapsed; partial-failure degradation is unchanged. The `origin` discriminator is still carried on the surviving option.

## 3. Consumer audit

- [x] 3.1 Audit prefix-parsing consumers for stored dependency references this change alters: `utils/deployment-navigation.ts`, `server/publications/resolver/registry.ts`, `components/Applications/ParametersTab/utils.ts`, `utils/toolset/toolset-auth.ts`. For each, determine whether it parses a stored interceptor/role/model/application/toolset dependency reference (update it) or a blob-storage resource path (leave it). Record the finding.
      - **Finding:** all four parse blob-storage resource paths (`applications/{path}`, `toolsets/{path}` via the resource `.path` field), not stored `Config` dependency references. None altered by this change; no updates needed.
- [x] 3.2 Check the entity interceptor-attach path (`mergeInterceptorOrigins` in `components/EntityView/Interceptors/utils.ts` and its callers in `Interceptors.tsx` / `CollapsableInterceptors.tsx`) for whether an `Asset`-origin interceptor is stored by canonical id; if so, store the bare name there too.
      - **Finding:** `Interceptors.tsx` stores `i.name` on attach. Asset interceptors come from `assetApi.list` → `mergeInterceptorResource` → `flatMetadataFields` → `parseEncodedFlatPath(metadata.url, prefix)`, which sets `name` to the **bare name** and `path` to the full `interceptors/platform/…` form. So the entity path already stores the bare name and is correct under the new keying; no change needed.

## 4. Tests

- [x] 4.1 Update `utils/config-entities/tests/options.spec.ts`: the "two distinguishable options on collision" and "canonical id for API-written" assertions flip to bare-name / single-platform-option semantics; add route and key cases preserving canonical-id form for API origin.
- [x] 4.2 Update `utils/models/tests/deployment-id.spec.ts` to expect the bare name.
- [x] 4.3 Update `utils/config-entities/tests/rows.spec.ts` (`interceptors/platform/from-api` → `from-api`).
- [x] 4.4 Run the full suite from `apps/ai-dial-admin/` as the final gate: `npx vitest run --coverage`. Confirm the coverage threshold is not regressed and lint passes.
      - **Result:** 903 test files passed (10179 tests), 0 failures, exit 0 — coverage gate held. Lint: the touched files are clean; the one remaining lint error is pre-existing in `src/app/error.tsx` (not touched by this change).

## 5. Notes

No spec-browser-verify task is included: the user opted for unit-test coverage only. The unit tests in group 4 cover the changed reference-form and merge-collapse logic directly; browser-observable behavior (picker row count, model detail identifier) flows from that logic and is not separately gated against a live stack.
