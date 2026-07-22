## Why

The `intro` field is fully modeled on the backend for Model, Application, Interceptor, and Toolset (both the admin-BE plain DTOs and DIAL Core's `Deployment`/`Data` classes), and `vendorWebsite` is fully modeled for Toolset the same way, but neither field exists anywhere in the frontend — no type, no form control, no i18n key. Users can't set or view either field today even though both admin-BE and Core already read/write them (ai-dial-admin-backend #1084; ai-dial-admin-frontend #3964). This is a pure frontend gap: add the missing fields to the entity models and forms, following the existing `description` field as the template.

## What Changes

- Add `intro?: string` to `BaseEntity` (`apps/ai-dial-admin/src/models/dial/base-entity.ts`), so it's inherited by Model, Application, Interceptor, and Toolset (regular) automatically.
- Add an `IntroControl`, mirroring `DescriptionControl` (`apps/ai-dial-admin/src/components/BaseControls/`), with the same length-validation pattern (new `intro-error.ts` validator + `MAX_INTRO_SYMBOLS` constant) and i18n key.
- Mount `IntroControl` next to `DescriptionControl` in the two shared properties components: `DeploymentProperties.tsx` (Model, Application, Toolset) and `EntityProperties.tsx` (Interceptor).
- Add `vendorWebsite?: string` to the `Toolset` model (`apps/ai-dial-admin/src/models/dial/toolset.ts`) and a dedicated `VendorWebsiteControl` (or inline field), mounted in `Toolsets/Properties/Properties.tsx` only (not shared — Toolset-only field). Reuse the existing endpoint/URL-format validation pattern already used for `viewerUrl`/`editorUrl` on Application.
- Extend the asset-side models (`AssetApp`, `AssetToolset` in `apps/ai-dial-admin/src/models/dial/deployment-asset.ts`) and the `AssetApi` content/metadata mapping (`apps/ai-dial-admin/src/server/core/asset-api.ts` and per-type mappers) so `intro` (both) and `vendorWebsite` (toolset) round-trip through DIAL Core directly — asset applications and asset toolsets do **not** go through admin-BE for these fields, per the ongoing Core-direct migration.
- Add both fields to the properties views used for Asset Applications (`components/Assets/Applications/...`) and Asset Toolsets (`components/Assets/Toolsets/Properties/Properties.tsx`), reusing the same `IntroControl`/`VendorWebsiteControl` built for the regular entities.

## Capabilities

### New Capabilities
- `entity-intro-field`: `intro` field support (type, validation, form control) across Model, Application, Interceptor, and Toolset — both regular (admin-BE-backed) and asset (Core-direct) variants.
- `toolset-vendor-website-field`: `vendorWebsite` field support (type, validation, form control) for Toolset only — both regular and asset variants.

### Modified Capabilities
- `application-resources-core-api`: asset application get/create/update now carry `intro` through the Core content/metadata mapping.
- `toolset-resources-core-api`: asset toolset get/create/update now carry `intro` and `vendorWebsite` through the Core content/metadata mapping.

## Impact

- **New/changed frontend files**: `models/dial/base-entity.ts`, `models/dial/toolset.ts`, `models/dial/deployment-asset.ts`, `components/BaseControls/` (new controls), `utils/validation/` (new validators), `constants/i18n.ts` (new keys), `EntityMainProperties/Properties/DeploymentProperties.tsx`, `EntityMainProperties/Properties/EntityProperties.tsx`, `Toolsets/Properties/Properties.tsx`, `Assets/Toolsets/Properties/Properties.tsx`, `Assets/Applications/**/Properties*`, `server/core/asset-api.ts` and its per-type mappers.
- **No backend changes required** — both admin-BE and Core already expose these fields; this is form/model wiring only.
- **No breaking changes** — both fields are optional and additive to existing entities; existing save payloads are unaffected when the fields are left blank.
- **Shared components touched**: `DeploymentProperties.tsx` and `EntityProperties.tsx` are shared across multiple entity types, so a mistake here has broad blast radius (affects Model, Application, Toolset, Interceptor simultaneously) — needs care and testing across all four regular-entity views plus the two asset views.
