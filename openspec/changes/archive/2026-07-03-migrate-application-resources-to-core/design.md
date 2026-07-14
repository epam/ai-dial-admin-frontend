## Context

`src/app/[lang]/assets-applications/actions.ts` mirrors toolset-resources' CRUD+move shape: `getApps`/`getApp`/`createApp`/`updateApp`/`removeApp`/`bulkDeleteApps`/`moveApps`, plus `getAssetTools` (deferred, see Non-goals) and `importApps`/`exportApps` (deferred). The one structural difference from every other type: the BE's `ApplicationResourceService.fetchApplicationResource` calls `applicationResourceValidityStateOnGetResolver.resolveValidityState(dto)` on every `get`, which:
1. Reads `applicationTypeSchemaId` off the application resource's content.
2. If set, loads the corresponding `ApplicationTypeSchema` — a DB-backed **deployment-config** entity (`ApplicationTypeSchemaService`, JPA-backed, out of scope for the assets→Core migration entirely).
3. Maps that schema to a Core-format JSON-schema string (`ApplicationTypeSchemaCoreMapper`).
4. Validates the application resource's properties against it using `com.epam.aidial.core.config.validation.CustomApplicationConformToTypeSchemaValidator` — a validator from the Core library, not BE-authored code.
5. Returns `{ valid: boolean, message?: string }`, surfaced to the FE as `EntityValidityState.validityState`.

This has zero FE precedent: nothing in the FE today runs JSON-schema conformance validation, and the schema source (`ApplicationTypeSchema`) is a config-side DB entity this migration's architecture explicitly excludes (see the deployment-config-vs-asset-resource split established when this migration was scoped). Porting it correctly requires picking a JS/TS JSON-schema validator, confirming it can consume the Core-mapped schema format, and reproducing the DB lookup path — real, standalone work, not a byproduct of the client this change already depends on.

## Goals / Non-Goals

**Goals**
- `getApps`, `createApp`, `getApp`, `updateApp`, `removeApp`, `bulkDeleteApps`, `moveApps` call the Core application-resource client instead of `assetsApi`.
- `validityState` is still present and correct in `get`/`getApps` responses — sourced from the admin BE rather than recomputed.
- Preserve conditional-header semantics (create → `If-None-Match: *`, update/delete → `If-Match`).
- Zero change to `Apps/List`/`Apps/View`, `AssetApp`, or routes.
- Apply the create/update field-validation parity fix from `add-core-asset-client`'s D6.

**Non-Goals**
- Porting `ApplicationResourceValidityStateOnGetResolver` end-to-end — Phase 2, per the user's explicit decision to phase this rather than port the validator now.
- Import/export/zip-preview, discovered-tools — deferred fast-follow.
- Building any client/mapper logic — owned by `add-core-asset-client`.
- Folders/rules.

## Decisions

### D1 — `validityState` sourced by calling the still-alive BE `get` endpoint, response otherwise discarded
No standalone "just give me the validityState" BE endpoint exists — it's computed inline inside the BE's full `get`. Rather than asking the (deprecating, frozen) BE for a new endpoint, this change calls the existing BE `get` (`assetsApi.getAsset`/`getAssetWithEtag` for `ResourceType.APPLICATION`) purely to read its `validityState` field, and merges that single field onto the Core-sourced content+metadata result. The rest of the BE response is discarded. This is deliberately wasteful (a full redundant fetch) but requires zero BE changes and zero new client code beyond what already exists — acceptable for a Phase 1 seam that Phase 2 removes entirely.

**Alternative considered**: skip the extra BE call and default `validityState` to `{ valid: true }` until Phase 2. Rejected — this would silently hide real schema-conformance errors from admins reviewing application resources, a user-visible regression, not just an internal implementation gap.

### D2 — Hard cutover for everything except `validityState`
Every other operation (list, create, update, delete, bulk-delete, move) and the content+metadata portion of `get` call Core unconditionally, no flag. `validityState` is the one explicit, called-out exception (D1) — not a general fallback path.

### D3 — `getApp`'s list-then-filter path resolution is preserved (same reasoning as prompts' D2 / toolsets' D3)
Kept for the same reason: the returned `path` field is guaranteed correct; hand-building it risks an encoding mismatch with no fixture to catch it here. Since `getApps` (the list call within `getApp`) is now Core-backed, this list-then-filter itself moves to Core; only the final single-resource fetch also needs the BE-`validityState` merge from D1.

### D4 — Create/update field-validation parity (from `add-core-asset-client` D6) is applied here
`add-core-asset-client` built shared validation for `viewerUrl`/`editorUrl`/`maxInputAttachments` usable by both create and update payloads. This change is the first (and only, currently) consumer — `createApp`/`updateApp` both run it, closing the BE's known create-only validation gap for real, user-visible payloads.

## Risks / Trade-offs

- **[Risk] `validityState` staleness or mismatch**: the BE `get` call (D1) fetches the resource independently of the Core `get` — if the two reads race with a concurrent write, `validityState` could reflect a different version than the content shown. → **Mitigation**: acceptable, low-probability window already implicit in any two-step read; Phase 2 removes the double-read entirely. Not worth added complexity (e.g. etag cross-checking) for a temporary seam.
- **[Trade-off] Redundant BE call for `validityState` costs latency** on every `get`/`getApps` call. → **Mitigation**: accepted as the deliberate cost of deferring the JSON-schema-validator port; revisit only if it proves user-visibly slow before Phase 2 lands.
- **[Risk] Phase 2 scope creep if deferred indefinitely** — like publications' Phase 1/2 split, there's a risk this seam becomes permanent. → **Mitigation**: called out explicitly in Non-goals as a tracked follow-up, same accountability pattern as `migrate-publications-enrichment-to-core`.

## Migration Plan

1. Confirm `add-core-asset-client` has landed; read its application-resource client, mapper, and D6 shared-validation exports.
2. Swap the seven CRUD+move `assetsApi` calls in `assets-applications/actions.ts` for the Core client.
3. Add the `validityState` BE-fetch-and-merge step (D1) to `getApp` and `getApps`.
4. Apply D6's shared validation to `createApp`/`updateApp` payloads.
5. Update `assets-applications/actions.spec.ts` to mock both the Core client and the scoped BE `validityState` call.
6. Track "port `ApplicationResourceValidityStateOnGetResolver`" as the acceptance bar for the Phase 2 follow-up.

## Open Questions

- Which JS/TS JSON-schema validator (e.g. `ajv`) the Phase 2 follow-up should adopt, and whether the Core-mapped schema format needs a translation step to be consumable by it — explicitly deferred, not resolved here.
