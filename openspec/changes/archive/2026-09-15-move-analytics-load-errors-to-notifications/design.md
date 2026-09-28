## Context

See `proposal.md` — *Why*. What shapes the approach is where each of the nine failures is *detected*, because
that decides how it reaches a notification.

Three of the nine are detected in the browser, inside a client fetch that already holds the service's answer:
the hop body read, the column value read, and the pipelines listing's client-side re-read. Those can call
`showNotification` where they are.

Six are detected while the page renders on the server. `src/app/[lang]/evaluators/page.tsx`,
`evaluators/[name]/page.tsx`, `pipelines/page.tsx`, `pipelines/[name]/page.tsx` and
`conversations-trace/page.tsx` each `await` a read, catch the failure, and pass a **boolean** to the client
view (`hasLoadError`, `hasUsageError`, `hasSummaryError`, `hasEvaluatorsError`, `hasSchemaError`). A server
component cannot raise a notification, and by the time the view mounts the response is gone.

The boolean is not the only thing lost. `BaseApi.sendRequest` reads a failed response's body, logs it, and
returns `null` (`src/server/base-api.ts:187`), so `errorHeader`, `errorMessage`, `requestId` and `status`
never leave the API layer for any read declared as `T | null` — which is every Analytics read except
`checkAccess` and the `*Action` writes. `BaseApi.handleResponse` already builds all four
(`base-api.ts:210`), and `BaseApi.getAction` already routes a GET through it. The envelope exists; the reads
just do not use it.

One pre-existing shape depends on the discarded status: `PipelineReadResult<T>` (`{ data, isForbidden }`)
exists because `sendRequest` answers HTTP 403 with `undefined` and every other failure with `null`, which is
the only way a caller can currently tell a refusal from a failure.

## Goals / Non-Goals

**Goals:**

- One reporting path for a failed Analytics read, carrying the service's own words.
- One mechanism for turning a server-detected failure into a client notification, used by all six pages.
- A read contract that tells a caller what failed, not merely that something did.

**Non-Goals:**

- Changing `BaseApi`. Everything needed is already on it.
- Retry, backoff, or re-fetch affordances.
- Touching `src/components/Runs/` (see `proposal.md` — *Non-goals*).
- Reworking the `*Action` writes; they already carry the envelope and already notify.

## Decisions

### Reads return `ServerActionResponse<T>`, not `T | null`

`AnalyticsDataApi`'s thirteen read methods change from `T | null` to `ServerActionResponse<T>` by calling
`this.getAction(...)` instead of `this.get(...)`. Listing unwrapping (`{ tables }`, `{ pipelines }`,
`{ items }`) moves inside the successful branch and applies to `response`.

`getAction` returns `ServerActionResponse` whose type parameter defaults to `any`, so a read can narrow its
own return type without a `BaseApi` change and without a cast at the call site.

*Alternatives considered.* A second result type carrying `{ data, error }` — rejected: it is a second answer
to a question `ServerActionResponse` already answers, and every consumer would have to learn which methods
speak which. Threading only `errorMessage` through the existing `T | null` return as an out-parameter —
rejected: it makes the failure a side channel, which is what produced the current situation.

### Refusal is read off `status`, and `PipelineReadResult` is retired

A refusal becomes `{ success: false, status: 403 }`; any other failure carries the service's own status.
`PipelineReadResult<T>` is deleted along with the `res === undefined` check that fed it.

This is a behaviour-preserving swap — both pipeline pages already branch on `isForbidden` to render
`Page403`, and they will branch on `status === 403` instead — but it must land in the same task as the
`getPipelines` / `getPipeline` signature change, because the `undefined`-vs-`null` distinction
`PipelineReadResult` reads disappears the moment those two calls stop going through `sendRequest`.

A refused read raises **no** notification: `Page403` is the whole report.

### `requestId` is the response's `traceparent`, not a locally generated id

`handleResponse` populates `requestId` from the response's `traceparent` header. The uuid
`sendActionRequest` generates is a cancellation-registry key and never reaches the caller. So a failure
whose response carried no `traceparent` has no request id to show, and the notification simply omits it —
`getErrorNotification` already accepts it as optional.

### A page hands the view the failure, not a flag

Each of the six pages replaces its boolean prop with `ReadFailure | null`:

```ts
export interface ReadFailure {
  errorHeader?: string;
  errorMessage?: string;
  requestId?: string;
}
```

It lives in `src/models/server-action.ts`, beside `ServerActionResponse`, because it is that envelope's
failure half and is not Analytics-specific — `Runs` will want the same type when its turn comes.

A page builds it from the unsuccessful envelope. A read that threw rather than resolved has no envelope, so
the `catch` branch builds `{}` — a failure with no words, which the hook reports under its fallback title.

*Alternative considered.* Passing the whole `ServerActionResponse` down. Rejected: it hands a client view
the success path and the payload it already receives as a separate prop, and invites a view to re-derive data
from it.

### One hook raises the notification, keyed on the failure's content

`src/hooks/use-read-failure-notification.ts`:

```ts
useReadFailureNotification(failure: ReadFailure | null, fallbackTitleKey: string): void
```

It calls `showNotification(getErrorNotification(failure.errorHeader ?? t(fallbackTitleKey),
failure.errorMessage, failure.requestId))` from a `useEffect` whose dependency is a **string key** derived
from the failure's own members, not the object. A server component builds a fresh object on every render, so
depending on the reference would re-raise the notification on every navigation and every re-render; depending
on the content raises it once per distinct failure and again when the failure changes.

It lives in `src/hooks/` rather than under `components/Analytics/` because three sibling feature areas use
it and it holds no Analytics domain knowledge (`components.md` §4: push generic mechanisms down, keep domain
logic in the feature).

A surface that detects its failure client-side does **not** use the hook — it already holds the envelope
inside its own `catch`/`!success` branch and calls `showNotification` there, which is what
`TablesView.tsx:55` and `use-conversations.ts:129` already do.

*Alternative considered.* A provider that collects failures and reports them centrally. Rejected: it adds a
second notification pipeline beside `NotificationContext` for no behaviour the context does not already give.

*Alternative considered.* Raising the notification from the page's own `catch` via a server action. Rejected:
notifications are client state; a server component has no access to the provider.

### Two surfaces keep a statement, and it says only that there is nothing to show

The evaluator's **Pipelines** tab and the hop inspector have no content to render once their read fails, and
their neighbouring states — "no pipeline references this evaluator", "this body was withheld", "this hop
recorded nothing" — are the exact readings a blank surface would invite. Each keeps a short statement in
place; the cause, the message and the request id move to the notification.

The column **value filter** keeps its existing live region and states the service's message there, falling
back to a fixed string. The popup closes on the next click, so the notification is what persists; the
in-place text is what the operator reads without leaving the control they just opened. Its failed state is
**not** folded into the empty state — "no values" asserts something a failed read never established.

### Retired and retained strings

`AnalyticsPipelines.PipelinesLoadFailed`, `AnalyticsEvaluators.EvaluatorsLoadFailed`,
`AnalyticsEvaluators.UsageLoadFailed`, `AnalyticsEvaluators.VersionListFailed` and
`ConversationsTrace.SchemaUnavailableNotice` stay in `i18n.ts` / `en.ts` as the **fallback titles** the hook
uses; only their inline render sites go. `AnalyticsEvaluators.UsedByLoadFailed`,
`ConversationsTrace.InspectorLoadFailed` and `ConversationsTrace.ValueFilterLoadFailed` are reworded to state
an absence rather than a cause, since they now sit beside a notification that carries the cause. Wording is
settled per surface in the spec deltas.

### Tests assert the call, with a locally stable mock

`test-setup.tsx` mocks `useNotification` with a fresh `vi.fn()` per call, which cannot be asserted against.
The established pattern is a per-spec override holding a stable mock — `ActivityAudit/List/tests/List.spec.tsx:24`
is the exemplar. Specs for these surfaces follow it; `test-setup.tsx` is left alone, so no existing spec
changes behaviour.

## Risks / Trade-offs

- **Two failed reads on one page raise two notifications.** The evaluators listing page reads evaluators and
  enrichment pipelines; a service outage fails both. → Accepted: they are two distinct failures with two
  distinct messages, and collapsing them would report one cause for two reads.
- **The hop inspector reads one body through four paths** — request, response, raw, and each opened message —
  so an outage reaches the reporter several times per hop. → Each path dedupes on the failure's content, so a
  repeated identical failure inside one path is reported once. Across paths the request and response reads
  hold separate marks, so an operator who opens the Response tab during an outage can see a second report of
  the same cause; the alternative was a shared module-level mark, which would then swallow the same failure
  recurring after a recovery.
- **A report is lost when the reporting component unmounts.** The evaluator's Pipelines tab is mounted only
  while that tab is open, so a report raised there would repeat on every return to it. → The referencing-read
  failure is reported by `EvaluatorDetailView`, which stays mounted across the tab switch; the tab keeps only
  its in-place statement. Any future surface behind a tab needs the same treatment.
- **React StrictMode runs an effect twice in development**, which would show the notification twice. → The
  content key plus a "last reported key" ref makes the second run a no-op. Worth a spec.
- **73 read call sites change shape**, and a missed `== null` check silently reads a failure as an empty
  result. → `tsc -p tsconfig.app.json` catches every one: the return type changes, so an unmigrated caller
  does not compile. The spec project is excluded from that gate (`AGENTS.md`), so spec fixtures typed against
  the old shape must be migrated in the same task as their production call site, not left to
  `typecheck:specs`.
- **A 403 on a read that is not a pipeline read** now surfaces as `status: 403` where the caller previously
  saw `null`. → Those pages have no refusal branch and treat it as a failure, exactly as they do today; the
  only behavioural difference is that the notification now carries the service's 403 message. Where a page
  does gate on refusal, it renders `Page403` and raises nothing.
- **The `requestId` an operator sees depends on the service emitting `traceparent`.** → Nothing to mitigate
  here; the notification omits what the response did not carry, and the message alone is still more than the
  fixed sentence it replaces.
- **A dismissed notification is gone for good** — there is no history. → This is why the two replaced
  surfaces keep a statement in place, and why the empty-state surfaces in `proposal.md` — *Non-goals* are not
  converted at all.

## Migration Plan

No data migration and no deploy coupling — this is a client and server-action change inside one Next.js app.
The API-layer signature change and the retirement of `PipelineReadResult` must land in one task with their
call sites, since the type gate is what proves the migration complete. Rollback is a revert.
