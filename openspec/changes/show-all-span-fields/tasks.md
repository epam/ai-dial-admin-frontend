## 1. Resolve the field set from the schema

- [x] 1.1 Add the span-field models to `src/models/analytics/conversations-trace.ts`: a resolved span-field
      descriptor (published name, label, description, type, tag) and a group descriptor (tag, ordered
      fields), plus a `SpanFieldTag` enum for the tags this release labels.
- [x] 1.2 Add `spanFields` to `src/utils/analytics/conversation-column-catalog.ts` beside `hopBodyFields`:
      takes the fetched schema's fields, returns the projection (base list ∪ reported fields, minus `heavy`)
      and the ordered group descriptors. Match by unqualified column name, as `hopBodyFields` does.
- [x] 1.3 Extract the current literal column list out of `buildConversationSpansQuery` into a named base
      constant in `src/constants/analytics/conversations-trace.ts`, and make the query take the resolved
      field names instead of carrying the list.
- [x] 1.4 Resolve the field set in the conversations-trace server action that reads the spans
      (`src/app/[lang]/conversations-trace/actions.ts`), reusing the `withEntitySchemaCache` read the body
      grant already performs, and fall back to the base list when the schema read fails. Return the group
      descriptors alongside the spans.

## 2. Format and count field values

- [x] 2.1 Add `src/utils/analytics/conversation-span-fields.ts` with the emptiness predicate — `null`, empty
      string and empty array are empty; a reported zero is empty only for the metered tags — and the value
      formatter keyed by the schema's field type (timestamp with sub-second precision, array joined, numbers
      through the existing formatters).
- [x] 2.2 Add the per-group counting helper to the same module: counts the fields a span has a value for
      against the number the schema declares, using the predicate from 2.1 and nothing else.

## 3. Present the fields in the rail

- [x] 3.1 Add `use-span-field-groups.ts` under `components/Analytics/ConversationsTrace/Detail/`: holds the
      chosen tag, derives the open one, following the chosen-versus-active split of `useSpanBodyTabs`.
- [x] 3.2 Add `SpanGroupPanel.tsx` — one controlled ui-kit `Accordion` per group, header stating the label
      and the count, body rendering the group's non-empty fields through `ConversationTermList` with the
      schema's description as the `FieldCaveat` hint, and a statement in place of rows when the span has
      none.
- [x] 3.3 Add `SpanFieldsSection.tsx` — the section of groups, wiring 3.1 to 3.2 so opening one collapses the
      other.
- [x] 3.4 Restructure `ConversationSpanDetail.tsx`: figure tile down to the recorded instant with sub-second
      precision and the own/chain cost pair, endpoint and upstream rows above the groups, then
      `SpanFieldGroups`. Drop the rows the tree and the transport line already state in the same form.
- [x] 3.5 Add the JSON control to `ConversationSpanDetail.tsx`: an icon button opening `FullscreenViewer`
      (`ViewerContentType.Json`) titled by the span's label, serialising the whole span row under its
      published column names with empty values intact, and stating the note about the bodies in the popup's
      frame rather than inside the JSON. Verify the shared `portalId` does not collide with the bodies
      section's `CodeViewer` instance; mount the popup only while open if it does.
- [x] 3.6 Add the i18n keys to `src/constants/i18n.ts` and `src/locales/en.ts`: the rail's own figure labels
      (replacing the reused `TraceTokens` / `TraceCost` at the rail's call sites), the group header labels
      with a fallback to the raw tag, the empty-group statement and the JSON control's accessible name.

## 4. Tests

- [x] 4.1 Unit-test `spanFields`: projection includes the reported non-heavy fields, excludes `heavy`,
      excludes nothing the schema omits, resolves a qualified enrichment column by its column name, and
      falls back to the base list on an empty schema. Add the invariant test that every column in the base
      list is one the service publishes to any caller — a schema fixture without the sensitive columns must
      leave the base list fully resolvable.
- [x] 4.2 Unit-test the predicate, the formatter and the counter from task group 2, including the metered
      zero and a group whose count must equal the number of rows rendered.
- [x] 4.3 Component-test `SpanGroupPanel` and `SpanFieldsSection`: header states label and count, opening one
      group closes the other, a group with no values stays operable and states the absence, rows carry the
      schema's description as a caveat. Query by role and accessible name.
- [x] 4.4 Component-test `ConversationSpanDetail`: the figure tile states the instant and both cost figures,
      endpoint and upstream render outside the groups, the duration and the token total are absent, the open
      group survives a change of the `node` prop, and the JSON control opens a popup holding the fields the
      groups omit.

## 5. Docs and quality gate

- [x] 5.1 Reconcile the delta with what implementation settled: group order comes from the order the schema
      reports fields in (the service sorts them by the entity's tag order), a failed schema read leaves the
      rail with its headline facts and no groups, and the restated fields stay in the projection while
      leaving the groups.
- [x] 5.2 Run lint, format check and the test suite, and clear anything they report.

Note: no browser-verification task is included — the change's scenarios are browser-observable, and the
decision not to add one was the user's.
