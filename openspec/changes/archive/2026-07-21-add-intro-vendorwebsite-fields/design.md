## Context

`intro` and `vendorWebsite` are already fully modeled on both backend services (admin-BE's plain and resource DTOs, and DIAL Core's `Deployment`/`ToolSet` config + `Data` classes — confirmed by direct inspection of `ai-dial-admin-backend` and `ai-dial-core`) but do not exist anywhere in the frontend: no TS field, no i18n key, no form control. There is no DTO/adapter layer between backend JSON and the frontend's TS interfaces for the regular (admin-BE) entities — the interfaces are the wire types, and `onChangeEntity` spreads (`{...entity, field: x}`) carry values straight to save. For asset entities (`AssetApp`, `AssetToolset`), the frontend is mid-migration to calling DIAL Core directly via a shared `AssetApi`/`core-asset-client`, replacing the admin-BE resource proxy — this migration already has its own capability specs (`application-resources-core-api`, `toolset-resources-core-api`, `core-asset-client`).

The existing `description` field is the exact template to follow: `BaseEntity.description` → `getErrorForDescription()` validator → generic `DescriptionControl<T extends {description?: string}>` → mounted once in each of the two shared properties components (`DeploymentProperties.tsx` for Model/Application/Toolset, `EntityProperties.tsx` for Interceptor).

## Goals / Non-Goals

**Goals:**
- Add `intro` as a generic, reusable field on `BaseEntity`, following the `description` pattern exactly, so Model/Application/Interceptor/Toolset all get it "for free" through the two shared properties components.
- Add `vendorWebsite` as a Toolset-only field, following the URL-format validation pattern already used for `viewerUrl`/`editorUrl`.
- Make both fields work identically for regular entities (admin-BE-backed) and asset entities (Core-direct via `AssetApi`) — same UI control, same validation, different save/load plumbing underneath.
- Keep both fields optional and additive; no migration of existing data needed.

**Non-Goals:**
- No backend changes — both fields already exist on every backend layer.
- Not fixing the separately-discovered orphaned fields (`Toolset.provider`, `DialApplication.viewerUrl`/`editorUrl` gaps, if any) beyond what's needed to reuse their patterns as a reference — that's a separate concern if real, out of scope here. Correction: `viewerUrl`/`editorUrl` do have controls (`BaseControls/Endpoint/ViewerUrl.tsx`, `EditorUrl.tsx`) — these are used directly as the validation/control template for `vendorWebsite`, not evidence of a gap.
- Not changing `validityState`, import/export shapes, or any other field already covered by the `application-resources-core-api` / `toolset-resources-core-api` specs beyond adding `intro`/`vendorWebsite` to the content mapping.

## Decisions

**`intro` lives on `BaseEntity`, not per-entity.** Same rationale as `description`: all four entity types share it, and the two shared properties components (`DeploymentProperties.tsx`, `EntityProperties.tsx`) are the single mount point. Adding it once at the base avoids four separate additions and four separate places that could drift.

**`vendorWebsite` lives directly on `Toolset` (and `AssetToolset`), not on a shared base.** It's Toolset-only per both backend models (`ToolSetDto`/`ToolSetResourceDto` in admin-BE, `ToolSet.java` in Core) — no Application/Model/Interceptor equivalent exists. Putting it on `BaseEntity` would be speculative generality for entities that will never use it, which the project's own conventions and CLAUDE.md caution against.

**Reuse `EndpointControl` validation for `vendorWebsite`.** `ViewerUrl.tsx`/`EditorUrl.tsx` already wrap a shared `EndpointControl` (`BaseControls/Endpoint/Endpoint.tsx`) with endpoint-format validation. `vendorWebsite` is a plain external URL (a vendor's marketing/info site), not a DIAL endpoint, so validation should be a simpler "well-formed URL" check rather than the DIAL-endpoint-specific format `EndpointControl` enforces — reuse its *component structure* (label/placeholder wiring, error display) but back it with a new, simpler URL validator, not the endpoint-format one.

**Asset entities get the fields through `AssetApi`'s mapper, not a separate code path.** Since `AssetApp`/`AssetToolset` extend `DialApplication`/`Toolset`, they inherit the new `intro`/`vendorWebsite` TS fields automatically once added to the base types. The only additional work for assets is confirming `asset-api.ts`'s content/metadata merge (per `apps/ai-dial-admin/src/server/core/asset-api.ts` and the per-type mappers referenced by `application-resources-core-api`/`toolset-resources-core-api`) doesn't drop unknown/new fields — if it does a fixed-shape pick/whitelist rather than a spread, both fields need to be added to that whitelist explicitly. This needs to be confirmed against the actual mapper code during implementation (flagged as an Open Question below), since the exploration to date was backend-focused and didn't inspect `asset-api.ts`'s field-level mapping logic.

**Same UI control reused for both regular and asset variants.** `IntroControl`/`VendorWebsiteControl` are generic over `{ intro?: string }`/`{ vendorWebsite?: string }` (like `DescriptionControl<T extends {description?: string}>`), so the same component instance mounts in `Toolsets/Properties/Properties.tsx` (regular) and `Assets/Toolsets/Properties/Properties.tsx` (asset) without duplication.

## Risks / Trade-offs

- **Shared-component blast radius**: `DeploymentProperties.tsx` and `EntityProperties.tsx` are used by Model, Application, Toolset, and Interceptor respectively — a mistake in the shared `IntroControl` mount affects all of them at once. → Mitigation: test all four regular-entity views plus both asset views after the change; keep the control itself dumb/generic so entity-specific logic never leaks into it.
- **Asset mapper may silently drop new fields** if `asset-api.ts` does explicit field selection rather than a spread. → Mitigation: confirm this during implementation (see Open Questions) before assuming the asset-side fix is "just a form control."
- **`vendorWebsite` validation scope creep**: reusing `EndpointControl`'s DIAL-endpoint validation would incorrectly reject valid external vendor URLs (e.g. URLs without DIAL's expected path conventions). → Mitigation: use a plain URL-format validator, not the DIAL endpoint validator, even though the *component* is modeled on `EndpointControl`.

## Open Questions — resolved during implementation

- **Asset mapper field handling**: `asset-metadata.ts`'s `mergeApplicationResource`/`mergeToolsetResource` both do `{...content, ...metadataFields(...)}` — a full spread, no whitelist. New content fields (`intro`, `vendor_website`) pass through automatically; no mapper changes needed.
- **Backend length constraint**: no `@Size`/length validation annotation exists on `intro` or `vendorWebsite` in any admin-BE DTO (checked `ApplicationDto`, `ModelDto`, `ToolSetDto`, `ToolSetResourceDto`) — same as `description`, which also has no backend-side length annotation. `MAX_DESCRIPTION_SYMBOLS` (2048) is a frontend-only UX convention, not a mirrored backend constraint. `MAX_INTRO_SYMBOLS` follows the same convention (reuse 2048).
- **`vendorWebsite` validator**: no new validator is needed. `BaseControls/Endpoint/Endpoint.tsx` (which `EditorUrl.tsx`/`ViewerUrl.tsx` already wrap) already validates with `getUrlError`/`isValidHttpUrl` — a plain http(s)-URL check, not a DIAL-endpoint-specific format as originally assumed. `VendorWebsiteControl` should be a third thin wrapper around the same `EndpointControl`, not a new validator file.

## Corrected architecture (discovered during apply — differs from the original design above)

The asset-side properties views turned out **not** to reuse the shared `DeploymentProperties.tsx` the way regular entities do. Concretely:

- **Model, regular Application, regular Toolset** → `DeploymentProperties.tsx`, entity typed camelCase (`DialModel`/`DialApplication`/`Toolset`, all extending `BaseEntity`). Adding `intro?: string` to `BaseEntity` and mounting `IntroControl` once here covers all three.
- **Regular Interceptor (and Routes, which shares the same component)** → `EntityMainProperties/Properties/EntityProperties.tsx`. Routes' backend DTO (`RouteDto`) has no `intro` field, so `IntroControl` must be gated to `view === ApplicationRoute.Interceptors` here, unlike `DescriptionControl` which Routes does support.
- **Asset Application** → its own dedicated, snake_case-typed component `components/Assets/Apps/Properties.tsx` (`DialApplicationResource`, from `models/dial/resource.ts`), rendered directly by `Applications/View/TabsContent.tsx` when `view === ApplicationRoute.AssetsApplications` — it does **not** go through `DeploymentProperties.tsx`. `DialApplicationResource extends DialResource extends BaseEntity`, so it inherits `intro` for free once added to `BaseEntity`; only the `IntroControl` mount needs adding here.
- **Asset Toolset** → its own dedicated, snake_case-typed component `components/Assets/Toolsets/View/Properties.tsx` (`DialToolsetResource`, also from `resource.ts`) — not the tasks.md's originally-assumed `Assets/Toolsets/Properties/Properties.tsx` path. `intro` is inherited the same way; `vendor_website` (snake_case, since Core's wire format for resource entities is snake_case throughout, unlike the camelCase `Toolset`/`DialApplication` models used elsewhere) must be added explicitly to `DialToolsetResource`.
- The camelCase `AssetApp`/`AssetToolset` types in `deployment-asset.ts` are used for state typing and list/JSON-editor concerns elsewhere, but the live Properties-tab UI for both asset types is the snake_case `resource.ts` pair above, cast to/from the camelCase types at the view-component boundary (a pre-existing inconsistency in this codebase, not something this change should try to fix).

Net effect: `IntroControl` (generic over `{intro?: string}`) mounts in **four** places (`DeploymentProperties.tsx`, `EntityProperties.tsx` gated to Interceptors, `Assets/Apps/Properties.tsx`, `Assets/Toolsets/View/Properties.tsx`), not two. `VendorWebsiteControl` (a bare `{endpoint, onChange}` wrapper, not entity-generic) mounts in **two** places (`Toolsets/Properties/Properties.tsx` using `vendorWebsite`, `Assets/Toolsets/View/Properties.tsx` using `vendor_website`).
