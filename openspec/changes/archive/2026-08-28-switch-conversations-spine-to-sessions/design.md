## Context

See `proposal.md` — Why. Three measured facts shape everything below; all were checked against the dev
instance while this change was written, not inferred from the catalog.

**The two rollups are the same shape.** `sessions_rollup` and `conversations_rollup` read the same
`dial_usage_log` and declare the same measures under the same names. The only difference in the exposed
schema is the grain column (`client_session_id` against `chat_id`) and the enrichment namespace
(`session_insights.` against `conversation_insights.`). Everything else the view projects, sorts, filters or
renders keeps its name and type.

**The ids are the same values.** The identity enrichment resolves a hop's session id as
`chat_id` first, falling back to a harness header, so a chat conversation's session id *is* its chat id. That
is what lets `response_ratings.chat_id` keep joining, and what lets a bookmarked detail URL keep resolving.

**The frontend cannot discover the key.** The entity-schema endpoint the page calls returns `{fields: […]}`
with no identity or grain marker. The catalog does record `identity_column`, but through a different endpoint
the frontend does not read, and `tag: "identity"` is a display grouping carried by four columns on `sessions`.
So the row key stays a frontend constant. This change repoints it; it does not make it dynamic.

## Goals / Non-Goals

**Goals:**

- Repoint the view at `sessions` with the smallest edit that leaves every existing behaviour intact.
- Make an agent session's trace reachable, which is the one thing the rename alone does not buy.
- Keep every hop-log read that works today on the column the hop log is actually indexed by.

**Non-Goals:**

- Any dynamic derivation of the identity field. See Context — the endpoint carries no such signal, and
  inventing one from `tag` would be guessing.
- Curated columns for the session-only fields. They arrive in the catalog through the existing schema path
  and are selectable there; promoting one is separate work.
- Renaming the route, the i18n group or the storage key. See proposal — Non-goals.

## Decisions

### D1 — The identity moves by changing one enum value, not by threading a parameter

`ConversationsField.ChatId` is read by the select, the sort tie-breaker, the search predicate, the
sortable/filterable whitelists, the single-session filter and the Metadata panel. Changing its *value* to
`client_session_id` moves all of them at once and leaves the *symbol* — and therefore every call site —
untouched.

*Alternatives considered.* **Parameterising the queries by an identity field** — passing the key in from the
caller so both entities could be served. Rejected: nothing calls for two spines at once, and the parameter
would have to be plumbed through nine builders to express a constant. **Renaming the symbol as well
(`ChatId` → `SessionId`)** — clearer, but it touches every call site for no behavioural gain and would bury
the four real edits in a rename diff. Worth doing later, on its own.

### D2 — Literal `row.chat_id` reads are the part the enum does not cover, and they fail silently

Three sites read the property off the row object rather than through the enum: the ratings request in
`conversations-trace/actions.ts` and the two lookups in `conversation-rows.ts`. TypeScript catches them only
because `ConversationRow` declares `chat_id` — so the interface field must be renamed *together with* the
enum value, in one edit, or the compiler stops helping and every rating silently fails to match its row.

`conversation-trace-groups.ts` also reads `root.chat_id`, and that one SHALL be left alone: its row comes
from `dial_usage_log`, where `chat_id` is a real column. It does change meaning, though — see D4.

### D3 — The hop log is scoped by whichever column that session's hops actually carry

This is the only decision in the change that is not a rename.

The spec's existing rule — every hop-log read predicates on `chat_id`, which is bloom-filtered alongside
`trace_id` and `core_span_id` — exists because a read predicated on a non-indexed attribute took over 120 s
and took the service down. `usage_client_identity.client_session_id` is an enrichment column and is **not**
one of the indexed three.

So the predicate is chosen per session, from `client_session_source` on the session row the detail view has
already loaded:

- source `chat_id` → predicate on `chat_id`, exactly as today. Every conversation the view reads now keeps
  the indexed path, and the change costs it nothing.
- source a harness header → predicate on `usage_client_identity.client_session_id`. Its hops carry an empty
  `chat_id`, so there is no indexed alternative; this is the read that did not exist before.

*Alternatives considered.* **One predicate for both, on the enrichment column** — one code path, no branch.
Rejected: it moves every existing read off the index to serve a population that is a third of the rows, and
the spec's own 120 s measurement is the reason that rule was written. **Measuring first and deciding after**
— rejected as a gate: the branch is cheap, and it is correct whatever the measurement says. If the enrichment
column later turns out to be indexed too, collapsing the branch is a two-line follow-up with the measurement
in hand.

### D4 — An agent session's roots are unlabelled by the existing test, and that is now wrong

`hasConversationLabel` marks a root span as Core-internal by testing `chat_id` for emptiness. On an agent
session every hop has an empty `chat_id`, so every root would read as unlabelled and the listing would mark
the whole trace as Core-internal traffic. The test SHALL read the session id the query is scoped by, so the
distinction it draws — client rows against Core's own — survives on both populations. The root query already
projects that column under D3.

### D5 — `sentiment_score` is dropped by the schema, not by a filter

`session_insights` exposes no `sentiment_score`. The detail panel's insight fields already reach the query
through `OPTIONAL_DETAIL_SELECT_FIELDS`, which is intersected against the fetched schema, so removing the
enum value is enough — no field-name exclusion list is added. An exclusion list would be a second thing to
re-audit the day the enrichment gains the column back.

## Risks / Trade-offs

- **The unindexed predicate on the agent path is unmeasured.** → D3 confines it to sessions that have no
  indexed alternative, and every such query keeps its `request_time` bound, which is what prunes partitions.
  The chat path — all of today's traffic — is untouched. Measure it against a large agent session before
  widening the padded window.
- **The population grows by roughly a third and the grid's default sort is unchanged.** → `last_request_time`
  descending now interleaves agent sessions with conversations, so an operator's familiar first page changes
  content. This is the point of the change rather than a regression, but it lands with no filter to undo it
  until a client column exists.
- **`client_type` is `max()` over the session's hops.** → It labels a router-wrapped chat conversation
  `claudecode`; two of three sampled on dev were mislabelled this way. Nothing in this change reads it. Any
  later column SHALL read `client_types` (the full set) rather than `client_type`.
- **Ratings become sparse rather than near-complete.** → An agent session can carry no rating, so the Rating
  column's empty cells stop meaning "nobody rated this". The spec now requires the ordinary unavailable
  placeholder for both cases; the alternative — a distinct "not applicable" marker — was rejected as a
  distinction the reader cannot act on.
- **History shortens from 2026-07-01 to 2026-08-12.** → Accepted by the user and out of scope. It resolves as
  the identity enrichment's backfill extends, with no frontend change.
