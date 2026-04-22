## Context

The Deployments section of the AI DIAL Admin frontend lets operators create containers of several types. Model Servings is one such section; its Create dropdown currently hardcodes two rows: **HF Model Serving** and **NIM Model Serving**. These rows are shown regardless of whether the backend's deployment manager has the required infrastructure configured for those serving types. Selecting an unsupported type results in a backend error after submit — poor UX for an admin tool.

The codebase already has a feature-flag pipeline: `.env` / `process.env` → `FeatureFlags` initialized in `app/[lang]/layout.tsx` → `AppContextProvider` → `useAppContext().featureFlags` consumed throughout the tree. `mcpRegistryEnabled` is the precedent — a default-off opt-in that gates `Containers/List/HeaderButtons.tsx` dropdown rows, the MCP Registry modal plumbing, and other affordances. The Deployments navigation tab already supports global disable via `DEPLOYMENTS_ENABLED`, filtered in `Menu/menu-configuration.tsx`. There is no backend capabilities endpoint today; all gating is frontend-driven.

Per-serving-type flagging has been requested in [#2667](https://github.com/epam/ai-dial-admin-frontend/issues/2667) with two specific requirements: hide individual unsupported options, and hide the entire Model Servings navigation entry when no options are supported.

## Goals / Non-Goals

**Goals:**
- Introduce two opt-in environment variables, `NIM_ENABLED` and `HF_ENABLED`, that admins set per deployment.
- Gate the NIM and HF rows of the Model Servings Create dropdown on their respective flags.
- Remove the Model Servings entry from the left navigation when neither flag is enabled.
- Redirect direct URL hits to `/<lang>/model-servings` to `/` when neither flag is enabled.
- Keep the implementation consistent with the existing `mcpRegistryEnabled` pattern so reviewers can match it on sight.

**Non-Goals:**
- Flagging MCP / Adapter / Application / Interceptor container types.
- Flagging individual Deployment Image types.
- Introducing a backend capabilities endpoint or any cross-service coordination.
- Renaming or altering the semantics of existing flags (`DEPLOYMENTS_ENABLED`, `MCP_REGISTRY_ENABLED`).
- Preserving the pre-change default of "shown." Operators who want to keep today's UI must explicitly opt in after upgrade.

## Decisions

### Decision: Default-off ("opt-in") semantics for both new flags

Unset or falsy `NIM_ENABLED` / `HF_ENABLED` means hidden; explicit truthy means shown. Rationale: matches the existing `MCP_REGISTRY_ENABLED` precedent, produces a safer out-of-the-box posture for operators whose infrastructure doesn't support either serving type, and makes the flag's intent easy to state in one line of documentation.

**Alternatives considered:**
- *Default-on ("opt-out")*: `NIM_DISABLED` / `HF_DISABLED`, unset means shown. Preserves backward compatibility at the cost of inverting the polarity of similar existing flags — reviewers would have to keep two mental models. Rejected because consistency with `MCP_REGISTRY_ENABLED` matters more than silent backward compatibility for an explicitly-scoped admin tool.
- *Hybrid (FE flag + BE capability)*: Overkill for the scope of this change and requires cross-repo coordination.

### Decision: Flag consumption via `useAppContext().featureFlags`

Both flags are read in server-side `layout.tsx` via `isValueTruthy(process.env.*)`, bundled into the existing `FeatureFlags` object, and delivered through `AppContextProvider`. Client components call `useAppContext()` and read `featureFlags.nimEnabled` / `featureFlags.hfEnabled`.

**Rationale:** The existing `mcpRegistryEnabled` flag uses exactly this path — no new indirection introduced. Any component that already consumes `featureFlags` can add the new fields without changing its imports.

**Alternatives considered:**
- *Passing flags as props down to `HeaderButtons`*: more explicit but inconsistent with `mcpRegistryEnabled` handling in the same file.

### Decision: Spread-filter pattern for dropdown items

`servingsDropdownItems` becomes:

```ts
[
  ...(featureFlags.hfEnabled ? [hfOption] : []),
  ...(featureFlags.nimEnabled ? [nimOption] : []),
]
```

This matches the `mcpDropdownItems` pattern already in the same file and keeps the diff local to lines 63–77.

### Decision: Hide Model Servings menu item when both flags are false

In `Menu/menu-configuration.tsx`, inside the Deployments group's `items` array, the `ModelServings` entry is wrapped in the same spread-filter pattern:

```ts
...(featureFlags.nimEnabled || featureFlags.hfEnabled
  ? [{ key: MenuI18nKey.ModelServings, href: ApplicationRoute.ModelServings }]
  : []),
```

**Rationale:** The existing `deploymentsEnabled` filter removes the whole Deployments group; this change filters a single item within it, composing cleanly.

### Decision: Server-side redirect to `ApplicationRoute.Home` for the hidden route

`app/[lang]/model-servings/page.tsx` reads `process.env.NIM_ENABLED` / `HF_ENABLED` at the top of the server component and calls `redirect(ApplicationRoute.Home)` when both are falsy, before fetching any containers. `ApplicationRoute` is already imported in the file for the Model Servings list route, so this reuses the existing routes enum rather than hardcoding a path string.

**Rationale:** The page is a Next.js server component — `redirect()` is the idiomatic mechanism and avoids a wasted backend fetch. Redirecting home rather than throwing a 404 is less hostile to bookmarks that pre-date the change. Home is guaranteed to exist for all authenticated users.

**Alternatives considered:**
- *Return `notFound()`*: correct HTTP semantics but users see a 404 page rather than landing somewhere useful.
- *Client-side redirect in a layout*: unnecessary hop; server-side is cheaper.

### Decision: Document flags in `.env.template` and top-level `README.md`, skip `.env.local`

`.env.template` receives new commented rows under `# Deployments`; `README.md`'s env-vars table gets two new rows next to the existing `MCP_REGISTRY_ENABLED` row. `.env.local` is operator-local secrets and must not be touched.

## Risks / Trade-offs

- **Behavior change on upgrade** → This is a breaking default change: after deploying this, all environments without explicit `NIM_ENABLED=true` / `HF_ENABLED=true` will see the Model Servings tab disappear. Mitigation: call this out loudly in the proposal's Impact section and the PR description; the flag documentation in README lands with the code so operators can re-enable before rolling.
- **Dropdown/menu/page flags can drift** → The filter lives in three places (HeaderButtons, menu config, page guard) and could be updated inconsistently. Mitigation: tests cover each site independently; the spread-filter idiom is identical across all three to make review easy.
- **Redirect changes route semantics** → A future consumer might expect `/model-servings` to always resolve; the redirect silently skips that. Mitigation: behavior is specified in specs and covered by tests.
- **Env var naming collision** → `NIM_ENABLED` / `HF_ENABLED` are short names; a future backend or other service might want to use the same identifiers. Mitigation: these are client-tier Next.js env vars scoped to this app's `layout.tsx`; no conflict today.

## Migration Plan

- **Rollout:** Ship as a single PR. Before merging, coordinate with ops/release notes so operators can set `NIM_ENABLED=true` / `HF_ENABLED=true` in environments that previously used either serving type.
- **Rollback:** Revert the PR. No data or backend state is affected; flags are pure UI gating.
