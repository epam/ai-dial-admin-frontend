## Why

Resolves [#2667](https://github.com/epam/ai-dial-admin-frontend/issues/2667). The Deployments → Model Servings section currently exposes every serving type (NIM, HF) regardless of whether the underlying infrastructure supports them, which surfaces options that produce backend errors when used. Administrators need an opt-in way to show only the serving types their deployment actually supports, and to hide the Model Servings tab entirely when neither is available.

## What Changes

- Add two environment variables, `NIM_ENABLED` and `HF_ENABLED`, following the same default-off opt-in convention as the existing `MCP_REGISTRY_ENABLED` flag.
- Extend the `FeatureFlags` interface with `nimEnabled` and `hfEnabled`, and initialize them in the root `layout.tsx` via `isValueTruthy(process.env.*)`.
- Filter the Model Servings Create dropdown in `Containers/List/HeaderButtons.tsx` so the "HF Model Serving" and "NIM Model Serving" rows render only when their respective flags are enabled, using the existing spread-filter pattern.
- Hide the "Model Servings" entry in the left-nav menu configuration when both flags are disabled.
- Redirect to the home page from `app/[lang]/model-servings/page.tsx` when both flags are disabled, so bookmarked URLs don't render a dead-end page.
- Document both variables in `.env.template` and in the env-vars table in top-level `README.md`.

## Capabilities

### New Capabilities
- `model-servings-visibility`: Feature-flag gating for Model Servings options (NIM, HF), the Model Servings navigation entry, and the Model Servings route.

### Modified Capabilities

(none)

## Impact

- **Code:**
  - `apps/ai-dial-admin/src/models/feature-flags.ts`
  - `apps/ai-dial-admin/src/app/[lang]/layout.tsx`
  - `apps/ai-dial-admin/src/components/Containers/List/HeaderButtons.tsx`
  - `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/model-servings/page.tsx`
- **Config & docs:**
  - `.env.template` (new entries under the existing `# Deployments` section)
  - `README.md` (new rows in the environment-variables table)
  - `.env.local` is **not** touched
- **Tests:**
  - `apps/ai-dial-admin/src/components/Containers/List/tests/HeaderButtons.spec.tsx` — extend the `useAppContext` mock and add coverage for the four flag combinations
  - New `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts` — verify the Model Servings entry appears/disappears based on flag state
- **Behavior change:** Default changes from "always shown" to "hidden unless explicitly enabled." Operators must set `NIM_ENABLED=true` and/or `HF_ENABLED=true` to retain the current UI. This is intentional and matches the precedent set by `MCP_REGISTRY_ENABLED`.
- **Out of scope:** Other container types (MCP, Adapter, Application, Interceptor), the Deployment Images dropdown, and any backend capabilities endpoint.

## Non-goals

- Adding per-type flags for container kinds other than Model Servings.
- Replacing frontend env-var gating with a backend capabilities endpoint.
- Changing how existing `MCP_REGISTRY_ENABLED` / `DEPLOYMENTS_ENABLED` flags behave.
