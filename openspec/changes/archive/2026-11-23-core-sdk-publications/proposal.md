## Why

Phase 3 of the TypeScript SDK migration (#5633, epic #5629). Publications are the next group of Core calls the SDK
expresses directly: all eight `POST /v1/ops/publication/*` operations have an SDK operation. The issue points at
`src/server/publications/`, but that directory holds no Core calls — it holds mappers, path helpers, comment
sanitising, the update plan and the resolvers. The calls live in `src/server/entities/core-publications-api.ts`
(`CorePublicationsApi extends CoreApi`). Moving them also lets the hand-written `CorePublication*` types go: they
duplicate the SDK's `Publication`, `PublicationResource`, `Rule` and `Rules` schemas.

## What Changes

- `CorePublicationsApi` calls the SDK for all eight operations, through the existing adapters:
  `getPublicationList` / `getPublication` use `sdkGet`; `createPublication`, `ruleList`, `approvePublication`,
  `declinePublication`, `deletePublication` and `updatePublication` use `sdkAction`. Responses and failures keep the
  envelope and value contracts of the hand-written client.
- **Ids are sent as their input dictates**, in the JSON body (`ResourceLink.url`), not a URL path:
  a Core-issued publication path (`get`, `approve`, `reject`, `delete`, `update`) is already encoded and goes
  unchanged; `ruleList` encodes a typed folder with `encodeFolderPath`; `createPublication.targetFolder` stays
  encoded by its caller (`folders-core.ts`), and the client sends it as given.
- `getPublicationList` and `getPublication` return `… | null | undefined` (`undefined` = 403); the two publication
  pages map `undefined` to `null`.
- The SDK declares the list response as a bare array while Core returns `{ publications: [...] }`; the existing
  `(res.publications ?? [])` read stays, behind one typed cast with a comment, and a spec pins the object shape.
- **BREAKING (internal):** the duplicated `CorePublication`, `CorePublicationInfos` and `CorePublicationRulesResponse`
  are removed. `mapPublicationBase`, `resolvePublication`, `buildUpdatePlan`, the resolvers and `folders-core.ts` take
  the SDK types; optional `url` / `status` and the `status` and rule `function` literals are handled in `mappers.ts`.
  No defaults are invented and no new validation is added: an unknown rule `function` passes through, a missing rule
  `source` / `targets` stays absent, a list item without `url` or `status` is skipped, and a `get` without `status`
  resolves to `null`.
- The eight `CORE_PUBLICATION_*_URL` constants are deleted.
- Inventory of `src/server/publications/`: it stays hand-written and is recorded in the design — the resolvers and
  `EnrichmentClients` (asset get/put, file / skill / project metadata, file upload) belong to the platform-entity,
  files and skills phases; `listPublishedResources` is unused and not added.

**Non-goals:** the `BaseApi` non-JSON 2xx fix (own change; specs here only pin that empty bodies resolve as
success); moving `createPublication`'s folder encoding into the client; the `EnrichmentClients` calls; the
`GlobalSettings` DTO cleanup; filing the upstream SDK issue (drafted only).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-client`: the SDK-backed call list gains the eight publication calls.
- `publications-core-api`: publication operations go through the SDK; the request-body id rules, the 403 / failure
  contract and the list-response shape become requirements.

## Impact

- Code: `src/server/entities/core-publications-api.ts` and its spec; `src/server/publications/{models,mappers,update}.ts`
  and `resolver/*`; `src/server/folders/folders-core.ts`; `src/constants/publications-core.ts`;
  `src/app/[lang]/publications/page.tsx` and `[id]/page.tsx`; specs for mappers, resolvers, `folders-core`,
  `publications-enrichment`, and the component specs that reach the publication actions (they must run without
  `DIAL_CORE_API_URL`).
- Ordering: independent of the `BaseApi` fix; archive after any open change that MODIFIES the same `core-client`
  requirement.
- No new dependency; uses `@epam/ai-dial-typescript-sdk` `^0.2.1`.
