## Context

Adapters, `CoreSdkCall`, and the per-host client are those of the archived `adopt-core-sdk-pilot` (D1–D6).
At runtime this change needs nothing from the sibling `core-sdk-settings` change. Its `core-client` delta is
written against that change's result, so `core-sdk-settings` archives first (see Risks).

Today both deployment reads go through `BaseApi` against constants in `core-utility-api.ts`:

- `getAllDeployments` → `getAction('v1/deployments')`, returning an untyped envelope. Its chain is dead:
  the conversations `getAllDeployments` action is imported only by `useUtilityDeployments`, and nothing
  imports that hook. The remaining references are `not.toHaveBeenCalled()` mocks in the Conversations
  `Properties`, `DeploymentExternalLink` and TestSuites `Properties` specs.
- `checkDeploymentByName` → `get('v1/deployments/{name}')`, typed `Deployment | null` (admin's evaluation-service
  shape: `$type`, `deploymentId`). Core returns a different shape: the SDK's `DeploymentData`, a union
  discriminated by `object` (`model`, `application`, `toolset`, `router`). Two callers with different inputs:
  - `checkIsUniqueDeploymentName` (`=== null`) passes a name the user typed into a create form — raw text.
  - the conversations `getDeployment` action behind `Properties.tsx` passes the conversation's `model.id` — an
    id Core issued, already in Core's wire form (a custom app is `applications/<bucket>/My%20App`).

The SDK has two similarly named families: `getDeploymentInfo` / `listDeployments` (`/v1/deployments*`) and
`getDeployment(s)` (`/openai/deployments*`). Only the first is the route these methods use today.

## Goals / Non-Goals

**Goals:** identical null/undefined contract; both lookups typed with what Core returns; no dead listing code.

**Non-Goals:** the test-suite link paths; the eval test-suites client's own `DEPLOYMENTS_URL`
(`server/eval/test-suites-api.ts`), which is a different constant.

## Decisions

### D1. The listing chain is deleted, not migrated
`CoreUtilityApi.getAllDeployments`, the conversations `getAllDeployments` action, `useUtilityDeployments`, and
`core-utility-api.ts`'s `DEPLOYMENTS_URL` / `DEPLOYMENT_URL` are removed, along with the specs' negative
`getAllDeployments` mocks. Nothing reaches them, so migrating them would type dead code against
`CatalogDeploymentRecord` and hide that record's mismatch with Core (`displayName` vs Core's `display_name`,
a `LocalizedValue`) behind a widened type.
Alternative considered: migrate it to `sdk.listDeployments` and widen `CatalogDeploymentRecord` until it
type-checks — rejected: it keeps unreachable code alive and papers over the field-name mismatch.

### D2. Two lookups over `getDeploymentInfo`, returning the SDK type
Both use `sdkGet<DeploymentData>` over `this.sdk.getDeploymentInfo(…, init)`, so both give 404 → `null`, other
failure or abort → `null`, 403 → `undefined`, and both return `DeploymentData | null` rather than casting to
`Deployment`: the old type was wrong for Core's body, and a cast would keep it wrong.

- `checkDeploymentByName(name, token)` — for names a user typed; encodes (D3). Callers keep their `=== null`
  checks, so a 403 still reads as "taken" (unchanged from `get`).
- `getDeploymentById(id, token)` — for ids Core issued; passes the id unchanged. The conversations
  `getDeployment` action calls this one.

### D3. Encode by input, not by route
The SDK interpolates path parameters raw, and the old `DEPLOYMENT_URL` did too, so a `?` or `#` in a typed
name used to change the request. `checkDeploymentByName` encodes with `encodeCorePath`
(`server/publications/path.ts`), which encodes per segment and leaves `/`, so slash-containing names behave
exactly as before — a deliberate pin, so the later phase that handles slash ids changes it on purpose.

`getDeploymentById` does not encode. A Core-issued id is already percent-encoded; encoding it again would turn
`My%20App` into `My%2520App`, Core would answer 404, and the conversation's agent link would silently vanish for
every custom app whose name has a space or a non-ASCII character. One lookup method encoding for both inputs is
exactly that bug, which is why there are two.

### D4. `Properties.tsx` resolves the agent link from Core's `object`
`Properties.tsx` holds the lookup result in state and reads `deployment?.$type` for `useModelDeploymentRoute`;
`getAgentLinkForConversation` takes `CatalogDeploymentRecord | Deployment`. Core's body has no `$type` — it
discriminates on `object` — so that read has been `undefined` for this call all along: the hook's
`DeploymentType.Model` branch never ran, and the link always went through `resolveCatalogDeploymentNavigation`,
which ignores `modelRoute`.

Decision: a small pure util maps `object` to the existing `DeploymentType` (`model` → `Model`,
`application` → `Application`, anything else → `undefined`). `Properties.tsx` feeds that type to
`useModelDeploymentRoute` and to `getAgentLinkForConversation`, which takes `DeploymentData | null | undefined`
plus the mapped type and resolves through `resolveDeploymentNavigationTarget` (the conversation's `model.id` as
deployment id, the type, the probed `modelRoute`); with no mapped type it falls back to
`resolveCatalogDeploymentNavigation`. The state becomes `DeploymentData | null`. The eval `Deployment` branch
(`isEvalDeployment`) has no caller left and is deleted with its test cases.

Behavior changes, each pinned by a scenario:

- **Model:** the Catalog-vs-Entities probe now runs, the link waits for it (as test-suite links do), and points
  at the route the probe picks.
- **Application with an `applications/` id** (custom app): AssetsApplications with the prefix stripped — the
  same target as today.
- **Application with an unprefixed id** (defined in Core's config): `ApplicationRoute.Applications` with the id.
  Today it went to Applications only when Core's `application` equalled its `reference`, otherwise to
  AssetsApplications with the bare id as a path, which is not an asset. Core's `reference` is not guaranteed to
  equal the name, so this is a change for those apps, and the intended one.

Loading: `Properties.tsx` treats the agent as resolving while the mapped type is `Model` and `modelRoute` is
still `undefined`, not only while the hook reports `isLoading`. The hook's `isLoading` flips true in an effect,
so for one render after the lookup lands it is false with no route yet, and the name would flash without its
link before the spinner appears.

Alternative considered: keep the dead `$type` read and leave the link on the catalog branch — rejected by the
user, who chose `object` as the discriminator.

## Risks / Trade-offs

- **403 reads as "name taken"** → unchanged from `get`; pinned by a spec so it is not "fixed" silently.
- **A wrong `getDeployment(s)` call would hit `/openai/deployments`** → the spec asserts the exact path.
- **The wrong lookup at a call site** → a typed name sent through `getDeploymentById` alters the URL; a Core id
  sent through `checkDeploymentByName` is double-encoded. Each method's JSDoc names its input, and the spec has a
  scenario for each.
- **Encoded names change the request for names with reserved characters** → intended; they previously looked up
  a different URL.
- **Spec ordering with `core-sdk-settings`** → both MODIFY the `core-client` "Calls the SDK cannot express"
  requirement, and a MODIFIED block replaces the whole requirement. `core-sdk-settings` archives first; this
  delta lists the final set of SDK-backed calls, settings included. Archiving this change first would claim the
  settings calls are SDK-backed before they are.
- **Stale spec** → `run-summary-deployment-link` still says the Conversations link uses the eval
  `GET /api/v1/deployments/all/{id}` and its `$type`; the code already calls Core. This change's delta renames
  and rewrites that requirement to the Core lookup and `object`.
- **A spinner on model conversations** → `Properties.tsx` already waits on `isResolvingAgent`, so no new loading
  UI is added.
