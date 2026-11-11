## 1. Source model and resolution

- [x] 1.1 Add the `SessionsSourceSetting` and resolved `SessionsSource` interfaces to `src/models/analytics/sessions-source.ts`, a `SessionsRole` enum, and the default binding plus the per-role accepted field types to `src/constants/analytics/sessions-source.ts`
- [x] 1.2 Add a pure `resolveSessionsSource(setting, schema)` util in `src/utils/analytics/sessions-source.ts`: default binding when the setting is absent, each role resolved against the schema, required-role failure naming the role and field, enrichment namespaces listed in schema order
- [x] 1.3 Add `src/server/analytics/sessions-source-api.ts` with read and write of the instance setting, returning the service's header, message and request id on failure as the other analytics clients do
- [x] 1.4 Unit tests for 1.2 and 1.3

## 2. Sessions pages read through the source

- [x] 2.1 Resolve the source in `src/app/[lang]/sessions/page.tsx` and the session detail page, pass it to the client views, and report a required-role failure as a page error before any session query
- [x] 2.2 Replace `SESSIONS_ENTITY` and the role members of `SessionsField` in `src/utils/analytics/sessions-queries.ts` and `src/app/[lang]/sessions/actions.ts` with the source's base entity and role fields; drop the project predicate from the trace paging query when the Project role is absent
- [x] 2.3 Hide the cost pill and Cost column without a Cost role, the turns figure and Turns column without a Turns role, and fall back to the session id in the identity column and detail header without a Title role
- [x] 2.4 Record the base table of the saved column state of `SESSIONS_STORAGE_KEY` in a marker and drop a mismatching state on load in `SessionsList.tsx`, treating a missing marker as saved for `sessions`
- [x] 2.5 Unit tests for 2.2–2.4

## 3. Enrichments without fixed names

- [x] 3.1 Add the rating field signature to `src/constants/analytics/sessions-trace.ts`, a util that finds the first namespace carrying it, and remove `INSIGHTS_ENRICHMENT`
- [x] 3.2 Key the projection class in `session-column-catalog.ts` on any enrichment field, and assign provenance colours by namespace order in the provenance line and grid band
- [x] 3.3 Turn the insights panel into a generic enrichment panel rendered once per namespace except the rating one, titled by the enrichment's catalog display name or namespace, with field labels and tag grouping per the spec in a pure util shared with the metadata panel
- [x] 3.4 Unit tests for 3.1–3.3

## 4. Ratings from enrichments

- [x] 4.1 Replace the feedback filter's candidate query with a predicate on the session query over the rating enrichment, and remove the candidate cap and its disclosure
- [x] 4.2 Render the Rating column from the row's rating enrichment fields, remove the post-page ratings query, and exclude the composed fields from the derived column catalog
- [x] 4.3 Resolve the rated and negative pills by aggregating the rating enrichment over the base entity, and hide them and the filter and column when the schema reports no rating enrichment
- [x] 4.4 Read the detail feedback panel's figures from the session record and its rated-response list from the usage log's response rating enrichment; join card and span ratings on each row's own response id, once per response per trace
- [x] 4.5 Remove the `response_ratings` reads and `FEEDBACK_ENTITY`
- [x] 4.6 Unit tests for 4.1–4.4

## 5. Settings tab

- [x] 5.1 Add Sessions source server actions to `src/app/[lang]/system-properties/actions.ts` over the API client from 1.3
- [x] 5.2 Add the Sessions source tab to the System Properties view, shown only when Analytics is enabled, with its own dirty state, Save and Discard: base-table picker, six type-filtered role pickers, required-role validation, roles cleared on a table change, the compatibility caveat, success and error notifications
- [x] 5.3 Add the i18n keys to `src/constants/i18n.ts` and `src/locales/en.ts`
- [x] 5.4 Unit tests for 5.1 and 5.2

## 6. Docs and deployment

- [x] 6.1 Add the `analytics/sessions-source` row to the routing table in `openspec/specs/analytics/spec.md`, and update the sub-capability count in `AGENTS.md` and `openspec/config.yaml`
- [x] 6.2 Add an `INFRA-CHANGELOG.md` entry stating the analytics-service version as a prerequisite and the rating field signature an enrichment needs

## 7. Verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change against the local app and resolve every `fail` verdict
- [x] 7.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`
