## Context

See proposal.md for the Why. This design is about the contracts the templates rely on. Each one was
read from source, not assumed.

**Deployment Manager** (`ai-dial-admin-deployment-manager-backend`)
- `DeploymentDtoMapper.constructFullUrl` serves `url`.
- MCP deployments get the stored root plus `mcpEndpointPath`, with `/mcp` or `/sse` as the default.
  Every other type gets the bare Knative `status.url`, with no trailing slash.
- The Knative service name is `<prefix>-<deployment id>`, persisted on first deploy and reused on
  update, rollback and undeploy/deploy. The URL is therefore stable per deployment id.
- `url` is `null` while the container is not RUNNING.

**Admin backend** (`ai-dial-admin-backend`)
- `ContainerEndpointResolver` builds every endpoint as `url + <stored path>`.
- An adapter-linked model's Core `endpoint` is `adapter.baseEndpoint + "<id>/chat/completions"`
  (or `/embeddings`), concatenated at export time.
- Entities reach Core as a generated config file every 15 s.

**DIAL Core** (`ai-dial-core`)
- An API-written resource is keyed by its **short name** in the merged config. `PUT
  models/platform/X` serves as deployment `X`, the same as a config-file `X`.
- An API entry of the same type and name **replaces** the config-file entry. Deleting it restores
  the file entry.
- A name already held by another type is refused with 409.
- URL resolution (`DeploymentEndpointUtil`):
  - A legacy `endpoint` is used verbatim.
  - An entry in `interfaces` resolves to `base_url ?? baseUrl` + the ingress path, with the
    `/deployments/{id}/` segment set to `overrideName ?? name`.
  - `overrideName` also rewrites the body `model` field and adds `X-DIAL-OVERRIDE-NAME`.
- `baseUrl` and interface `mode` require Core 0.48 or later.
- `userRoles`: `null` means everyone can see the entity, `[]` means nobody can (`RoleBasedEntity`).
  Platform models, applications and toolsets already default new resources to `[]` per their
  "defaults to unavailable" requirements.

**Adapters and SDKs**
- `ai-dial-adapter-*`, `ai-dial-sdk` and `ai-dial-interceptors-sdk` serve
  `/openai/deployments/{name}/chat/completions` (and `/embeddings`).
- They resolve the deployment id from `X-DIAL-OVERRIDE-NAME` first, then from the path.
- One interceptor or application container may register several names.
- The OpenAI adapter also serves `/openai/v1/responses`. Bedrock and Vertex AI do not.

## Goals / Non-Goals

**Goals:**
- Every Core asset created from a container routes on first use. No field may be left for the
  admin to discover.
- Without the admin API, no admin-backend request leaves the container pages.

**Non-Goals:**
- Changing how the existing `CreateAsset` modal validates or submits for its other callers.
- Adding a Core-version branch. See Decision 2.

## Decisions

### 1. Two independent create options, never a dual write

The MCP dropdown pattern (`createToolsetOptions`) is extended to adapter, application and
interceptor containers and to Model Servings.

- **Alternative rejected:** writing the admin-backend entity and the Core asset in one action.
  Core keys both by short name, so the API asset would replace the exported entity. The two stores
  would then hold divergent copies with no defined owner.
- With the admin API off, the dropdown collapses to the existing `OutlinedButton` with the plain
  entity label from `getTranslatedEntity`. An adapter container is labelled "model", because Core
  has no adapter type.

### 2. Per-type template fields

`url` below is `container.url`.

| Source | Core write | Fields set by the template |
| --- | --- | --- |
| Adapter container | `models/platform/<name>` | `baseUrl: url`; `type` CHAT with `interfaces.openaiChatCompletions: {}` |
| Model Serving, text generation | `models/platform/<name>` | `type` CHAT; `endpoint: url + '/openai/v1/chat/completions'`; `overrideName: container.name` |
| Model Serving, text classification | `toolsets/platform/<name>` | `endpoint: url + '/mcp'`; `transport` HTTP |
| Interceptor container | `interceptors/platform/<name>` | `baseUrl: url`; `interfaces.openaiChatCompletions: {}` |
| Application container | `applications/platform/<name>` | `base_url: url`; `interfaces.openaiChatCompletions: {}` |
| MCP container | `toolsets/platform/<name>` | `endpoint: url`; `transport` from the container (unchanged) |

Every template also seeds `name` (from `getEntityId`) and `displayName` from the container, as
`getEntityTemplate` and `getAssetTemplate` already do.

**`baseUrl` + interface for adapter, interceptor and application.** Core then calls
`url/openai/deployments/<name>/chat/completions`. That is the path the admin backend composes today
and the path the SDK containers serve. An explicit `overrideName` is needed only when the name the
container registered differs from the asset name. The admin sets it in the existing Properties tab.
The template does not guess it.
- **Alternative rejected:** a legacy full `endpoint`. It works on every Core version, but it
  hard-codes the id segment into a string the admin must edit whenever the name changes, and it
  cannot be extended to embeddings or responses without a second field.
- **Alternative rejected:** a Core-version branch. `direct-core-version` exists, but the
  Assets > Models and Interceptors Properties tabs already edit `baseUrl` and interfaces with no
  version gate. This change makes the same assumption rather than introducing a stricter one.

**Legacy `endpoint` for Model Serving.** Serving runtimes listen on `/openai/v1/...` and select the
model by the body `model` field. The `baseUrl` route would emit `/openai/deployments/<name>/...`,
which they do not serve. `overrideName: container.name` keeps the body `model` aligned, the same
as the admin-backend template.

**Embeddings and Responses.** The template seeds the chat interface only, matching the
admin-backend adapter default (`ModelEndpointUtils`, chat when the type is unset). An embedding
model or a Responses-capable adapter is a type/interface edit on the Properties tab afterwards.
Pre-selecting it from the container is not possible: the container does not expose the adapter's
upstream API.

**No `/` handling.** Neither service emits a trailing slash, and Core strips one from a base URL.
The template uses `url` as given.

### 3. Fields the template must not set

- **`userRoles` / `user_roles`.** The platform create flows already seed `[]` by spec. The template
  leaves the flow's default in place, so the new asset is unavailable until roles are granted.
- **Empty strings in `baseUrl`, `base_url` or `endpoint`.** Core treats `""` as a present, broken
  URL. The Create action is offered only while the container is RUNNING, so `url` is non-null.
- **`upstreams`.** The adapter keeps its own provider configuration, which matches what the admin
  backend exports for adapter-linked models.

### 4. Duplicate-name sources

The modal follows the type's own Assets list, so the payload is the one that list already writes:
- **Flat platform types (model, interceptor)** open `CreateEntity` with the platform route and the
  `CreateAssetActionMap` action, as `BaseAssetList` does. `CreateAsset` would seed a `version`, which
  Core rejects for these resources with 400 (found in browser verification). The page fetches the
  names server-side (`getContainerAssetNames`: the `platform/` listing plus the config-file names),
  because `CreateEntity` renders no folder tree to load them.
- **Dual-bucket types (application, toolset)** keep `CreateAsset`.

`CreateAsset` gains one optional prop, `isPlatformTarget`, which the container flow sets. It does two
things:
- It merges the `file/` root's names (already fetched with the initial root batch) into the
  duplicate list next to the selected folder's. A config-file name must be rejected even though
  Core would accept it, because the write would silently replace that entity.
- It drops the `public/` root, so a dual-bucket view (applications, toolsets) opens on `platform/`.
  With Catalog off there is no platform root to keep, and the create falls back to public as today.

Other callers do not pass the prop and keep their behavior.

A name held by another type is not pre-checked. Core answers 409 and the modal's existing error
notification shows it, with the modal left open.
- **Alternative rejected:** `checkIsUniqueDeploymentName` on submit. It does not cover interceptors,
  and it duplicates a check Core already enforces atomically.

For the dual-bucket types the container page wraps the view in a fresh folder provider, because the
layout-level providers keep whatever state the matching Assets list was left in. Models and
interceptors need no folder state. The admin-backend name list (`getEntityNames`) is fetched only
when `getIsAdminApiEnabled()` is true. The Core names are fetched outside that block, so an
admin-backend failure cannot empty the Core duplicate check.

## Risks / Trade-offs

- **[Risk]** The registered SDK name differs from the asset name, so the first request returns 404
  from the container. → The asset detail Properties tab already edits `overrideName`. The
  container cannot reveal the name, so the field cannot be pre-filled.
- **[Risk]** An admin creates both the admin-backend entity and the Core asset under one name. →
  The Core option's name check includes the config-file population, where the exported entity
  appears within one export cycle (≈15 s). Creates inside that window are not caught. This is
  accepted because both options are explicit user choices.
- **[Trade-off]** A created model or application is unavailable to every user until roles are
  granted. This is deliberate and consistent with the existing platform create flows.
- **[Risk]** A new deployment id gets a new URL, and the asset keeps the old one. → This is out of
  scope (proposal Non-goals). The URL is stable for the lifetime of a deployment id.

## Migration Plan

Frontend-only, with no data migration. Rollback is reverting the change: Core assets already
created stay valid, because they hold no reference back to the container.
