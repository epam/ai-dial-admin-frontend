Three PRs, in the order below. Each is independently shippable and leaves the view coherent — see
`design.md` — Migration Plan. Groups 1–4 are PR 1, 5–7 are PR 2, 8–10 are PR 3.

The `turns` read stays alive through PRs 1 and 2, feeding the chat view alone. PR 1 rebuilds the listing on
the new queries; the chat view keeps its existing source until PR 3 makes it self-sufficient, and only then is
the turns path deleted. Deleting it earlier would strand the chat view's answer footers for two PRs.

## 1. Query builders — PR 1

- [x] 1.1 Add the page, roots and figures row enums plus the group, card and window models to
      `src/models/analytics/conversations-trace.ts`. Leave `ConversationTurnRow` / `TurnsField` in place — the
      chat view still reads them until PR 3
- [x] 1.2 Add `CONVERSATION_TRACE_PAGE_SIZE` (50), `CONVERSATION_TRACE_ROOT_CAP` and
      `CONVERSATION_DAY_PAD_MS` to `src/constants/analytics/conversations-trace.ts`
- [x] 1.3 Add `paddedUtcDayRange` to `src/utils/analytics/conversation-formatting.ts` — floor to UTC day minus
      one day, ceil to UTC day plus one day; epoch-millis output, since ADAS rejects an ISO timestamp literal
- [x] 1.4 Add the `fnIf` helper to `src/utils/analytics/query-build.ts`; `if` is in the live function catalog
      (`GET /v1/queries/functions`), not in the local Java checkout — read the catalog, not the source. No
      `having` helper: its only consumer was keyset paging, which is deferred, so it would be dead code
- [x] 1.5 Add `buildConversationTracePageQuery` to `src/utils/analytics/conversations-queries.ts`: group by
      `trace_id`, filter `chat_id` + `project_id` + padded day range, select `trace_id`, `min(request_time)`,
      `max(request_time)` only, sort ascending `(min(request_time), trace_id)`, offset page
- [x] 1.6 Add `buildConversationTraceRootsQuery`: `core_parent_span_id IS NULL`, `trace_id IN (page)`, padded
      page window, no `chat_id`, no `project_id` **in the filter**; project only the cheap columns named in the
      spec, including `deployment` and `project_id` — projected because the marker compares it, never filtered
      on. Note that contrast at the builder
- [x] 1.7 Add `buildConversationTraceFiguresQuery`: group by `(trace_id, event_kind)`, `trace_id IN (page)`,
      same window, no `chat_id`, no `project_id`; select `count()`, `sum(total_tokens)`,
      `sum(deployment_price)`, `sum(if(success, 0, 1))`, `group_uniq_array(response_id)`
- [x] 1.8 Comment at the builders why `project_id` is on the page query and forbidden on the other two — the
      page query is restricted to labelled rows, which are single-project; on the others it silently deletes
      the Core-internal rows. A reader unifying the three filter lists reintroduces the bug
- [x] 1.9 Remove the `chat_id` predicate from `buildConversationSpansQuery`, with the reason recorded: a
      header-scoped read omits the root the card describes

## 2. Server actions — PR 1

- [x] 2.1 Add `getConversationTracePage(chatId, projectId, range, offset)` to
      `src/app/[lang]/conversations-trace/actions.ts`: page query, then roots and figures concurrently,
      returning groups with their cards assembled. `getConversationTurns` stays for the chat view until PR 3
- [x] 2.2 Derive the roots/figures window from the page query's own `min`/`max`, not from the conversation row
- [x] 2.3 Apply the root cap per trace in the action, returning the elided count alongside the cards so the
      view can disclose it rather than truncating silently
- [x] 2.4 Attribute ratings by joining the figures query's `response_id` set against the feedback rows; leave a
      rating unattributed when its response id matches no loaded trace, and do not fall back to time

## 3. Card rendering — PR 1

- [x] 3.1 Rebuild `Detail/ConversationTraceList.tsx` to render one card per root from the card model: own
      recorded time, duration, status, own tokens, own/chain price pair, chips with counts, rating counts
- [x] 3.2 Title a card by `deployment`, falling back to `request_uri` when it is empty; wrap both in
      `DialEllipsisTooltip`. Remove the `question` prop and the turn-number label
- [x] 3.3 Render the "entry call not recorded" state for a trace whose root the roots query did not return
- [x] 3.4 Append pages on scroll with a loaded-trace-id `Set` guarding against a duplicate; remove the
      200-row ceiling and the `TranscriptTurnsTruncated` disclosure
- [x] 3.5 Stop titling the drawer with a transcript question when it was opened from a card: the card's own
      name is passed as the title instead. The drawer's figures are mapped from the group and card at the
      boundary (`asTraceFigures` in `ConversationDetailBody`) rather than by changing the drawer's own prop
      type — that keeps the drawer, its event stream and its hop-body reads untouched, as scoped. The prop
      shape is renamed when the turns model is deleted in PR 3
- [x] 3.6 Add the i18n keys for the new card, chip, cap-disclosure and not-recorded strings to
      `src/constants/i18n.ts` and `src/locales/en.ts`

## 4. Tests and verification — PR 1

- [x] 4.1 Unit-test the three builders in `src/utils/analytics/tests/conversation-detail-queries.spec.ts`,
      including: no body column in any of them, and the page query's filter naming `chat_id` and `project_id`
- [x] 4.2 Assert the scope invariant as **one** property — build the roots and figures queries for the same
      page and assert their filters are equal modulo the root-span predicate — not as two enumerated lists;
      apply the same assertion to the figures query built for the transcript's traces (its second call site)
- [x] 4.3 Assert the day **padding**, not only UTC-ness: a query whose bounds are the containing UTC day must
      fail the test, and a root at `23:59:59.7` with a child at `00:00:00.1` next day must fall inside
- [x] 4.4 Unit-test `paddedUtcDayRange` and the rating join, including an unmatched response id going
      unattributed and attribution not moving when a further page is appended
- [x] 4.5 Component-test `ConversationTraceList`: card fields, deployment-then-endpoint titling, the
      own/chain price pair, the not-recorded state, and duplicate suppression on an overlapping page
- [x] 4.6 Verified in the browser against live data: card fields, deployment titling, the own/chain price pair,
      opening on Trace. Confirmed the rendered figures against ADAS for trace 5281bcb5 (4 rows → "4 calls",
      9357 tok → "9.4 K", $0.0275655 → "$0.028", root's own "— / $0.028").
      **Pass-through card naming verified** on conversation fa6f303e (project `claude-eval-key1`): roots carry
      empty `deployment` and `event_kind`, so cards are titled by `request_uri`
      (`/claude_code_router/v1/messages`) and the empty kind renders as its own `pass-through` chip. Card facts
      match the rows exactly (1324 ms → "1.3s", 2 msg, null tokens → "0 tok", null prices → "— / —").
      **Scroll paging verified** on the same conversation: 50 → 100 → 150 → 191, then stops; 191 rendered,
      191 distinct trace ids, matching `turn_count` — the loaded-id Set admits no duplicate. Repeated on
      a608ffec (200 traces, the old ceiling): 50 → 100 → 150 → 200, stops, 200 distinct. That conversation runs
      23:43–23:50 UTC on Aug 24 — ten minutes from a midnight boundary and three days outside the list's
      default period — and lost nothing, which exercises the day padding and the conversation-derived window.
      **Correction:** "entry call not recorded" was recorded here as unreachable at ~0.1% of traces. That was
      wrong — conversation `7KmZAxvyTU1fUwGDGRKgB` has three traces and **none** carries a root
      (every row's parent is absent from the trace), so its entire listing was that state. Worse, the state
      rendered as an inert `div`, so those conversations had no route to their hops at all — a capability
      every row of the previous listing had. The panel is now a button: the hop read is scoped by trace id
      alone, so the spans are reachable even where no root is. This is the second time an "unreachable" claim
      here was made from what a UI happened to show rather than from querying ADAS.

## 5. Grouping — PR 2

- [x] 5.1 Render trace-as-group in `Detail/ConversationTraceList.tsx`: trace-level figures on the group header,
      cards beneath it
- [x] 5.2 Collapse a single-root trace's group and card into one row, with no grouping affordance rendered
- [x] 5.3 Give each group `role="group"` with an `aria-label`, per `.claude/rules/a11y.md`, so the
      group/card distinction is not carried by layout alone
- [x] 5.4 Render the cap disclosure — "N further calls in this trace" — on a group whose cards were capped

## 6. Core-internal marker and guards — PR 2

- [x] 6.1 Add `isCoreInternalRoot(root, conversationProjectId)` as a relative comparison; do not hard-code
      Core's project name. Landed in `src/utils/analytics/conversation-trace-groups.ts` rather than
      `conversation-spans.ts`: it operates on `ConversationTraceRootRow`, which that module owns, and the
      assembly needs it to populate the card model rather than hardcode the field false
- [x] 6.2 Mark a Core-internal card in the listing, with the marker exposed as text rather than colour alone
- [x] 6.3 Add the five guards from the spec, each failing loudly and naming the property and the trace: one
      chat id per trace, one project among labelled rows, at most one Core-internal root, exactly one root
      where none is labelled, and the labelling rule agreeing with the marker
- [x] 6.4 Add the i18n keys for the marker and the cap disclosure

## 7. Tests and verification — PR 2

- [x] 7.1 Unit-test `isCoreInternalRoot` and each of the five guards, tripping and not tripping
- [x] 7.2 Component-test the collapse rule, a two-card trace, the marker, and the cap disclosure
- [x] 7.3 Verified in the browser: single-root traces collapse with no `role="group"`; trace 64a9c812 renders
      a two-card group with `role="group"`/`aria-label`, trace figures on the header, and the Core-internal
      marker. **Found and fixed a real bug here** — `isCoreInternalRoot` required the conversation's project to
      be non-empty, which left the marker off exactly the measured chat shape (conversation project `''`, Core
      root `dial`). The unit test had asserted the buggy behaviour. **Not reachable:** the cap disclosure needs
      a labelled trace with >12 roots, which chat traffic does not produce; covered by component tests

## 8. Chat view becomes self-sufficient — PR 3

- [x] 8.0a Extend the transcript action to resolve figures for the traces its transcript covers, reusing
      `buildConversationTraceFiguresQuery` with those trace ids and a window padded from their own min/max —
      no `chat_id`, no `project_id`
- [x] 8.0b Move `ConversationTimeline`'s assistant footer from `ConversationTurnRow` to the trace-group model,
      keeping its figures, rating counts and open-trace control
- [x] 8.0c Resolve a footer's figures from the transcript's own figures map, not from the listing's loaded
      pages, so a message's completeness does not depend on Trace-view scroll position
- [x] 8.0d Leave overlapping reads between the two views alone — no shared cache

## 8a. Chat-view load timing — PR 3

- [x] 8.1 Split `getConversationTranscript` into `getConversationTranscriptAvailability` (the cached entity
      schema probe, returning `ColumnsUnavailable` or readable) and `getConversationTranscript` (the body read)
- [x] 8.2 Call the availability probe in `[id]/page.tsx` so `isChatDisabled` is still resolved at page open;
      `ConversationViewSwitch.tsx` is unchanged
- [x] 8.3 Default the detail view to `DetailView.Trace` in `Detail/ConversationDetailBody.tsx`
- [x] 8.4 Fetch the transcript body on the first switch to Chat, holding it in client state behind a spinner,
      and do not re-fetch on subsequent switches
- [x] 8.5 Render a failed body read inside the Chat view, leaving the Trace view and the page intact; remove
      the transcript from the page's whole-page error path
- [x] 8.6 Remove `getConversationTranscript` and `getConversationTurns` from the `[id]/page.tsx` server
      prefetch, and drop `turns` / `transcript` from the props `ConversationDetailView` receives


## 9. Tests and verification — PR 3

- [x] 9.1 Unit-test the split actions: the availability probe issues no body query, and the body read is not
      issued until requested
- [x] 9.2 Component-test that the view opens on Trace, that switching to Chat shows a loading state and fetches
      once, and that a failed body read leaves the listing usable
- [x] 9.4 Component-test that an answer whose trace lies beyond the listing's loaded pages still states its
      figures, and unit-test that the transcript's figures query carries neither `chat_id` nor `project_id`
- [x] 9.3 Verified in the browser: the view opens on Trace with no body read; switching to Chat issues the
      body read and renders the transcript, whose assistant footer states its own trace's figures (184 tok,
      $0.000078, 2 calls) from the transcript's own figures read. Also confirmed the drawer's span tree now
      contains the unlabelled root (`echo` + `gpt-4.1-nano`), which the `chat_id` removal was pulled in for.
      **Not reachable without fault injection:** the failure-inside-Chat state; covered by component tests.
      (An earlier note here recorded pass-through naming and scroll paging as unreachable. That was wrong —
      it inferred absence from the list's default 7-day view instead of querying ADAS. Both were verified
      under 4.6.)

## 10. Cleanup and quality gate

- [x] 10.1 Delete the turns path now its last consumer is gone: `buildConversationTurnsQuery`,
      `getConversationTurns`, `TURNS_ENTITY`, `CONVERSATION_TURN_LIMIT`, `TurnsField`, `ConversationTurnField`,
      `ConversationTurnRow`, `ConversationTurnsResult`, and their spec blocks
- [x] 10.2 Delete `attributeRatingsToTurns` from `src/utils/analytics/conversation-detail-fields.ts` and its
      spec block, now that nothing calls it
- [x] 10.3 Update `docs/` where it describes the turn list as coming from the `turns` rollup — nothing to do:
      grepped `docs/` for the turns rollup, entity and constants and found no reference
- [x] 10.4 Run lint, format and the full suite; resolve every failure. **Correction:** an earlier tick here
      overstated what ran — `eslint --fix` had been run but `prettier` had not, and nine spec files were
      failing the format check. Prettier is now run over the change's own files (a null-delimited list, since
      the `[lang]` paths are quoted by `git status` and were silently dropped by an earlier attempt), and an
      over-broad `eslint --fix` across `src` that had reformatted six unrelated files was reverted.

## 11. Review fixes and presentation pass

- [x] 11.1 Retire `turn` / `turnNumber` / `question` from the drawer — the rename deferred by 3.5. Every
      opened drawer had been rendering "Turn 0", because a title was always passed alongside `turnNumber = 0`
      and the subtitle rendered the ordinal whenever a title was set
- [x] 11.2 Give the Chat view its own rating attribution from the transcript's traces; it had shared the
      listing's map, so an answer's rating counts depended on how far the Trace view had been scrolled
- [x] 11.3 Make the unrecorded-root panel openable, and state the trace's tokens and price on it
- [x] 11.4 Add the listing's loading state, and rebuild the paging observer on `isLoading` — keying it on the
      loaded count stalled paging whenever a page returned only ids already on screen
- [x] 11.5 Exclude Core-internal roots from the labelling-candidate guard, which tripped on the design's own
      premise (an unlabelled client root beside a Core service root)
- [x] 11.6 Report a roots or figures read that comes back exactly full, and fail the page on a failed figures
      read rather than rendering zeroes as the trace's facts
- [x] 11.7 Attach trace ratings only to the card carrying the conversation label, so a Core service call no
      longer displays the reader's rating of the conversation's own answer
- [x] 11.8 Three-tier panel layout: section header stating the rule, top tier (identity, status, headline
      figures), middle tier (card-level facts, each labelled), bottom tier (trace-level chips and span count).
      Trace figures state once at panel level when a trace has more than one card
- [x] 11.9 Colour the chips one hue per recorded `event_kind`, from theme tokens only — `llm_call` blue,
      `embedding` teal, `mcp` purple, `route` amber, pass-through muted. Colour is never the sole signal: each
      chip states its kind and count in text. The design's App / Interceptor / Upstream categories are
      deliberately not adopted — `event_kind` does not carry them
- [x] 11.10 Tests for the new structure (which tier a value lands in), the paging hook including the dedup
      `Set`, and `getConversationTracePage` including its window derivation and partial-failure branches
