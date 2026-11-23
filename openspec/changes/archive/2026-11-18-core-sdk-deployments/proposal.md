## Why

`CoreUtilityApi` still reads deployments through the hand-written client, and carries a `TODO` to move them
in this phase. The lookup is a plain GET the SDK expresses directly, and it sits on the create flow for every
entity (`checkIsUniqueDeploymentName`), so its 404 and error mapping must be pinned while it moves. Moving it
also surfaces a typing problem — the lookup is declared as admin's eval-service `Deployment`, which is not what
Core returns — and shows that the listing has no live consumer at all.

## What Changes

- **Removed:** `CoreUtilityApi.getAllDeployments`, the conversations `getAllDeployments` action, the
  `useUtilityDeployments` hook, and `core-utility-api.ts`'s `DEPLOYMENTS_URL` / `DEPLOYMENT_URL`. Nothing imports
  the hook, so the whole chain is dead. The eval test-suites client has its own `DEPLOYMENTS_URL` and is
  unaffected.
- `CoreUtilityApi.checkDeploymentByName` calls `sdk.getDeploymentInfo` (`/v1/deployments/{name}`) through
  `sdkGet`: a `GET`, never a `HEAD`; 404 resolves to `null`, 403 to `undefined`, as before. It takes a name a
  user typed and percent-encodes it once with `encodeCorePath`, so a name containing `?`, `#`, `%` or a space
  looks up that name instead of altering the URL. A name with `/` is unchanged.
- New `CoreUtilityApi.getDeploymentById` makes the same call for an id Core issued and sends it unchanged, since
  such an id is already encoded. The conversations `getDeployment` action uses it.
- **BREAKING (internal):** both lookups return the SDK's `DeploymentData | null` instead of admin's
  `Deployment | null`. The consumers are re-typed: the conversations `getDeployment` action,
  `Conversations/View/Properties.tsx`, and `checkIsUniqueDeploymentName`, which keeps depending on `=== null`.
- `Properties.tsx` resolves a conversation's agent link from Core's `object` (`model` / `application`) instead of
  an eval-shaped `$type` that Core never sends. Model conversations now get the Catalog-vs-Entities route probe;
  applications defined in Core's config (unprefixed id) now link to Applications; custom apps link as before.
  `getAgentLinkForConversation` drops its eval `Deployment` branch.
- The `TODO` above `checkDeploymentByName` is removed.

**Non-goals:** other `CoreUtilityApi` methods (`getCallerDeployments` reads `/openai/*`, the version read stays
`text/plain`); the global-settings change (`core-sdk-settings`); the `BaseApi` fix; replacing admin's `models/dial`
types; a `DELETE` path; the test-suite link paths.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-client`: the SDK-backed call list gains the two deployment lookups.
- `run-summary-deployment-link`: the Conversations agent link requirement is renamed and rewritten — it reads
  Core's `/v1/deployments/{id}` and uses its `object`, replacing the stale eval by-id and `$type` wording.
- `utility-core-api`: the deployment requirement is renamed to cover lookups only (the listing is gone); both
  lookups go through the SDK, a typed name is encoded, and a Core-issued id is sent as is.

## Impact

- Code: `src/server/core/core-utility-api.ts` and its spec; `src/app/[lang]/conversations/actions.ts` and its spec,
  `src/app/actions.ts`, `src/hooks/use-utility-deployments.ts` (deleted),
  `src/components/Assets/Artifacts/Conversations/View/Properties.tsx`, `Assets/utils.ts`, a new util for the
  `object` → `DeploymentType` mapping, and the `getAllDeployments` mocks in the Conversations `Properties`,
  `Runs/Summary/DeploymentExternalLink` and `TestSuites/Properties` specs.
- Ordering: independent of `core-sdk-settings` at runtime, but archive it **after** `core-sdk-settings`: both
  MODIFY the `core-client` "SDK-backed calls" requirement, and this delta states the final list on top of it.
- No new dependency; uses the stable `@epam/ai-dial-typescript-sdk` `^0.2.1` that `core-sdk-settings` declares
  (`getDeploymentInfo` and the `DeploymentData` union are in 0.2.1).
