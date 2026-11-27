# Tasks

## 1. Deployment ids (issue #5698)

- [x] 1.1 Confirm in `Assets/Platform/Applications/View.tsx` and its data what `_metadata.path` holds for a platform application, then add a platform-application id helper to `components/TryOut/Deployment/utils/get-asset-deployment-id.ts` that returns the short name, and make `getPlatformModelDeploymentId` return the short name; verify with updated specs in `utils/tests` covering platform model, platform application and other-bucket application ids
- [x] 1.2 Pass the new ids from `Assets/Platform/Models/View.tsx` and `Assets/Platform/Applications/View.tsx` (the `Assets/Entities/Apps/View.tsx` id is unchanged); verify with the existing View specs (`View.try-out.spec.tsx`, `Applications/tests/View.spec.tsx`, `Apps/tests/View.spec.tsx`) asserting the `deployment` prop per entity kind
- [x] 1.3 Correct the "canonical id" wording in the `getPlatformModelDeploymentId` doc comment and in `openspec/specs/deployment-try-out/spec.md` once the delta is synced; verify no remaining reference to `models/platform/` in the Try out code or spec

## 2. Embeddings interface

- [x] 2.1 Add `OpenAIEmbeddings` to `TRY_OUT_INTERFACES`, map `embedding` and `openaiEmbeddings` to it in `REPORTED_INTERFACE_TYPES`, add its label in `TRY_OUT_INTERFACE_LABELS` and the `DeploymentTryOutI18nKey` / `locales/en.ts` entries, and drop the "Embeddings is deliberately absent" comment; verify with `get-supported-interfaces` specs: an `embedding` report yields only embeddings, a `chat` report never yields it
- [x] 2.2 Add the embeddings path to `CORE_INTERFACE_PATHS` in `server/try-out/constants.ts` (deployment id in the path, same safety check as chat completions) and widen `isTryOutInterface` / `getCorePath` accordingly; verify with `build-core-request` and route specs: embeddings reaches `/openai/deployments/<id>/embeddings`, an unknown interface is still rejected without a Core call
- [x] 2.3 Build the embeddings Simple-mode body (`{ input: message }`, no `stream`) in `utils/build-request-body.ts`; verify with `build-request-body` specs, and with a `DeploymentTryOut` spec that sending with embeddings shows the JSON reply and no events section

## 3. Interface lookup and unavailable reasons (issue #5701)

- [x] 3.1 Add a status-preserving deployment-info call to `server/core/core-utility-api.ts` through `sdkAction`, leaving `checkDeploymentByName` untouched; verify with `core-utility-api` specs for 200, 403, 404, 5xx and a network error
- [x] 3.2 Change `getTryOutInterfaces` in `app/actions/try-out.ts` to return `{ interfaces }` or a classified failure with its status (reusing `classifyTryOutFailure`); verify with `actions/tests/try-out.spec.ts` for each outcome
- [x] 3.3 Add the lookup state and unavailable-reason enums and models (`models.ts`, `constants.ts`), a pure function that maps reported interfaces to supported interfaces or an unavailable reason (`mcp` only, `custom_ui` only, anything else), and rewrite `use-deployment-try-out.ts` to expose one lookup state plus a retry; remove `isInterfacesUnknown` and the all-interfaces fallback; verify with hook and util specs for loading, ready, each reason, each failure kind, retry, and "callable interface wins over `mcp`"
- [x] 3.4 Render the states in `DeploymentTryOut.tsx`: loader, form, a reason message per unavailable case, lookup-failure message with a Retry control only for network and server failures, status code shown where there is one; remove `InterfacesUnknownNote` and the old `Unavailable` text, add the new keys to `constants/i18n.ts` and `locales/en.ts`, announce outcomes through the existing live region, and keep Send only in the ready state; verify with `DeploymentTryOut.spec.tsx` by role and key for every scenario in the delta spec, including "no could-not-be-read note" and "Retry reads again"

## 4. Specs and docs

- [x] 4.1 Sync the delta into `openspec/specs/deployment-try-out/spec.md` and update any `docs/` page that describes Try out interfaces; verify `openspec validate fix-deployment-try-out-ids-and-interfaces` passes and `grep -rn "could not be read" docs openspec/specs` finds nothing

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`; verify all exit 0 with the spec typecheck still at zero errors

## Workflow follow-up

- Archive the change after review (`/opsx:archive`).
