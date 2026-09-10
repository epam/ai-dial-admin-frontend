# Tasks — register an evaluator from the Evaluators listing

All paths are relative to `apps/ai-dial-admin/` unless stated otherwise. Every vitest command below is
run **from `apps/ai-dial-admin/`** so the `@/` alias resolves, and every one uses `--reporter=dot`: the
default reporter prints ~3 900 lines to say "0 failures", and the dot reporter still prints every
failure in full.

`design.md` is sectioned per file — find your section by grepping your own paths rather than reading it
end to end.

## 1. Name validation and the success-message decision

- [x] 1.1 Add `EVALUATOR_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/` to
      `src/constants/analytics/evaluators.ts`; add `getEvaluatorNameError(value, existingNames, t)` to a
      new `src/utils/validation/evaluator-name-error.ts`, modelled on `getAnalyticsIdentifierError` in
      `src/utils/validation/analytics-table-error.ts` (blank returns `null`, first violation wins,
      returns `FieldError | null`); add `getEvaluatorCreatedMessage(version, t)` to a new
      `src/utils/analytics/evaluator-created-message.ts`. Both files are pure — no hooks, no JSX, no
      I/O. Interfaces and check order are fixed in `design.md` §2 and §3. The pattern is a deliberate
      **copy** of `PIPELINE_NAME_PATTERN`, not an import: that constant lives in a `'use client'` hook
      module. Do not modify `src/utils/analytics/evaluator-dto.ts`.
- [x] 1.2 Unit-test both utils: `src/utils/validation/tests/evaluator-name-error.spec.ts` and
      `src/utils/analytics/tests/evaluator-created-message.spec.ts`. Chase branches (utils are cheap):
      blank, valid, leading digit, uppercase, space, 64 vs 65 characters, a duplicate, a duplicate
      differing only by surrounding whitespace; and version `1`, `undefined`, `7` — with a `t` spy that
      echoes its params, so the test proves the **version number** reaches `t`, which a component test
      cannot (the suite's mocked `t()` drops params). Verify with
      `npx vitest run src/utils/validation/tests/evaluator-name-error.spec.ts src/utils/analytics/tests/evaluator-created-message.spec.ts --reporter=dot`.

## 2. i18n keys

- [x] 2.1 Add the eight keys of `design.md` §7 to `AnalyticsEvaluatorsI18nKey` in
      `src/constants/i18n.ts` and to the `AnalyticsEvaluators` block in `src/locales/en.ts`. Insert by
      anchoring on the single pure-ASCII line named in §7 for each file — both files contain em dashes
      and curly apostrophes, and an `Edit` whose anchor spans them comes back smart-quoted and fails
      `tsc`. Post-check: `git diff --stat` shows insertions and **zero** deletions, and
      `grep -c "‘\|’" src/locales/en.ts` equals `git show HEAD:apps/ai-dial-admin/src/locales/en.ts | grep -c "‘\|’"`.

## 3. The create-evaluator modal

- [x] 3.1 Add `src/components/Analytics/Evaluators/use-create-evaluator-form.ts` exporting
      `useCreateEvaluatorForm({ existingNames })` with the interface fixed in `design.md` §4. It reuses
      `isEvaluatorShapeValid` and `buildEvaluatorDto` from `src/utils/analytics/evaluator-dto.ts`
      unchanged, and `getEvaluatorNameError` from 1.1. A type change patches `type` and clears nothing —
      §4.1 explains why that is safe.
- [x] 3.2 Add `src/components/Analytics/Evaluators/CreateEvaluatorPopup.tsx` per `design.md` §6: name
      with the inline error, the type radio group **before** the members that depend on it, preset and
      model only when the type is not `sql`, and the output-variables section reusing
      `EvaluatorVarsEditor` **with no new prop on it** — a mismatch is absorbed by this wrapper's own
      markup, per the house rule. Submit follows `Pipelines/Common/CreatePipelineShell.tsx` line for
      line except for the message branch, which calls `getEvaluatorCreatedMessage`. Do not edit
      `EvaluatorVarsEditor.tsx`, `EvaluatorProperties.tsx`, or the actions module.
- [x] 3.3 Unit-test the hook and the modal:
      `src/components/Analytics/Evaluators/tests/use-create-evaluator-form.spec.ts` and
      `src/components/Analytics/Evaluators/tests/CreateEvaluatorPopup.spec.tsx`. Query by role and
      accessible name only, assert i18n **keys** rather than English, and mock
      `@/src/app/[lang]/evaluators/actions` for `createEvaluator`. The request-shape scenarios are
      settled by asserting the argument `createEvaluator` was called with — that is the right proof for
      them, and the only one, since these writes are Server Actions and never leave the browser. Cover
      at least: llm without a model does not submit; sql presents no preset/model control; no output
      variable disables submit and states the requirement; a sql variable without an expression
      disables submit; llm→sql then submit sends no `preset`/`model`/`params`/`request_template`/
      `input_vars`/`response_schema`; llm→sql→llm keeps the typed model on screen; an expression typed
      under llm arrives under `sql` after the flip; a valid llm submit carries no `request_template`; a
      duplicate name shows the inline error and calls `createEvaluator` never; success calls
      `onCreated` then `onClose`; a `{ success: false }` response shows the error notification and calls
      neither. Verify with
      `npx vitest run src/components/Analytics/Evaluators/tests/use-create-evaluator-form.spec.ts src/components/Analytics/Evaluators/tests/CreateEvaluatorPopup.spec.tsx --reporter=dot`.

## 4. The listing's create control and refresh path

- [x] 4.1 Modify `src/components/Analytics/Evaluators/EvaluatorsView.tsx` per `design.md` §5: read
      `isFullAdmin` from `AppContext`, add the header control gated on it (hidden, not disabled),
      hold the modal's open state, and pass `onCreated={() => router.refresh()}` plus
      `existingNames={rows.map((row) => row.name)}`. The component keeps rendering `rows` **from
      props** — do not introduce a local copy of the row data, do not call `getEvaluators()` from the
      client, and do not touch `src/app/[lang]/evaluators/page.tsx`; §5.1 gives the reasons and the
      evidence that a new `rows` prop reaches the grid.
- [x] 4.2 Update `src/components/Analytics/Evaluators/tests/EvaluatorsView.spec.tsx` and add
      `src/components/Analytics/Evaluators/tests/EvaluatorsCreatePermissions.spec.tsx`. In
      `EvaluatorsView.spec.tsx` the existing case `offers no create control` is now **false** and must
      be replaced by: a full admin is offered the create control; no row and no action column offers a
      mutation; the empty state adds no create control of its own; activating the control opens the
      modal; a successful create calls `router.refresh()`. Its `useRouter` mock currently returns
      `{ push }` only and must also return `refresh`. The non-admin case needs its **own file**, because
      `test-setup.tsx` pins `isFullAdmin: true` suite-wide — follow
      `tests/EvaluatorDetailPermissions.spec.tsx`, which declares a local `vi.mock` of
      `@/src/context/AppContext` over a mutable module-level flag. Verify with
      `npx vitest run src/components/Analytics/Evaluators --reporter=dot`.

## 5. Delta fidelity

- [x] 5.1 Read-only check on the spec delta, before the change is archived: confirm that in
      `openspec/changes/add-evaluator-create-modal/specs/analytics/evaluators/spec.md` the two
      `## MODIFIED Requirements` blocks restate the shipped text of
      `openspec/specs/analytics/evaluators/spec.md` (requirements *Evaluators listing grid* and
      *Registering a version requires full-admin rights*) with **only** the changes the proposal
      decided, and that every scenario the shipped requirements carry is still present — a MODIFIED
      block replaces its requirement wholesale at archive time, so a scenario dropped from the delta is
      a scenario deleted from the consolidated spec. Confirm the four detail-page full-admin scenarios
      are still proven by `src/components/Analytics/Evaluators/tests/EvaluatorDetailPermissions.spec.tsx`
      and that nothing in this change touched it. Writes nothing; report a mismatch rather than editing.

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill against the running local app
      (`http://localhost:4200`, not 3000) for exactly three scenarios, and no others: *The header
      control opens the create-evaluator modal*, *A created evaluator is reported as created and the
      modal closes*, and *The refreshed listing reports the created evaluator's used-by count as a real
      zero*. These three are the ones that cross a boundary every unit test mocks away — a real
      `POST /v1/evaluators`, a real portal, and the server component re-running its used-by join. The
      remaining browser-observable scenarios are proven by the specs in 3.3 and 4.2 and are deliberately
      **not** sent; `plan.json` records why. Prefer `browser_evaluate` returning just the asserted
      values over `browser_snapshot`, whose full accessibility tree is ~90% of a browser pass's cost,
      and do not make an auto-dismissing toast the sole evidence for a scenario. Resolve any `fail`
      verdict before the change is complete.

## 7. Quality checks

- [x] 7.1 From `apps/ai-dial-admin/`: `npm run lint 2>&1 | tail -30` (compare against the 111 warnings
      / 0 errors a clean tree carries — do not aim at zero), `npx prettier --check` on the explicit list
      of files this change touched (`npm run format` only reports; it rewrites nothing, and never pass
      prettier a directory or a glob here — a human is working in this tree),
      `npx tsc -p tsconfig.app.json --noEmit` (this exits 0 on a clean tree, so any error is ours and it
      blocks), and
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary` for the suite and its
      thresholds. Anything this turns up comes back as a new dispatch to the role that owns the file,
      not as an edit from here.

## 8. Corrections after the owner reviewed the running modal

Sections 1-7 are shipped, ticked and verified — **do not renumber or reopen them.** This section folds in
three corrections the owner asked for after seeing the modal. `design.md` §11 carries the reasoning and
supersedes §5's item 3, §6's item 4 and one row of §7's key table; the delta's scenario *At least one
output variable is required for either type* and the prose of *The listing's create modal presents the
members registration requires and nothing else* are already updated.

- [x] 8.1 Two label-and-message edits, no restructuring. In
      `src/components/Analytics/Evaluators/EvaluatorsView.tsx` change the header control's label from
      `t(AnalyticsEvaluatorsI18nKey.CreateEvaluator)` to `t(ButtonsI18nKey.Create)` (`'Buttons.Create'`,
      already exported from `@/src/constants/i18n`) — the gate, the icon and everything else about the
      control is unchanged, and `AnalyticsEvaluatorsI18nKey` stays imported for the other keys the file
      uses. In `src/components/Analytics/Evaluators/CreateEvaluatorPopup.tsx` change `emptyText` on
      `EvaluatorVarsEditor` (line 133) from `t(AnalyticsEvaluatorsI18nKey.NoOutputVars)` to `""` and
      delete the whole `{!outputVars.length && <span …OutputVarsRequired…>}` block (lines 136-138), so an
      empty output-variables section presents only the editor's add-variable button. `emptyText` is
      **required** on `EvaluatorVarsEditor`'s `Props` — do **not** make it optional and do **not** add a
      prop; `design.md` §11.3 fixes `""` as the absorption and asks for a one-line comment at that call
      site saying why an empty string is deliberate. `outputVars` may become unused once the block goes —
      check before deleting the binding, since it is still passed as `vars`. Do not touch
      `EvaluatorVarsEditor.tsx`, `EvaluatorProperties.tsx`, or the i18n files.
- [x] 8.2 Update the three specs that assert the old label and the removed message:
      `src/components/Analytics/Evaluators/tests/EvaluatorsView.spec.tsx` and
      `tests/EvaluatorsCreatePermissions.spec.tsx` query the header control by
      `AnalyticsEvaluatorsI18nKey.CreateEvaluator` at six call sites between them (four and two) and must
      query `ButtonsI18nKey.Create` instead; `tests/CreateEvaluatorPopup.spec.tsx` asserts
      `getByText(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)` in the two cases of
      *at least one output variable is required for either type* (lines 162 and 172) and must instead
      assert, for both `llm` and `sql`, that the submit is disabled **and** that neither
      `AnalyticsEvaluatorsI18nKey.OutputVarsRequired` nor `AnalyticsEvaluatorsI18nKey.NoOutputVars` is
      present, **and** that the add-variable control the editor renders
      (`AnalyticsEvaluatorsI18nKey.AddVariable`, `EvaluatorVarsEditor.tsx:91`) still is — the delta's two
      new `AND` clauses. Keep every other case in all three
      files. Report which production lines you broke to redden the two new absence assertions, and that
      you reverted them: an absence check that passes against a modal that never rendered is worthless,
      and QA cannot prove this itself. Verify with
      `npx vitest run src/components/Analytics/Evaluators --reporter=dot`.
- [x] 8.3 Remove the one key this correction kills, from `src/constants/i18n.ts` and
      `src/locales/en.ts`. **Exactly one key**, `AnalyticsEvaluatorsI18nKey.CreateEvaluator`.
      `OutputVarsRequired` and `NoOutputVars` **must stay** — both are pre-existing on `development` and
      both are still used by `EvaluatorProperties.tsx` (lines 138 and 134) on the detail page, which this
      change never touched; `CreateEvaluatorTitle` stays too, as the modal's own header. Before removing,
      `grep -rn "AnalyticsEvaluatorsI18nKey.CreateEvaluator\b" apps/ai-dial-admin/src` must return
      nothing, which is why this item runs after 8.1 and 8.2. Each removal is a single pure-ASCII line —
      anchor on that line alone, because both files carry em dashes and curly apostrophes nearby and an
      `Edit` spanning one comes back smart-quoted and fails `tsc`. Post-check:
      `git diff --stat` shows deletions and **zero** insertions on both files, and
      `grep -c "‘\|’" src/locales/en.ts` equals
      `git show HEAD:apps/ai-dial-admin/src/locales/en.ts | grep -c "‘\|’"`.
- [x] 8.4 Quality checks over this section only, from `apps/ai-dial-admin/`:
      `npm run lint 2>&1 | tail -30` (111 warnings / 0 errors is the clean-tree baseline),
      `npx prettier --check` on the explicit list of the five files section 8 touched (never a directory
      or a glob — a human works in this tree, and `npm run format` only reports),
      `npx tsc -p tsconfig.app.json --noEmit` (exits 0 on a clean tree, so any error is ours and blocks —
      this is what catches a dangling reference to the removed key), and
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. Anything this turns up
      comes back as a new dispatch to the role that owns the file, not as an edit from here.

## Notes for EM

- Nothing in this change is committed or pushed in this run; the owner reviews the tree first.
- `src/app/[lang]/evaluators/page.tsx` and `src/app/[lang]/evaluators/actions.ts` appear in no item's
  scope on purpose. `createEvaluator` already exists and this change is its first caller; the page's
  used-by join is what the refresh path re-runs unchanged.
- Item 5.1 exists because `openspec validate --strict` does **not** check that a MODIFIED requirement's
  target exists or that its scenarios survived. Nothing else catches a dropped scenario until the
  archive silently folds it away.
- Section 3's two implementation items (3.1, 3.2) are the natural split point if this change has to be
  landed in more than one PR: 3.1 plus its half of 3.3 is self-contained and ships nothing user-visible.
- **Section 8 must run in order: 8.1 → 8.2 → 8.3 → 8.4, one item per batch.** 8.2's specs are written
  against 8.1's markup, and 8.3 removes an enum member that 8.1 and 8.2 hold the last references to — run
  8.3 early and the app typecheck reddens and the Evaluators specs query `undefined`. Their file scopes
  are disjoint, so the gate would let 8.1 and 8.2 share a batch; the dependency is why they do not.
- **No browser re-verification for section 8.** Item 6.1's three scenarios cross a real `POST
  /v1/evaluators`, a real portal and the server component's used-by join; none of those boundaries moves
  here. What changes is one button's text and one absent `<span>` — both of them assertions a component
  spec makes better and ten thousand times cheaper, and 8.2 makes them. A browser pass would also
  register a second undeletable evaluator in the local service for nothing.
