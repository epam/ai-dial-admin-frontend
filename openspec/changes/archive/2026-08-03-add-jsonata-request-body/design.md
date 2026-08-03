## Context

The Method tab of a `DEPLOYMENT` test suite renders `RequestTemplate` + `EndpointSchema`
(`TestSuites/View/MethodTabContent.tsx`). Inside `RequestTemplate`:

- The header row (`RequestTemplate.tsx:44-47`) holds an `<h3>` and `ContentTypeSelect`.
- `RequestTemplate.tsx:36-40` derives `isBodyFormData`, `showAddButton`, and `showVariablesDoc` from the
  active tab plus `body.contentType`.
- `tabs/BodyTab.tsx` is a 2-way branch on `body.contentType === ContentType.JSON`: `EntityJsonEditor` vs
  `FormDataGrid`. It also exposes an imperative `add()` that is deliberately a no-op for JSON.
- `components/ContentTypeSelect.tsx` is a `DialSelect` that stashes the outgoing content per content type in
  local `tempContent` state so switching back and forth restores what the user had. It derives
  `currentContentType` as `body?.contentType ?? contentTypes[0].value` (line 26) — a **display-only** default.
  It does not write `contentType` into the body until the user actively changes the dropdown, and
  `contentType` is optional on `TestSuiteRequestTemplateBody`.

**Pre-existing asymmetry — out of scope, do not "fix".** Because that default is display-only, a body with no
`contentType` shows `application/json` as the selected dropdown value while `BodyTab`'s
`contentType === ContentType.JSON` check is false and falls through to `FormDataGrid`. This predates the
change and is untouched by it. It is recorded here only so an implementer who trips over it while working on
the toggle does not opportunistically change it — doing so would alter behavior for existing suites well
outside this change's scope. It is, however, the reason the toggle's visibility rule cannot key on
`contentType` alone (D1a).
- `tabs/TabsContent.tsx` funnels every template edit through `onChangeTemplate`, which re-runs
  `getTemplateParameters` + `filterParameterBindings` so input bindings stay in sync with the placeholders
  actually present in the template.

Monaco is centralized in one wrapper: `Common/JsonEditorBase/JsonEditorBase.tsx`. It already takes `language`,
`options`, and `onEditorMount`; it defines the current theme from `EDITOR_THEMES_CONFIG` in a private
`handleBeforeMount`, and registers permissive JSON diagnostics only when `language === 'json'`. Roughly a
dozen editors across the app mount through it.

The repo already has one non-JSON Monaco language: `Analytics/QueryBuilder/Sql/SqlEditor.tsx`. It wraps
`JsonEditorBase` with `language="sql"`, registers a completion provider in `onEditorMount`, scopes the
provider to its own model via `model.id !== modelIdRef.current`, and disposes on both
`editorInstance.onDidDispose` and unmount. That is the pattern to mirror.

JSONata is not new to this feature: `EndpointSchema/Columns` already authors JSONata expressions for response
columns, `jsonata@^2.2.1` is already a dependency (used by `TestSuites/utils/evaluate-columns.ts`), and a
`JsonAtaI18nKey` enum plus a `DocumentationModal` already exist. What is missing is JSONata on the *request*
side and any Monaco language support for it.

Constraints:

- The backend contract is fixed and user-supplied: `jsonataContent: string`, mutually exclusive with `content`.
- Monaco language registration and theme rules are **global to the Monaco singleton**, so anything registered
  for JSONata affects every other editor in the app unless it is namespaced and guarded.
- A discarded prototype exists in the session scratchpad (`jsonata-prior-art/`) with a working Monarch grammar,
  language configuration, and a ~54-entry builtin-function catalogue. It was never reviewed or tested. It is a
  reference for the grammar and function list, not something to copy wholesale.

## Goals / Non-Goals

**Goals:**

- Let a user author the whole request body as one JSONata expression, with syntax highlighting and builtin
  function completions, and round-trip it through the backend.
- Keep `jsonataContent` and `content` mutually exclusive at every mutation site, with no way for the UI to
  produce a body carrying both.
- Add JSONata Monaco support without perturbing the JSON or SQL editors that share `JsonEditorBase` and
  `EDITOR_THEMES_CONFIG`.
- Put the editor in `Common/` so response-side JSONata (`EndpointSchema/Columns`) can adopt it later without a
  rewrite.
- Keep the change splittable so two agents can implement it in parallel over disjoint files.

**Non-Goals:**

- Client-side JSONata evaluation, resolved-body preview, syntax validation, or Monaco error markers. The
  backend validates on save.
- Save gating via `SaveValidationContext` for the JSONata body (a consequence of the above).
- Migrating `EndpointSchema/Columns` to the new `JsonataEditor` in this change.
- The MCP branch (`McpMethodContent`, `ArgumentTemplate`).
- A JSONata document-formatting provider.

## Decisions

### D1 — Mode is derived from `body.jsonataContent`, never stored

`isJsonataMode = body?.jsonataContent != null`. No `useState`, no prop, no context entry records the mode.

*Why:* the mode is already fully determined by the data the backend round-trips, and `components.md` §3 says
to derive rather than add state. A parallel state variable would need seeding from the loaded suite, resetting
on suite change, and reconciling on discard — three chances to desynchronize from the body.

*Consequence:* in **local editing state**, `jsonataContent: ''` must mean "JSONata mode, empty expression", so
the check is `!= null`, not truthiness. Clearing the editor must not silently bounce the user back to the JSON
editor mid-edit.

*This applies to editing state only — `''` is not the persisted form.* The save payload omits the field when
the expression is empty, to match the backend's canonical "null if empty" (D13). That normalization happens at
the API boundary, not here; the mode derivation is unchanged.

Note the empty state is now reached by clearing the editor rather than by enabling the mode, since turn-on
seeds `{}` (D14). It is narrower than it was, but still reachable, so `!= null` is still the right check.

*Alternative rejected:* a `bodyMode` enum on local view state. More flexible if a third mode ever appears, but
it duplicates a fact the model already carries, and nothing in the roadmap needs a third mode.

### D1a — Toggle visibility is `contentType === JSON || jsonataContent != null`

The switch renders when the content type is `application/json` **or** whenever `jsonataContent` is present,
whatever the content type says.

*Why the second clause is load-bearing, not defensive:* `BodyTab` branches on `jsonataContent` **first**,
before it consults `contentType` (D4/§Body tab). So a body of `{ jsonataContent: "..." }` with a form-data or
absent `contentType` renders the JSONata editor. If visibility keyed on `contentType` alone, that body would
show the JSONata editor with no switch anywhere on screen — the user could not get back to a literal body.

That state is reachable, not hypothetical: `contentType` is optional on the model, and per the Context note
`ContentTypeSelect` only defaults it for *display*, never writing it until the dropdown is actively changed.
A backend payload of `{ jsonataContent: "..." }` with no `contentType` is entirely plausible.

*Alternative rejected:* making `BodyTab`'s JSONata branch conditional on `contentType === JSON` too, so the two
rules match. That trades an unreachable-toggle bug for a silently-ignored-`jsonataContent` bug — the expression
would be in the model, invisible, and still sent on save. Showing the editor and guaranteeing an exit is the
safer asymmetry.

*Alternative rejected:* having the toggle write `contentType: 'application/json'` when it turns on, to
normalize the body. That is a hidden side effect on a field the user did not touch, and it would silently
change what a form-data suite sends. (Turn-**off** is a different case — see D1b.)

### D1b — Turn-off normalizes an absent content type; turn-on does not

D1a guarantees the switch is *visible* for a body of `{ jsonataContent: "..." }` with no `contentType`. It does
not by itself guarantee the user lands anywhere usable when they turn it off.

*The trace:* the toggle writes `content: getDefaultContentForType(undefined)` → `{}` and drops
`jsonataContent`. `BodyTab` then evaluates its JSONata branch false, and `isJsonContent` is
`contentType === ContentType.JSON`, which an absent `contentType` is not — so it falls through to
`FormDataGrid`. That component is typed `content: FormDataPart[]` and does `structuredClone(content) || []`
(an object is truthy, so the `|| []` guard never fires and the object is cloned straight through) and
`!content?.length` (an object has no `.length`, so the grid silently claims to be empty while holding a JSON
object).

So without this decision the C1 fix would trade "stranded in the JSONata editor with no switch" for "escapes
into the form-data grid holding a JSON object". Same root cause both times: the absent-`contentType`
asymmetry documented in Context.

*The rule* — on turn-off only:

```ts
{ ...restBody, contentType: restBody.contentType ?? ContentType.JSON, content: getDefaultContentForType(restBody.contentType) }
```

`getDefaultContentForType` is passed the *original* `contentType`, not the normalized one; for an absent type
both spellings yield `{}`, and for `multipart/form-data` the `??` does not fire so the type is preserved and
the content is `[]`. The two stay in agreement either way.

*Why the directions are deliberately asymmetric* — this is the part a future reader will want to "clean up" by
making both branches behave the same:

- **Turn-off must produce a body some editor can actually render.** Leaving `contentType` absent hands
  `FormDataGrid` a shape it is not typed for. The write is not cosmetic; it is what makes the resulting state
  legal.
- **Turn-on has no such obligation.** The JSONata branch in `BodyTab` ignores `contentType` entirely, so an
  absent one renders correctly with no normalization, and writing a value the user never chose would silently
  change what a form-data suite sends (D1a).
- **Turn-off is not inventing a value.** `ContentTypeSelect:26` has been *displaying* `application/json` for an
  absent `contentType` since long before this change. Writing it makes the model agree with what the user was
  already looking at, rather than introducing a new claim.

*Alternative rejected:* normalizing on load instead, so no body ever reaches the UI without a `contentType`.
Broader blast radius — it would rewrite bodies for suites the user never edits, and it would mask rather than
fix the Context asymmetry that is explicitly out of scope here.

### D2 — Mutual exclusivity is enforced by deleting the other key, at each of the three mutation sites

There are exactly three places that write `body`: the JSONata toggle, the JSONata editor's `onChange`
(and its JSON/form-data counterparts), and `ContentTypeSelect`. Each writes a body object that carries **one**
of `jsonataContent` / `content` — the other key is omitted from the spread result, not set to `undefined`.

- Toggle on → `{ contentType, jsonataContent: '{}' }` (seeded per D14; `contentType` passed through untouched)
- Toggle off → `{ contentType: contentType ?? ContentType.JSON, content: <default empty value for contentType> }`
  (the `??` normalization is D1b)
- Content-type change → the existing `tempContent` behavior, plus `jsonataContent` dropped

**Toggle-off must consult the content type.** Following from D1a, the switch can be visible while `contentType`
is `multipart/form-data`, so hardcoding `content: {}` would hand `FormDataGrid` an object where it expects an
array. The default is `{}` for `application/json` and for an absent content type, `[]` for
`multipart/form-data`.

That is exactly the rule `getDefaultContentForType` already implements, currently private at
`ContentTypeSelect.tsx:15`. Lift it to a shared module both call rather than duplicating it — the invariant
"what an empty body looks like for a given content type" now has two callers and must not be able to drift
between them. `utils.md` places it in `TestSuites/utils/` (pure function, named export, no hooks or JSX).

*Why:* the invariant is cheap to hold at the (few) write sites and expensive to reconstruct at read sites. A
body carrying both keys is invalid at the backend, so the UI must never build one — including transiently.

*Why omit rather than set `undefined`:* `JSON.stringify` drops `undefined` keys, so both forms happen to
serialize identically today, but an explicitly-present `undefined` is a trap for any `'jsonataContent' in body`
or `Object.keys` check. Omission is unambiguous.

*Alternative rejected:* a normalizing helper applied on save. It centralizes the rule but leaves invalid
intermediate states in local editing state, which is exactly what the mode derivation in D1 reads.

*Alternative rejected:* keeping the discarded `content` in `ContentTypeSelect`'s `tempContent` stash so
toggling JSONata off restores the previous JSON object. Nice-to-have, but it means the toggle needs local
memory, and there is no settled requirement for it. Toggle off yields the content type's empty default,
matching what the content-type switch does for a type it has not seen before.

### D3 — `JsonEditorBase` gains an `onBeforeMount` passthrough

New optional prop `onBeforeMount?: (monaco: Monaco) => void`, invoked from the existing private
`handleBeforeMount` alongside the theme definition.

*Why:* a custom Monaco language must be registered before the model is created. `onEditorMount` fires after,
so registering there would require a follow-up `monaco.editor.setModelLanguage(model, 'jsonata')` and would
briefly render the expression as plaintext.

*Why in `JsonEditorBase` rather than a second wrapper:* `JsonEditorBase` is the single Monaco entry point in
this app; forking it for one language would fragment theming and options handling. The prop is strictly
additive and every existing caller is untouched.

*Ordering:* the theme definition runs first, then `onBeforeMount`, so a caller could in principle amend the
theme. Not needed here, but it is the less surprising order.

### D4 — `JsonataEditor` wraps `JsonEditorBase` directly, not `EntityJsonEditor`

`EntityJsonEditor` (`EntityTabs/JsonEditor/JsonEditor.tsx`) exists to marshal an object ⇄ text: it stringifies
an entity, parses on change, preserves the cursor via `lastEntityFromEditorRef`, remounts on external change
via `editorInstanceKey`, and pushes Monaco markers into `SaveValidationContext`.

A JSONata body is *already* a string. Routing it through `EntityJsonEditor` would mean parsing a JSONata
expression as JSON on every keystroke, which fails by construction.

*Why this matters beyond correctness:* it also means the JSONata body does **not** feed
`SaveValidationContext`, so Save is not gated on JSONata syntax. That is accepted — the backend validates —
and it is called out as a non-goal rather than left implicit.

### D5 — Every JSONata Monarch token is namespaced `jsonata.*`

Monaco matches theme rules against token names by **dotted prefix, across all languages**. A rule for `string`
would restyle JSON string values and SQL literals; a rule for `keyword` would hit `keyword.json`.

So the tokenizer emits `jsonata.string`, `jsonata.string.escape`, `jsonata.number`, `jsonata.keyword`,
`jsonata.variable`, `jsonata.variable.template`, `jsonata.operator`, `jsonata.bracket`, `jsonata.comment` —
and `EDITOR_THEMES_CONFIG` gets matching rules in **both** the light and dark blocks.

Both blocks set `inherit: false`, which means any token with no matching rule falls back to plain editor
foreground. That is the failure mode to watch: forgetting a rule in one theme block yields unstyled — not
mis-styled — JSONata in that theme, which is easy to miss if only one theme is checked.

`${{...}}` gets its own `jsonata.variable.template` token so template placeholders read differently from
JSONata's own `$`-variables. They are conceptually different things — one is substituted before the expression
ever runs — and the highlight is the only cue.

### D6 — Language registration guarded by an id lookup

`if (monaco.languages.getLanguages().some((l) => l.id === JSONATA_LANGUAGE_ID)) return;` before
`register` / `setMonarchTokensProvider` / `setLanguageConfiguration`.

*Why:* the Monaco instance is a singleton shared by ~12 editors. `onBeforeMount` fires on every mount, so
without the guard, navigating between suites re-registers the language repeatedly.

Completion providers are the opposite case: they are registered **per editor instance** in `onEditorMount`,
scoped to their own model by `model.id !== modelIdRef.current`, and disposed on both
`editorInstance.onDidDispose` and unmount — exactly as `SqlEditor` does. `SqlEditor`'s comment notes
`onDidDispose` does not fire on every teardown path, hence both.

**The `$` sigil breaks the naive replace range.** `$` is not a Monaco word character, so
`model.getWordUntilPosition()` returns `su` — not `$su` — for a cursor after `$su`, with a `startColumn`
pointing at the `s`. Building the suggestion range from that `startColumn`, the way `SqlEditor` does, means
accepting `$sum` inserts the full label *after* the `$` already in the buffer and yields `$$sum`.

So the range must start one column further left when the text immediately preceding the word is `$`. This is
why the prototype reads the line up to `word.startColumn` before constructing the range — an operation that
looks redundant next to `SqlEditor` and would be a natural thing to "simplify" away. `SqlEditor` has no sigil
in its language and therefore never hits this. The same reason forces `triggerCharacters: ['$']`: without it,
typing `$` alone suggests nothing, because Monaco's default trigger is a word character.

### D7 — File layout

- `Common/JsonataEditor/JsonataEditor.tsx` — the component.
- `Common/JsonataEditor/constants.ts` — `JSONATA_LANGUAGE_ID`, `JSONATA_KEYWORDS`, `JSONATA_FUNCTIONS`,
  `JSONATA_MONARCH_TOKENS`, `JSONATA_LANGUAGE_CONFIGURATION`.
- `Common/JsonataEditor/models.ts` — `JsonataFunction { label; signature; description }`.
- `TestSuites/RequestTemplate/components/JsonataToggle.tsx` — the `DialSwitch`, its visibility rule, and the
  two body mutations.
- `TestSuites/utils/body-content.ts` — `getDefaultContentForType`, lifted out of `ContentTypeSelect` per D2 and
  called by both it and `JsonataToggle`.
- `src/utils/evaluation/test-suite-payload.ts` — the save-payload normalization per D13. Cross-cutting rather
  than feature-local because its caller is `src/server/`, not a component (`utils.md` §2 placement).

*Why `Common/`:* the editor is presentational and domain-free — a string in, a string out — which is what
`components.md` §4 reserves `Common/` for. The domain knowledge (which field, which content type, when the
toggle shows) stays in the `TestSuites/` feature components.

*Why the constants/models split:* `code-standards.md` requires `constants.ts` (values) separate from
`models.ts` (types) in a feature directory.

*Why a separate `JsonataToggle` component rather than inlining the switch in `RequestTemplate.tsx`:* it keeps
the mutation logic (build a body with exactly one of the two keys) out of the JSX and gives it a unit-test
seam, per `components.md` §3.

### D8 — `DialSwitch` from `@epam/ai-dial-ui-kit`

API: `{ switchId: string; label?: ReactNode; isOn?: boolean; disabled?: boolean; onChange?: (value: boolean) => void; caption?: string }`. Precedent in this repo: `Tools/Tools.tsx:287`.

*Why:* `components.md` §5 — reuse the design system before hand-rolling. A checkbox or a segmented control
would both be inconsistent with how binary modes are presented elsewhere in the app.

### D9 — i18n

Reuse the existing `JsonAtaI18nKey` enum (`constants/i18n.ts:2188`) for the toggle label rather than adding a
`TestSuites.*` key. That enum already owns every JSONata-facing string in the app and its `JsonAta.*` namespace
already exists in `locales/en.ts`.

### D10 — `${{var}}` extraction needs no change

`getTemplateParameters` (`TestSuites/utils/request-template-params.ts`) recurses over every string value
reachable from the template object, so a `jsonataContent` string is scanned for free and its placeholders
become input bindings via the existing `TabsContent.onChangeTemplate` path.

*Why it is still called out:* it is the kind of behavior a reviewer would assume is broken and "fix" by
special-casing the field. It works; it needs a regression test, not code.

### D11 — Prior art is reference, not a drop-in

The scratchpad prototype supplies a plausible Monarch grammar and a ~54-entry function catalogue. Both are
worth starting from — hand-writing 54 JSONata signatures is pure toil — but the prototype was never reviewed
or run. Treat the grammar as a draft to verify against real expressions and the function list as data to
spot-check against docs.jsonata.org, not as tested code.

### D12 — Parallel implementation split

The work divides cleanly into two disjoint file sets:

- **Group A (editor infrastructure):** `Common/JsonataEditor/*`, `Common/JsonEditorBase/JsonEditorBase.tsx`,
  `constants/editor.ts`. Owns D3, D5, D6, D11. Produces a `JsonataEditor` with the contract "string in, string
  out".
- **Group B (test-suite wiring):** `models/evaluation/test-suite.ts`, `constants/i18n.ts`, `locales/en.ts`,
  `TestSuites/RequestTemplate/**`, `TestSuites/utils/body-content.ts`. Owns D1, D1a, D2, D7 (toggle), D8, D9,
  D10.

The only coupling is the `JsonataEditor` import path and its prop signature, both fixed by this document
before either group starts. Group B mocks the editor in its component tests anyway (`testing.md` §4 —
mock heavy children like Monaco), so it is not blocked on group A landing.

D13's save-payload normalization is a third, independent file set (`src/utils/evaluation/`,
`src/server/eval/test-suites-api.ts`) touching neither group.

### D13 — Empty expression is normalized away at the API boundary, not in the UI

**The contract.** The user's canonical form is: `jsonataContent` "should be null if empty". The backend rejects
an empty `jsonataContent` **only when `content` is also non-null** — and per D2 the UI guarantees exactly one of
the two keys is ever present, so that combination is already unreachable from this app.

**This normalizer therefore prevents no error.** It is a conformance choice, not a safety net. Saying otherwise
would be a false rationale, and a false rationale is what gets the code deleted later: the first reader who
tests the claim will find `''` saves cleanly, conclude the util is dead weight, and remove it. The honest
statement is that we send the canonical representation of "no expression" because the backend's owner defined
one, and agreeing with it costs us little and keeps the wire format unambiguous for every other consumer.

**The trade-off, stated plainly.** Normalizing is not free:

- **Cost:** an empty expression no longer round-trips. Save with the editor empty and the suite reloads in JSON
  mode with the toggle off — the user's mode selection is silently lost.
- **Bought:** a canonical wire representation, with exactly one spelling of "no expression" rather than two
  (`''` and absent) that every reader of the payload would otherwise have to treat as equivalent.

That cost is real and is why D14 exists: seeding `{}` on turn-on makes reaching the empty state a deliberate
act rather than the default, which moves this from the common path to a rare edge. The two decisions were taken
together and should be read together.

**The collision with D1.** D1 derives mode as `jsonataContent != null` and depends on `''` meaning "JSONata
mode, empty expression". If empty persists as absent, the persisted form of an empty expression is
indistinguishable from "not in JSONata mode at all".

**The resolution — separate editing state from wire format:**

- **Local editing state keeps `''`.** D1, D1a, D1b, `JsonataToggle`, and `BodyTab` are unchanged. A user who
  flips the toggle on, or clears the editor to retype, stays in JSONata mode.
- **The save payload omits the key when the expression is `''`.** Nothing else changes.

**Why the API boundary and not the UI.** The toggle and the editor cannot distinguish "empty because the user
just enabled the mode" or "empty because the user selected-all and is about to type" from "empty and final".
Normalizing in either one would fight the user mid-edit — exactly the bounce D1's consequence paragraph
forbids. Emptiness only becomes a decision at the moment of save, so that is the only place with enough
information to act on it.

`TestSuitesApi.updateTestSuite` (`src/server/eval/test-suites-api.ts:140`) is the sole choke point: it is the
only path by which a request-template body reaches the backend. `tryOutTestSuite` posts
`{ variables: requestBody }` (line 188) and `tryOutTestCase` posts `{}` (line 192) — neither carries the
template, which is why try-out requires a saved suite. One call site, one rule.

**Why omission rather than an explicit `null`.** `updateTestSuite` does
`putActionWithEtag(TEST_SUITE_URL(suite.id), suite, token, etag)` — a **full-object PUT**, so an omitted key
and an explicit null are equivalent to the backend: both clear the field. `JSON.stringify` drops `undefined`,
so building the payload without the key is sufficient and needs no special null handling. This also keeps the
rule identical to D2's "omit the other key" convention rather than introducing a second spelling of absence.

**Shape.** A pure, named-export util — `src/utils/evaluation/test-suite-payload.ts` — returning a new suite
with `requestTemplate.body.jsonataContent` removed when it is the empty string, called inside
`updateTestSuite` before the PUT. No mutation of the input (`utils.md` §2: pure, deterministic, one job).
`test-suites-api.ts` already imports from `@/src/utils/...` (lines 12-13), so the placement is consistent with
existing structure.

*Alternative rejected:* normalizing in the save handler in `TestSuites/View`. It is UI-layer code and would
need duplicating if another save path is ever added.

*Alternative rejected:* sending an explicit `jsonataContent: null`. Equivalent on a full PUT, but it requires
widening the model to `string | null` purely to express a wire concern, and would then leak into the
`!= null` mode check — the one derivation this decision exists to protect.

*Alternative rejected:* not normalizing at all. Defensible on the facts — `''` saves without error — and it
would preserve the round trip. Rejected because the backend's owner named a canonical form and divergence from
it is the kind of thing that stays invisible until a second consumer reads the field and has to special-case
two spellings of empty.

**Accepted consequence.** Saving while the expression is empty means the reloaded suite has no
`jsonataContent`, so it comes back in JSON mode with the toggle off. This is the cost named above, not a bug —
it is stated in the spec so it is a known outcome rather than a surprise, and D14 makes it rare.

### D14 — The toggle seeds `{}` on turn-on

Turning the JSONata switch on writes `jsonataContent: '{}'`, not `''`.

*Why:* `{}` is a valid JSONata expression that evaluates to an empty object, and it mirrors what the JSON
editor already starts the user with, so the two modes open on equivalent content rather than one of them
opening blank. Its real work is against D13's cost: with a seeded default, the empty state is something the
user has to reach deliberately by clearing the editor, instead of the state every new JSONata body starts in.
That turns "save loses your mode" from the common path into a rare edge.

*What it does not change:* the mode derivation. It remains `!= null`, **not** truthiness. A user who selects
all and deletes — on the way to typing something else — sits at `''` and must stay in JSONata mode while
editing (D1). Only the save payload drops the key (D13). Seeding narrows the window in which the empty state
occurs; it does not close it, and code that assumes `jsonataContent` is always non-empty is still wrong.

*Cross-reference:* D1b and D14 both govern what `JsonataToggle` writes — D1b the turn-off body, D14 the
turn-on expression. Change either and check the other.

*Alternative rejected:* seeding a fuller template such as `{ "key": "value" }`. More instructive, but it is
content the user must delete before writing anything real, and unlike `{}` it does not correspond to what the
JSON editor starts with.

## Risks / Trade-offs

- **Theme rules leak across languages** → every JSONata token is prefixed with the language id (D5), and the
  quality gate includes visually confirming a JSON editor and the Analytics SQL editor are unchanged. This is
  the single highest-blast-radius part of the change: `EDITOR_THEMES_CONFIG` is shared by every Monaco editor
  and diff editor in the app.
- **One theme block updated, the other forgotten** → `inherit: false` makes the miss silent (plain foreground,
  not a crash). Mitigation: both light and dark are named explicitly in the tasks, and browser verification
  covers both themes.
- **User stranded in the JSONata editor with no toggle** → the visibility rule ORs in `jsonataContent != null`
  (D1a). Reachable via a backend body carrying `jsonataContent` with no `contentType`, since `BodyTab` checks
  `jsonataContent` before `contentType`. Covered by a unit test and a browser scenario, both driving the
  no-`contentType` case explicitly.
- **Toggle-off writing the wrong empty shape** → toggle-off defaults via the shared
  `getDefaultContentForType` (D2), so a form-data body gets `[]` rather than an object `FormDataGrid` cannot
  render.
- **Toggle-off dropping the user into `FormDataGrid` with a JSON object** → turn-off normalizes an absent
  `contentType` to `application/json` (D1b). Without it, the D1a visibility fix just moves the failure: the
  grid is typed `FormDataPart[]`, its `structuredClone(content) || []` guard does not fire for a truthy
  object, and `!content?.length` makes it report itself empty while holding one. Covered by a unit test on the
  turn-off body shape and by asserting `FormDataGrid` is never handed a non-array `content`.
- **`$$sum` from a mis-anchored completion range** → the range extends one column left when the preceding
  character is `$` (D6), asserted by a test that types `$su`, accepts `$sum`, and expects exactly one `$`.
- **Duplicate global language registration** → id-lookup guard (D6), asserted by a unit test that mounts,
  unmounts, and remounts.
- **Leaked completion providers** → dispose on both `onDidDispose` and unmount, copying `SqlEditor`'s
  belt-and-braces approach; scope suggestions to the owning model so a stale provider cannot pollute another
  editor's completions.
- **`JsonEditorBase` is shared by ~12 editors** → the new prop is optional and additive, and the existing
  JSON-diagnostics branch is untouched. Existing `JsonEditorBase` consumers' tests act as the regression net.
- **Saving an empty expression silently loses JSONata mode** → the direct cost of D13, mitigated but not
  eliminated by seeding `{}` on turn-on (D14), which makes the empty state deliberate rather than default.
  Accepted and specified rather than hidden. If users still hit it, the fix is Open Question 6, not removing
  the normalizer.
- **The normalizer is deleted as pointless** → the real risk, because on the facts it *is* removable: `''`
  saves without error, so anyone who tests the "prevents a validation error" story will find it false. D13 now
  states the actual reason (canonical wire form, chosen trade-off) precisely so the code survives that review.
  Keep the rationale honest if it is ever edited.
- **Someone "fixes" the empty case in the toggle or the editor instead** → D13 states why normalization cannot
  live there (neither can tell mid-edit from final). Watch for it in review: moving it earlier reintroduces
  the mid-edit bounce D1 forbids, and the symptom (mode flips while typing) looks unrelated to the save path.
- **`{}` seeding mistaken for "expression is never empty"** → D14 is explicit that it narrows the window
  rather than closing it; the `!= null` derivation and the empty-string handling both remain load-bearing.
- **No client-side syntax validation** → a malformed expression is only rejected on save, by the backend. The
  trade-off is accepted for this change; `jsonata@^2.2.1` is already a dependency, so adding a
  `jsonata(expr)`-in-try/catch marker provider later is a small follow-up.
- **Toggling JSONata off discards the expression, and back on discards the JSON object** → no undo. Accepted:
  the two representations are not convertible, and the alternative (a stash like `ContentTypeSelect`'s
  `tempContent`) contradicts D1's "no parallel state". Flagged as an open question below.
- **`formatOnType` / `formatOnPaste` are on for every editor** (`constants/editor.ts:108-112`) → harmless
  no-ops with no JSONata formatting provider registered. Do not add one without checking it does not fight the
  user mid-expression.

## Migration Plan

No data migration. `jsonataContent` is optional and additive: a suite without it loads into JSON or form-data
mode exactly as today. Rollback is reverting the frontend change — suites already saved with `jsonataContent`
would then show an empty JSON body in the UI, but the field itself is untouched by the reverted UI and
survives on the backend.

## Open Questions

1. **Should toggling JSONata off preserve the previous JSON object (and vice versa)?** This design says no —
   toggle off gives the empty default for the current content type, toggle on gives `''`. A `tempContent`-style
   stash (the pattern `ContentTypeSelect`
   already uses for content types) would make the toggle non-destructive. Deferred because it reintroduces
   local state that D1 deliberately removes and no requirement asks for it. Revisit if users report losing
   work by mis-toggling.
2. **Should the JSONata body gate Save?** Currently no: `JsonataEditor` does not participate in
   `SaveValidationContext`, so an unparseable expression can be saved and rejected server-side. Adding a
   marker provider backed by the already-installed `jsonata` package would close this. Deferred as a non-goal;
   revisit once the backend's error message for an invalid expression is known, so the two do not disagree.
3. **Should `EndpointSchema/Columns` adopt `JsonataEditor` for response-column expressions?** They are JSONata
   too and would get highlighting and completions for free. Out of scope here; the editor is placed in
   `Common/` specifically so this is a later, isolated change.
4. ~~**Does the backend accept `jsonataContent: ''`?**~~ **RESOLVED — yes, when `content` is null.** It is
   rejected only alongside a non-null `content`, which D2 already makes unreachable. The user's canonical form
   is nonetheless "null if empty", so the payload omits the field: a conformance choice, not error prevention.
   See D13.
5. ~~**Should the toggle seed a non-empty default such as `{}` on turn-on?**~~ **RESOLVED — yes, seed `{}`,
   and normalize as well.** Both, not either/or. See D14.
6. **Should an empty expression block Save, or warn?** Open, and now the natural home for the residual cost of
   D13: the user can still clear the editor and save, losing JSONata mode with no feedback. Options range from
   a validation message to leaving it. Not decided; revisit alongside Open Question 2, since both are about
   giving the JSONata body a voice in save validation.
