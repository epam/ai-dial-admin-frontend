## Why

Analytics reports a failed read by writing a sentence into the page it was rendering. An operator who
opened `/evaluators` while the enrichment-pipeline read failed gets *"Could not load enrichment rules, so
usage counts are unavailable."* sitting above the grid; the same shape appears on eight other surfaces. Three
problems follow from it.

It is not where the rest of the console reports failures. A failed table read, a failed save, a failed
conversations page already raise an error notification — so the same class of event is reported in two
different places depending on which Analytics screen the operator is on.

It says less than the app already knows. Every one of these messages is a fixed English sentence this app
wrote. The service's own `errorHeader`, `errorMessage` and `requestId` are read by `BaseApi` and then
discarded, because the read methods these pages call return `T | null`. An operator cannot quote a request id
at the team that runs the service, because the console never showed one.

It competes with the content for space. The sentence is inserted into the page's own column flow, so it
shifts the grid down on arrival and back up on the next successful read.

## What Changes

- **Analytics read failures are reported by notification.** The nine inline failure texts listed under
  *Impact* are replaced by an error notification. Notifications already do not auto-dismiss
  (`getErrorNotification` passes `duration: null`), so the report stays until the operator closes it.
- **The notification carries what the service said.** Its title is the service's `errorHeader`, its body the
  service's `errorMessage`, and it carries the `requestId` — falling back to the existing fixed string only
  where the service supplied none. This is the shape `ContainerNodePool` already uses for a failed node-pool
  read.
- **Analytics reads carry their error envelope.** `AnalyticsDataApi`'s read methods move from `T | null` to
  `ServerActionResponse<T>` so `errorHeader` / `errorMessage` / `requestId` survive the call. `BaseApi`
  already offers `getAction` for exactly this. The HTTP 403 distinction `PipelineReadResult` exists to carry
  is preserved through the envelope's `status`, and `PipelineReadResult` is retired.
- **A server-rendered failure reaches the notification through one shared hook.** Six of the nine failures are
  detected while the page renders on the server, where no notification can be raised. A new client hook
  raises it once when the view mounts, and again only when the failure changes — not on every re-render.
- **Two surfaces keep a statement in place as well**, because the notification is not next to what the
  operator is looking at:
  - the enum column's value filter states the service's message in its existing live region — kept distinct
    from its empty state, since "no values" asserts something a failed read never established;
  - the hop inspector keeps a note where the body would have been, worded distinctly from a withheld body
    and from a hop that recorded nothing;
  - the evaluator's Pipelines tab states that the referencing pipelines are unavailable rather than going
    blank, which would read as "no pipeline references this evaluator".
  In each the request id and the error header move to the notification, which is what persists after the
  popup, panel or tab is left.
- **One duplicate is removed.** `PipelinesView` already raises a notification for a failed listing *and*
  renders the sentence; only the sentence goes.

## Capabilities

### New Capabilities

None. This changes how existing Analytics surfaces report a failure, not what the console can do.

### Modified Capabilities

- `analytics`: the API layer requirement changes — read endpoints return `ServerActionResponse<T>` rather
  than `T | null`, and refusal is carried by the envelope rather than by `PipelineReadResult`. A new
  requirement states where an Analytics read failure is reported and what the report says.
- `analytics/evaluators`: the listing's and the detail page's failed reads are reported by notification
  rather than "stated on the page"; the Pipelines tab's failed read likewise.
- `analytics/pipelines`: the listing's failed read is reported by notification rather than stated on the
  page; the create modal's failed evaluator read likewise; a refusal keeps rendering `Page403` and now
  explicitly raises no notification. The Audit tab is untouched — its grid already replaces the content with
  its own error state, which the new requirement excludes by rule rather than by naming that tab.
- `analytics/conversations-listing`: the schema prefetch failure is reported by notification, replacing the
  rationale that "a server component cannot raise a toast"; the value filter's failed state is re-specified
  as notification plus an unavailable statement.
- `analytics/conversation-trace-detail`: a hop body read failure is reported by notification, and the
  inspector's one-treatment rule for absence notes is narrowed to statements about absence rather than
  failure.

## Impact

Nine failure sites, all under `apps/ai-dial-admin/src/components/Analytics/`:

| Surface | Current inline text |
| --- | --- |
| `Evaluators/EvaluatorsView.tsx` | evaluators listing read failed |
| `Evaluators/EvaluatorsView.tsx` | enrichment-pipeline read failed, so usage counts are unavailable |
| `Evaluators/EvaluatorDetailView.tsx` | version list read failed |
| `Evaluators/EvaluatorPipelinesGrid.tsx` | referencing-pipelines read failed |
| `Pipelines/PipelinesView.tsx` | pipelines listing read failed (**duplicate** — notification already raised) |
| `Pipelines/Enrich/EnrichSection.tsx` | evaluators read failed |
| `ConversationsTrace/Toolbar/ConversationsToolbar.tsx` | entity schema read failed |
| `ConversationsTrace/Detail/Inspector/HopStateNote.tsx` | hop body read failed |
| `ConversationsTrace/List/ConversationValueFilter.tsx` | column values read failed |

Also touched:

- `src/server/analytics/analytics-data-api.ts` — read methods return `ServerActionResponse<T>`
- `src/models/analytics/pipeline.ts` — `PipelineReadResult` retired
- `src/app/[lang]/{evaluators,pipelines,conversations-trace}/actions.ts` — envelope propagated
- `src/app/[lang]/evaluators/page.tsx`, `evaluators/[name]/page.tsx`, `pipelines/page.tsx`,
  `pipelines/[name]/page.tsx`, `conversations-trace/page.tsx` — pass the failure's message rather than a
  boolean
- a new shared client hook next to the other Analytics hooks
- `src/constants/i18n.ts` and `src/locales/en.ts` — the retired sentences, and the one new string the value
  filter needs
- co-located specs for each touched component

Not touched: `src/components/Runs/` carries the same inline pattern in four places and is explicitly out of
scope.

## Non-goals

- **Turning an empty surface into a notification.** Where the failure text *is* the whole content — the query
  builder's entity and schema failures, a conversation that could not be read, a trace that could not be
  read, the trace listing's failure, the conversations grid's empty state — the statement stays. A dismissed
  notification would leave a blank surface with nothing to explain it.
- **Form validation.** A required output variable, an invalid JSON body, a non-truncatable group key and the
  evaluator field's own error stay inline; they are not reports of a failed request.
- **Backend-recorded errors.** `state.last_error` on a pipeline, and a failed hop's own error message in the
  inspector, are values the service returned. They are data this console displays, not failures it suffered,
  and they stay where they are rendered.
- **Retry affordances.** This change moves where a failure is reported. It adds no retry control.
- `src/components/Runs/` — the same pattern, deliberately left for a separate change.
