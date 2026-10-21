## Context

See `proposal.md` — Why. The constraints that shape this design, all established by probing the running
analytics service rather than read off documentation:

- `conversations` is **one row per `chat_id`**. It carries no `trace_id`, no `deployment`, and no per-request
  rows. Nothing about a conversation's internal structure is derivable from it.
- `turn_count` is a `count()` of usage-log rows. Measured on one real conversation: **2,190 rows across 12
  distinct traces**. Materializing the distinct count is impossible — pipeline measures have no `distinct`
  flag — even though a *query* can compute it.
- `request_body` / `response_body` are `sensitive` and `heavy`. Sensitive columns are **removed from the query
  model** for callers without the elevated role, so a reference fails as `unknown field` rather than `403`.
  One row's `request_body_bytes` measured **1.2 MB**; one `response_body` was a 1536-float embedding array.
  They read correctly on the local service but intermittently — the same single-row query measured 1.94s and
  later timed out — and every query naming `request_body` fails against dev while `response_body` succeeds.
- A conversation's hops are not its turns. One measured conversation: **930 hops across 3 traces**, with one
  trace fanning out into **922 hops** costing **$5.32**.
- **A hop with a null `core_parent_span_id` is the exception, not the rule.** The column is documented as
  "null for the first hop of the chain", but that first hop is frequently not recorded in this table at all:
  every hop of every recent conversation measured carries a parent, so filtering on a null parent returns
  **zero rows**. The trace's earliest request is the entry hop instead.
- Cost is hierarchical but tokens are not. A hop's `total_price` already covers everything it initiated, so
  summing it across a chain double-counts; `deployment_price` is each hop's own cost and sums correctly.
- Offset paging over a heavy column **times out** — skipped rows are still read. Any future body-reading
  feature must filter to specific ids, never page.
- `operation_duration_ms` is `0` on every dev row, so `duration_ms` / `avg_duration_ms` are `0` too.
- No enrichment exists over `conversations` on either environment.

The page therefore has no filters, no paging and no sorting — it renders one record. That absence is what
lets the whole design collapse to something much simpler than the list page.

## Goals / Non-Goals

**Goals:**

- One render pass, no client-side loading state: everything the page shows is known before first paint.
- Make the data gap **declarative** — the set of unavailable fields is a data structure, not conditionals
  scattered through markup — so a field flips from `—` to live by editing one definition.
- Keep the list page's behaviour byte-identical apart from the new row-open affordance.

**Non-Goals** (design-level, beyond the proposal's scope):

- No shared "detail page" abstraction. This is the first analytics detail view; generalising across it and
  `tables/[id]` before a second case exists would be speculative.
- No client-side refetch, polling or revalidation. The route is `force-dynamic`; a reload is the refresh.

## Decisions

### Fetch everything on the server; the view is presentational

`page.tsx` issues both queries — the conversation row and the ratings — and passes plain data to a client
view. There is no `use-conversation-detail` hook and no `useProtectedRequest` on this page.

*Why:* `useProtectedRequest` exists to survive a 401 mid-session across repeated client calls driven by
filters. This page has no filters and makes no call after mount, so the hook would add a loading state, an
effect and a request-id race guard to protect a request that never repeats. `tables/[id]` and
`activity-audit/[id]` both fetch server-side for the same reason.

*Alternative considered:* mirror `use-conversations.ts` for consistency with the list page. Rejected — that
hook's machinery (debounce, latest-wins ref, candidate-promise cache, datasource identity) exists entirely to
serve filters and infinite paging, none of which this page has.

### A failed query and a missing conversation are different outcomes

`notFound()` fires only when the query **succeeded and returned zero rows**. A query that failed renders an
error state naming the conversation, and MUST NOT 404.

*Why:* the analytics API reports failure inside the payload (`ServerActionResponse.success`), not by
throwing, so the naive `if (!row) notFound()` would turn every backend outage into "this conversation does
not exist" — the most misleading error this page could produce, given the service proved unstable during
investigation.

### Panels are declared as field definitions, not written as markup

Each sidebar panel is a constant: a provenance, a label key, and an ordered list of field definitions. A
field definition binds a label key to either a column of the fetched record or to nothing. A single renderer
walks the definitions; a field bound to nothing renders the unavailable marker.

*Why:* the spec requires that no defined field be silently dropped and that the three states stay distinct.
Encoding availability in data makes that structurally true rather than a thing reviewers must check per
field, and it makes the eventual fix — a new rollup column — a one-line edit to a definition list. It also
mirrors how this feature already declares its grid provenance groups (`CONVERSATION_PROVENANCE_GROUPS`).

*Alternative considered:* write each panel as its own component with inline `value ?? '—'`. Rejected — it
spreads the placeholder decision across every panel and makes "is every design field still present?"
unanswerable without reading all the markup.

### Three value states, resolved by the renderer, not by the caller

- **unavailable** — the definition binds no column.
- **empty** — the definition binds a column whose value is `null` or `''`.
- **zero** — the definition binds a column whose value is `0`.

Zero renders as a number. This is the one case worth stating explicitly, because `0` ratings and `0` failed
requests are findings, and the obvious `value || marker` idiom would silently destroy both.

The marker is one constant used everywhere, and its styling comes from theme tokens.

### Provenance gains an explicit "no source" value

`ColumnProvenance` gets a member for panels backed by nothing (the classification panel). Every provenance
value must map to a colour class — the existing spec requires it so a new source cannot render unstyled — so
the marker value gets a muted token entry in `PROVENANCE_TEXT_CLASS` alongside the existing two.

*Why:* the alternative, letting a panel carry no provenance at all, reintroduces exactly the
unattributed-source hole the list page's provenance requirement closed.

### Ratings: one row-mode query, counts derived client-side

The detail page issues a **single** row-mode query over `rate_analytics` filtered to the `chat_id`, selecting
direction, recorded time and response id, with `include_total`. Header counts are derived from those rows
(`rate > 0` is positive, matching the list page's `gt(rate, 0)` / `le(rate, 0)` predicates). `include_total`
against the requested limit is what tells the panel to declare itself partial.

*Why:* the list page needs two aggregate queries per direction because it must attribute counts across a
whole page of conversations without carrying every rating row. One conversation's ratings are few, and the
feedback panel needs the individual rows anyway — so one query serves both the header and the panel, and two
aggregate round trips become one.

Neither query carries a time bound, for the same reason the conversation query doesn't: the page is addressed
by id, and a bookmark must not break because the conversation aged out of the list's window.

### `eq` joins the query primitives

`QueryOperator.Eq` is already in the query model but has no builder helper — the list page only ever needed
range, `in` and `ico`. Filtering to one `chat_id` needs equality, added alongside the existing helpers rather
than hand-built at the call site.

### `RatingCount` is extracted, and the grid cell keeps its exact behaviour

`RatingCount` moves out of `RatingCellRenderer.tsx` into a shared component; the renderer becomes the
AG-Grid adapter around it and keeps its current early return when either count is `null`.

*Why:* the header and the grid cell must render ratings identically — the spec requires the same conversation
to read the same in both places — and the component's only grid coupling was the `ICellRendererParams`
wrapper.

### Row-open affordance and keyboard parity

The list grid gains `onCellClicked`, honouring the app's new-tab convention via the existing
`navigateEntityUrl` / `shouldOpenInNewTab` helpers, with a locale-less href built by a local
`conversationDetailHref(chatId)` helper mirroring `tableDetailHref`. Rows get the pointer affordance the
audit grid already uses (`rowClassRules`).

Keyboard parity is not free: AG Grid's cell click is a mouse event, so cell-level `Enter` handling is wired
alongside it rather than assumed. The heading's copy control and the panel rows are ordinary focusable
elements; the placeholder timeline region is real text, not `aria-hidden`, so it is announced.

### Turns come from root hops; the transcript comes from one body

Two reads, deliberately split by cost. The turn list filters `dial_usage_log` to `chat_id` with a null
`core_parent_span_id` and names **no** body column — measured at **0.27s** for a 930-hop conversation. The
transcript then reads exactly one row, pinned by `chat_id` + `core_span_id` — measured at **1.94s**.

*Why one body:* a turn's request body carries the conversation as it stood when that turn was sent, so the
last turn's request already contains every earlier message. Reading one row reconstructs the whole exchange.

*Alternatives measured and rejected:* a body read per turn (N slow reads for the same content); an `in` over
several span ids (loses the index, times out); offset paging over a body column (times out — skipped rows are
still read); selecting bodies alongside the turn list (makes the fast query as slow as the slow one).

### The response body has two stored forms, and the streamed one is not a document

`response_body` is the verbatim event stream for a streamed call — confirmed on real data, whose first frame
is `data: {"choices":[{"delta":{"role":"assistant"}}]}` carrying no content — and DIAL's merged reply is
never persisted. So the reply is rejoined from the fragments, with a document path as the other branch. A
view that assumed a document would render nothing for every streamed conversation, which is the common case.

### Message content is optional by construction

The body columns are `sensitive`, so a caller without the elevated role does not get a clean refusal — the
column leaves the query model and the reference fails as an unknown field. That is treated as one more
failure mode alongside a timeout or an uninterpretable value: the transcript comes back empty and the view
keeps its placeholder while everything else renders. The page is therefore useful at every role, and the
transcript is a bonus rather than a dependency.

*Consequence worth stating:* the page shows strictly less to a non-elevated viewer. That is a real
behavioural difference between roles, not a bug.

### Assistant messages are paired to turns by position

The nth assistant message carries the nth turn's model, tokens and cost. Pairing cannot be by id: the reply
is reconstructed from a *request* body and carries no span of its own. A root hop's `total_price` covers the
chain beneath it, so the figure shown is the turn's true cost — measured at **$5.32 for a single
922-hop turn**.

## Risks / Trade-offs

- ~~6 of the 13 rollup columns are not yet query-verified.~~ **Resolved** — all 13 return values. Confirmed
  against the local service: `user_hash`, `prompt_tokens` (4,293,420), `completion_tokens` (70,174) and
  `success_count` (930) all carry real data, so the usage and metadata panels are as full as the proposal
  claims. Two follow-on facts the design already accommodates: `duration_ms` and `avg_duration_ms` return `0`
  (their source `operation_duration_ms` is `0`), so neither is surfaced; and `project_id` came back as an
  **empty string**, which is the empty-not-unavailable case the three-state renderer exists to distinguish —
  it is the common case, not an edge one.
- **The local analytics service proved unstable** — it returned 401 (auth mode changed), then 500s, then
  stopped answering, partly provoked by the heavy-body queries during investigation. → This change issues
  only small, indexed, non-heavy queries. Browser verification needs the service healthy; the query-shape
  tests do not.
- **Extracting `RatingCount` touches a component the list grid renders.** → The existing
  `RatingCellRenderer` specs must pass unchanged; treat any edit to them as a signal the extraction changed
  behaviour.
- **A page that is almost entirely placeholders can read as broken.** → Every marker sits next to its label
  and each panel names its source or states it has none, so the page reads as "this system does not record
  that" rather than "this failed to load". This is the main thing to judge in browser verification.
- **`chat_id` values are hostile as URL segments** — hundreds of characters, embedded `/`, already
  percent-encoded text. Not hypothetical: the most-rated conversation in local data is
  `conversations/eRxsos…/chathub-claude4__E2EConversationlqZAcFQ4BG`, and others embed percent-encoded query
  text. → Encode on the way out and decode once on the way in, exactly as `tables/[id]` does; cover a
  separator-bearing and an already-encoded id in tests.
- **`test-setup.tsx` mocks `next/navigation` as `{ useRouter, usePathname }` only**, and `useRouter()` returns
  `undefined` by default. → The new route's specs and the row-click spec each supply their own mocks; do not
  widen the global setup, which every other suite depends on.
- **The transcript costs one encrypted body read per page view, and that is accepted.** The route is
  `force-dynamic`, so every navigation, reload and dev hot-reload reads a `ZSTD` + `AES_256_GCM_SIV` column
  whose values reach 1.2 MB — this feature is the only thing in the app that touches a `heavy` column.
  Cheap queries stay at 0.03–0.27s throughout, while body reads range from 1.94s to timeouts and one 503,
  so the cost sits with ClickHouse decompressing and decrypting inside a memory-capped local VM. A size
  guard on the cheap `request_body_bytes` column and moving the read behind an explicit control were both
  considered and **deliberately declined**: messages appearing without a click is worth the local
  instability. Revisit before this reaches an environment where the database is shared.
- **Body reads are intermittent on the local instance.** The same single-row transcript query succeeded at
  1.94s and, minutes later, timed out; the service also returned 503 mid-session under heavy-body probing.
  The turn list is unaffected. → The transcript is optional by construction, so an intermittent failure
  degrades to the placeholder instead of breaking the page. The parser is covered by fixture tests rather
  than by a live read.
- **A turn's hop fan-out is unbounded in practice** — 922 hops in one measured turn. → Nothing in this
  change reads per hop, and the turn list is capped; a hop-level call tree is left out for that reason.
- **The relabelling from turns to requests makes the list and detail pages disagree in wording** for the same
  underlying number. → Accepted deliberately: the detail page states what the number is. Aligning the list's
  column label is a separate, larger call about a shipped page.

## Migration Plan

Additive and frontend-only — new route, new components, new query builders, plus the row-open affordance on
an existing grid. No backend, pipeline, schema or permission change, so nothing needs sequencing against a
deployment and rollback is a straight revert. The only change to existing behaviour is that conversation rows
become openable.

## Open Questions

- Whether the feedback panel's "partial" statement belongs inline in the list or in the panel header. Purely
  presentational, decided at implementation, and it changes no requirement.
