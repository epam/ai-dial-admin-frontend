All paths below are relative to `apps/ai-dial-admin/`.

**Parallel split (design D12).** Groups 1-3 (**A**) and groups 4-6 (**B**) touch disjoint file sets and can be
implemented by two agents at the same time. The only contract between them is the `JsonataEditor` import path
and prop signature, fixed here before either starts:

```ts
// @/src/components/Common/JsonataEditor/JsonataEditor
interface Props {
  value: string;
  onChange: (value: string) => void;
  options?: editor.IStandaloneEditorConstructionOptions;
}
```

Group B mocks `JsonataEditor` in its component tests (`testing.md` §4 — mock heavy Monaco children), so B is
not blocked on A landing. Groups 7-9 are sequential and run after both A and B are done.

| Group | Owner | Files |
| --- | --- | --- |
| 1-3 | A | `src/components/Common/JsonataEditor/*`, `src/components/Common/JsonEditorBase/JsonEditorBase.tsx`, `src/constants/editor.ts` |
| 4-6 | B | `src/models/evaluation/test-suite.ts`, `src/constants/i18n.ts`, `src/locales/en.ts`, `src/components/TestSuites/RequestTemplate/**`, `src/components/TestSuites/utils/body-content.ts` |
| 8.1-8.2 | B | `src/components/TestSuites/RequestTemplate/components/JsonataToggle.tsx` + its spec (amends 5.3 / 7.6) |
| 8.3-8.6 | C | `src/utils/evaluation/test-suite-payload.ts`, `src/server/eval/test-suites-api.ts` |

Group 8 was added after 1-7 landed, from two later user decisions. Its second half (**C**) is a disjoint file
set depending only on `jsonataContent` existing on the model (task 4.1), so it can run in parallel; its first
half amends files group B already owns.

## 1. [A] JsonEditorBase pre-mount hook

- [x] 1.1 Add optional `onBeforeMount?: (monaco: Monaco) => void` to the `Props` interface in
      `src/components/Common/JsonEditorBase/JsonEditorBase.tsx`.
- [x] 1.2 Call it from the existing private `handleBeforeMount`, after the `monaco.editor.defineTheme(...)`
      call and before the `language !== 'json'` early return, so a non-JSON caller still gets it (design D3).
- [x] 1.3 Verify: `npx tsc --noEmit -p tsconfig.app.json` reports no new errors, and no existing
      `JsonEditorBase` call site needed a change (the prop is optional and additive).

## 2. [A] JSONata Monaco language

- [x] 2.1 Create `src/components/Common/JsonataEditor/models.ts` with
      `JsonataFunction { label: string; signature: string; description: string }`.
- [x] 2.2 Create `src/components/Common/JsonataEditor/constants.ts` exporting `JSONATA_LANGUAGE_ID = 'jsonata'`,
      `JSONATA_KEYWORDS`, `JSONATA_FUNCTIONS: JsonataFunction[]` (JSONata builtins with signature + one-line
      description), `JSONATA_MONARCH_TOKENS: languages.IMonarchLanguage`, and
      `JSONATA_LANGUAGE_CONFIGURATION: languages.LanguageConfiguration` (block comments, brackets,
      auto-closing/surrounding pairs). Start from the scratchpad prior art, but verify the grammar against real
      expressions and spot-check the function list against docs.jsonata.org — it was never reviewed or run
      (design D11).
- [x] 2.3 Prefix **every** token the tokenizer emits with `jsonata.` — `jsonata.string`,
      `jsonata.string.escape`, `jsonata.number`, `jsonata.keyword`, `jsonata.variable`,
      `jsonata.variable.template`, `jsonata.operator`, `jsonata.bracket`, `jsonata.comment`. No bare `string` /
      `keyword` / `number` / `delimiter` token names anywhere (design D5).
- [x] 2.4 Tokenize `${{...}}` as its own `jsonata.variable.template` token, matched before the generic
      `$name` variable rule so placeholders win.
- [x] 2.5 Create `src/components/Common/JsonataEditor/JsonataEditor.tsx`: wrap `JsonEditorBase` with
      `language={JSONATA_LANGUAGE_ID}`, pass `onBeforeMount` a registration function guarded by
      `monaco.languages.getLanguages().some((l) => l.id === JSONATA_LANGUAGE_ID)` (design D6), and register a
      completion provider in `onEditorMount` with `triggerCharacters: ['$']` that returns `[]` unless
      `model.id === modelIdRef.current`. Dispose on both `editorInstance.onDidDispose` and unmount, mirroring
      `src/components/Analytics/QueryBuilder/Sql/SqlEditor.tsx`. Emit `''` when Monaco reports `undefined`.
- [x] 2.6 Anchor the completion replace range one column left when the character before the word is `$`.
      `$` is not a Monaco word character, so `model.getWordUntilPosition()` returns `su` for a cursor after
      `$su` and its `startColumn` points at the `s`; using it verbatim (as `SqlEditor` does — it has no sigil)
      makes accepting `$sum` produce `$$sum`. Read the line text up to `word.startColumn` and decrement
      `startColumn` when it ends with `$`. Do not simplify this away as redundant (design D6).
- [x] 2.7 Verify: `npx tsc --noEmit -p tsconfig.app.json` reports no new errors; `npm run lint` passes for the
      new files.

## 3. [A] JSONata theme rules

- [x] 3.1 Add `jsonata.*` rules to the **dark** block of `EDITOR_THEMES_CONFIG` in `src/constants/editor.ts`,
      covering every token name emitted in 2.3.
- [x] 3.2 Add the matching `jsonata.*` rules to the **light** block. Both blocks set `inherit: false`, so a
      token missing from one block renders as plain foreground in that theme with no error (design D5).
- [x] 3.3 Verify: every token name in `JSONATA_MONARCH_TOKENS` has a rule in both theme blocks, and no rule
      added in this group uses a bare (non-`jsonata.`-prefixed) token name.

## 4. [B] Model and i18n

- [x] 4.1 Add `jsonataContent?: string` to `TestSuiteRequestTemplateBody` in
      `src/models/evaluation/test-suite.ts`. Document the mutual exclusivity with `content` once, on the
      interface — the source of truth for the rule (`code-standards.md` comments rule).
- [x] 4.2 Add a toggle-label key to the existing `JsonAtaI18nKey` enum in `src/constants/i18n.ts` (design D9 —
      do not create a new `TestSuites.*` key) and its English string under the existing `JsonAta` section of
      `src/locales/en.ts`.
- [x] 4.3 Verify: `npx tsc --noEmit -p tsconfig.app.json` reports no new errors and the new i18n key resolves
      in both files.

## 5. [B] Shared empty-body default and JSONata toggle

- [x] 5.1 Lift `getDefaultContentForType` out of `ContentTypeSelect.tsx:15` (where it is currently private)
      into a new `src/components/TestSuites/utils/body-content.ts` as a named export — `{}` for
      `application/json` and for an absent content type, `[]` for `multipart/form-data`. Update
      `src/components/TestSuites/RequestTemplate/components/ContentTypeSelect.tsx` to import it instead of
      declaring it. Two callers now depend on this rule; it must not be duplicated (design D2).
- [x] 5.2 Create `src/components/TestSuites/RequestTemplate/components/JsonataToggle.tsx`: a `DialSwitch`
      (`switchId`, `label`, `isOn`, `onChange`) taking `testSuite` + `onChangeTestSuite`, deriving
      `isOn = requestTemplate?.body?.jsonataContent != null` (design D1 — `!= null`, not truthiness).
- [x] 5.3 On → write a body of `{ ...restBody, jsonataContent: '' }` with the `content` key **omitted**, not set
      to `undefined`, and `contentType` passed through untouched. Do **not** normalize `contentType` on turn-on
      (design D1a).
      **⚠ SUPERSEDED — done as written, but the seeded value has since changed.** Turn-on now writes
      `jsonataContent: '{}'`, not `''` (design D14). Everything else in this task stands. The follow-up edit is
      task 8.1; do not re-tick this line, it records what was built.
- [x] 5.4 Off → write
      `{ ...restBody, contentType: restBody.contentType ?? ContentType.JSON, content: getDefaultContentForType(restBody.contentType) }`
      with `jsonataContent` omitted. Two distinct rules here, both required (design D2 + D1b):
      (a) do **not** hardcode `content: {}` — per 5.5 the switch can be visible while the content type is
      form-data, where the default must be `[]`; (b) do **not** skip the `?? ContentType.JSON` normalization —
      `BodyTab` selects the JSON editor with `contentType === ContentType.JSON`, so a body left with an absent
      content type falls through to `FormDataGrid`, which is typed `FormDataPart[]`, whose
      `structuredClone(content) || []` guard does not fire for a truthy object and whose `!content?.length`
      check then reports it empty while holding a JSON object. The normalization is turn-off only; the
      asymmetry with 5.3 is deliberate.
- [x] 5.5 Render the toggle in `src/components/TestSuites/RequestTemplate/RequestTemplate.tsx`, in the header
      row before `<ContentTypeSelect />`, when
      `body?.contentType === ContentType.JSON || body?.jsonataContent != null`. The second clause is required,
      not defensive: `BodyTab` (6.1) branches on `jsonataContent` before `contentType`, `contentType` is
      optional on the model, and `ContentTypeSelect` only defaults it for display — so a backend body of
      `{ jsonataContent: "..." }` with no `contentType` would otherwise render the JSONata editor with no way
      out (design D1a).
- [x] 5.6 Confirm `showAddButton` / `showVariablesDoc` (`RequestTemplate.tsx:36-40`) behave correctly in
      JSONata mode: `isBodyFormData` is already false when `contentType` is JSON, so the Add button stays
      hidden and the variables doc stays shown — adjust only if that derivation turns out not to hold.
- [x] 5.7 Verify: `npm run lint` passes for the touched files; toggle-on and toggle-off each produce a body
      object with exactly one of the two keys present; a body of `{ jsonataContent: '...' }` with no
      `contentType` renders the switch, on, and turning it off yields
      `{ contentType: 'application/json', content: {} }`.

## 6. [B] Body tab and content-type wiring

- [x] 6.1 In `src/components/TestSuites/RequestTemplate/tabs/BodyTab.tsx`, replace the 2-way branch with a
      3-way one: JSONata editor when `template.body?.jsonataContent != null`, else `JsonEditor`
      (`EntityJsonEditor`) when `contentType === ContentType.JSON`, else `FormDataGrid`.
- [x] 6.2 Render `JsonataEditor` (import from `@/src/components/Common/JsonataEditor/JsonataEditor`) with
      `value={template.body.jsonataContent}` and an `onChange` that writes `jsonataContent` and omits `content`.
      Do **not** route it through `EntityJsonEditor` (design D4).
- [x] 6.3 Keep the imperative `add()` handle a no-op in JSONata mode, as it already is for JSON.
- [x] 6.4 In `src/components/TestSuites/RequestTemplate/components/ContentTypeSelect.tsx`, drop
      `jsonataContent` from the body it writes in `handleChange`, so switching content type can never leave both
      fields populated (design D2). Leave the existing `tempContent` stash behavior unchanged. This file also
      loses its private `getDefaultContentForType` in 5.1 — it now imports the shared one from
      `@/src/components/TestSuites/utils/body-content`, which `JsonataToggle` calls too; keep the single
      definition when reconciling the two edits.
- [x] 6.5 Verify: `npm run lint` passes; switching JSON → form-data with JSONata mode on yields a body with
      `contentType: 'multipart/form-data'`, `content: []`, and no `jsonataContent`.

## 7. Unit tests

Follow `.claude/rules/testing.md`: co-locate in `tests/`, query by role, no `data-testid`, reuse mocks from
`test-setup.tsx`, mock Monaco rather than rendering it.

- [x] 7.1 New `src/components/Common/JsonataEditor/tests/JsonataEditor.spec.tsx` — mock
      `@/src/components/Common/JsonEditorBase/JsonEditorBase` and assert: `language` is `jsonata`; the value is
      passed through; `onChange(undefined)` emits `''`; the `onBeforeMount` registration is a no-op when
      `getLanguages()` already contains `jsonata` and registers all three (language, Monarch, configuration)
      when it does not; the completion provider returns `[]` for a foreign `model.id` and returns builtin
      functions + keywords for its own; the provider is disposed on unmount.
- [x] 7.2 In the same spec, cover the `$` range trap from 2.6: with a model whose line reads `$su` and a
      `getWordUntilPosition` returning `su`, assert the returned suggestion range `startColumn` is one left of
      `word.startColumn`, so applying `$sum` yields `$sum` and not `$$sum` — exactly one `$` in the result.
      Also assert `triggerCharacters` includes `$`.
- [x] 7.3 New `src/components/Common/JsonEditorBase/tests/JsonEditorBase.spec.tsx` — mock
      `@monaco-editor/react` and assert `onBeforeMount` is invoked with the Monaco instance, the theme is still
      defined when it is supplied, and JSON diagnostics are not registered for a non-`json` language.
- [x] 7.4 Extend `src/constants/tests/editor.spec.ts` — assert both `EDITOR_THEMES_CONFIG` blocks contain a rule
      for every `jsonata.*` token the tokenizer emits, and that no rule added for JSONata uses a bare token name.
- [x] 7.5 New `src/components/TestSuites/utils/tests/body-content.spec.ts` — `getDefaultContentForType` returns
      `{}` for `application/json`, `[]` for `multipart/form-data`, and `{}` for `undefined` / an unknown type
      (`utils.md` §3 — chase branches).
- [x] 7.6 New `src/components/TestSuites/RequestTemplate/tests/JsonataToggle.spec.tsx` — `isOn` reflects
      `jsonataContent != null` including the `''` case; on/off each call `onChangeTestSuite` with a body carrying
      exactly one of `jsonataContent` / `content` and the other key absent (assert with `'content' in body` /
      `'jsonataContent' in body`, not just `toBeUndefined()`); toggle-off writes `{}` under
      `application/json` and `[]` under `multipart/form-data` (C2 / design D2). Cover the absent-`contentType`
      body in both directions (design D1b): turning **off** yields
      `{ contentType: 'application/json', content: {} }`, and turning **on** leaves `contentType` absent —
      assert the on case explicitly so the normalization is not copied to the wrong branch.
      **⚠ PARTIALLY SUPERSEDED — done as written; the turn-on assertions now expect the wrong value.** Any
      assertion that turn-on produces `jsonataContent: ''` must become `'{}'` (design D14). The `isOn`-with-`''`
      assertion is **unchanged and still required** — it now covers the hand-cleared case. Follow-up edit is
      task 8.2; do not re-tick this line.
- [x] 7.7 Extend `src/components/TestSuites/RequestTemplate/tests/BodyTab.spec.tsx` — add a `JsonataEditor`
      mock alongside the existing `JsonEditor` / `FormDataGrid` mocks; cover all three branches, the seeded
      expression text, that typing writes `jsonataContent` and leaves `content` absent, that clearing the editor
      keeps JSONata mode, and that `add()` is a no-op in JSONata mode. Include a body with `jsonataContent` and
      **no** `contentType` — it must render the JSONata editor, not `FormDataGrid`. Assert via the `FormDataGrid`
      mock that whenever it renders, the `content` prop it receives is an array — the guard against the D1b
      regression, which the grid itself would swallow silently (`!content?.length` reports an object as empty).
- [x] 7.8 Extend `src/components/TestSuites/RequestTemplate/tests/ContentTypeSelect.spec.tsx` — switching away
      from `application/json` with `jsonataContent` set clears it; selecting the already-active type is still a
      no-op.
- [x] 7.9 Extend `src/components/TestSuites/RequestTemplate/tests/RequestTemplate.spec.tsx` — the toggle is
      present for JSON, absent for form-data **with no `jsonataContent`**, and present for a body carrying
      `jsonataContent` with a form-data or absent `contentType` (C1 / design D1a — the stranded-user case);
      `showAddButton` / `showVariablesDoc` are unchanged in JSONata mode.
- [x] 7.10 Extend the existing `src/components/TestSuites/utils/tests/request-template-params.spec.ts` — a
      `${{name}}` placeholder inside `jsonataContent` is returned by `getTemplateParameters`, and removing it
      drops the stale binding via `filterParameterBindings` (design D10 — regression guard, no code change).
- [x] 7.11 Verify: `npx vitest run src/components/Common/JsonataEditor src/components/Common/JsonEditorBase src/components/TestSuites/RequestTemplate src/components/TestSuites/utils src/constants/tests/editor.spec.ts`
      passes (run from `apps/ai-dial-admin/`).

## 8. Seeded turn-on and save-payload normalization

Added after groups 1-7 landed, from two later user decisions taken together:

1. **Turn-on seeds `{}`** instead of `''` (design D14) — amends what 5.3 built and what 7.6 asserts.
2. **The save payload omits an empty `jsonataContent`** (design D13) — new code.

On (2), be precise about *why*, because the wrong reason invites deletion: `''` is rejected by the backend
**only** alongside a non-null `content`, which D2 already makes unreachable, so this prevents no error. It
conforms to the user's canonical "null if empty". It also costs something — an empty expression stops
round-tripping — which is exactly what (1) mitigates by making the empty state deliberate rather than default.

Local editing state is unchanged: `''` still means JSONata mode, the derivation is still `!= null`, and neither
`JsonataToggle` nor `JsonataEditor` may normalize — neither can tell mid-edit from final, and doing so
reintroduces the mid-edit mode bounce D1 forbids.

Tasks 8.1-8.2 amend group B files; 8.3-8.6 are a disjoint file set (group C).

- [x] 8.1 In `src/components/TestSuites/RequestTemplate/components/JsonataToggle.tsx`, change the turn-on
      branch to write `jsonataContent: '{}'` instead of `''` (design D14). Turn-off (5.4) is unaffected. Do not
      touch the `!= null` mode derivation.
- [x] 8.2 Update `src/components/TestSuites/RequestTemplate/tests/JsonataToggle.spec.tsx` — turn-on assertions
      expect `'{}'`. **Keep** the `isOn`-with-`''` assertion: it now covers the hand-cleared case and is still
      load-bearing. Add a case asserting a hand-cleared `''` stays in JSONata mode, so seeding is not mistaken
      for "the expression is never empty".
- [x] 8.3 Create `src/utils/evaluation/test-suite-payload.ts` — a pure, named-export function taking a
      `TestSuite` and returning a new one with `requestTemplate.body.jsonataContent` removed when it is `''`.
      No mutation of the input; return the input unchanged when there is no `requestTemplate`, no `body`, or a
      non-empty expression (`utils.md` §2).
- [x] 8.4 Call it in `TestSuitesApi.updateTestSuite` (`src/server/eval/test-suites-api.ts:140`) so the
      normalized suite is what reaches `putActionWithEtag`. This is the single choke point — the try-out
      endpoints (lines 188, 192) carry no request template. Omit the key rather than sending
      `jsonataContent: null`: the endpoint is a full-object PUT, so absent and null both clear the field, and
      `JSON.stringify` drops `undefined` (design D13).
- [x] 8.5 New `src/utils/evaluation/tests/test-suite-payload.spec.ts` — `''` is omitted (assert with
      `'jsonataContent' in body`, and assert the key is not present as `null` either); a non-empty expression
      is passed through verbatim, including the seeded `'{}'`; a JSON-mode body with `content` is untouched; a
      suite with no `requestTemplate` / no `body` returns unchanged and does not throw; and the input object is
      not mutated (`utils.md` §3 — chase branches).
- [x] 8.6 Extend the existing `src/server/eval/tests/test-suites-api.spec.ts` — `updateTestSuite` sends a
      payload with no `jsonataContent` key when the expression is `''`, and sends it verbatim when non-empty.
      Assert the **called URL and request body** per `testing.md` §4 (API tests). This guards the wiring, not
      just the util: a future save path added elsewhere would otherwise miss the rule silently.
- [x] 8.7 Verify: `npx vitest run src/utils/evaluation src/server/eval/tests/test-suites-api.spec.ts src/components/TestSuites/RequestTemplate/tests/JsonataToggle.spec.tsx`
      passes (run from `apps/ai-dial-admin/`).

## 9. Browser verification

Requested explicitly in the change brief for this proposal (the `openspec/config.yaml` tasks rule normally
requires asking the user first). Automated, not manual: it runs the `spec-browser-verify` skill, which builds a
`VerificationRequest` from this change's scenarios and spawns the `spec-verification-gate` sub-agent to drive
the running local app through the Playwright MCP. Requires the local stack running with auth disabled.

**RESULT — run on 2026-08-03 against the live local stack (auth ENABLED, pre-authenticated browser session;
the "auth disabled" precondition above turned out not to be required). Gate status: green — 15 scenarios,
13 pass, 0 fail, 2 blocked.** Exercised the `singleturn` DEPLOYMENT suite; environment restored afterwards.

Verified: toggle visible for `application/json` and hidden for form-data; toggle-on seeds `{}` (monaco model
language `jsonata`, value `{}`); toggle-off restores the JSON editor; Add hidden and the variables doc shown in
JSONata mode; `${{question}}` becomes a binding row; clearing the editor keeps JSONata mode (the D1 regression
did NOT occur); save+reload preserves a non-empty expression verbatim with the persisted body carrying
`contentType` + `jsonataContent` and no `content`; save straight after toggle-on preserves the seeded `{}`;
switching to form-data drops the switch and renders the grid with no stray object and zero console errors;
JSONata highlights with 7 token classes in both themes; JSON key/value/number colours unchanged.

Both blocked scenarios are environment limits, not defects:
- *Empty expression is omitted from the PUT* — the backend PUT is issued server-side by a Next.js server
  action, so it is not browser-observable. The client→server-action payload does carry `jsonataContent: ''`,
  which is expected: the normalizer runs at the API layer (D13), and the gate confirmed the **persisted** suite
  ends up with no `jsonataContent` key and reloads in JSON mode. The payload clause itself is covered by 8.6.
- *SQL editor styling unaffected* — no Analytics section exists in this build (`/en/analytics` 404s, no route
  exposes a SQL editor). The guarantee is covered by 7.3, which asserts no bare token names were added.

Out of scope, found while verifying: switching theme **live** (without reload) drops the app's custom monaco
theme for any editor mounted at page load, falling back to built-in `vs`. Not caused by this change — the gate
reproduced it with a JSON editor. `JsonEditorBase.handleBeforeMount` defines only the theme active at mount.
JSONata shows the worst symptom because built-in `vs` has no jsonata rules at all. The user has deferred it.

- [x] 9.1 Run the `spec-browser-verify` skill against
      `openspec/changes/add-jsonata-request-body/specs/test-suite-jsonata-request-body/spec.md`, scoped to the
      browser-observable scenarios: toggle visible for `application/json` and hidden for `multipart/form-data`
      with no expression; toggle on swaps to the JSONata editor **showing the seeded `{}`, not an empty
      document** (design D14) and off swaps back; the Add button stays hidden and the variables documentation
      stays shown in JSONata mode; switching to form-data removes the toggle; a placeholder typed into the
      expression appears as a binding row in Dynamic Configuration.
- [x] 9.2 Verify the save round trip in **three** cases against a real backend (design D13 + D14): saving
      immediately after toggle-on persists `{}` and reloads with the toggle on; a hand-written non-empty
      expression survives save → reload with the toggle on; an expression the user **clears by hand** is
      omitted from the PUT and the suite comes back in JSON mode with the toggle off. The third is the accepted
      cost of the canonical wire form, not a bug — confirm it behaves exactly that way rather than erroring.
- [x] 9.3 Verify the stranded-user case from C1 / design D1a-D1b end to end against a real suite: a body
      carrying `jsonataContent` whose `contentType` is form-data or absent still shows the switch, on; turning it
      off lands on a working JSON editor (not the form-data grid, and not a grid rendering as empty); and the
      resulting body saves and reloads. This is the one path a unit test alone does not settle, since it depends
      on what the backend actually sends.
- [x] 9.4 Verify JSONata highlighting renders in **both** the light and dark themes (the `inherit: false` trap
      from design D5), and that a JSON editor and the Analytics SQL editor are visually unchanged — that is the
      highest-blast-radius risk in this change.
- [x] 9.5 Verify: every scenario returns a `pass` verdict. Resolve any `fail` and re-run only the failed
      scenarios before moving on.

## 10. Quality gate

Run from `apps/ai-dial-admin/`, after all implementation, tests, and browser verification are complete.

- [x] 10.1 `npm run lint` — clean.
- [x] 10.2 `npm run format` — clean (use `npm run format:write` to apply, then re-check).
- [x] 10.3 `npx vitest run` — full suite green, coverage thresholds in `vitest.config.ts` not regressed.
- [x] 10.4 `npx tsc --noEmit -p tsconfig.app.json` — the known baseline is exactly **291 pre-existing errors**.
      The gate is **no NEW errors**, not zero: compare the count and confirm none of the reported errors are in
      files this change touched.
