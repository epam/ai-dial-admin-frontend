## 1. Establish the Core contract before building on it

- [x] 1.1 ~~Read the endpoint against a live DIAL Core~~ — **not possible, and answered from source instead.** Core's auth is server-side only: the app's session exposes no access token (`/api/auth/session` returns `user`/`expires`/`providerId`) and a direct browser fetch to Core is cross-origin (`TypeError: Failed to fetch`), so no call can be made before the client exists. `FileConfigController` was read at the pinned commit instead, which answered both questions more precisely than one sample response would.
- [x] 1.2 Record the answers in design.md's Open Questions. **Done, and one answer invalidated a design assumption** — see 1.4.
- [x] 1.3 ~~Confirm the current admin-backend behaviour in the browser before changing it~~ — **dropped as unnecessary.** This was scoped as a contract check, and the contract came from source instead (1.1). What remains is a data question — which entities this deployment defines in its config file versus through the API — and that is answered by using the built client against real data, not by a before-snapshot. Equality with the old admin-BE list was never the success criterion: the point of the change is that the two sources are deliberately different populations.
- [x] 1.4 **Contract finding that changes the plan.** The config-file listing returns `{"items":[{"name":"..."}]}` — names only, with no pagination. The metadata route returns `ResourceItemMetadata` with author and timestamps. The pickers render Display Name and Description columns, so config-file rows have no description available without a per-entity GET per name. Resolved by normalising the union down to name + origin rather than paying that N+1; recorded as a decision in design.md and as a requirement in the `core-config-file-client` spec. Anyone implementing section 3 should read that decision before writing the row model.

## 2. Core config-file client

- [x] 2.1 Add a read-only client for `GET /v1/admin/config/file/{type}[/{name}]` under `src/server/core/`, authenticating through the existing Core client pipeline, alongside `assetApi` rather than inside it — the family is read-only and not bucket-scoped, so modelling it as a `ResourceType` would give `AssetApi` a type it must refuse to write.
- [x] 2.2 Constrain the client to an explicit allow-list of readable types. `keys` is refused by Core for every caller including admin, so a client deriving its types from the route pattern would appear to support it and fail at runtime.
- [x] 2.3 Make a refused or failed read distinguishable from a successful empty list, so a caller cannot mistake "forbidden" for "none defined".
- [x] 2.4 Register `INTERCEPTOR` and `ROLE` for the metadata half of the union in `src/types/resource-type.ts` and `src/constants/assets-core.ts`, following how `MODEL` and `APP_TYPE_SCHEMA` are registered.

## 3. Union helper

- [x] 3.1 Add a pure helper composing the two populations of one entity type into one option list: API-written entries from the metadata route, config-file entries from the client in section 2. Normalise to name + origin only — the config-file listing carries nothing else, and filling the gap would cost a request per entry (see 1.4).
- [x] 3.2 Attach an origin discriminator to every option as data — an enum per the repo's enums-over-unions rule — and derive the reference form from it. Do not infer origin from whether a value contains a separator; a name may legitimately contain one, and Issue #4078 hit exactly this on the runner picker.
- [x] 3.3 Derive the stored reference per origin: bare name for a config-file entity, canonical id (`{type}/platform/{name}`) for an API-written one. Define both in one place so the write and the reverse lookup cannot disagree.
- [x] 3.4 Keep both entries when a name exists in both populations, each labelled with its origin; collapse duplicates only within a single population. Collapsing across populations would make the stored reference ambiguous, since Core resolves the two forms as different keys.
- [x] 3.5 Return the surviving population when one read fails, and report the failure — never silently reduce the option set. Return a failure only when both fail.

## 4. Interceptors tab

- [x] 4.1 Replace the `interceptorsApi.getInterceptorsList` read in `src/app/[lang]/assets-app-runners/[id]/page.tsx` with the Core union from section 3.
- [x] 4.2 Move the global-interceptor read in `src/components/EntityView/Interceptors/Interceptors.tsx` off `getProperties` → `utilityApi.getSystemProperties` and onto Core's settings pair (`/v1/settings/platform/global` plus the config-file settings entry), scoped to this surface only.
- [x] 4.3 Confirm the selection still round-trips in `dial:applicationTypeInterceptors` and that a selection saved before the change reads back unchanged — a config-file interceptor was already referenced by bare name, which is the form this change continues to write for that population.

## 5. Per-route role options

- [x] 5.1 Replace the `rolesApi.getRolesList` read in the app-runner detail route with the Core union. This is the read the earlier audit missed; it feeds `TabsContent` → `EntityRoutes` → `RouteRoles`.
- [x] 5.2 Stop `RouteRoles` hiding a granted role that the option list does not contain. It currently intersects a route's `roleLimits` keys with the fetched list, so a failed read or a config-file-defined role makes existing grants disappear from a permissions surface — the same defect found and fixed on the models Roles tab.

## 6. Topics

- [x] 6.1 Stop the topics catalogue read on this surface. The path is `Assets/AppRunners/Properties.tsx` → `SchemeProperties` → `AppRunnerExtendedProperties` → `TopicsControl`, and `TopicsControl` receives no `view` prop there — so a `view`-based gate alone will not work, unlike on the models side.
- [x] 6.2 Leave `Entities > Application Runners` unaffected. It shares `SchemeProperties`, so whichever mechanism carries the decision must not reach that path.
- [x] 6.3 Confirm topics remain addable by typed entry and still persist, since the control already seeds from the resource.
- [x] 6.4 **Scope note, added during implementation.** The gate is one predicate keyed on the view (`hasTopicCatalogue`), and it covers `Assets > Models` as well as `Assets > App Runners` — so this change also stops the catalogue fetch on the models surface. That was a Non-Goal as written. Gating only the runner view would have left an identical admin-BE dependency one line away, for a catalogue Core has no equivalent of. Recorded as an added Goal in design.md; the `assets-models` capability spec should absorb the requirement when that surface's own unlink lands.

## 7. Spec correction

- [x] 7.1 Apply the delta in `specs/assets-app-runners/spec.md`: the requirement asserting admin-BE interceptor sourcing is removed and replaced, and the surface's Core-direct claim is stated with its actual scope.

## 8. Tests

- [x] 8.1 Unit tests for the union helper: both populations present; a name in both yielding two distinguishable options; duplicates within one population collapsed; each single-source failure returning the survivor plus a reported error; both failing returning a failure.
- [x] 8.2 Unit tests for the reference forms, asserting the exact stored string rather than comparing against the helper that produced it — a wrong form produces a valid-looking save that Core rejects, so the assertion must be independent of the code under test.
- [x] 8.3 Unit test that a name containing a separator is not mistaken for a canonical id.
- [x] 8.4 Unit test the config-file client's allow-list: a non-readable type is refused before a request is issued.
- [x] 8.5 Component test that a granted route role absent from the option list is still displayed.
- [x] 8.6 Component tests that no admin-backend read is required for the interceptor, role and topic controls on this surface — driving the interaction that triggers the fetch, not just rendering. These components fetch lazily when their picker opens, so a render-only assertion passes whether or not the dependency exists; the models change shipped two vacuous tests for exactly this reason before it was caught.
- [x] 8.7 Component tests that an admin-backend-backed entity surface still reads its interceptor, role and topic lists as before — the positive controls that make 8.6's negative assertions meaningful.

## 9. Quality checks

- [x] 9.1 Run lint, format check, and the full test suite from `apps/ai-dial-admin/`; fix any failures. **Done:** lint 0 errors (32 pre-existing warnings), prettier clean, full suite 7313 passed / 0 failed / 4 pre-existing skips.
