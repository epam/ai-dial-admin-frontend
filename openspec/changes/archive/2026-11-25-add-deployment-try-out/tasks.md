# Tasks

No browser-verification task: declined by the user. Scenarios are covered by the unit and component tests in group 7.

## 1. Shared `components/TryOut/` folder (move only, no behavior change; own commit)

- [x] 1.1 `git mv` `CollapsibleSection.tsx` and `TryOutEventsSection.tsx` from `components/TestSuites/RequestTemplate/components/` to `components/TryOut/components/`, and `utils/tryout-json-editor.ts` from `components/TestSuites/utils/` to `components/TryOut/utils/`, each with its spec. Rewrite imports to the `@/` alias in `TestSuites/` and `EntityView/Modals/Delete/Delete.tsx`.
- [x] 1.2 Read `ParamsTab.tsx` and `BodyTab.tsx` for Eval coupling. If coupled, turn the Eval part into a prop and move them (with specs) to `components/TryOut/components/`; if not, leave them and import them in place. Record which in the PR. Outcome: `BodyTab` is coupled to Jsonata and form-data, so it stays; `ParamsTab` stays and is reused in place with a request-template-shaped value for headers and query, with the body edited in `JsonEditor` directly.
- [x] 1.3 Add `components/TryOut/constants.ts` and `models.ts`, moving any constants and types the moved files share. Outcome: the moved files share no constants or types, so the two files are created in the groups that first need them (3 and 4).

## 2. Extract duplicated Try out shell pieces

- [x] 2.1 Add `TryOutHeader` (title, Send, `CloseButton`) and `useCloseTryOutSidebar` to `components/TryOut/`, from the copies in `TestSuites/RequestTemplate/components/TryOut.tsx` and `Tools/Tool/TryOut.tsx`. Switch both to them.
- [x] 2.2 Extract the response panel inline in Eval `TryOut.tsx` (`TryOutResponseBody`) into `components/TryOut/components/` and use it from Eval.
- [x] 2.3 Split `TryOutButton.tsx` into a generic sidebar-opening button in `components/TryOut/` and the Eval wrapper that keeps its `TestSuite` and `SaveValidationContextProvider` handling. Outcome: the two buttons differ visually, so only the sidebar-opening logic is shared (`useOpenTryOutSidebar`), used by the Eval and Toolset buttons.
- [x] 2.4 Update the specs of the changed Eval and Toolset components; they must pass with only import and mock-path edits.

## 3. Grafana trace-by-id link

- [x] 3.1 Add `buildTraceUrl(config, traceId)` in `utils/grafana/` (Explore URL for one trace, same datasource and org handling as `buildApplicationTracesUrls`) and `parseTraceparent` in `utils/grafana/`, which returns the trace id or `null` for a missing or malformed header.
- [x] 3.2 Add the `TryOutTraceLink` component in `components/TryOut/components/` (opens in a new tab with `noopener,noreferrer`, icon `aria-hidden`, renders nothing without a config or trace id), and the i18n keys.

## 4. Streaming proxy route

- [x] 4.1 Add `app/api/deployments/try-out/route.ts`: fixed table mapping the three interfaces to Core paths (constant in `components/TryOut/constants.ts` or a server constants file), 400 for any other interface, header deny-list, the admin's own `authorization` set last, query forwarding, `requestRegistry` registration, abort on client cancel and an upstream timeout, upstream status and body returned as a stream, the trace URL (from `traceparent` and the Grafana config) returned in `X-Try-Out-Trace-Url`.
- [x] 4.2 Add the client helper that calls the route and exposes the response stream, status and trace id.

## 5. Deployment Try out panel

- [x] 5.1 Add per-interface request builders in `components/TryOut/Deployment/` (chat completions, Responses, Messages with `max_tokens`) and the interface list derived from `Deployment.interfaces`.
- [x] 5.2 Add the shared request state (message, headers, query, body) with Simple and Advanced views, rebuild on interface change or Reset, JSON validity gating, and Send/Stop handling.
- [x] 5.3 Add the panel: `TryOutHeader`, interface and mode controls with ARIA state, streamed response and events via the shared components, the access-error classification (403/404, other 4xx, 5xx, network), the live status region, and the unavailable message for a deployment with no supported interface.
- [x] 5.4 Add i18n keys to `src/locales/en.ts` and the matching enum in `src/constants/i18n.ts`.

## 6. Entry points

- [x] 6.1 Add `DeploymentTryOutButton` and pass it as a header child, after Delete and after `ApplicationGrafanaLinks`, in `Assets/Platform/Models/View.tsx`, `Assets/Platform/Applications/View.tsx` and `Assets/Entities/Apps/View.tsx` (the config-file `Models/View` and `Applications/View` are deliberately left out), hidden under the same conditions as the Grafana dropdown. Check `Assets/Platform/Models` for a model details header and add it there if one exists. Outcome: `Assets/Platform/Models` does have the header and is wired.
- [x] 6.2 Superseded by design decision 5: the route builds the trace URL, so no page passes Grafana config. Nothing to do beyond 4.1.

## 7. Tests

- [x] 7.1 Unit tests: `parseTraceparent`, `buildTraceUrl`, the three request builders, interface derivation, the access-error classifier, the route's header deny-list and path table.
- [x] 7.2 Route tests: own-token injection, supplied `authorization` ignored, unsupported interface rejected, status and stream passthrough, trace URL header present only with Grafana config and a valid `traceparent`, abort on cancel.
- [x] 7.3 Component tests for the panel: interface gating, Simple send, Advanced shared state and edits surviving mode switches, invalid JSON, streaming and Stop, each error class, trace link present and absent, live region. Query by role and name only.
- [x] 7.4 Entry-point tests: button position and visibility on each of the four views.
- [x] 7.5 Confirm the Eval and Toolset Try out specs are green; run `npm run typecheck` and `npm run typecheck:specs` at zero.

## 8. Docs and quality gates

- [x] 8.1 Update `docs/` pages that describe Try out or the Grafana links, and add the Core interface paths and the route to the relevant doc. Outcome: no `docs/` page describes Try out or the Grafana links, so the only doc change is registering the `TryOut` folder in `docs/areas.md`.
- [x] 8.2 Run lint, format check, both typechecks and the full test suite, and fix what they report.
