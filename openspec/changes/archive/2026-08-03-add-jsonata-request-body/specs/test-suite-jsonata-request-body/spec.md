## ADDED Requirements

### Requirement: Request template body model carries a JSONata expression

`TestSuiteRequestTemplateBody` (`src/models/evaluation/test-suite.ts`) SHALL declare an optional
`jsonataContent?: string` field alongside the existing `contentType?` and `content?` fields.

`jsonataContent` and `content` SHALL be mutually exclusive: at most one of the two is populated at any time,
both in local editing state and in the payload sent to ai-dial-admin-backend. The backend applies the same
contract in the other direction — when it returns a `jsonataContent` string, `content` is absent, and vice
versa.

#### Scenario: Model exposes jsonataContent

- **WHEN** code reads `testSuite.requestTemplate.body`
- **THEN** the type SHALL permit an optional `jsonataContent` string
- **AND** the existing `contentType` and `content` fields SHALL be unchanged

#### Scenario: Suite loaded with jsonataContent has no content

- **WHEN** the backend returns a request template body with `jsonataContent` set to a non-empty string
- **THEN** the same body SHALL NOT carry a `content` value
- **AND** the UI SHALL treat the suite as being in JSONata mode

#### Scenario: Suite loaded with content has no jsonataContent

- **WHEN** the backend returns a request template body with `content` set
- **THEN** the same body SHALL NOT carry a `jsonataContent` value
- **AND** the UI SHALL treat the suite as being in JSON (or form-data) mode

### Requirement: JSONata mode is derived from the body, not stored separately

The UI SHALL derive JSONata mode from the request template body alone —
`isJsonataMode = body?.jsonataContent != null` — and SHALL NOT keep a parallel piece of React state, prop, or
context value recording the mode.

#### Scenario: Mode follows the loaded suite

- **WHEN** a test suite whose body has `jsonataContent` is opened on the Method tab
- **THEN** the Request Template Body tab SHALL show the JSONata editor without any additional user action

#### Scenario: Empty string is still JSONata mode

Still load-bearing after the `{}` seeding decision — it now governs the **cleared-by-hand** case rather than
the just-toggled-on one. A user who selects all and deletes, on the way to typing a different expression, sits
at `''` and must not be thrown out of the mode mid-edit.

- **WHEN** `jsonataContent` is the empty string `''`, having been cleared by the user
- **THEN** the UI SHALL remain in JSONata mode and show an empty JSONata editor
- **AND** the UI SHALL NOT fall back to the JSON editor
- **AND** the mode check SHALL be `!= null`, never truthiness

### Requirement: JSONata toggle in the Request Template header

The Request Template header row (`RequestTemplate.tsx`) SHALL render a `DialSwitch` labelled "JSONata",
positioned before the existing `ContentTypeSelect`, wired to the derived JSONata mode.

The switch SHALL be rendered when the body `contentType` is `application/json` **or** when `jsonataContent` is
present, regardless of `contentType`. The second clause is required, not defensive: `contentType` is optional
on `TestSuiteRequestTemplateBody` and `ContentTypeSelect` never writes it until the user actively changes the
dropdown, so a backend body of `{ jsonataContent: "..." }` with no `contentType` is reachable. Because the Body
tab branches on `jsonataContent` before it looks at `contentType`, a visibility rule keyed on `contentType`
alone would render the JSONata editor with no way to leave it.

#### Scenario: Toggle renders for JSON content type

- **WHEN** the request template body `contentType` is `application/json`
- **THEN** the header SHALL render the JSONata switch
- **AND** the switch SHALL appear before the content-type dropdown

#### Scenario: Toggle is hidden for form-data with no JSONata expression

- **WHEN** the request template body `contentType` is `multipart/form-data` and `jsonataContent` is absent
- **THEN** the header SHALL NOT render the JSONata switch
- **AND** the content-type dropdown SHALL still render

#### Scenario: Toggle rendered when jsonataContent is present under a non-JSON or absent content type

- **WHEN** the body carries a `jsonataContent` value and its `contentType` is `multipart/form-data`, or is
  absent entirely
- **THEN** the header SHALL still render the JSONata switch, in the on state
- **AND** turning it off SHALL return the user to a normal body editor for the current content type
- **AND** the user SHALL NOT be able to reach a state where the JSONata editor is shown with no switch

#### Scenario: Toggle reflects current mode

- **WHEN** the body has a `jsonataContent` value
- **THEN** the switch SHALL be rendered in the on state
- **WHEN** the body has no `jsonataContent` value
- **THEN** the switch SHALL be rendered in the off state

### Requirement: Turning the toggle on switches the body to a seeded JSONata expression

Turning the JSONata switch on SHALL set `body.jsonataContent` to `{}` and remove `body.content` from the
request template body, in a single update to the test suite.

`{}` is a valid JSONata expression evaluating to an empty object, and mirrors what the JSON editor starts the
user with. Seeding it — rather than an empty string — makes the empty-expression state something the user
reaches deliberately by clearing the editor, rather than the state every new JSONata body begins in. That
matters because an empty expression does not survive a save (see the save-payload requirements).

#### Scenario: Enabling JSONata clears content and seeds the expression

- **WHEN** the user turns the JSONata switch on while `body.content` is `{ "model": "gpt-4" }`
- **THEN** the updated body SHALL have `jsonataContent` set to `{}`
- **AND** the updated body SHALL NOT carry a `content` value
- **AND** `contentType` SHALL remain `application/json`

#### Scenario: Enabling JSONata swaps the editor

- **WHEN** the user turns the JSONata switch on
- **THEN** the Body tab SHALL render the JSONata editor in place of the JSON editor
- **AND** the editor SHALL show the seeded `{}` expression, not an empty document

### Requirement: Turning the toggle off restores the literal body editor

Turning the JSONata switch off SHALL, in a single update to the test suite:

- remove `body.jsonataContent`;
- set `body.content` to the **default empty value for the current content type** — `{}` for
  `application/json` (and for an absent content type), `[]` for `multipart/form-data`;
- set `body.contentType` to `application/json` **when it is absent**, leaving any existing value untouched.

The content type must be consulted because the switch can be visible while `contentType` is
`multipart/form-data` (see the toggle visibility requirement); hardcoding `{}` would produce a form-data body
holding an object. The defaulting logic is the same rule `ContentTypeSelect` already applies when it switches
content type, and SHALL be shared between the two rather than duplicated.

The content type must additionally be **normalized** on turn-off because the Body tab selects its literal
editor with `contentType === 'application/json'`, which an absent content type fails — so a body left without
one would fall through to the form-data grid, which is typed for an array and would be handed an object.
Turning the switch **on** SHALL NOT normalize `contentType`: the JSONata branch ignores it, and writing a value
the user never chose would silently change what a form-data suite sends. This asymmetry between the two
directions is deliberate.

At no point SHALL the form-data grid be rendered with a `content` value that is not an array.

#### Scenario: Disabling JSONata under JSON content type

- **WHEN** the user turns the JSONata switch off while `contentType` is `application/json` and
  `body.jsonataContent` is `'{ "model": "gpt-4" }'`
- **THEN** the updated body SHALL NOT carry a `jsonataContent` value
- **AND** the updated body SHALL have `content` set to `{}`

#### Scenario: Disabling JSONata under form-data content type

- **WHEN** the user turns the JSONata switch off while `contentType` is `multipart/form-data`
- **THEN** the updated body SHALL NOT carry a `jsonataContent` value
- **AND** the updated body SHALL have `content` set to `[]`, not `{}`
- **AND** `contentType` SHALL remain `multipart/form-data`

#### Scenario: Disabling JSONata with no content type normalizes it to JSON

- **WHEN** the body carries `jsonataContent` with `contentType` absent, and the user turns the JSONata switch
  off
- **THEN** the updated body SHALL have `contentType` set to `application/json`
- **AND** the updated body SHALL have `content` set to `{}`
- **AND** the updated body SHALL NOT carry a `jsonataContent` value
- **AND** the Body tab SHALL render the JSON editor
- **AND** the Body tab SHALL NOT render the form-data grid

#### Scenario: Enabling JSONata leaves an absent content type absent

- **WHEN** the body has no `contentType` and the user turns the JSONata switch on
- **THEN** the updated body SHALL still have no `contentType`
- **AND** the Body tab SHALL render the JSONata editor

#### Scenario: Form-data grid is never handed a non-array content

- **WHEN** the Body tab renders `FormDataGrid`, by any route including after the JSONata switch is turned off
- **THEN** the `content` it receives SHALL be an array
- **AND** it SHALL NOT receive an object or `undefined`

#### Scenario: Disabling JSONata swaps the editor back

- **WHEN** the user turns the JSONata switch off
- **THEN** the Body tab SHALL render the literal body editor for the resulting content type in place of the
  JSONata editor

### Requirement: Body tab branches three ways

`BodyTab` SHALL choose its editor as follows, in priority order: JSONata editor when JSONata mode is active;
otherwise the existing `EntityJsonEditor` when `contentType` is `application/json`; otherwise the existing
`FormDataGrid`.

#### Scenario: JSONata editor rendered in JSONata mode

- **WHEN** `contentType` is `application/json` and `jsonataContent` is present
- **THEN** the Body tab SHALL render the JSONata editor
- **AND** the JSONata editor SHALL be seeded with the `jsonataContent` string

#### Scenario: JSON editor rendered in JSON mode

- **WHEN** `contentType` is `application/json` and `jsonataContent` is absent
- **THEN** the Body tab SHALL render `EntityJsonEditor`, unchanged from today

#### Scenario: Form-data grid rendered for form-data

- **WHEN** `contentType` is `multipart/form-data`
- **THEN** the Body tab SHALL render `FormDataGrid`, unchanged from today

#### Scenario: Add-row action stays a no-op in JSONata mode

- **WHEN** the Body tab is in JSONata mode and the imperative `add()` handle is invoked
- **THEN** nothing SHALL be added and no error SHALL be raised

### Requirement: Editing the JSONata expression updates the body

Every keystroke in the JSONata editor SHALL write the editor's full text to `body.jsonataContent` and SHALL
leave `content` absent.

#### Scenario: Typing updates jsonataContent

- **WHEN** the user types `{ "model": prompt.model }` into the JSONata editor
- **THEN** `body.jsonataContent` SHALL be set to that exact string
- **AND** `body.content` SHALL remain absent

#### Scenario: Clearing the editor keeps JSONata mode

- **WHEN** the user deletes all text in the JSONata editor
- **THEN** `body.jsonataContent` SHALL be the empty string
- **AND** the Body tab SHALL still render the JSONata editor

### Requirement: Header add-button and variables documentation follow the active editor

The Request Template header's "Add" button and the template-variables documentation popover SHALL behave in
JSONata mode exactly as they do in JSON mode: the Add button SHALL be hidden and the variables documentation
SHALL be shown.

#### Scenario: Add button hidden in JSONata mode

- **WHEN** the Body tab is active in JSONata mode
- **THEN** the header SHALL NOT render the "Add" button

#### Scenario: Variables documentation shown in JSONata mode

- **WHEN** the Body tab is active in JSONata mode
- **THEN** the header SHALL render the template-variables documentation control

### Requirement: Content-type change preserves mutual exclusivity

`ContentTypeSelect` SHALL clear `jsonataContent` whenever it writes a new `contentType`, so that switching
content type can never leave both `jsonataContent` and `content` populated.

#### Scenario: Switching to form-data while in JSONata mode

- **WHEN** the body has `contentType: 'application/json'` and a non-empty `jsonataContent`, and the user
  selects `multipart/form-data`
- **THEN** the updated body SHALL have `contentType: 'multipart/form-data'`
- **AND** `jsonataContent` SHALL be absent
- **AND** `content` SHALL be an empty array
- **AND** the JSONata switch SHALL no longer be rendered

#### Scenario: Switching back to JSON returns to JSON mode

- **WHEN** the body is `multipart/form-data` and the user selects `application/json`
- **THEN** the updated body SHALL have no `jsonataContent`
- **AND** the Body tab SHALL render the JSON editor
- **AND** the JSONata switch SHALL be rendered in the off state

#### Scenario: Selecting the current content type is a no-op

- **WHEN** the user selects the content type that is already active
- **THEN** the test suite SHALL NOT be updated and the current mode SHALL be preserved

### Requirement: Template variables inside a JSONata expression become input bindings

`${{name}}` and `${{name:default}}` placeholders written inside a `jsonataContent` expression SHALL be
discovered by `getTemplateParameters` and SHALL participate in input bindings exactly as placeholders in any
other request-template string do.

#### Scenario: Placeholder in a JSONata expression is discovered

- **WHEN** `jsonataContent` is `{ "q": "${{question}}" }`
- **THEN** `getTemplateParameters` SHALL include `question` in its result
- **AND** the Dynamic Configuration section SHALL offer a binding row for `question`

#### Scenario: Removing a placeholder drops its stale binding

- **WHEN** the user edits `jsonataContent` so that a previously present `${{question}}` placeholder is gone
- **THEN** the input binding for `question` SHALL be filtered out of `testSuite.inputBindings`

### Requirement: Reusable JSONata Monaco editor component

A `JsonataEditor` component SHALL live at `src/components/Common/JsonataEditor/` and SHALL wrap
`JsonEditorBase` directly with `language="jsonata"`. It SHALL accept the expression as a `string` value and
emit a `string` on change, and SHALL NOT route through `EntityJsonEditor` (whose only purpose is object ⇄ text
marshalling).

#### Scenario: Editor renders the expression text

- **WHEN** `JsonataEditor` is rendered with a value of `$sum(items.price)`
- **THEN** the underlying Monaco editor SHALL be mounted with `language` `jsonata` and that text as its value

#### Scenario: Editor emits a string, never undefined

- **WHEN** Monaco reports a change with an `undefined` value
- **THEN** `JsonataEditor` SHALL invoke its `onChange` with the empty string

### Requirement: JsonEditorBase supports pre-mount Monaco setup

`JsonEditorBase` SHALL accept an optional `onBeforeMount?: (monaco: Monaco) => void` prop and SHALL invoke it
from its existing `beforeMount` handler, so a caller can register a custom Monaco language before the editor
model is created. Existing behavior for callers that do not pass the prop SHALL be unchanged.

#### Scenario: Callback runs before mount

- **WHEN** `JsonEditorBase` is rendered with an `onBeforeMount` callback
- **THEN** the callback SHALL be invoked with the Monaco instance before the editor model is created

#### Scenario: Theme definition still applies

- **WHEN** `onBeforeMount` is supplied
- **THEN** `JsonEditorBase` SHALL still define the current editor theme from `EDITOR_THEMES_CONFIG`

#### Scenario: JSON diagnostics remain JSON-only

- **WHEN** `JsonEditorBase` is rendered with a `language` other than `json`
- **THEN** it SHALL NOT register the permissive JSON diagnostics options

### Requirement: JSONata language registration is idempotent and globally safe

The `jsonata` Monaco language, its Monarch tokenizer, and its language configuration SHALL be registered at
most once per Monaco singleton, guarded by an existing-language lookup
(`monaco.languages.getLanguages().some((l) => l.id === JSONATA_LANGUAGE_ID)`).

#### Scenario: Second editor mount does not re-register

- **WHEN** a JSONata editor is mounted, unmounted, and mounted again in the same session
- **THEN** the language SHALL be registered exactly once
- **AND** the second editor SHALL still highlight JSONata syntax

### Requirement: JSONata completions are scoped and disposed

The JSONata editor SHALL register a Monaco completion provider offering JSONata builtin functions and
keywords, triggered on `$` as well as on word characters. The provider SHALL return suggestions only for its
own editor model, and SHALL be disposed on both `editorInstance.onDidDispose` and component unmount.

#### Scenario: Completions offered for builtin functions

- **WHEN** the user types `$su` in the JSONata editor
- **THEN** the completion list SHALL include `$substring` and `$sum` with their signatures as detail

#### Scenario: Completions scoped to the owning model

- **WHEN** the completion provider is asked for suggestions for a Monaco model that is not the editor's own
- **THEN** it SHALL return an empty suggestion list

#### Scenario: Provider disposed on unmount

- **WHEN** the JSONata editor unmounts
- **THEN** its registered completion provider SHALL be disposed

### Requirement: JSONata theme tokens are namespaced and defined for both themes

Every JSONata Monarch token name SHALL be prefixed with the `jsonata.` language id, and matching rules SHALL
be added to both the light and dark blocks of `EDITOR_THEMES_CONFIG` (`src/constants/editor.ts`). No JSONata
rule may use a bare token name such as `string`, `keyword`, or `number`.

#### Scenario: JSON editor styling is unaffected

- **WHEN** the JSONata theme rules are in place and a JSON editor is rendered
- **THEN** JSON keys, values, numbers, and brackets SHALL render with their existing colors

#### Scenario: SQL editor styling is unaffected

- **WHEN** the JSONata theme rules are in place and the Analytics SQL editor is rendered
- **THEN** its token colors SHALL be unchanged

#### Scenario: JSONata highlighted in both themes

- **WHEN** the app is in the light theme, and again in the dark theme
- **THEN** JSONata strings, numbers, keywords, variables, operators, brackets, and comments SHALL each render
  with a theme-appropriate color rather than the plain default foreground

#### Scenario: Template placeholders highlighted distinctly

- **WHEN** a JSONata expression contains `${{question}}`
- **THEN** the placeholder SHALL be tokenized as `jsonata.variable.template` and styled distinctly from a
  plain `$`-variable

### Requirement: An empty JSONata expression is omitted from the save payload

`TestSuitesApi.updateTestSuite` (`src/server/eval/test-suites-api.ts`) SHALL normalize the suite before its PUT
to ai-dial-admin-backend, removing `requestTemplate.body.jsonataContent` when it is the empty string. The
normalization SHALL be a pure, named-export util that returns a new object and does not mutate its input.

The canonical wire form for "no expression" is null/absent, not `''`. The backend rejects an empty
`jsonataContent` only when `content` is also non-null — a combination the mutual-exclusivity requirement
already makes unreachable — so this normalization is a **conformance** rule, not error prevention. It is a
deliberate trade: an empty expression stops round-tripping (see the requirement below), in exchange for one
unambiguous spelling of "no expression" on the wire.

The empty string remains a legal **editing** state (see the mode-derivation requirement), so the two forms are
reconciled at the point of save rather than in the editor.

Omission is sufficient — the endpoint is a full-object PUT, so an absent key and an explicit null both clear
the field, and `JSON.stringify` drops `undefined`. An explicit `null` SHALL NOT be sent.

This is the only path by which a request-template body reaches the backend: the try-out endpoints send
`{ variables }` and `{}` respectively and carry no template.

#### Scenario: Empty expression is omitted from the PUT

- **WHEN** a suite whose `requestTemplate.body.jsonataContent` is `''` is saved
- **THEN** the request body sent to the backend SHALL NOT contain a `jsonataContent` key
- **AND** it SHALL NOT contain `jsonataContent: null`

#### Scenario: Non-empty expression is sent verbatim

- **WHEN** a suite whose `jsonataContent` is `{ "model": "gpt-4" }` is saved
- **THEN** the request body SHALL carry that exact `jsonataContent` string, unmodified

#### Scenario: A body in JSON mode is unaffected

- **WHEN** a suite whose body has `content` and no `jsonataContent` is saved
- **THEN** the request body SHALL be unchanged by the normalization
- **AND** `content` SHALL be sent as-is

#### Scenario: A suite with no request template is unaffected

- **WHEN** a suite with no `requestTemplate`, or a `requestTemplate` with no `body`, is saved
- **THEN** the normalization SHALL return it unchanged and SHALL NOT throw

#### Scenario: Normalization does not mutate its input

- **WHEN** the normalization util is called with a suite whose `jsonataContent` is `''`
- **THEN** the returned object SHALL omit the key
- **AND** the object passed in SHALL still have `jsonataContent` set to `''`

### Requirement: Saving an empty expression returns the suite to JSON mode

A suite saved while the JSONata editor is empty SHALL reload in JSON mode with the toggle off, because the
empty expression is omitted from the payload and the mode derivation therefore sees no `jsonataContent`. The
UI SHALL NOT attempt to preserve the mode across such a save.

This is the accepted cost of the canonical wire form, and it is the reason turn-on seeds `{}`: the user must
clear the editor deliberately to reach it, so it is a rare edge rather than what happens to every newly
enabled JSONata body.

#### Scenario: Save with a hand-cleared expression reloads in JSON mode

- **WHEN** the user turns the JSONata switch on, clears the seeded `{}` so the editor is empty, saves, and
  reopens the suite
- **THEN** the Body tab SHALL render the JSON editor
- **AND** the JSONata switch SHALL be off

#### Scenario: Save immediately after enabling the toggle preserves JSONata mode

- **WHEN** the user turns the JSONata switch on and saves without editing the seeded expression
- **THEN** the payload SHALL carry `jsonataContent` as `{}`
- **AND** reopening the suite SHALL render the JSONata editor with the switch on

#### Scenario: Clearing the editor before save does not change mode until save

- **WHEN** the user clears a non-empty JSONata expression but has not yet saved
- **THEN** the Body tab SHALL still render the JSONata editor with the switch on

### Requirement: JSONata body is saved and reloaded without loss

Saving a test suite whose body is in JSONata mode SHALL send `jsonataContent` and no `content` to the backend,
and reloading the suite SHALL restore JSONata mode with the same expression text. Save success and failure
notifications SHALL be the existing test-suite save notifications — this change adds no new notification.

The empty-expression case is the one exception, covered by its own requirement above.

#### Scenario: Round trip preserves a non-empty expression

- **WHEN** the user enters a non-empty JSONata expression, saves the suite, and reopens it
- **THEN** the Body tab SHALL render the JSONata editor with the same expression text
- **AND** the JSONata switch SHALL be on

#### Scenario: Save notifications unchanged

- **WHEN** saving a suite in JSONata mode succeeds or fails
- **THEN** the existing test-suite save success or failure notification SHALL be shown, with no JSONata-specific
  message
