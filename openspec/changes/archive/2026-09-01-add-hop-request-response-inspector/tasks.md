## 1. Models, constants and i18n

- [x] 1.1 Add `System` and `Tool` to `MessageRole` in `src/models/analytics/conversations-trace.ts`, and add the inspector's own types — envelope, message entry, property entry, params, dialect, per-side suppression and per-side readability — as interfaces and enums in that file
- [x] 1.2 Add `MESSAGE_TEXT_CLAMP`, `LARGE_MESSAGE_BYTES`, `ENVELOPE_BYTE_BUDGET` and `RAW_BODY_BYTE_BUDGET` to `src/constants/analytics/conversations-trace.ts`, beside `STREAM_MODEL_BODY_BYTE_BUDGET`
- [x] 1.3 Replace the `SpanSent` / `SpanReceived` / `SpanToolCalls` / `SpanTexts*` keys in `ConversationsTraceI18nKey` and `src/locales/en.ts` with the inspector's keys — tab labels, parameter names, the absent-value placeholder, role labels, the clamp and truncation statements, the withheld / failed / empty statements, and the MCP and embedding field labels

## 2. Dialect parsing and envelope building

- [x] 2.1 Create `src/utils/analytics/hop-inspector/dialect.ts` — `dialectOf(request_uri)` returning `ChatCompletions`, `Messages` or `Unknown`, reusing `MODEL_CALL_URI_MARKERS`; an empty `event_kind` on a model-call endpoint resolves to a dialect rather than to unknown
- [x] 2.2 Create `src/utils/analytics/hop-inspector/params.ts` — extract the request's parameters, always emitting `temperature`, `max_tokens`, `tools` and `stream` with an explicit absent marker, emitting every other recognised parameter only when present, and counting unrecognised keys; every presence test is `!= null`
- [x] 2.3 Create `src/utils/analytics/hop-inspector/envelope.ts` — shared sizing (`Buffer.byteLength` over recorded JSON), text clamping, the total envelope budget and its clamped-marker, and property enumeration
- [x] 2.4 Create `src/utils/analytics/hop-inspector/chat-completions.ts` — message list, roles and per-message properties for the OpenAI dialect
- [x] 2.5 Create `src/utils/analytics/hop-inspector/messages.ts` — the Anthropic dialect normalised into the same envelope: the top-level `system` field becomes a system message at index 0, and `text` / `tool_use` / `thinking` content blocks become that message's properties. Roles come from parsed structure only
- [x] 2.6 Delete `src/utils/analytics/conversation-hop-texts.ts`; leave `conversation-bodies.ts` unchanged for the transcript

## 3. Per-tab suppression and split entitlement

- [x] 3.1 Replace `hopTextSuppressionOf` in `src/utils/analytics/conversation-spans.ts` with a per-side resolver: a zero recorded response size suppresses the response side only, a protocol-envelope method suppresses both without a fetch, and an embedding suppresses the response side only
- [x] 3.2 Add `isRequestReadable` and `isResponseReadable` to `transcriptBodyFields` in `src/utils/analytics/conversation-column-catalog.ts`, leaving the conjoined `isReadable` in place for the transcript

## 4. Server actions and hop-row columns

- [x] 4.1 Add `NumberRequestMessages` and `RequestBodyBytes` to the spans query in `src/utils/analytics/conversations-queries.ts` and to `ConversationSpanRow`; both are plain columns and no body column is added to any listing query
- [x] 4.2 Replace `getConversationHopBodies` in `src/app/[lang]/conversations-trace/actions.ts` with `getConversationHopEnvelope`, keeping the existing session/trace/hop filter and `request_time` bound and returning the envelope for the requested side
- [x] 4.3 Add `getConversationHopProperty` — one message's one property in full, same filter and bound
- [x] 4.4 Add `getConversationHopRawBody` — the recorded body clamped to `RAW_BODY_BYTE_BUDGET`, returning the recorded size alongside the delivered size
- [x] 4.5 Have all three actions report a withheld column, a failed read and a hop that recorded nothing as three distinct results

## 5. Inspector — request side

- [x] 5.1 Create `Detail/Inspector/HopInspector.tsx` — the ui-kit `Tabs` (2.0) with the request message count as the Request tab's `count`, the parameter line beside it, and the branch on hop kind and dialect, with `Unknown` routing to the raw view
- [x] 5.2 Create `Detail/Inspector/HopParamsLine.tsx`
- [x] 5.3 Create `Detail/Inspector/use-hop-envelope.ts`, keyed and race-guarded exactly as `use-hop-bodies.ts` is, and delete `use-hop-bodies.ts` once nothing reads it
- [x] 5.4 Create `Detail/Inspector/HopRequestPanel.tsx` — role filter chips as toggle buttons carrying `aria-pressed`, offering only the roles present, with the match count announced through a `role="status"` region
- [x] 5.5 Create `Detail/Inspector/HopMessageRow.tsx` — role, index, byte size, weight bar, property chips with per-property sizes, clamped text, and a reveal carrying `aria-expanded` and `aria-controls` against a `useId()` id; a message at or above `LARGE_MESSAGE_BYTES` is marked
- [x] 5.6 Create `Detail/Inspector/HopMessageProperties.tsx` and `use-hop-property.ts` — the per-message property list and the per-property viewer, fetching one property on reveal

## 6. Inspector — response, MCP, embedding and absence

- [x] 6.1 Create `Detail/Inspector/HopResponsePanel.tsx` — Assembled by default, built from the assembled-response column where the schema reports it and decoded from the recorded response body where it does not
- [x] 6.2 Create `Detail/Inspector/HopRawView.tsx` and `use-hop-raw.ts` — raw fetched only on selection, stating the recorded and delivered sizes when clamped
- [x] 6.3 Create `Detail/Inspector/HopMcpPanel.tsx` — method, tool name, toolset from the hop's deployment, arguments and result; no session field
- [x] 6.4 Create `Detail/Inspector/HopEmbeddingPanel.tsx` — model, inputs, dimension count, tokens and the embedded text; no vector depiction
- [x] 6.5 Create `Detail/Inspector/HopWithheldNote.tsx` — withheld, failed and empty stated distinctly in a `role="status"` region
- [x] 6.6 Mount the inspector in `Detail/ConversationSpanDetail.tsx` in place of `ConversationHopTexts`, and delete `Detail/ConversationHopTexts.tsx`
- [x] 6.7 State the withheld side once with the trace view's header in `Detail/ConversationTraceView.tsx`, leaving individual hops silent

## 7. Span kind and outcome split

- [x] 7.1 Split `SpanCategory` into a kind enum — `Llm`, `Mcp`, `Embeddings`, `Route`, `Other` — and update `SPAN_CATEGORY_CLASS` and `SPAN_CATEGORY_RAIL_CLASS` and their label keys accordingly
- [x] 7.2 Split `spanCategoryOf` into `spanKindOf` (no failure branch) and `isFailedSpan` in `src/utils/analytics/conversation-spans.ts`
- [x] 7.3 Update `Detail/SpanCategoryBadge.tsx` and `Detail/ConversationSpanDetail.tsx` to render the kind badge with a failure marker beside it rather than instead of it
- [x] 7.4 Remove `Error` from `HopEventType` and carry failure as an outcome on the node in `src/utils/analytics/conversation-hop-stream.ts`; a failed hop still renders as a single node
- [x] 7.5 Add the single `Failed` filter control to `Detail/ConversationEventStream.tsx`, offered only when the turn recorded a failure, behaving as a kind control otherwise, with the failure marker persistent regardless of emphasis

## 8. Tests

- [x] 8.1 Unit-test the dialect resolver, the parameter extractor (including `temperature: 0` and `stream: false`), the sizing and clamping helpers, and both dialect parsers — including that a `"role":"system"` string inside a tool result yields no system message
- [x] 8.2 Unit-test the per-side suppression resolver and the split entitlement helper
- [x] 8.3 Unit-test `spanKindOf`, `isFailedSpan` and the event-stream tree's outcome handling
- [x] 8.4 Component-test the inspector: the tabs and their counts, the parameter line's absent-value placeholder, the role filter, a clamped message and its reveal, the assembled and raw response modes, the MCP and embedding panels, and the withheld / failed / empty statements
- [x] 8.5 Component-test the kind badge with its failure marker and the event stream's `Failed` control, including that it is absent when nothing failed

## 9. Quality checks

No browser-verification task: a `spec-browser-verify` task was offered for this change's browser-observable
scenarios and declined in favour of unit and component tests alone.

- [x] 9.1 Run `npm run lint`, `npm run format` and `npm run test` from the repo root, and fix everything they report

## 10. Follow-up: feedback from the running app

Collected from a live pass over the inspector on 2026-08-31. Nothing here is implemented yet. Items 10.5 and
10.6 change what the specs mandate, so they need the delta spec revised before they are built — see the note
under each.

- [x] 10.1 Recolour the per-property pills and the tab's message-count badge: both render in accent blue and
      read as interactive links. Use the default secondary text colour. The count badge is drawn by ui-kit
      `Tabs` and takes no styling prop, so the count moves off the badge — into the parameter line, keeping
      `number_request_messages` as its source so it stays right when a body read is clamped or withheld
- [x] 10.2 Remove the per-message weight bar in `HopMessageRow`. It reads as a divider under the message
      header, and at 44 B beside a 1 KB message it draws a two-pixel dash that says nothing the stated size
      does not
- [x] 10.3 Render the tool call as the message's content when an assistant message carried no text. Such a
      message records `content` as `""` — 2 B — so `messageTextOf` returns an empty string and the row renders
      an empty paragraph, leaving a card that looks broken. "Recorded no text" is the wrong answer: the
      `tool_calls` array *is* what the assistant said, so the row SHALL state each call's function name and its
      arguments inline, in the message history, rather than only in a pill or a note. The decoder already has
      `toolCallRequestsOf` in `conversation-bodies.ts`, which returns `{ name, args }` per call and handles the
      streamed shape; the request-side parsers currently discard `tool_calls` into a property entry instead.
      Applies to both dialects — the messages dialect records the same thing as a `tool_use` content block
- [x] 10.4 Reconcile the two colour palettes. The tree colours a node by `HopEventType`
      (`HOP_EVENT_RAIL_CLASS` / `HOP_EVENT_CHIP_CLASS` — model call is `accent-primary`) while the rail
      colours the same hop by `SpanKind` (`SPAN_KIND_CLASS` — LLM is `info`), so one hop reads as two
      different colours in two places on one screen. Decide which vocabulary owns the palette and derive the
      other from it
- [x] 10.5 Remove the per-property pills from the end of each message and render the message history as text.
      **Spec impact**: this deletes tier 2 as specified — "On revealing one message or one property — that
      property's full value, for that message alone" — and the requirement "The Request tab SHALL state ...
      the names and sizes of the properties it carries", plus their scenarios. Reveal becomes a full-text
      fetch of the message rather than a per-property one. Revise `specs/analytics/spec.md` before building
- [x] 10.6 Decide what survives of the property model once 10.5 lands. `HopMessageProperty`,
      `HopMessageProperties.tsx`, `use-hop-property.ts`, `propertyValueOf` and `getConversationHopProperty`
      exist only to serve the pills; the per-message byte size stays either way, since it comes from the
      envelope

## 11. Follow-up: review findings

From two independent review passes over the implemented change, plus two items verified first-hand. Ordered by
severity. Nothing here is implemented.

- [x] 11.1 **Critical.** `clampBytes` (`hop-inspector/envelope.ts`) slices *characters* against a *byte*
      budget and then trims one character per pass, re-encoding the whole remainder each time. Measured at
      241 980 iterations and 158 s of synchronous CPU for a 1.4 MB Cyrillic body against
      `RAW_BODY_BYTE_BUDGET`; it runs inside a server action, so it blocks the shared event loop for every
      reader. Reachable from `rawBodyOf` and `mcpFactsOf`. Encode once, slice the byte array, decode, and drop
      a trailing replacement character. The existing test uses a 5-byte ASCII budget and cannot surface it —
      the regression test needs multi-byte content at a realistic budget
- [x] 11.2 The response fetch is gated on the raw `side` state (`HopInspector.tsx:63`) while the rendered tab
      is `activeSide`, which falls back to `tabs[0].id` (line 100). A caller granted the response column but
      not the request one gets a single Response tab, `side` stays at its `Request` default, the read is never
      enabled and the panel spins forever — the split-entitlement case this change exists to serve. Gate on
      `activeSide`, or initialise `side` from the available tabs
- [x] 11.3 **Decision drift, not a bug (decision 4 — an unparseable dialect falls back to raw *and says so*).** The delta spec's scenario "an unparseable dialect falls back to raw" requires the inspector to
      state that it cannot structure the body. `RequestSide` renders `<HopStateNote />` with no props and
      `STATE_KEY` has no `Unstructured` entry, so it returns `null` and the raw dump appears unexplained.
      `InspectorUnstructured` is dead i18n. Pass the state and add the entry
- [x] 11.4 **Decision drift, not a bug (the clamp-statement rule).** Two clamps are computed and never stated, against the spec's "a clamp SHALL state that it clamped,
      and by how much": `HopResponseEnvelope.isTextClamped` is never read by `HopResponsePanel`, and
      `HopMcpFacts.isResultClamped` is never read by `HopMcpPanel` — the latter fires in practice, since a
      `tools/call` result averages 123 KB. Relatedly `responseEnvelopeOf` passes `RAW_BODY_BYTE_BUDGET`, a
      byte budget, to `clampText`, a character limit; pick one unit
- [x] 11.5 `text-controls-text-disable` (`HopParamsLine.tsx`) is not a generated Tailwind class — the config
      keys are `controls-disable` and `controls-secondary-disable`, and `controls-text-disable` is the CSS
      variable name. The absent-parameter placeholder silently inherits `text-secondary`. Make that explicit
      rather than reaching for a `*-disable` token, which `a11y.md` forbids for enabled content
- [x] 11.6 A large message is marked by `border-warning` alone. `InspectorMessageLarge` was added to
      `i18n.ts` and `en.ts` and is referenced nowhere, so the distinction is colour-only — which both
      `a11y.md` and the spec's own "colour SHALL NOT be the only thing that distinguishes" rule out. Render
      the label
- [x] 11.7 (moot — the pills are gone with 10.5) `HopMessageProperties` set `aria-expanded` with no `aria-controls`, and the disclosure cannot
      close — a second click re-fetches the same property. Either make it a real toggle or drop
      `aria-expanded` and treat it as a load button. May be moot once 10.5 removes the pills
- [x] 11.8 `use-hop-facts.ts` freezes `run` with `useRef(async …).current`, capturing the first render's
      `scope` and `traceId`, while `heldKey` includes both — so a change re-fires the effect and commits a read
      issued against the old scope under the new key, defeating the key discipline the file's own comment
      claims. `useCallback` with real deps keeps `run` stable without the staleness, as `use-hop-envelope.ts`
      already does by passing both as arguments
      Fixed by making `scope`, `traceId`, `span` and the request *arguments* of a module-level runner, so
      nothing render-scoped is captured at all — a `useCallback` with deps would have worked and this needs no
      dependency list to stay right.
- [x] 11.9a `conversation-span-tree.spec.ts:306` still names `HopEventType.Error` after the member was
      deleted. vitest does not typecheck, so `seed(span, undefined)` makes the assertion compare `undefined`
      to `undefined` and the test passes vacuously — leaving the change's central behaviour, a failed call
      keeping its own kind, without real coverage. `tsc` reports it as `TS2339`
- [x] 11.9b **Moved out of this change — the typecheck gate is its own task.** `tsc` runs nowhere: no nx
      `typecheck` target, `.husky/pre-push` runs only `npm run test`, and `.github/workflows/pr.yml` runs only
      the agent-doc validators, so `TS2339` could not have been caught by anything. The gate cannot be
      switched on as-is; that task starts by clearing the app project. Both tsconfigs are back at HEAD and stay
      there. Measurements to carry into it, so it does not start from zero:
      - `tsconfig.spec.json` as it stands: **3 922 errors, 2 625 of them phantom** `toBeInTheDocument`.
      - Adding `@testing-library/jest-dom` to `types`: **702**.
      - Adding `@testing-library/jest-dom/vitest`: **702 — identical today, and this is the form to use.**
        The bare name resolves to `types/index.d.ts` → `jest.d.ts`, which augments `namespace jest` and carries
        `/// <reference types="jest" />` while `@types/jest` is not installed; the `/vitest` subpath augments
        `declare module 'vitest'` directly.
      - App project: **57 errors — 42 are stale `dist/apps/ai-dial-admin/.next/types/**` artifacts**, whose
        route types go out of date the moment a route moves. The **15 real ones are all in
        `ExportAssets/ExportGrid.tsx`** (`bulkSelectedData` missing from `AssetsFolderContext`).
      - **0 errors in the inspector area.**
- [x] 11.10 **Decision drift, not a bug (decision 16 — entitlement is per side).** `getConversationHopMcp` and `getConversationHopEmbedding` call `readHopBody` with both sides and
      proceed as `Available` when only one is granted, so `mcpFactsOf` returns `resultText: null` and
      `embeddingFactsOf` returns `NoBody` — reporting a withheld column as "recorded nothing", which the spec
      requires be stated as different facts
      Fixed by carrying the read's actual grants (`HopSideGrants`) into both fact builders: an MCP hop states
      its result half by `resultState`, an embedding hop its dimension count by `isDimensionsWithheld`, and a
      caller denied the *request* column gets a withheld panel rather than one that appears to have recorded
      nothing. Covered by four parser tests and two component tests. The delta spec gains the rule ("a panel
      built from both columns SHALL state each half by its own grant") and two scenarios; design.md §5 gains
      the reasoning.
- [x] 11.11 **Decision drift, not a bug (decision 17 — kind and outcome are two axes).** The tree rail states the outcome *instead of* the kind (`railClassOf`), relocating the
      conflation this change removed from the badge. Defensible because the "failed" chip preserves the
      information, but it sits against "kind and outcome SHALL be two axes, never one set". Decide it
      alongside 10.4, which owns the two-palette problem next door
- [x] 11.12 `embeddingFactsOf` joins a whole input array with no budget, breaking the payload invariant every
      other path honours. Low risk at a 352 B average, real for a batch embedding
      Fixed with `clampToBudget` and a stated clamp, like every other body-derived text. The spec's MCP and
      embedding requirement now states the rule and a scenario covers a batch.
- [x] 11.13 **Decision drift, not a bug (parsers take parsed values).** The request body is JSON-parsed twice per tier-1 read: `paramsOf` parses internally and then
      `parseJson` parses again. Doubled work on the 21% tail above 100 KB. Have `paramsOf` take the parsed
      value, as every other parser in the folder does
      Fixed: `paramsOf` takes the parsed value and tier 1 parses once. The spec is unaffected — it never
      described the internals — and `params.spec.ts` now passes objects, which also let it state the real
      contract (any JSON value, not just a string that may not parse).
- [x] 11.14 Nits (partly done — `clampedCount` renamed, `role="group"` now carries the index, dead `SPAN_KIND_RAIL_CLASS` removed, `<dl>` wrappers are now `div`): dead `ConversationHopTexts` / `ConversationHopBodies` / `HopTextsState` /
      `HopTextSuppression` types and the `EventError` i18n key have no consumers left; `clampedCount` counts
      messages *with* text, not clamped ones; `<dl>` wrapping `dt`/`dd` in `<span>` is invalid markup;
      `aria-label` on a `<p>` is ARIA-prohibited; `role="group"` on an `<li>` drops `listitem` semantics and
      labels every message identically; `suppression` should use `HopSideSuppression | null` directly;
      `serialize` can return `undefined` despite a `string | null` type

## 14. ui-kit audit of the inspector's components

      All closed: the four dead types and the `EventError` key are deleted (a test asserting on that key was
      comparing against `undefined`, so its regex matched every button — it now names a live category);
      `HopParamsLine` is a `role="group"` rather than an `aria-label`led `<p>`; `SideProps.suppression` is
      `HopSideSuppression | null`; and the `tool_use` argument serializer returns `?? null` so its declared
      type is true rather than intended.
- [x] 14.1 **The reveal read as a link, not a button.** "Show full message" used `GhostButton`, whose ghost
      appearance is accent text with no border — correct ui-kit, wrong affordance for an action on the message.
      Now `OutlinedButton` (2.0)
- [x] 14.2 Prefer 2.0 where a 1.0 component is superseded: `DialNotification` → `Notification`,
      `DialSegmentedControl` → `SegmentedControl`. The latter also **fixes an ARIA collision**: the 1.0 control
      rendered `role="tab"`, so the response mode switch put a second tablist inside the Request/Response tab's
      own panel and "the tab named Raw" was ambiguous. The 2.0 control is a `radiogroup`. Pinned by a test
      asserting the radiogroup and that exactly two tabs exist on the panel
- [x] 14.3 Deliberately kept: `DialLoader` has no 2.0 replacement (`Skeleton` is a placeholder, not a
      spinner), so 1.0 is correct there. `GhostButton` stays for the role filter chips — it is 2.0, and it is
      what the sibling filter in `ConversationEventStream` uses, so the two filters on one screen stay the same
      control
- [x] 14.4 Deliberately **not** `Tag` for the kind badge, the large-message marker or the role label: `Tag`
      exposes no `className` and no colour, so adopting it would discard the kind hues 10.4 exists to keep in
      step with the tree palette. The hand-rolled badge is a colour carrier, not a missed component
- [x] 14.6 **The 2.0 preference is wrong on this theme for controls with a hover or selected fill.** ui-kit's
      2.0 controls reach for the `--bg-control-*` / `--text-control-*` families, which the DIAL themes service
      never defines, so both fallbacks miss and they resolve to a light palette — light text on a light fill.
      The 1.0 controls use `--controls-bg-*`, which the service *does* define. Same class of gap as the Assets
      grid (#4108). Note the word order is the only difference between a token that exists and one that does
      not. Consequences, each verified against the running app:
      - `OutlinedButton` (2.0) is kept for the message reveal — the affordance was the point — with a scoped
        `hover:!bg-controls-neutral-hover` override, the app's own key for a token the service defines. It is
        the first use of `OutlinedButton` in the repo, which is why nothing else had surfaced this
      - `SegmentedControl` (2.0) is **reverted to `DialSegmentedControl`** (1.0): its selected segment is
        styled by ui-kit's own `bg-control-*` utilities with no themeable class to override, and the 1.0
        control is what `ConversationViewSwitch` and `FeedbackFilterControl` already render correctly. This
        reverses part of 14.2 and gives back the `radiogroup` ARIA — a legible control beats better roles on an
        illegible one, and the mode switch is a sibling of the tab list rather than nested in a `tabpanel`
      - `Notification` (2.0) and `Tabs` (2.0) are kept: neither reaches a missing token for its resting or
        hover state. `Tabs`'s selected underline does reach `--bg-gradient-*` / `--stroke-gradient-*`, which
        are also undefined — it renders acceptably today, so it is recorded rather than worked around
- [x] 14.7 **The inspector moves last in the rail and owns its own scroll.** It sat between the metrics grid
      and the facts list, so a long message list pushed the hop's endpoint, upstream and status off the rail
      entirely. Now: heading, metrics and facts stay fixed, and the Request/Response tab takes the remaining
      height with one scroll container. `ConversationRailShell` no longer decides overflow for both its
      consumers — the conversation rail scrolls as a whole, the hop rail scrolls inside the inspector. The
      per-block `max-h-*` caps are dropped with it, since a nested scroller made the reader hunt for which
      scroll they were in; the tab stop moves to the one container that scrolls
- [x] 14.8 **The rail's reference facts were starving the surface the change exists for.** Two causes, one
      symptom: the nine-row facts block sat at natural height (~280px of a ~530px rail) with `shrink-0`, so
      the inspector — `flex-1` with a zero basis — got only the leftover ~130px, enough for the role filter
      and a sliver of message list. The filter itself then scrolled away with the list it filters, leaving no
      way to change the filter on a 52-message hop without scrolling back up. Fixed by capping the facts block
      at 35% of the rail with its own scroll and a tab stop (reference data read once per hop yields to the
      working surface), tightening its row padding, making the role filter `sticky top-0` on the rail's own
      ground — with the panel's row gap removed and each block carrying its own bottom padding instead,
      because a gap below a sticky bar is a transparent band *inside* the scroll port and rows crossing it
      read as text sliding under the chips — and dropping the visible "N of M messages" line to `sr-only` — every count it showed was
      already on the pressed chip, and at 360px it wrapped to a row of its own to restate it. The screen-reader
      announcement is unchanged.
      The Response tab's Assembled/Raw control is pinned the same way, for the same reason: it chooses what
      the pane below shows, and a raw body scrolls far past the rail's height.
- [x] 14.9 **Bug (pre-existing, in `Common/LoadingOverlay`): the selected view segment floated over the
      loading overlay.** Opening a hop chain covers the page with `LoadingOverlay`, which was `absolute
      inset-0` with no stacking level — so a *positioned* descendant of the content beneath it still painted
      on top. ui-kit's `DialSegmentedControl` gives its selected segment `relative z-10` so that segment's
      border overlaps its neighbour's, which is why exactly one control survived the overlay — the selected
      "Trace" button, alone on an otherwise blank page. Not introduced here and not limited to this view:
      the same overlay covers the conversations listing and the Chat transcript. Fixed with `z-20` on the
      overlay, above ui-kit's `z-10` and below the repo's dialog levels.
- [x] 14.5 Remaining raw elements are layout and content, not controls — `<pre>` scroll blocks for bodies and
      arguments, `<dl>` fact grids, `<p>` text. ui-kit offers no code or JSON *viewer*, and
      `components.md` §6 puts static key-value layout on CSS grid rather than a component. Re-check if a
      viewer component appears in a later ui-kit release
      Re-checked against the ui-kit MCP server: the only candidates are `DialJsonEditor` and
      `DialSchemaRenderer`. Neither fits — `DialJsonEditor` is Monaco with a required `onChange`, an editor
      lazy-loaded for editing, and the inspector renders read-only content that is often not JSON at all (SSE
      frames, clamped bodies). Conclusion stands: `<pre>` blocks and CSS-grid fact tables are correct here.
      Worth re-checking only if ui-kit ships a read-only viewer.

## 12. Follow-up: reconcile the artifacts before archive

Done last, after the code stopped moving, and by re-reading the diff rather than this list — which is how the
entries below 12.4 were found. Where an artifact and the code disagreed, the disagreement was decided before
either was edited. **12.3 is the one case decided the artifact's way** — the table was wrong and the code
stayed. Everywhere else the code was right and the document moved, except 11.10, where the spec was *silent*
rather than wrong: the rule was written and the code fixed to meet it.

- [x] 12.1 design.md §1 promised "three fetch tiers, three server actions" and named
      `getConversationHopEnvelope`; six shipped. **The code is right, and the reason is worth stating rather
      than just the count:** one envelope action would have to name both body columns to answer either tab,
      which defeats the per-side entitlement the change exists for — the split is what makes that entitlement
      enforceable at the query rather than in the panel. §1 now carries all six with their tiers and both
      "why" paragraphs. §7's utils list is rewritten from the folder as it stands (nine modules, including
      `responses.ts`, `response.ts`, `mcp.ts`, `embedding.ts`; no `property.ts`)
- [x] 12.2 Naming drift, all in design.md: `HopWithheldNote.tsx` → `HopStateNote.tsx` (renamed once it
      carried four states rather than one), `isFailedSpan` → `isFailedHop`, and `SpanCategoryBadge.tsx`
      deleted and replaced by `SpanKindBadge.tsx` rather than "updated". §7's component list is the real one
      now, with a paragraph naming what was renamed, dropped and extracted against the original sketch
- [x] 12.3 **The artifact was wrong here, so the artifact changed.** design.md §4's suppression table was
      ordered response-bytes → envelope → embedding; the code tests the envelope first. The code is right: a
      protocol-envelope hop records zero response bytes, so a response-bytes-first reading labels every
      session-negotiation hop "returned no response body" — true, useless, and it hides the reason there is
      nothing to read. Table reordered, with the ordering stated as part of the rule so the next reader does
      not "fix" it back. `HopReadState.Unstructured` is now described in §3, including why it is not the same
      answer as a hop that recorded nothing
- [x] 12.4 `MessageRole.Other` is now in the proposal (both mentions) and in the delta spec as a requirement
      sentence plus a scenario — an unrecognised role renders under a neutral label and is counted, because
      the endpoint set is open by design and a message dropped for an unfamiliar role is a gap the reader
      cannot see. Already covered by `envelope.spec.ts`

Found by re-reading the diff, absent from the list above:

- [x] 12.5 `HopDialect.Responses` and the third `DIALECT_MARKERS` row appeared nowhere in design.md, whose
      Context bullet still read "two dialects, and a third family already named in code" and whose §3 had
      `/v1/responses` landing on the raw fallback. Both corrected, and §3 now describes all three
      normalisations. Recorded as a mid-change addition rather than folded into the original reasoning: the
      traffic appeared after the proposal was written
- [x] 12.6 `HopResponseEnvelope.reasoningText` is a field no artifact named. design.md §3 now states it and
      why it is separate from the answer — 54% of Responses hops record a reasoning summary, and reading it
      as the reply misattributes the model's scratch work. The delta spec already carried it from 13.8
- [x] 12.7 `conversation-bodies.ts` now **exports** `sseFrames` for the Responses decoder — a new dependency
      between the transcript's module and the inspector's, where design.md §7 claimed the transcript module
      was left to the transcript. Stated: the decoder reuses the frame splitter rather than splitting frames
      a second way
- [x] 12.8 Tier 2 was reshaped from per-property to per-message; design.md §1 still said "one message's one
      property". The reshape is stated, and the Risks entry that offered this widening as a *remedy for
      chatty reads* is corrected — it was taken because the properties were removed, not because reads proved
      chatty, so the remedy it promised is already spent
- [x] 12.9 Also unrecorded, from the review and UI passes: the per-half grant rule (design §5 plus two spec
      scenarios, from 11.10), the ui-kit reversal on the response-mode control and the dropped tab count (§7,
      from 14.2 / 14.6), and the rail's height priority — not a styling fix but a layout decision, now
      design.md **§10** with the measurements that forced it
- [x] 12.10 design.md §6 stated the wrong cause for the route contradiction. It read as though route hops
      were excluded because they are "scheduler REST calls"; the real cause is that **Core records nothing
      that would place a route hop in a conversation**. Re-measured on 1 September 2026 rather than quoted:
      `event_kind = 'route'` recorded **4 780 hops in August 2026**, and through 30 August **0** carried a
      `chat_id` while 1 carried a `core_parent_span_id`. **The premise is already changing** — on 31 August
      alone, 369 route hops carried 215 parent spans and 10 conversation ids, each of those 10 carrying both,
      all from one RAG deployment's `/route/channel/documents/search`. So the exclusion is a data decision
      with a visible expiry date, not a rendering preference, and §6 says so with the window stated

## 15. Parked, and where each one now lives

Three items are deliberately out of this change. Each is recorded where it will still be found after this
change is archived — an unarchived change is listed by `openspec list`, which this file will not be.

- [x] 15.1 **The typecheck gate** (from 11.9b) → `openspec/changes/enable-typescript-typecheck-gate/`. Its
      proposal carries the vacuous-test story that motivates it and every measurement from 11.9b, so the work
      does not restart from a blank `tsc` run. The pre-push-vs-CI question is stated there as an open
      question rather than decided here
- [x] 15.2 **A Core ticket: propagate the parent span and conversation id into route calls** →
      `openspec/changes/surface-route-hops-in-usage-log/`, item 2. **Not filed.** Filing it means posting to
      `epam/ai-dial-core`, which needs explicit authorization; the proposal says so and leaves a place for the
      issue number
- [x] 15.3 **A Usage Log detail panel where route hops are actually visible** → the same change, item 1. It
      is the half that works with the data as it stands: a Usage Log row needs no conversation id and no
      parent span, because the row itself is the selection, and `HopInspector` already takes a hop row rather
      than a tree node

      One consequence worth stating: `enable-typescript-typecheck-gate` is marked `skip_specs: true` and
      validates, while `surface-route-hops-in-usage-log` has no spec delta yet and therefore does **not**
      validate. That is deliberate — it changes behaviour, so writing `skip_specs` there would be a lie, and
      writing the delta now would mean designing unplanned work. `openspec validate` on it will report a
      missing delta until someone picks it up.

## 13. Responses API dialect

Written against `ali.qwen3.7-plus` (22 hops, the only deployment with meaningful streaming) and verified against
a disjoint set — `anthropic.claude-sonnet-5-ak` (18 Aug, streaming), `gpt-5.4-2026-03-05`,
`deepseek-v4-flash-2026-04-23`, `fw.glm-5.2` — different families, different days. Measured over 199 hops on
`/v1/responses`, 2026-08-18..20, across 21 deployments.

**Confirmed from the brief.** `instructions` top-level 180/199; `input` present on all, a string in most;
`messages` absent from every body; `max_output_tokens` 185/199; `usage.input_tokens`, never `prompt_tokens`;
`function_call` and `function_call_output` zero, so tool use is genuinely unexercised here.

**Three things the brief did not have, all found by measuring rather than by reading the API docs:**

1. **`output_text` and `reasoning` are dominant on the *response* side.** The brief's zero counts hold for the
   request only. Response-side: `reasoning` items **107/199 (54%)**, `output_text` content parts **190/199
   (95%)**, `message` items 190/199. A `reasoning` item carries `summary: [{ type: 'summary_text', text }]`
   and a null `content`; a `message` item carries `content: [{ type: 'output_text', text }]`.
2. **`input` is an array more often than the brief measured** — 13/199 rather than 3/188, with 9 carrying
   `input_text` parts. Not a rare shape to defer.
3. **Assembled mode is broken for this dialect today, and the column is not the reason.**
   `assembled_response` is populated on **199/199**, but it holds the *Responses* shape (`output[]`), not
   `choices[].message`. `assistantTextOf` → `firstChoiceMessage` finds no `choices`, the raw fallback finds
   none either, so the Response tab reports "this hop recorded nothing" while a full response sits in the
   column. `finishReasonOf` likewise finds no `finish_reason` — this shape states `status` and
   `incomplete_details`.

**Streaming.** 9/199 set `stream: true`, 8 recorded SSE. The framing is **named events** —
`event: response.created`, `response.output_item.added`, `response.content_part.added`,
`response.output_text.delta` (text under `delta`), `response.output_text.done`, `response.output_item.done`,
`response.completed` — each `data:` payload repeating its own `type`. The existing `sseFrames` reads only
`data:` lines and so needs no change. The terminal `response.completed` frame carries the whole `response`
object, so decoding *that* reuses the non-streaming path rather than accumulating deltas.

- [x] 13.1 Add `HopDialect.Responses` and map `/v1/responses` to it in `dialect.ts`
- [x] 13.2 `responses.ts` request parser: `instructions` → a system message; a string `input` → one user
      message; an array `input` → one message per item, with `input_text` parts reduced to text. An item type
      this frontend does not recognise renders generically — never silently hidden, per the deny-list rule
- [x] 13.3 Decode the Responses *output* shape: `message` items' `output_text` parts as the answer, and a
      `reasoning` item's `summary_text` stated as reasoning rather than as the answer. Take `status` where
      `finish_reason` does not exist. Decode a stream from its terminal `response.completed` frame
- [x] 13.4 Make `responseEnvelopeOf` dialect-aware — it currently hardcodes the chat-completions decode
- [x] 13.5 Params: `max_output_tokens` becomes a recognised parameter; `input` and `instructions` join the
      structural set so they are not counted as unrecognised parameters
- [x] 13.6 Tests for all of the above, including the array-`input` shape and a `reasoning`-only output
- [x] 13.9 **Bug: a full response reported as empty on the Responses dialect.** `responseEnvelopeOf` ran one
      decoder for every dialect — `assistantTextOf` → `firstChoiceMessage`, which looks for
      `choices[].message`. The Responses dialect lands in the same `assembled_response` column but records
      `output[]`, so the decoder found nothing, the raw fallback found nothing either, and the Response tab
      rendered `InspectorNoBody` — "this hop recorded nothing here" — over a complete, populated response.
      Not a rare path: `assembled_response` is populated on **472 of 472** sampled hops, so *every* hop on
      this endpoint showed it. `finishReason` was empty for the same reason: this shape states `status`.
      Fixed by choosing the decode by dialect. Covered by
      `hop-inspector/tests/responses.spec.ts` — "decodes the answer from output items rather than reporting
      nothing", plus "takes the status where a finish reason does not exist" and a chat-completions case
      asserting the old path is unchanged.
- [x] 13.10 **Bug: a Responses tool call was invisible.** Only a `message` item carries text, so a hop that
      called a tool and said nothing rendered its reasoning summary with no sign of the call — the same defect
      as 10.3 one dialect over. Found by widening the measurement window: `function_call` is 0 of 199 over
      18-20 August and **1 of 472** over 17-21, which is why the narrower window read as "tool use is
      unexercised". Span `47ed5589e0cd5d86`, `ali.qwen3.7-plus`, 21 August, calling `get_current_weather`.
      Fixed by naming `function_call` items on the response envelope, and by counting a tool call as content
      when deciding whether a hop recorded anything. Covered by "names a function_call output item so the call
      is not invisible".
- [x] 13.11 **Correction: the spec's Responses figures were quoted from a narrower window than they claimed.**
      `180 of 199` and `13 of 199` were re-measured on challenge. Both the original `180 of 188` / `3 of 188`
      and the `/199` restatements were internally correct — for different windows, since every
      `instructions`-bearing hop fell on 19 August and the array-shaped inputs fell on 18 and 20. Re-measured
      over one stated window (472 hops, 23 deployments, 17-21 August) and the spec now names it, with the
      per-day spread recorded so the next reader does not re-derive a different answer and stop trusting the
      rest.
- [x] 13.8 Fold the dialect into `specs/analytics/spec.md`: the requirement said "two structurally different
      dialects" and still described the messages dialect's blocks as **properties**, which 10.5 removed. Now
      three parsed dialects, the Responses request and output shapes, the reasoning summary stated separately,
      `status` in place of a finish reason, the named-event stream decoded from its terminal frame, the
      unexercised-tool-use deny-list, and one mapping from endpoint to parser across every tier. Seven
      scenarios added, and the "Assembled" requirement now states that the decode is chosen by dialect
- [x] 13.7 (decided, nothing built) Do **not** build a parser for `/v1/completions` — zero hops in two weeks; it stays on the raw
      fallback
