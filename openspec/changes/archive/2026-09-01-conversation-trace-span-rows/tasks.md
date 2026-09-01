## 1. Taxonomy: one kind set for row, badge, chip and detail

- [x] 1.1 Add the rating member to `SpanKind` in `src/models/analytics/conversations-trace.ts`, and recognise
      it in `spanKindOf` (`src/utils/analytics/conversation-spans.ts`) by request-URI suffix, ahead of the
      `event_kind` map so a rating hop is not classified by its absent event kind.
- [x] 1.2 Add `SPAN_KIND_LABEL_KEY` / `SPAN_KIND_CLASS` entries for the rating kind in
      `src/constants/analytics/conversations-trace.ts`, plus its i18n key in `src/constants/i18n.ts` and
      `src/locales/en.ts`. Reuse an existing theme token; add no hardcoded colour.
- [x] 1.3 Replace the tree's `HopEventType` axis with `SpanKind`: change `HopNodeData.type` to
      `SpanKind | null`, drop `HopNodeKind.Event`, and point `HOP_EVENT_CHIP_CLASS` / `HOP_EVENT_RAIL_CLASS` /
      `FILTERABLE_EVENT_TYPES` at `SpanKind`. Keep `null` reserved for the unrecorded-root placeholder.
- [x] 1.4 Delete `HopEventType` and `HopEventSeed` from the models, and delete the i18n keys and locale
      entries for the removed event categories (assistant text, tool request, tool result, reasoning, empty,
      session, model call) so no key addresses a category the view can no longer produce.

## 2. Naming a row by its entity

- [x] 2.1 Invert `spanLabelOf` in `src/utils/analytics/conversation-spans.ts` to prefer `deployment`, falling
      back to `request_uri` and then `core_span_id`.
- [x] 2.2 Add a sibling accessor returning what the hop did — the MCP tool-call name where recorded,
      otherwise the MCP method, otherwise nothing — so an MCP row can state its server and its phase from two
      fields rather than one.

## 3. The row's secondary facts

- [x] 3.1 Add a pure function to `src/utils/analytics/conversation-spans.ts` mapping a hop row to a
      discriminated union of the two fact shapes, or to `null`: one shape with tokens, request-message count
      and cost; one with the chain cost; nothing where the hop recorded neither. The predicate is whether the
      hop recorded tokens or a price of its own — a data-presence test, never an entity-type test. Neither
      shape carries the duration (every row has its own column for it) nor the upstream host (constant per
      deployment, so per row it restates the row's own name; the detail panel states it). Put the union in
      `src/models/analytics/conversations-trace.ts`; return data, not formatted text.
- [x] 3.2 Add `formatHopDuration` to `src/utils/analytics/conversation-formatting.ts`, with its own spec.
      `formatConversationDuration` is the wrong scale — it renders anything under 50 ms as `0s`, and recorded
      hop durations begin at single-digit milliseconds. Keep milliseconds below a second, reuse the existing
      second/minute/hour shapes above it, and answer the empty string for an absent or zero value so the
      caller supplies any placeholder.

## 4. Tree construction from spans alone

- [x] 4.1 Rewrite `buildSpanTree` in `src/utils/analytics/conversation-span-tree.ts` to take spans only: one
      node per hop, kind from `spanKindOf`, label and phase from task 2, facts from task 3, no seed
      parameter and no single-seed collapse.
- [x] 4.2 Stop excluding `route` hops: remove `isConversationHop`'s event-kind test so a route hop nests and
      parents like any other. Keep every existing rule for a hop with no locatable parent — it still renders
      at the top level.
- [x] 4.3 Delete `src/utils/analytics/conversation-hop-stream.ts` and move `buildHopTree`'s remaining
      responsibility (sort, build) into `conversation-span-tree.ts` or its caller.
- [x] 4.4 Update `markMatchingNodes`, `categoriesOf`, `countMatchableNodes` and `hasFailedNodes` for the
      `SpanKind` axis, keeping the unrecorded-root placeholder unmatched by every filter.

## 5. Row rendering

- [x] 5.1 Rewrite the row in `ConversationEventStream.tsx`: entity name as the title, the hop's phase and its
      secondary facts beneath it, the kind badge, the persistent failure marker, and the position number.
      Remove the reasoning-token cell and the no-recorded-result chip.
- [x] 5.2 Render the hop's duration on the row where reported, and nothing where the value is at or below
      zero. Draw no offset from the start of the trace and no duration bar.
- [x] 5.3 Point the filter chips at `SpanKind`, still offering only the kinds the turn recorded, still
      pressed-state-exposed, still never disabled, and keep the announced match count and the neutral
      clear-emphasis control.
- [x] 5.4 Keep the a11y contract of the current row: `aria-expanded` plus `aria-controls` on the
      expand/collapse control, `aria-current` on the selected row, `role="status"` + `aria-live="polite"` on
      the match count, `aria-hidden` on the rails and decorative icons, and `DialEllipsisTooltip` wherever a
      name truncates.

## 6. Detail panel and the unrecorded-tool note

- [x] 6.1 Add the hop's duration to `ConversationSpanDetail.tsx`'s metric rows, rendered only where reported.
- [x] 6.2 State the cause of an unrecorded tool result in `Inspector/HopResponsePanel.tsx`, beside the tool
      names that panel already lists: the execution did not cross DIAL and so was not recorded. Resolve the
      surplus by count per tool name against the turn's own MCP hops, never by identity, and add the i18n key
      and locale entry for the wording.

## 7. Drop the model-body read the tree required

- [x] 7.1 Remove `resolveModelOutputs` and its call from `src/app/[lang]/conversations-trace/actions.ts`, and
      remove `modelOutputs` from the payload the trace page passes into `ConversationTraceView.tsx` and
      `use-conversation-trace.ts`.
- [x] 7.2 Delete `src/utils/analytics/conversation-model-outputs.ts` and the `ModelCallOutput` model, and
      remove the now-unused model-body select fields and their constants from
      `conversations-queries.ts` / `constants/analytics/conversations-trace.ts`. Leave the inspector's
      on-demand body read and its session-predicate and time-bound rules untouched.

## 8. Tests

- [x] 8.1 Delete `utils/analytics/tests/conversation-hop-stream.spec.ts` and the model-outputs spec; rewrite
      `utils/analytics/tests/conversation-span-tree.spec.ts` for one-row-per-span, kind derivation including
      the rating kind and the generic fallback, the route hop as a parent, an empty conversation id changing
      nothing, and the placeholder root carrying no kind.
- [x] 8.2 Add a spec for the secondary-facts function covering both shapes and the boundary where a hop
      records tokens but no own price.
- [x] 8.3 Add a spec for `spanLabelOf` and the phase accessor covering an MCP protocol message, an MCP tool
      call, a hop with no deployment, and the fallback chain.
- [x] 8.4 Rewrite `ConversationEventStream.spec.tsx` and `ConversationTraceView.spec.tsx` for the span rows:
      query by role and accessible name, assert the i18n keys the mocked `t()` returns, and cover the chips
      offering only present kinds, the match count announcement, and a duration of zero rendering nothing.
- [x] 8.5 Update `ConversationDetailView.spec.tsx` and the `HopInspector` spec for the removed
      `modelOutputs` prop and the new unrecorded-tool wording. Add mocks to
      `apps/ai-dial-admin/test-setup.tsx` rather than inline in a spec.

No `spec-browser-verify` task: the change's browser-observable scenarios were reviewed and covered by the
component specs in this group instead, by decision on this change.

## 9. Reconcile the neighbouring change

- [x] 9.1 Rewrite `openspec/changes/surface-route-hops-in-usage-log/proposal.md`: its Why becomes the
      remaining gap — hops that are roots of their own traces and belong to no conversation are unreachable
      from every conversation-scoped view — and its incorrect empty-conversation-id inference and its
      out-of-scope note on the span tree are removed. Its Usage Log detail panel and its Core-side ticket stay
      its own scope.

## 10. Quality checks

- [x] 10.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; run
      `npx vitest run <file>` from `apps/ai-dial-admin/` while iterating. Resolve every failure before the
      change is complete.
