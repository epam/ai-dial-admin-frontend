## Why

`conversations.turn_count` used to be a `count()` over usage-log rows — proxy hops, not turns — which is why
the conversation detail header carries two figures: a **Turns** count derived client-side by grouping the
usage log, and a **Requests** count read from the rollup. The analytics pipeline now materializes
`turn_count` as `count(distinct trace_id)`, one trace per request, so the two figures measure the same
quantity.

The derived one is now the wrong one. It comes from `buildConversationTurnsQuery(chatId,
CONVERSATION_TURN_LIMIT)` with `CONVERSATION_TURN_LIMIT = 200`, so on a conversation of 911 turns the header
reads **Turns 200 · Requests 911** — a page size presented as a fact, next to the correct answer, under two
labels. The tooltip on the Requests figure still explains that requests are *"one per proxy hop — a single
turn fans out into several, so this is not a turn count"*, which is now false.

The consolidated analytics spec contradicts itself on this: the conversations field table already documents
`turn_count` as distinct traces, while the detail-view requirement still asserts "930 usage-log rows across 3
turns" and mandates the two-figure header.

## What Changes

- The detail header states the conversation's turn count **once**, read from `conversations.turn_count`,
  under the label **Turns**. It is the whole-conversation figure, unaffected by how many turns the view
  loaded.
- **BREAKING (user-visible)**: the separate **Requests** figure is removed from the header, along with its
  now-false tooltip. "Requests" leaves the conversations vocabulary — turn, request and trace are one
  quantity, and keeping two names for it renames the confusion rather than removing it.
- The turn list states its own bound when it is clipped — "showing 200 of 911" — so the 200 appears only as a
  stated limit, never as the answer. Today nothing signals that the list stopped short.
- The grid's Turns column tooltip is aligned to the same vocabulary; the column itself already binds
  `turn_count` and is correct.
- The transcript keeps generating one sample exchange per **loaded** turn, not per counted turn, and the spec
  says so — a reader applying "show the real number everywhere" to it would fabricate hundreds of sample
  exchanges.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the detail-view requirement that derives turns from the usage log and mandates a distinctly
  labelled turn-count/request-count pair is replaced. The turn count becomes a rollup read; the derived turn
  list keeps its role as the transcript's spine and gains a truncation disclosure. Requirements naming the
  removed "requests" label are retired.

## Impact

- `src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader.tsx` — Turns slot re-sources,
  Requests slot removed, `turnCount` prop drops
- `src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView.tsx` — stops passing
  `turnCount={turns.length}`
- `src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline.tsx` — gains the truncation
  disclosure
- `src/locales/en.ts` + `src/constants/i18n.ts` — `DetailRequests` / `DetailRequestsHint` retired, `TurnsHint`
  reworded, truncation key added
- `src/constants/grid-columns/grid-columns.tsx` — Turns column tooltip only
- `openspec/specs/analytics/spec.md` — the contradicting detail-view requirement and its scenarios
- Co-located specs under `ConversationsTrace/tests/` and `conversations-trace/tests/` that assert the
  two-figure header

No query, server action or entity-field change: `turn_count` is already selected by
`buildConversationDetailQuery`, which projects every `ConversationsField`.

## Non-goals

- **Reworking `success_count` into a success rate.** `success_count` is now distinct-trace scoped too, so
  `success_count / turn_count` finally means "turns that succeeded" — but a ratio is not expressible in row
  mode, so a rate column could offer neither sort nor filter. That is its own change.
- **Deriving cost or duration per turn** from the newly-meaningful denominator.
- **Filling the header's Model slot** from `conversation.deployments`, though it renders unavailable
  immediately beside the slots this change touches.
- **Raising `CONVERSATION_TURN_LIMIT`.** This change makes the bound honest, not larger.
- **Any backend or pipeline change.**
