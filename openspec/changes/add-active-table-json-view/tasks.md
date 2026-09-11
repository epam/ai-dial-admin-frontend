## 0. Read this before dispatching or archiving

**State of the work, so nothing finished is re-dispatched.** This list has been revised twice. Read
the state column before you dispatch anything.

| Item | State |
|---|---|
| 1.1, 1.2, 1.3 | **Done. Untouched by every revision.** 1.2 in particular is still needed — see below. |
| 2.1, 2.2 | **Done, then superseded.** The files they produced are **deleted** by 3.3. Do not re-run them and do not re-create the component. |
| 3.1 | **Done.** Its header/body wiring stands; 3.3 revises the header's order and the body's contents. |
| 3.2 | **Dispatched.** Whatever state it returned in, 3.4 owns both spec files afterwards and is written not to assume their content. |
| 3.3, 3.4 | **The remaining work.** |
| 4.1 | Browser verification — **waived by the owner on this run**, task and waiver both kept. |
| 5.1 | Quality checks — not run since the rework. |

**Revision 2 — the owner's three instructions, after seeing the reworked placement running.**

1. **Drop the "JSON definition" heading** from the read-only surface. The surface is reached by a
   toggle that already names it.
2. **Move the copy control into the header**, beside the JSON-editor toggle — offered only while the
   JSON view is on.
3. **Swap the toggle and Connect**: the JSON-editor toggle becomes the header's rightmost control.

Two consequences are decided in `design.md`, not left to the implementer:

- **`AnalyticsTablesI18nKey.JsonDefinition` survives revision 1. Item 1.2 stands as done and must
  NOT be reverted.** Only the `<h3>` goes. The key is still the copy control's `valueLabel`, which is
  what produces the accessible name "copy JSON definition" and the toast "JSON definition Copied
  successfully" (`design.md` §D9). Deleting the key would break two delta scenarios.
- **`TableDefinitionJson.tsx` is deleted** and the read-only editor is rendered inline in
  `TableDetailView.tsx`, beside the draft editor it mirrors. With the heading gone and the copy
  control in the header it would be a wrapper around one element (`design.md` §D2). Its spec file
  goes with it; its one surviving case moves to `TableDetailView.spec.tsx`.
- **The consolidated spec's "the primary action last" clause is superseded, not deleted.**
  `design.md` §D6a quotes the superseded wording, states the replacement (actions before Connect,
  view controls after it) and names what it costs against `analytics/query-builder`, the one sibling
  toolbar that still puts the primary last with Copy before it.

**Reverts that must not be lost.** `TableProperties.tsx` (reverted to HEAD inside 3.1, confirmed
clean) and `tests/TableProperties.spec.tsx` (3.2's, re-checked by 3.4). A half-revert leaves the tree
red.

**Archive order — a hard dependency, and nothing enforces it.**
`add-table-draft-schema-json-editor` (PR #4492) **must merge and be archived before this change is
archived.** Two of the three `## MODIFIED Requirements` blocks in this change's delta name
requirements that reach `openspec/specs/analytics/tables/spec.md` only through that archive. Archiving
this one first folds them against nothing, and #4492's later archive then restores the superseded
wording with no diff to show for it. `openspec validate --strict` does **not** catch this — measured
on this change, exit 0 on an absent MODIFIED target. `design.md` §D8 has the detail. Nothing in this
change may be written into `openspec/changes/add-table-draft-schema-json-editor/`, which must stay
byte-identical to HEAD.

## 1. The document's text and its label — DONE, unaffected by every revision

Design: `design.md` §D4 (formatter), §D9 (i18n). Listed so the plan stays one-to-one, not so they are
run again.

- [x] 1.1 Add `formatDraftDocument(document: DraftTableDocument): string` to
      `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts`, returning
      `JSON.stringify(document, null, 4)`, with a comment naming
      `apps/ai-dial-admin/src/components/EntityTabs/JsonEditor/JsonEditor.tsx:90` as the serialization
      it must mirror. Pure and exported; no other change to that file.
- [x] 1.2 Add the surface's label. In `apps/ai-dial-admin/src/constants/i18n.ts`,
      `AnalyticsTablesI18nKey` gains `JsonDefinition = 'AnalyticsTables.JsonDefinition',`; in
      `apps/ai-dial-admin/src/locales/en.ts`, the `AnalyticsTables` block gains
      `JsonDefinition: 'JSON definition',`. **Revision 1 removed the heading, not the key — this item
      stands as done and must not be reverted.** The key is the copy control's `valueLabel`, hence the
      accessible name "copy JSON definition" and the toast "JSON definition Copied successfully"
      (`design.md` §D9). Not reworded.
- [x] 1.3 Unit-test the document and the copy text in
      `apps/ai-dial-admin/src/components/Analytics/Tables/tests/draft-document.spec.ts` — 13 cases,
      green. Placement-independent by construction: it composes the pure functions and renders nothing.

## 2. The read-only surface — DONE, then superseded by revision 2

Both items were implemented and are green. Revisions 1 and 2 empty the component they produced, and
`design.md` §D2 deletes it. They stay in the list so the plan reads one-to-one and nobody re-creates
the file; **item 3.3 removes both files.**

- [x] 2.1 Rewrote `apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx` as the
      full-body read-only surface (root flex-fill, toolbar with the `<h3>` heading and the copy
      control, editor wrapper). **Superseded — the file is deleted by 3.3.** Do not re-run.
- [x] 2.2 Rewrote `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDefinitionJson.spec.tsx`
      for that surface. **Superseded — the file is deleted by 3.3.** Its cases do not vanish: the copy
      ones move to the header's spec, the heading one dies with the heading, and the read-only-typing
      one moves to `TableDetailView.spec.tsx` in 3.4.

## 3. The placement

Design: `design.md` §D1 (the five header/body edits, the materialize reset, and the copy control's
slot in point 6), §D2 (the deletion and the inline editor), §D3 (pass the document by reference), §D5
(read-only props), §D6 (the copy control), §D6a (the superseded order clause), §D10 (where each
scenario is proved).

- [x] 3.1 Moved the surface into the header/body arrangement and reverted `TableProperties.tsx`.
      **Done.** `git diff --stat` on `TableProperties.tsx` prints nothing; `tsc -p tsconfig.app.json`
      exits 0. Three facts it established in code, which 3.3 must not re-derive and must not
      contradict: `isEditorEnabled` has exactly five readers and no sixth; `hasJsonErrors` is **not**
      `!isActive`-gated (only its sole consumer `isChangeBarShown` is, and the read-only editor does
      register markers); and the reset in `onDefineSchema` sits **before** `await reload()`
      deliberately, so no frame of ACTIVE-plus-open-editor is ever committed. Leave all three alone.
- [x] 3.2 Re-aimed the two existing specs (`tests/TableProperties.spec.tsx` reverted,
      `tests/TableDetailView.spec.tsx` re-aimed at the header toggle and the body). **Dispatched
      before revision 2 landed**, so some of what it wrote — an assertion that the toggle sits
      *before* Connect, and one on the toolbar heading — is now wrong. Item 3.4 owns both files
      afterwards and is written not to assume their content. Do not re-dispatch this item.
- [x] 3.3 Apply the owner's three revisions to the header and delete the wrapper component. **Three
      files, one item** — deleting the component while `TableDetailView.tsx` still imports it leaves
      the tree red, so they land together.
      - **Delete** `apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx` and
        `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDefinitionJson.spec.tsx`
        (`design.md` §D2), and remove the import of the component from `TableDetailView.tsx`.
      - In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`:
        (a) **render the read-only editor inline**, replacing
        `const definitionJson = <TableDefinitionJson document={storedDocument} />;` with the
        `<div className="flex min-h-0 flex-1 flex-col overflow-auto"><EntityJsonEditor entity={storedDocument} readonly /></div>`
        of `design.md` §D2 — mirroring `draftEditor` a few lines above it. Keep the §D3 by-reference
        comment at the new call site. **Pass no `setSelectedEntity`, no `setIsChanged`, no
        `onChangeText`**: `setDraftDocument` is now in scope at that call site and passing it would
        make a read-only surface write the draft document (`design.md` §D5).
        (b) **Move the `JsonToggle` to the end of the `isActive` arm** of the header, after the
        Connect block, so the rendered row reads Manage access, Delete table, Add columns, Add rows,
        Connect, JSON-editor toggle. Source order is rendered order — no CSS `order-*`. Update the
        comment above it, which currently says it is the last neutral action before the primary.
        (c) **Add the copy control immediately before the toggle**, gated
        `isActive && isEditorEnabled`: the existing `Common/CopyButton/CopyButton` with
        `valueLabel={t(AnalyticsTablesI18nKey.JsonDefinition)}`, `size={ElementSize.Small}`, **no**
        `buttonLabel` (`design.md` §D6 — the labelled variant loses its `aria-label`, so do not add
        one), and `value` from a `useMemo(() => formatDraftDocument(storedDocument), [storedDocument])`.
        The `isActive` half of the gate is load-bearing: a draft's header carries the same toggle and
        must not gain a copy control.
        Everything else in the file stays as 3.1 left it. Do not add a prop to `CopyButton`,
        `EntityJsonEditor` or `EntityHeaderControls/JsonToggle`. Do not touch
        `tests/TableDetailView.spec.tsx` here — it goes red and 3.4 is what fixes it.
      - Check with `npx tsc -p tsconfig.app.json --noEmit` from `apps/ai-dial-admin/` (exit 0 — the
        app typecheck is green on this tree and a red one is yours) and
        `npx eslint src/components/Analytics/Tables/TableDetailView.tsx`.
- [x] 3.4 Re-aim `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx`
      at the revised header and body. **Read the file first — item 3.2 wrote against the previous
      order and the deleted toolbar, so treat its content as a starting point, not as a premise.**
      Assertions, per `design.md` §D10:
      - *Header order.* The toggle is the **last** control of the header row, after Connect — assert
        on the DOM order of accessible names within the header container, not on presence alone,
        because presence passes under the old order too. The five existing actions are all still
        rendered. The toggle is present for a caller with no permissions (`setPerms({})`) and with
        `featureFlags.analyticsEnabled` false.
      - *Copy control.* Absent while the view is off; present once it is on, between Connect and the
        toggle, queryable by the accessible name `copy AnalyticsTables.JsonDefinition` (the mocked
        `t()` returns the key); activating it writes the whole formatted document to
        `navigator.clipboard.writeText`; absent again after the view is toggled off; absent on a
        `PENDING` table whose own JSON editor is open. Use `fireEvent.click`, not `userEvent.click` —
        `qa/review-batch-4-round-1.md` §1 established that `userEvent` does not reach `CopyButton`'s
        icon-only variant in jsdom.
      - *Body.* Turning the toggle on removes the tab strip and the columns grid and shows the
        document; turning it off restores the strip with the previously selected tab still selected,
        Audit included; no Save, no Discard and no changed-entity header while the view is on, and
        `updateTable`, `defineTableSchema` and `updateTableSchema` are never called from it.
      - *Read-only as behaviour* — the case inherited from the deleted `TableDefinitionJson.spec.tsx`:
        type into the editor and assert the value is unchanged.
      - *Materialize.* A successful save from a draft's JSON editor leaves the now-`ACTIVE` table on
        its live column surface with the toggle off. If the existing mocks cannot express that, assert
        the toggle's own state after the save instead — and say so; do not drop the case.
      - **Delete every assertion on the toolbar heading**, and every one that puts the toggle before
        Connect.
      - **The `JsonEditorBase` mock must change** and this is the trap in the file: it currently
        hardcodes `aria-label="rows-json"` and does not forward `options.readOnly`, so the two mounted
        editors are indistinguishable and the read-only case cannot be written. Accept `options`,
        set `readOnly={options?.readOnly}`, and derive a distinct label from that discriminator while
        keeping `rows-json` on the editable mount so existing assertions survive.
      - Also confirm `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableProperties.spec.tsx`
        is at HEAD: `git diff --stat` on it must print nothing. If 3.2 did not finish the revert,
        restore it by writing back `git show HEAD:<path>`.
      - Verify with
        `npx vitest run src/components/Analytics/Tables/tests/TableDetailView.spec.tsx src/components/Analytics/Tables/tests/TableProperties.spec.tsx --reporter=dot`
        from `apps/ai-dial-admin/`.

## 4. Browser verification — waived by the owner on this run

Design: `design.md` §D11 — why the task exists, and why only two scenarios would go into a browser.
**The owner waived the pass on this run**: his local backend is down and he chose to ship without it.
The task is kept rather than dropped so a later run picks it up unchanged; the waiver is recorded in
`plan.json` under `browser_verification.waiver`. EM decides whether to dispatch it.

- [ ] 4.1 Run the `spec-browser-verify` skill against the running local app
      (`http://localhost:4200`, an `ACTIVE` analytics table's detail page) for exactly two scenarios of
      `openspec/changes/add-active-table-json-view/specs/analytics/tables/spec.md`: **"The view cannot
      be edited"** and **"Copying places the whole displayed document on the clipboard"**. Both cross
      what jsdom mocks away — the real Monaco instance inside a body-height flex container, and the
      real clipboard plus the notification container. While there, note whether the icon-only copy
      control reads as an affordance beside a switch and a primary button; that is a judgement no unit
      test makes. Resolve any `fail` verdict before the change is complete; a blocked verdict caused
      by the local sign-in wall is an environment escalation, not a fix.

## 5. Quality checks

- [x] 5.1 From `apps/ai-dial-admin/`, in this order: `npx prettier --write` over exactly the files this
      change touched (never a directory or a glob — a human works in this tree concurrently);
      `npm run lint 2>&1 | tail -30`, comparing against the 111 pre-existing warnings rather than aiming
      at zero; `npx tsc -p tsconfig.app.json --noEmit` (a red app typecheck is this change's and it
      blocks); and `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. Also
      confirm the two reverts landed and the two deletions did:
      `git status --porcelain apps/ai-dial-admin/src/components/Analytics/Tables/` must show
      `TableDefinitionJson.tsx` and `tests/TableDefinitionJson.spec.tsx` as deleted and neither
      `TableProperties.tsx` nor `tests/TableProperties.spec.tsx` at all. Report the actual output.
      Anything this turns up is a new dispatch to the owner of the file, not an edit from here.
