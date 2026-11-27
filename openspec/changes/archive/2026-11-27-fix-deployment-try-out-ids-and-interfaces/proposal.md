## Why

Try out (issue #5627, PR #5682) fails for platform models and applications: it calls them by `models/platform/<name>`, but Core keys config-file and platform entities by **short name**, so the call misses Core's deployment map and is treated as a bucket resource the admin cannot read (403 "Forbidden deployment", issue #5698). The same wrong id makes the interface lookup fail, which surfaces the "interfaces could not be read" note on every entity (issue #5701). Embeddings models are not covered at all, and an application that only serves MCP gets a panel that explains nothing.

## What Changes

- Call platform models and platform applications by their short name, in the request path and in the request body's `model`. Applications stored in other buckets keep `applications/<bucket>/<path>`.
- Remove the "interfaces could not be read" note and the silent "offer all three" fallback.
- Read the interfaces Core reports **when the panel opens**, keeping the status of a failed read, and show either the form or a specific reason:
  - supported interfaces → the form, offering only those;
  - none supported → a reason that names why (MCP-only, UI-only, no callable interface);
  - lookup failed → no access (403), not found (404), or Core unreachable / server error (with Retry).
- Add Embeddings as a fourth Try out interface (`/openai/deployments/{id}/embeddings`). A model Core reports as `embedding` is offered Embeddings only; chat models are never offered it.
- The Try out button stays always visible; it never depends on the lookup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deployment-try-out`: how the deployment is named per entity kind, which interfaces are offered and what the panel says when none can be used or the lookup fails, and the new Embeddings interface.

## Impact

- `apps/ai-dial-admin/src/components/TryOut/Deployment/` — hook, panel, constants, request-body and request-building utils, interface mapping, failure messages.
- `apps/ai-dial-admin/src/app/actions/try-out.ts` and `server/core/core-utility-api.ts` — a status-preserving deployment lookup (the current one folds 404, 5xx and network failures into `null`).
- `apps/ai-dial-admin/src/server/try-out/` — embeddings path in the fixed path table.
- `components/Assets/Platform/Models/View.tsx`, `components/Assets/Platform/Applications/View.tsx` and `get-asset-deployment-id.ts` — the id passed to the button.
- `constants/i18n.ts`, `locales/en.ts` — new messages; two keys removed.
- The shared Try out components (`components/TryOut/*`) and the Eval and Toolset Try outs are untouched.

## Non-goals

- Hiding the button for any entity, or deciding availability from the entity's own config; Core stays the single source of truth.
- Narrowing a chat model's interfaces by its declared `interfaces` map beyond what Core reports.
- Try out for toolsets or for an application's MCP tools (the Tools tab already covers those).
- Embeddings-specific rendering (vectors) beyond showing the JSON reply.
