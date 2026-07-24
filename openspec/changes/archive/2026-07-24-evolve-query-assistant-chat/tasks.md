## 1. i18n

- [x] 1.1 Audit `QueryBuilderI18nKey` (`constants/i18n.ts` / `locales/en.ts`) for the keys the current
      single-proposal UI uses (e.g. run-hint, proposed-query label, response label, "Generate query"
      label) — confirm which are unused elsewhere before removing.
- [x] 1.2 Add new keys for: Send action label, per-message Run action label, per-message Copy label
      (or confirm the existing generic Copy label is reused), and any updated panel heading/description
      copy needed for the chat framing. (An `AiLoadedBadge` key was added then removed — see 2.5.)
- [x] 1.3 Remove i18n keys confirmed unused after 1.1/1.2.

## 2. `AiPanel` transcript rework

- [x] 2.1 Change `AiPanel`'s props to `{ onRunMessage: (sql: string, messageIndex: number) => void;
      loadedMessageIndex: number | null; runInFlight: boolean }`, replacing the current
      `onGenerated: (sql: string | null) => void`.
- [x] 2.2 Render `messages` as a scrollable transcript of user/assistant bubbles (existing
      `overflow-y-auto` container), with the input textarea + Send button pinned below it. (Added per
      feedback: on each new message, scroll the latest user message to the top of the transcript via
      `scrollIntoView({ behavior: 'smooth', block: 'start' })`, so the question just asked stays
      visible together with its reply instead of the view jumping straight to the transcript's end.)
- [x] 2.3 On Send: clear the input immediately, append the user's message to `messages` right away
      (so it shows in the transcript before the response arrives), call `generateQuery` with the full
      accumulated messages, and on success append the assistant's reply as a new message. On failure,
      leave the just-sent user message in the transcript, append nothing further, and surface the
      existing error notification.
- [x] 2.4 For each assistant message, run `extractSql(message.content)` independently and render the
      message's full content as prose; when extraction is non-null, additionally render the SQL
      read-only with a Copy action and a Run action (disabled while `runInFlight` is true). Call
      `onRunMessage(sql, index)` on Run. (Refined after initial review: rendering `message.content`
      verbatim duplicated the SQL — once as raw fenced text, once in the clean panel. Replaced
      `extractSql` here with a new `splitMessageAroundSql` util — same last-block-wins matching, plus
      the surrounding prose — so the winning block renders once, formatted in place, with the
      before/after prose around it instead of the raw fence.)
- [x] 2.5 Indicate which message is the currently loaded query. (Revised per feedback: dropped the
      separate "Loaded" `DialTag` badge and its `AiLoadedBadge` i18n key — the message whose index
      equals `loadedMessageIndex` now simply has its Run action disabled, same as during
      `runInFlight`. One signal, not two.)
- [x] 2.6 Show the suggested-prompt chips only while `messages` is empty; hide them once the first
      message has been sent.

## 3. `QueryBuilder.tsx` state and run wiring

- [x] 3.1 Add `aiLoadedMessageIndex: number | null` state; include it in `resetAiQuery()`.
- [x] 3.2 Replace `onQueryGenerated(sql)` with `onRunAiMessage(sql, index)` per design.md §4: on call,
      set `aiLoadedMessageIndex`, run the existing translate → hydrate-or-fallback-to-SQL logic
      (unchanged), then immediately execute (structured or SQL path matching what was loaded) and set
      `result`/`resultMeta` via the existing `buildExecutedMeta`, reusing `isRunning` for the execute
      phase and `aiLoading` for the translate phase. (Implementation note: `aiGeneratedSql` /
      `aiRepresentable` became write-only once the toolbar Run/Copy branches were removed and were
      deleted; `hydrateBuilderFromQuery` now returns `{ fields, state, timeBound }` so the request built
      for execution reflects the just-hydrated state and a freshly computed time bound instead of the
      stale pre-hydration closure — needed to keep the toolbar's live time-range filter applied to AI
      runs, same as the other views.)
- [x] 3.3 Remove the `isAiView` branch from `onRun` and from `runDisabled` (dead code once the toolbar
      Run button no longer renders for the AI view).
- [x] 3.4 Pass `showRun={!isAiView}` to `QueryBuilderToolbar`; when `isAiView`, don't build/pass the
      `CopyButton` child.
- [x] 3.5 Pass `onRunMessage={onRunAiMessage}`, `loadedMessageIndex={aiLoadedMessageIndex}`, and
      `runInFlight={aiLoading || isRunning}` to `AiPanel`.

## 4. `QueryBuilderToolbar` Run/Copy gating

- [x] 4.1 Add `showRun?: boolean` (default `true`) to `QueryBuilderToolbar`'s props; wrap the
      `DialPrimaryButton` Run control so it only renders when `showRun` is true. Entity selector and
      time filter controls remain unaffected.

## 5. Unit and component tests

- [x] 5.1 Rewrite `QueryBuilder/Ai/tests/AiPanel.spec.tsx` for: transcript rendering of multiple
      messages, per-message Run/Copy appearing only when SQL was extracted, chips hidden after the
      first message, `onRunMessage` called with the right `(sql, index)`, `runInFlight` disabling all
      inline Run buttons, and the failure path leaving the user's message in the transcript.
- [x] 5.2 Update `QueryBuilder/tests/QueryBuilder.spec.tsx` for: `aiLoadedMessageIndex` reset on entity
      change, `onRunAiMessage` driving both hydration and execution, toolbar Run/Copy absent when the
      AI view is active, and removal of the old `onGenerated`-triggered auto-load assertions.
- [x] 5.3 Update `QueryBuilder/tests/QueryBuilderToolbar.spec.tsx` for the new `showRun` prop
      (default-rendered vs. hidden).

## 6. Verification

- [x] 6.1 Run the `spec-browser-verify` skill against this change's browser-observable scenarios
      (chips hidden after first message, per-message Run/Copy visibility, toolbar Run/Copy absent in
      AI view, Run disabled on the loaded message, representable vs. non-representable Run outcomes)
      with the local stack running and auth disabled; resolve any `fail` verdicts before considering
      the change done. (First pass: 8/10 pass, 1 fail, 1 blocked-by-the-fail — that first pass still had
      the "Loaded" `DialTag` badge, since removed per feedback (see 2.5) in favor of disabling Run on
      the loaded message. Root cause of the fail fixed — `AiPanel` was keyed by `state.entityName`,
      which a cross-entity Run also changes as a side effect, silently remounting the panel and wiping
      the whole conversation; now keyed by a dedicated `aiConversationKey` bumped only from
      `resetAiQuery()` (i.e. only on an explicit user entity switch). Added a regression assertion to
      the existing cross-entity test that would have caught this. A live retest of the two affected
      scenarios (`representable-query-loads-and-runs`,
      `changing-the-entity-clears-the-conversation-and-loaded-state`) against the current build —
      disabled-Run indicator, not badge — was completed manually by the user after the automated gate's
      retry was blocked by intermittent `fetch failed` errors from the local assistant backend.)

## 7. Quality checks

- [x] 7.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`,
      `npm run test` from `apps/ai-dial-admin/`) and fix any failures. (0 lint errors; formatting fixed
      in `QueryBuilder.spec.tsx`; full suite: 660 files / 6492 tests passed.)
