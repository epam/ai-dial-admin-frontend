## 1. Shared hint affordance

- [x] 1.1 Move `apps/ai-dial-admin/src/components/Analytics/ConversationsTrace/FieldCaveat.tsx` to
      `apps/ai-dial-admin/src/components/Common/FieldCaveat/FieldCaveat.tsx`, renaming its prop
      `caveat` → `hint` and keeping the button/`aria-label`/`aria-hidden`/`focus-visible` behavior
      unchanged
- [x] 1.2 Re-point its three ConversationsTrace call sites — `RatingCounts.tsx`,
      `Detail/ConversationFieldRows.tsx`, `Detail/ConversationTermList.tsx` — to the Common path and the
      `hint` prop

## 2. Copy

- [x] 2.1 Add `Keys`, `KeysNote`, `OrderingKeyHint`, `GranularityHint`, `GrainKeyHint` to the
      `AnalyticsTables` enum in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 2.2 Add those five strings to `AnalyticsTables` in `apps/ai-dial-admin/src/locales/en.ts` and
      replace the text of `PartitionColumnHint`, `IdentityColumnHint`, `VersionColumnHint` with the
      agreed copy — plain language, impersonal voice, no engine vocabulary, and no per-hint repetition
      of the "fixed after creation" sentence (it lives in `KeysNote`)

## 3. Draft schema editor

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/DraftSchemaEditor.tsx`, add a `keyLabel`
      helper that composes a label plus `Common/FieldCaveat`, and delete `labelWithHint`
- [x] 3.2 Wrap the key selects in a `Keys` group: sub-header styled like the existing `Columns` header,
      with `KeysNote` beneath it in secondary small text
- [x] 3.3 Attach hints via `keyLabel` to all six key fields — Ordering key, Partition column,
      Granularity, Identity column, Version column (source) and Grain key (enrichment)

## 4. Active table key summary

- [x] 4.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`, switch the
      `ACTIVE` key summary from `Common/LabelledText` to ui-kit `DialLabelledText` so the label can be
      a node; leave `Common/LabelledText` untouched
- [x] 4.2 Attach the same six hints to the summary labels via the shared `keyLabel` helper, without
      rendering the Keys group note there

## 5. Tests

- [x] 5.1 Cover the draft editor in
      `apps/ai-dial-admin/src/components/Analytics/Tables/tests/DraftSchemaEditor.spec.tsx`: each of the
      six fields exposes a hint control addressable by role and accessible name (source fields with a
      partition chosen; grain key on an enrichment), and the Keys note renders once
- [x] 5.2 Cover the summary in
      `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx`: an `ACTIVE`
      source with ordering key, partition and scan pair, and an `ACTIVE` enrichment, each expose the
      matching hint controls, and the Keys note is absent
- [x] 5.3 Update the ConversationsTrace specs affected by the move/rename
      (`tests/ConversationDetailRail.spec.tsx` and any spec importing `FieldCaveat`)

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill against this change's scenarios on the running local app,
      and resolve every `fail` verdict before the change is considered complete

## 7. Quality gate

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test`, and fix everything they report
