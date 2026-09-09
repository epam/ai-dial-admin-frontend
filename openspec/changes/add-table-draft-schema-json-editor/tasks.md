## 1. The draft document and its request split

Pure code, no React. `design.md` — D3 governs this section.

- [x] 1.1 Add `DraftTableDocument` to `apps/ai-dial-admin/src/models/analytics/table.ts`, beside
      `DraftSchemaDto` and `UpdateTableDto`: `DraftSchemaDto` plus optional `description` and
      `tag_order`, widened so a member this console does not know still type-checks (the document is
      not a wire DTO — both request bodies are subsets of it, and D3 says why). Do not change
      `DraftSourceSchemaDto`, `DraftEnrichmentSchemaDto` or `UpdateTableDto`.
- [x] 1.2 Add `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts` exporting
      `buildDraftDocument(table, schema): DraftTableDocument` (the seed: the column form's
      `DraftSchemaDto` plus `description`/`tag_order` read off the table) and
      `splitDraftDocument(document): { update: UpdateTableDto; schema: DraftSchemaDto }` (drop
      `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`; unpack
      `grain` into flat `grain_key`/`cardinality` with a flat member already present winning; route
      `description`/`tag_order` into `update`; pass everything else through into `schema`). One
      destructure does the whole split — see D3; no constant list of dropped fields.
- [x] 1.3 Add `apps/ai-dial-admin/src/components/Analytics/Tables/tests/draft-document.spec.ts`
      covering the seeded shape for a source and for an enrichment (including the members that must be
      absent), all seven dropped members, the grain unpack, flat-wins-over-nested, an omitted
      `cardinality`, and an unrecognized member surviving into the schema body. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/draft-document.spec.ts --reporter=dot`
      from `apps/ai-dial-admin/`.

## 2. The table detail page provides the save-validation context

`design.md` — D6 governs this section. Do not modify `SaveValidationContext.tsx` itself.

- [x] 2.1 Wrap the rendered `TableDetailView` in `SaveValidationContextProvider` in
      `apps/ai-dial-admin/src/app/[lang]/tables/[id]/page.tsx`, exactly as
      `apps/ai-dial-admin/src/app/[lang]/evaluators/[name]/page.tsx` does. `notFound()` keeps throwing
      before the wrapper, so the not-found branch is unchanged.
- [x] 2.2 Add `apps/ai-dial-admin/src/app/[lang]/tables/tests/detail-page.spec.tsx`, modelled on
      `apps/ai-dial-admin/src/app/[lang]/evaluators/tests/detail-page.spec.tsx`: the page returns the
      provider, the view one level in receives `name`/`initialTable`/`apiBaseUrl`/`flightUri`, and a
      missing table still reaches `notFound()`. Verify with
      `npx vitest run "src/app/[lang]/tables/tests/detail-page.spec.tsx" --reporter=dot`.

## 3. Editor mode in the table detail view

`design.md` — D1, D2, D4, D5, D7, D8 govern this section. All three items touch one area; keep 3.1's
call-site comment on why the document object is stored by reference (D2) — nothing in the types
protects that, and jsdom cannot see it break.

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`: add
      `isEditorEnabled` and document state (seeded on first entry only), render `JsonToggle` beside the
      existing Save button in the `!isActive && canModify` arm, render `EntityJsonEditor` in place of
      `properties` while the editor is active, change Save's `disabled` to
      `!isEditorEnabled && !draft.canMaterialize`, and route Save through an `onTryToSave` that turns
      `jsonErrors` into notifications (`showEditorErrorNotifications` +
      `ValidationActionType.SetJsonEditorNotifications`) and otherwise submits `updateTable` then
      `defineTableSchema` in editor mode, or today's `onSubmitDefineSchema` alone in form mode. No new
      prop on `EntityJsonEditor` and no new i18n key.
- [x] 3.2 Add `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx`,
      following the mocking convention in
      `apps/ai-dial-admin/src/components/Analytics/Pipelines/tests/PipelineJsonEditor.spec.tsx` (mock
      the `SaveValidationContext` module for a controllable `jsonErrors`; mock `EntityJsonEditor` to
      capture props and expose a control that calls `setSelectedEntity`). Cover: the toggle shown on a
      draft and absent on an `ACTIVE` table; the column form replaced while the editor is active; the
      document surviving a re-render and a toggle-off/on round trip; Save enabled on an incomplete
      document; markers blocking both requests and raising notifications; `updateTable` sent before
      `defineTableSchema` with the split bodies; a failed `updateTable` suppressing the schema request;
      a failed `defineTableSchema` leaving the draft surface. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx --reporter=dot`.
- [x] 3.3 In `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx` add the
      `vi.mock('@/src/context/SaveValidationContext', …)` block the ~40 bare renders now need (D6), and
      one regression case asserting a form-mode Save calls `defineTableSchema` and never `updateTable`.
      Verify with
      `npx vitest run src/components/Analytics/Tables/tests/TableDetailView.spec.tsx --reporter=dot`.

## 4. Browser verification

The house criterion was applied to every scenario's THEN clause and the decision recorded in the run's
`plan.json`: verification is **added**, narrowed to the three scenarios that cross a boundary the unit
tests mock away — the real Monaco editor and the real analytics backend. Everything else in the delta
is a props-level render or a pure function and is proved by sections 1-3.

- [ ] 4.1 Run the `spec-browser-verify` skill against a locally booted app (port 4200) with
      `ANALYTICS_ENABLED` on and a `PENDING` table available, scoped to: an in-progress document
      surviving a re-render, a document with real Monaco parse markers blocking the save, and a
      successful save sending the metadata update before the schema and ending `ACTIVE`. Resolve any
      `fail` verdict before the change is complete.

## 5. Quality checks

- [x] 5.1 From `apps/ai-dial-admin/`: `npm run lint 2>&1 | tail -30`,
      `npx prettier --check "src/**/*.{ts,tsx}" 2>&1 | tail -10`, `npm run typecheck`, and
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. The app typecheck is
      green on `development` and blocks; a failure in it is this change's. Report anything that needs
      fixing rather than editing files this item does not own.
