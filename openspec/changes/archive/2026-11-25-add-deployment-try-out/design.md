# Design

## Context

See proposal.md for motivation and scope. Constraints from the current code and from Core:

- Core serves the three interfaces at `POST /openai/deployments/{name}/chat/completions`, `POST /openai/v1/responses` and `POST /anthropic/v1/messages`. For Responses and Messages the deployment is the `model` field of the body, not the path. A deployment's served interfaces are in `Deployment.interfaces` (the read-only `DeploymentApiInterface`).
- Core returns `traceparent`, `X-DIAL-TRACE-ID` and `X-DIAL-SPAN-ID` as response headers when a tracing SDK is attached, and omits them otherwise. It records an incoming `traceparent` only as the attribute `dial.request.parent_span.id`.
- The admin frontend never calls Core's inference endpoints today. Eval Try out goes through the Eval backend; Toolsets Try out is a server action that returns one JSON value. Streaming exists only as Next route handlers (`app/api/sse`, `app/api/runs/status-stream`).
- Header actions are a `children` slot on `SimpleEntityHeader` (models, platform applications, applications) and `AssetHeader` (asset applications); `ApplicationGrafanaLinks` already uses it. The sidebar is `AppContext.sidebar.showSidebar` / `closeSidebar`, as in the Toolsets and Eval Try outs.
- `core-api.ts` strips any caller-supplied `authorization` before adding the user's own (`withAuthorization`). `DIAL_CORE_API_URL` is the Core host.

## Goals / Non-Goals

**Goals:**
- One Try out component shared by every details page that shows it, so the button, sidebar and error handling cannot drift between models and applications.
- The signed-in admin's token is the only credential, so Core's access rules are the only access rules.

**Non-Goals:**
- A second request format. Advanced mode edits the same request that Simple mode builds.

## Decisions

### 1. Streaming route handler, not a server action

`POST /api/deployments/try-out` takes `{ interface, deployment, headers, query, body }`, calls Core with `fetch`, and returns the upstream body as a stream with the upstream status. The browser reads it with `fetch` and a stream reader.

- *Server action* — rejected: it returns one serialized value, so SSE could not be shown as it arrives.
- *Calling Core from the browser* — rejected: the token is held server side (`getUserToken`), and Core's CORS and the deployment's network position are not the browser's.

The handler follows `app/api/sse/route.ts` (token via `getUserToken`, `requestRegistry` so an in-flight request is aborted on logout, `AbortError` → 499). Client cancel aborts the upstream fetch.

### 2. The proxy builds the Core URL; the client never supplies it

The handler maps `interface` to a fixed Core path from a constant table and substitutes the deployment name for chat completions. A request naming any other interface is rejected with 400. This keeps the proxy from being an open relay to arbitrary Core or intranet paths.

Caller headers are passed through a deny-list: `authorization`, `host`, `content-length`, `cookie` and hop-by-hop headers are dropped, and the admin's own `authorization` is set last, as `withAuthorization` does. Query parameters are forwarded as given.

### 2a. Which interfaces to offer, and the deployment id

The panel reads the deployment's reported `interfaces` from Core with the admin's token (`getTryOutInterfaces`, via `checkDeploymentByName`) rather than re-deriving them from the entity config, because Core's rule for "declared" includes legacy endpoints and translators. Core reports `chat` for legacy chat completions and `openaiChatCompletions`, `openaiResponses`, `anthropicMessages` for declared ones; `chat` and `openaiChatCompletions` both mean chat completions. When the list cannot be read (hidden, missing or Core did not answer) every supported interface is offered and the real request reports the problem, which keeps the button free of a pre-check.

Core's deployment id spans slashes, so the chat completions path encodes each segment and keeps the slashes, and rejects empty, `.` and `..` segments. An application stored as a resource is called by `applications/<bucket-qualified path>`, a platform model by its canonical id `models/platform/<name>`, and a config-file application by its name. While the interfaces are being read the panel shows a loader rather than a form that may then be replaced by the unavailable message.

### 3. Access is Core's decision; the UI classifies the status

No pre-check. The route returns Core's status and body unchanged, with a small `X-Try-Out-*` envelope only for the trace id (decision 5). The sidebar shows a no-access message for 403 and 404, the upstream error text for other 4xx, and a generic failure for 5xx and network errors. A 404 is treated as no-access because Core answers a deployment the caller may not see the same way as one that does not exist, and the message names both.

### 4. Interface gating and request building

The sidebar offers the intersection of `Deployment.interfaces` and the three supported types. A deployment declaring none of them still shows the button; the sidebar then says Try out is unavailable for it.

Simple mode holds `{ message }`, and a per-interface builder turns it into the body: `messages: [{role: "user", content}]` for chat completions and Messages (plus `max_tokens` for Messages, which Anthropic requires), `input` for Responses, with `stream: true`. Advanced mode shows the built request as headers, query and JSON body for editing. Editing the body in Advanced mode stops the builder from overwriting it; changing the interface or the message, or pressing Reset, rebuilds it. One request state backs both views.

### 5. Trace link from the response header

The route parses Core's `traceparent` response header (`parseTraceparent` in `utils/grafana/`). When it yields a trace id and `getGrafanaConfig(process.env)` is non-null, the route builds the Grafana URL with `buildTraceUrl` and returns it to the browser in an `X-Try-Out-Trace-Url` response header; otherwise it sets no header. The panel shows "Open trace" (`TryOutTraceLink`) only when that header is present. The link is available as soon as the headers arrive, so it works during a stream.

Building the URL on the server keeps `GRAFANA_*` settings out of the client and means no details page has to read the Grafana config and thread it down to the panel (the earlier plan). Sending our own `traceparent` was rejected: Core does not adopt it as the trace id, so the link would point at the wrong trace.

### 6. Shared `components/TryOut/` folder

The criterion for moving a file is "would a second Try out use it unchanged", not "is it named TryOut". Survey of today's code:

| Today | Verdict | Goes to |
|---|---|---|
| `TestSuites/RequestTemplate/components/CollapsibleSection.tsx` (only Eval-typed import is `ViewerContentType`) | generic | `TryOut/components/` |
| `.../TryOutEventsSection.tsx` | generic SSE event list | `TryOut/components/` |
| `TestSuites/utils/tryout-json-editor.ts` | generic Monaco props helper | `TryOut/utils/` |
| `TryOutResponseBody` (inline in Eval `TryOut.tsx`) | generic response panel | extracted to `TryOut/components/` |
| Header row (title, Send, `CloseButton`) and the sidebar-close logic, copied in Eval `TryOut.tsx` and `Tools/Tool/TryOut.tsx` | duplicated | one `TryOutHeader` and one `useCloseTryOutSidebar` hook in `TryOut/` |
| `.../TryOutButton.tsx` (takes a `TestSuite`) | Eval-bound | split: generic sidebar-opening button/hook in `TryOut/`, Eval wrapper stays |
| `TryOutResponse.tsx` (history, per-entry Grafana banner) | Eval-bound | stays; its Grafana banner is a candidate for a shared `TryOutTraceLink` used also by the Deployment Try out |
| `TryOutColumns`, `TryOutRequestPreview`, `TryOutRequestTabs`, `tryout-test-case`, `tryout-storage`, `evaluation/tryout-sections` | Eval-only | stay |
| Toolset `Tools/Tool/TryOut.tsx` form and `SchemaUiRenderer` use | Toolset-only | stays; only the header and close hook are swapped |

`TryOut/` holds `components/`, `utils/`, `constants.ts` and `models.ts`, following the feature-folder rule that constants and models live apart. The Deployment Try out lives in `TryOut/Deployment/` and imports from its siblings, so what is shared is shared by construction. `ParamsTab` and `BodyTab` are reused in place from `TestSuites/RequestTemplate/tabs/`, read for Eval coupling first; where they are coupled, the Eval part becomes a prop and they move into `TryOut/components/` too.

The move is its own first task and its own commit, done with `git mv` so history follows, with specs moved alongside their files and imports rewritten to the `@/` alias. No behavior changes in that step; the Eval and Toolset specs passing with only import-path edits is the acceptance test. The Deployment Try out then builds on the new folder.

### 7. Button placement

A shared `DeploymentTryOutButton` is passed as a child to `SimpleEntityHeader` and `AssetHeader` on the platform model, platform application and asset application views (the config-file `Entities/Models` and `Entities/Applications` pages are out of scope), after Delete and after `ApplicationGrafanaLinks` where present. It follows the rule that governs the Grafana dropdown: it shows where the header shows entity actions, and not while there are unsaved changes, while the JSON editor is open, or for a read-only admin.

## Risks / Trade-offs

- [The proxy lets an admin send arbitrary headers and bodies to Core] → Fixed path table, header deny-list, own token only, so it can do nothing the admin could not do with their token against Core directly.
- [A body can be large or never end, tying up a server connection] → Abort on client cancel and on logout through `requestRegistry`; a request timeout on the upstream fetch.
- [Try out calls count against the deployment's limits and appear in analytics and cost] → Expected and accurate for a real call; the sidebar says the request is a real one.
- [404 shown as no-access can mislead] → Message names both possibilities.
- [Extracting shared Eval components could regress Eval Try out] → Existing Eval specs must stay green, and extraction is limited to props.
- [Trace link missing when the Core has no tracing SDK] → Expected; no link is shown.

## Open Questions

- Whether the sidebar should surface `X-DIAL-*` usage headers such as token counts. It can be added later without changing the specs.
