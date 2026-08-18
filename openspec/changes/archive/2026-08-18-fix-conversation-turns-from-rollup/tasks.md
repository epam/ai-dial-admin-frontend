## 1. Header states one turn count

- [x] 1.1 In `src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader.tsx`, source the
      Turns slot from `conversation.turn_count` via `formatCompactNumber`, falling back to
      `UNAVAILABLE_VALUE`; remove the Requests slot and its `hint`; delete the `turnCount` prop from `Props`
      and the component signature.
- [x] 1.2 In `src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView.tsx`, stop passing
      `turnCount={turns.length}` to `ConversationDetailHeader`.
- [x] 1.3 Delete `DetailRequests` and `DetailRequestsHint` from `ConversationsTraceI18nKey`
      (`src/constants/i18n.ts`) and from `src/locales/en.ts`; confirm no remaining reference.

## 2. Turn list discloses its bound

- [x] 2.1 Add a `ConversationsTraceI18nKey` entry and `en.ts` string for the truncation disclosure, taking
      the loaded count and the real count as interpolated params (e.g. "Showing {loaded} of {total} turns").
- [x] 2.2 In `src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline.tsx`, accept the
      conversation's `turn_count` and render a second `DialNotification` beside the existing sample-content
      notice when `turns.length < toNumber(turn_count)`; render nothing when the list is complete, or when
      `turn_count` is null or unparseable. Use `toNumber` from `src/utils/analytics/scalar.ts`.
- [x] 2.3 Pass `turn_count` from `ConversationDetailView` to `ConversationTimeline`.
- [x] 2.4 Leave `mockConversationTranscript(chatId, turns.length)` in
      `src/app/[lang]/conversations-trace/[id]/page.tsx` unchanged, and add a short comment stating that the
      sample count follows loaded turns, not `turn_count`, so every exchange has real figures behind it.

## 3. Grid copy

- [x] 3.1 Reword `TurnsHint` in `src/locales/en.ts` so the Turns column tooltip names turns rather than
      requests. The column binding (`ConversationsField.TurnCount` in
      `src/constants/grid-columns/grid-columns.tsx`) is already correct and does not change.

## 4. Tests

- [x] 4.1 Update `src/components/Analytics/ConversationsTrace/tests/ConversationDetailHeader.spec.tsx`:
      assert the header renders `turn_count` under the turns label and renders no requests label; replace the
      `turn_count: 930`-against-3-turns fixture and delete the comment justifying the requests label.
- [x] 4.2 Add coverage for the header count being independent of the loaded turn list — a fixture with
      `turn_count: 911` and a short `turns` array must render 911 and never 200.
- [x] 4.3 Add `ConversationTimeline` cases for the disclosure: clipped list renders it with both figures,
      complete list renders none, null `turn_count` renders none.
- [x] 4.4 Update the fixtures and assertions in
      `src/app/[lang]/conversations-trace/tests/detail-page.spec.tsx`,
      `.../tests/detail-actions.spec.ts`,
      `src/components/Analytics/ConversationsTrace/tests/ConversationDetailRail.spec.tsx` and
      `src/utils/analytics/tests/conversation-detail-fields.spec.ts` that carry `turn_count: 930` against 3
      turns, including the explanatory comment in
      `src/utils/analytics/tests/conversation-detail-queries.spec.ts`.

No browser-verification task: the user opted for unit tests only.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and the full `npm run test` from `apps/ai-dial-admin/`, and
      fix anything they surface.
