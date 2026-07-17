## Why

The Query Builder rail offers three ways to author a query — Builder (form), JSON, and SQL — all of
which assume the operator already knows the entity schema and the query language. Newcomers and
occasional users still have to learn the columns, the SQL subset, and the DSL before they can get an
answer. A natural-language assistant lets an operator describe what they want ("total cost by
deployment last 7 days, most expensive first") and get back a ready-to-run query, lowering the barrier
to the analytics data without replacing the precise, hand-authored paths for power users.

A dedicated DIAL application (a QuickApp on DIAL Core) already does the hard part: it maps plain
language to the analytics registry over MCP and emits a SQL query. This change surfaces that app as a
fourth **AI** view in the existing rail. A live probe against the deployed app confirmed the exact
response contract this design is built on (standard OpenAI chat-completions shape; the SQL is returned
inside a fenced ` ```sql ` block in the assistant message content).

## What Changes

- **New AI view** in the Query Builder rail switcher, alongside Builder/JSON/SQL, marked with a spark
  (✨) icon. It is shown **only when the assistant deployment is configured** (see gating below).
- **AI panel**: a heading + explanation, a plain-language textarea, a row of suggested-prompt chips
  that populate the textarea, and a **Generate query** button.
- **Generate** calls the assistant application through a new Core-direct server action
  (`generateQuery`) that posts the message to the QuickApp's `chat/completions` endpoint on DIAL Core.
- **Proposed query display**: the SQL extracted from the assistant reply is shown read-only below the
  input, with a Copy affordance.
- **Automatic load (no Apply step)**: a generated query is loaded immediately. It is translated into
  the builder so the Builder, JSON, and SQL views all reflect it and it can be viewed or edited there;
  when the builder cannot represent it, the raw SQL stays runnable and visible in the SQL view. A hint
  directs the user to switch views or click **Run** (the existing toolbar action). Running uses the
  existing execution paths and renders results in the existing result area — no new result rendering.
- **Gating**: a new `queryAssistantEnabled` feature flag, derived as `analyticsEnabled` AND presence
  of `DIAL_QUERY_ASSISTANT_DEPLOYMENT`. The env var both turns the AI segment on and supplies the
  deployment name. Transport reuses the existing `DIAL_CORE_API_URL`.

## Non-goals

- **No multi-turn chat UI.** The interaction is one-shot: each Generate replaces the previous
  proposal. (The transport keeps the OpenAI `messages`-array contract so multi-turn is a later
  drop-in, but no conversation thread is rendered.)
- **No streaming.** The reply is fetched non-streamed (`stream: false`) with a spinner on Generate.
- **No new translate/hydrate machinery.** Loading a generated query into the builder reuses the
  existing SQL→builder path (`translateSqlToQuery` + `isBuilderRepresentable` + the hydrate helper);
  this change adds no new reverse-translation logic.
- **No forced view switch.** Loading does not move the user off the AI view; they switch views
  themselves to see or edit the query.
- **No changes to the existing Builder/JSON/SQL run/translate behavior.**
- **No new result rendering or charting.** Results flow through the existing result area unchanged.
- **No editing of the proposed SQL in the AI panel.** Operators who want to tweak it can Copy it into
  the SQL view (existing surface).

## Capabilities

### Modified Capabilities

- `analytics`: the Query Builder gains a fourth AI view and a natural-language query-generation path,
  gated behind a new feature flag. Adds requirements for the view switcher option, the AI panel, the
  generate server action + transport, SQL extraction, Apply/Run wiring, and gating.

## Impact

- **New env var**: `DIAL_QUERY_ASSISTANT_DEPLOYMENT` — the assistant app's DIAL Core deployment id
  (resource URL, e.g. `applications/<bucket>/<app>__<version>`), stored raw. Presence gates the
  feature.
- **New feature flag**: `queryAssistantEnabled` on `FeatureFlags` (`models/feature-flags.ts`),
  initialized in `app/[lang]/layout.tsx`.
- **New server client**: `QueryAssistantApi extends CoreApi` (`src/server/core/query-assistant-api.ts`),
  wired in `src/app/api/api.ts` on `DIAL_CORE_API_URL` (same as `assetApi`/`toolsetOpsApi`).
- **New server action**: `generateQuery(messages)` in `src/app/[lang]/query-builder/actions.ts`.
- **New models**: `src/models/analytics/query-assistant.ts` (chat message / completion types); a new
  `Ai` member on the existing `QueryBuilderView` enum.
- **New util**: `extractSql()` (`components/Analytics/QueryBuilder/utils/`), pure + unit-tested.
- **New components**: `QueryBuilder/Ai/AiPanel.tsx` (+ suggested-prompt chips).
- **Modified components**: `QueryBuilder.tsx` (conditional AI segment, applied-SQL state, `onRun` /
  `runDisabled` branch, Copy value), `query-builder/page.tsx` (pass the flag down).
- **i18n**: new keys under `QueryBuilderI18nKey` in `constants/i18n.ts` + `locales/en.ts`.
- **No impact** on other app sections; when the deployment env var is unset the rail is byte-for-byte
  its current three-view self.
