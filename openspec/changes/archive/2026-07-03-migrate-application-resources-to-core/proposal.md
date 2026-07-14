## Why

Application-resources are the most complex of the four versioned asset types still proxied through the admin BE (`assetsApi` → `/api/v1/application-resources/*`): CRUD+move is structurally identical to toolset-resources, but every `get` additionally computes a `validityState` by loading a DB-backed `ApplicationTypeSchema` (a deployment-config entity, unrelated to Core) and running a Core-library JSON-schema validator against the resource's properties — logic with no FE precedent and no natural place to live once `get` talks to Core directly. Following `migrate-publications-to-core-api`'s own precedent (defer the one genuinely risky port to a Phase 2, ship everything else now), this change moves the CRUD+move surface to Core while `validityState` keeps calling the still-alive admin BE.

## What Changes

- **Cut application-resource list/get/create/update/delete/move over to Core**, replacing the corresponding `assetsApi` calls in `src/app/[lang]/assets-applications/actions.ts` with `add-core-asset-client`'s application-resource client.
- **Hard cutover for CRUD+move, no fallback** — `AssetsApplications`/application view, the `/assets-applications` and `/assets-applications/[id]` routes, the server-action signatures, and the `AssetApp`/`DialApplicationResource` models are unchanged.
- **Phase 1 seam: `validityState` stays BE-backed.** `get`'s response is assembled from the Core content+metadata merge (path/name/folderId/etc.) **plus** a `validityState` field fetched via a small, scoped call to the still-alive admin BE (see design D1) — reproducing `ApplicationResourceValidityStateOnGetResolver` end-to-end in TypeScript (DB entity lookup, Core-format schema mapping, JSON-schema validation) is deferred to a follow-up change once a schema-validation library is chosen.
- **Conditional create/update semantics preserved**: create → `If-None-Match: *` unless override; update → `If-Match` with the caller's etag.
- **Move/duplicate-rename flow preserved unchanged.**
- **Bugfix applied per `add-core-asset-client` D6**: `viewerUrl`/`editorUrl`/`maxInputAttachments` validation now applies identically to create and update payloads, closing the BE's known create-only validation gap.

## Capabilities

### New Capabilities
- `application-resources-core-api`: application-resource list, get, create, update, delete, bulk-delete, and move executed directly against DIAL Core via `add-core-asset-client`, replacing the admin-BE proxy for these operations, while `validityState` continues to be sourced from the admin BE as a scoped Phase 1 dependency; the FE-facing `AssetApp` contract, routes, and server-action signatures stay identical.

## Impact

- **Modified code:**
  - `src/app/[lang]/assets-applications/actions.ts` — `getApps`, `createApp`, `getApp`, `updateApp`, `removeApp`, `bulkDeleteApps`, `moveApps` call the Core application-resource client instead of `assetsApi`; `getApp`/`getApps` additionally fetch and merge in `validityState` from the admin BE
- **Unchanged:** `Apps/List.tsx`, `Apps/View.tsx`/`Properties.tsx`, `src/models/dial/deployment-asset.ts` (`AssetApp`), `src/models/dial/application-resource.ts`, the `/assets-applications` routes.
- **Explicitly not touched by this change** (stays on `assetsApi`/admin BE): `importApps`, `exportApps`, `getAssetTools` (discovered-tools) — see Non-goals.
- **New, scoped BE dependency**: a `validityState`-only call to the admin BE, replacing what was previously an inline part of the (now-removed) BE-backed `get`. This is the one deliberate exception to "hard cutover, no fallback" in this change, and is called out as the acceptance bar for the Phase 2 follow-up (see Non-goals).
- **Hard dependency:** `add-core-asset-client` (client, version-path helper, application-resource content+metadata mapper, D6's shared validation) must be implemented first.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline for Core calls; the `validityState` BE call reuses the existing admin-BE auth path unchanged.

## Non-goals

- **Porting `ApplicationResourceValidityStateOnGetResolver`** (DB-backed `ApplicationTypeSchema` lookup, Core-format schema mapping, JSON-schema conformance validation) — deferred to a Phase 2 follow-up once a TS JSON-schema validation approach is chosen. This change only wires the existing BE computation in as a scoped dependency.
- **Import/export/zip-preview and discovered-tools** (`importApps`, `exportApps`, `getAssetTools`) — same reasoning as the toolset-resource and prompt migrations: distinct risk buckets, deferred to a fast-follow.
- **MCP call-tool / transport-fallback logic** (Application falls back to its type-schema's MCP transport; ToolSet does not) — not currently exposed in the FE for application-resources at all (no `tryOutAssetTool`/call-tool action exists here), so nothing to port yet; would be scoped into the same fast-follow as discovered-tools if ever added.
- Folders/rules — `migrate-folders-to-core` (separate, later change).
- Any other asset type (conversation, prompt, toolset-resource — done; file — later change).
- Any change to `Apps/List`/`Apps/View` UI, columns, or i18n beyond what's needed to keep them working against the new data source.
