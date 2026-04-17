## Context

Today the admin UI constructs `source.completionEndpointPath` for a Model created from a Model Serving container by hardcoding `openai/v1` + a postfix derived from `DialModel.type` (`/chat/completions` or `/embeddings`). The literal appears in two call sites:

- `apps/ai-dial-admin/src/utils/deployments/entity.ts:119` — inside `getEntityTemplate`, when the Model is first templated from a Container in the `ModelServings` route.
- `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.tsx:91` — inside `onSelect`, when a user picks a different source container for a Model in the `Models` view.

The backend now expects NIM containers to be reached under `v1/...` rather than `openai/v1/...`. Any model templated or re-sourced from a NIM container today therefore gets a wrong path and silently fails at inference time until a user edits it by hand. Non-NIM servings (currently HF / inference) still use `openai/v1`.

Both call sites already have access to the full `Container` object: `entity.ts` receives it as a parameter, and `Containers.tsx` keeps the container list in local state (already used for `selectedContainerName` and `selectedContainer`). So the branching can live entirely on the frontend with no new data fetching.

## Goals / Non-Goals

**Goals:**

- Correctly seed `completionEndpointPath` with `v1/<postfix>` for NIM containers and `openai/v1/<postfix>` for non-NIM containers.
- Keep the rule in one place so the two call sites stay consistent.
- Mirror the existing `getEndpointPostfix` helper shape so the module stays coherent.

**Non-Goals:**

- Migrating or rewriting persisted `completionEndpointPath` values on existing models (BE owns any backfill).
- Re-deriving the prefix when a user toggles `DialModel.type` on an existing model — today the postfix doesn't auto-update either, and scope confirmed with user as "no".
- Introducing prefixes for additional container types. Only NIM differs from `openai/v1` right now.
- Changing the `Endpoints` / `ModelEndpoint` input UI — the path field remains user-editable after templating.

## Decisions

### Add `getEndpointPrefix(containerType?: CONTAINER_TYPE)` alongside `getEndpointPostfix`

`utils/models/model-endpoint.ts` currently exports only `getEndpointPostfix(type?: DialModelType)`. Add a sibling:

```ts
export const getEndpointPrefix = (containerType?: CONTAINER_TYPE) =>
  containerType === CONTAINER_TYPE.NIM ? 'v1' : 'openai/v1';
```

**Why this shape:**

- Prefix returned without a leading or trailing slash. The existing postfix already begins with `/` (`/chat/completions`, `/embeddings`), so templating `${prefix}${postfix}` composes to `v1/chat/completions` / `openai/v1/chat/completions` without double slashes.
- `containerType` is optional so the helper is safe for cases where the selected container hasn't been resolved yet (e.g. an id that doesn't match any loaded container) — it falls back to `openai/v1`, matching prior behavior.
- Enum-based branch keeps the set of "known NIM-style" containers colocated and typed; extending later (e.g. a new serving type) is a single-line edit.

**Alternatives considered:**

- *Inline ternary at each call site.* Rejected — two call sites already drift easily (we saw that firsthand in this codebase), and an inline branch ties the decision to the call site instead of to the module that already owns endpoint path construction.
- *Static map `PREFIX_BY_TYPE`.* Overkill for one differing value; a map also loses the "all unknowns fall back to `openai/v1`" property without extra wiring.
- *Pushing the decision to the backend* (BE returns the full path). Out of scope for this change; would also not help the "Create from Model Serving" flow, which templates locally.

### Use `container.$type` at both call sites (no prop changes)

- `entity.ts:getEntityTemplate` — `container.$type` is already the argument. One-line swap:
  `` `${getEndpointPrefix(container.$type)}${getEndpointPostfix(type)}` ``
- `Containers.tsx:onSelect(id)` — the container list lives in component state (`containers`). We already look it up twice in the component. In `onSelect`, compute `const picked = containers.find(c => c.name === id);` and feed `picked?.$type` into `getEndpointPrefix`.

No new props on `Containers`, no changes to `SourceField`, no new API calls.

### Leave the edit-existing-model flow alone

The persisted `completionEndpointPath` is loaded from the backend on edit and not recomputed. Users can still edit it manually via the `Endpoints` input. This matches current behavior for `getEndpointPostfix` and avoids surprising overwrites.

## Risks / Trade-offs

- **Existing NIM models created before this change keep a stale `openai/v1` prefix.** → Mitigation: out of frontend scope; backend handles migration or users resave. Called out explicitly in `proposal.md` non-goals.
- **Unknown container type falls back to `openai/v1`.** → Mitigation: today only NIM and HF (inference) are returned from the `?type=NIM,INFERENCE` endpoint for Model Serving; HF remains on `openai/v1`. If a new type appears, the fallback preserves prior behavior, and tests will catch when a new branch is needed.
- **Two call sites still exist.** → Mitigation: centralizing the literal in `getEndpointPrefix` means future changes touch one file. Collapsing the two call sites into one is a larger refactor with unrelated scope and not worth bundling.
- **BE and FE must agree on the exact NIM prefix string (`v1`, no leading slash).** → Mitigation: confirmed with user that BE expects `/v1` — the leading slash is supplied by the postfix (`/chat/completions`), so the prefix returns `v1`. Document this in a code comment next to the helper only if the reason is non-obvious.

## Migration Plan

No data migration required on the frontend. Rollout is a single code change landing on `development`. Rollback is a straight revert — no stored state changes.
