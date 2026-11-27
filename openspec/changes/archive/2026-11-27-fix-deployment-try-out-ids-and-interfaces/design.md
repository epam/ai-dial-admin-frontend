## Context

See proposal.md - Why. Findings from Core (`ai-dial-core`) that drive the design:

- `Config.selectDeployment(id)` resolves models, applications and toolsets by **short name** for config-file and platform entities. An id that misses the map falls through to `DeploymentService.toResourceDescriptor`, which checks read access on the named bucket resource; for `models/platform/<name>` the admin has none, so Core answers `Forbidden deployment`. Applications in other buckets are not in the map and are resolved by `applications/<bucket>/<path>`.
- `GET /v1/deployments/{id}` (`DeploymentController.to(...)`) reports `interfaces`: `chat` for a CHAT model, `embedding` for an EMBEDDING model, plus every declared interface (`openaiChatCompletions`, `openaiResponses`, `anthropicMessages`, `openaiEmbeddings`); `mcp`, `chat`, `custom_ui` and declared ones for an application. Declaration is resolved by Core from the interfaces map, translators, legacy endpoints and runner endpoints, so the admin panel must not re-derive it from entity config.
- Embeddings are served at `POST /openai/deployments/{id}/embeddings`.
- Today `checkDeploymentByName` goes through `sdkGet`, which returns `null` for 404 and for any failure, and `undefined` for 403, so a not-found and an outage cannot be told apart.

## Goals / Non-Goals

**Goals:** a correct id per entity kind; interfaces and unavailable reasons taken from Core at panel open; Embeddings as a first-class interface.

**Non-Goals:** see proposal.md - Non-goals. Also: no change to the Try out route's auth model, header filtering, timeout or trace-link handling.

## Decisions

### 1. The id is chosen at the call site by entity kind
`getPlatformModelDeploymentId` returns the short name. `getAssetApplicationDeploymentId` keeps the `applications/<path>` form for other buckets; the Platform Applications view passes the application's name instead. The button stays dumb: it receives one `deployment` string and uses it for the lookup, the path and the body `model`.

- *Alternative: have the button or hook normalise any id.* Rejected: it would hide a per-entity fact (which bucket a thing lives in) behind string surgery, and the views already know it.
- Whether a platform application's `_metadata.path` is `platform/<name>` is assumed from the existing helper and is confirmed in task 1.1 before the id is changed.

### 2. A status-preserving interface lookup, returning a discriminated result
Add a Core call through `sdkAction` (the pattern `getUserInfo` uses), so the status survives. The server action returns `{ interfaces: string[] }` or `{ failure: TryOutFailureKind, status? }`, classified with the existing `classifyTryOutFailure`, so the lookup and the send share one vocabulary (403 → NoAccess, 404 → NotFound, 5xx/network → Server/Network). `checkDeploymentByName` is left as is: `checkIsUniqueDeploymentName` depends on its null/undefined contract.

- *Alternative: widen `checkDeploymentByName`.* Rejected: it has other callers that rely on the current contract.

### 3. One lookup state in the hook, replacing `isInterfacesUnknown`
The hook exposes a single enum-typed state (`Loading`, `Ready`, `Unavailable`, `Failed`) plus the data each needs, instead of `reportedInterfaces` / `isLoadingInterfaces` / `isInterfacesUnknown` booleans. `Unavailable` carries a reason enum (`McpOnly`, `CustomUiOnly`, `NoInterface`); `Failed` carries the failure. Retry re-runs the lookup. The panel renders from this state alone, with the Send control only in `Ready`.

### 4. Interface mapping with Embeddings
`TRY_OUT_INTERFACES` gains `OpenAIEmbeddings`; `REPORTED_INTERFACE_TYPES` maps `embedding` and `openaiEmbeddings` to it. Because Core reports `chat` or `embedding` per model type, a chat model never reports an embeddings interface and an embeddings model never reports `chat`, so "embeddings only for embeddings models" needs no extra rule beyond the mapping. The `Unavailable` reason is derived from the *unmapped* reported values: only `mcp` → `McpOnly`, only `custom_ui` → `CustomUiOnly`, anything else → `NoInterface`. When both `mcp` and a callable interface are reported, the callable one wins and the form is shown.

### 5. Embeddings request shape
`buildTryOutBody` for embeddings returns `{ input: message }` with no `stream` flag. `CORE_INTERFACE_PATHS` gets an embeddings entry sharing the chat completions path builder's deployment-id handling (the id appears in the path, so the same `isSafeDeploymentId` check applies). The hook's reply handling already reads a non-event-stream response as JSON, so no new branch is needed.

### 6. Failure and unavailable messages share one component shape
Lookup failures reuse `TryOutFailureMessage`. The three unavailable reasons use a sibling message component (or the same one extended), each with its own i18n key. A Retry button appears only on `Network` / `Server`. Status text is announced through the existing `aria-live` region (a11y rules), not a second region.

## Risks / Trade-offs

- [The extra Core call on every panel open adds latency] → it happens after the click behind a loader, once per open, and replaces a call that already existed.
- [An admin without a role on a deployment now sees a 403 reason and no form, where the old fallback let them try] → intended per the request: no guessing. The message says why.
- [`custom_ui` / `mcp` wording drifting from Core's interface names] → the reason mapping is one lookup table with a spec scenario per case.
- [Platform application `_metadata.path` assumption] → verified first, in task 1.1; if wrong, only the helper changes.

## Migration Plan

No data or config migration. Spec `deployment-try-out` is updated by the delta in this change. Rollback is reverting the change.
