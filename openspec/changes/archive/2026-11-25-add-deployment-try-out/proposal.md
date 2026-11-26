# Proposal

## Why

An admin cannot send a test request to a model or application from the admin panel. To check that a deployment works after creating or changing it, they leave the panel for the chat or an external client. Issue #5627 asks for a built-in Try out for the three main LLM interfaces: chat completions, Responses and Messages.

## What Changes

- Add a **Try out** button to the details pages of platform models, platform applications and asset applications, in the header actions after Delete (and after the Grafana traces dropdown where the page has one). The button is always visible; it does no access pre-check.
- The button opens the existing right sidebar (the one the Toolsets and Eval Try outs use). While the deployment's interfaces are being read it shows a loader, then either an interface selector listing only the interfaces the deployment declares, among `openaiChatCompletions`, `openaiResponses` and `anthropicMessages`, or a message that Try out is unavailable.
- **Simple mode** (default): pick the interface, type a message, send, read the reply, streamed when the interface streams.
- **Advanced mode** (opt-in): custom request headers, query parameters and a raw JSON body, reusing the Eval request-template tabs (`ParamsTab`, `BodyTab`). Both modes share one request state, so switching never loses what was typed.
- Add a streaming Next route handler that forwards the request to Core with the signed-in admin's own token and relays the response (including SSE) back. No service credential is used, so Core's own access rules decide what an admin can test.
- When Core refuses the request for access reasons (403/404), the sidebar says the admin has no access to this deployment, distinct from other failures (5xx, network).
- When Grafana is configured and Core returned a `traceparent`, show an "Open trace" link to that request's trace. Otherwise show no link.
- **Refactor, no behavior change:** create `apps/ai-dial-admin/src/components/TryOut/` and move into it every component, util and constant that more than one Try out can share. Today these live inside `TestSuites/` (Eval) or are duplicated in `Tools/Tool/TryOut.tsx`. The Deployment Try out is built on that folder from the start; the Eval and Toolset Try outs are repointed to it. Code specific to one Try out stays with its feature.

## Capabilities

### New Capabilities

- `deployment-try-out`: the Try out button, sidebar, simple and advanced modes, interface gating, streaming proxy, access-error reporting and trace link for models and applications.

### Modified Capabilities

- `application-grafana-trace-links`: add a by-trace-id link builder and a requirement for where the Try out trace link appears. No change to the existing per-application links.

## Impact

- New: Try out sidebar components, a streaming route handler under `src/app/api/`, a request builder per interface, i18n keys, tests.
- Changed: the header-action area of the platform model, platform application and asset application details views, `src/utils/grafana/` (trace-by-id URL).
- Reused, not duplicated: the sidebar mechanism in `AppContext`, `ParamsTab` and `BodyTab`, `get-grafana-config.ts`, `getUserToken`, and the shared pieces moved into `components/TryOut/` (see design.md, decision 6).
- Moved files: `CollapsibleSection`, `TryOutEventsSection`, `tryout-json-editor`, and the generic response body and button shell, with their specs. Import paths change in `TestSuites/` and `Tools/Tool/`; no exports are public outside the app.
- Shared-component risk: the Eval and Toolset Try outs consume what moves. Their existing specs must pass unchanged, apart from import paths.
- Backend: none. Core's existing inference endpoints are called as they are: `/openai/deployments/{name}/chat/completions`, `/openai/v1/responses`, `/anthropic/v1/messages`.

## Non-goals

- Embeddings (`openaiEmbeddings`) and the legacy `/completions` route.
- Try out on config-file models and applications (the `Entities/Models` and `Entities/Applications` pages).
- Moving code that only one Try out uses (Eval's columns, request preview, turn tabs, test-case and storage helpers; Toolset's schema form) or changing what any existing Try out does.
- Handing off to Eval test suites, or saving a Try out request as a test case.
- An access pre-check or hiding the button by permission.
- Multi-turn conversation history, file or image attachments, tool-call round trips.
- Sending a client-generated `traceparent`; the trace id is read from Core's response.
