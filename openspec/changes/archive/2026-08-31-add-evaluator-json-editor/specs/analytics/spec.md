## ADDED Requirements

### Requirement: The Properties tab can be edited as JSON instead of as fields

The evaluator detail page SHALL offer a JSON editor as an alternative to the `Properties` tab's
fields: a toggle in the identity row above the tabs, and the whole definition as one JSON document in
place of the tabs and everything they present. One JSON document, rather than JSON per member, is the
point — `response_schema` is already edited as JSON inside the form, and this is the whole definition
at once.

The editor and the fields SHALL edit **one** draft, not two. Enabling the editor SHALL seed it from the
version on screen, and what the JSON holds at submission SHALL be what is submitted: a member deleted
in the JSON SHALL be absent from the request rather than retained from its previous value.

Submitting SHALL go through the same path either way — the same control, the same confirmation, and
the same assembled request — so that the same JSON produces the same request no matter which way it
was submitted. The editor SHALL NOT introduce a second write path.

The toggle SHALL be offered to every caller, and the JSON SHALL be read-only for a caller who may not
register a version, matching the gating the fields already apply. Reading the definition as JSON is
useful without the rights to change it.

The JSON SHALL hold the members `POST /v1/evaluators` accepts, seeded from the version on screen, and
SHALL NOT hold `version` or `created_at`. The service assigns both and rejects both on write, and the
page already reports them — the version through its own control, the timestamp as a labelled fact. An
editable field the service will not accept only invites the caller to set it.

#### Scenario: Enabling the editor replaces the fields with JSON

- **WHEN** the caller enables the JSON editor on the `Properties` tab
- **THEN** the version's definition is presented as one block of JSON
- **AND** the definition fields are no longer presented
- **AND** the evaluator name and the version control remain

#### Scenario: The JSON is seeded from the version on screen

- **WHEN** the caller enables the JSON editor on version 4 of an evaluator
- **THEN** the JSON holds that version's values

#### Scenario: A member deleted in JSON is not resurrected

- **WHEN** the caller deletes an optional member from the JSON and submits
- **THEN** the registered version does not carry that member

#### Scenario: The JSON leaves out the fields the service assigns itself

- **WHEN** a version is presented as JSON
- **THEN** the JSON contains no `version` and no `created_at`

#### Scenario: A caller without registration rights may read the JSON but not edit it

- **WHEN** a caller who may not register a version enables the JSON editor
- **THEN** the JSON is presented
- **AND** it cannot be edited

#### Scenario: Submitting from JSON uses the same flow as the fields

- **WHEN** the caller submits from the JSON editor
- **THEN** the same confirmation naming the predicted next version is presented
- **AND** confirming registers the next version exactly as submitting from the fields would

### Requirement: The name is not editable in JSON either

`name` SHALL NOT be editable in the JSON editor, for any caller, for the same reason it is not
editable as a field: posting a different name registers version 1 of a separate evaluator rather than
a new version of this one.

Because JSON cannot disable one of its own members, a name changed in the JSON SHALL be disregarded
rather than sent: the registered version SHALL carry the name of the evaluator being edited. The
editor SHALL NOT be the one place in the console where a name change quietly forks the entity.

A change to the name alone therefore counts as no change at all: the document keeps showing what was
typed, and nothing is offered to save. This follows the console's existing treatment of a protected
member and is preferable to the alternatives — rewriting the caller's document under the cursor, or
offering a Save that registers a version identical to the one on screen.

#### Scenario: A name changed in JSON does not fork the evaluator

- **WHEN** the caller changes `name` in the JSON and submits
- **THEN** the next version of the evaluator on screen is registered
- **AND** no separate evaluator is created

#### Scenario: Changing only the name counts as no change

- **WHEN** the caller changes `name` in the JSON and nothing else
- **THEN** neither Discard nor Save is offered

### Requirement: The JSON editor takes the whole view, and an unsaved change closes the way out

While the JSON editor is open, the page SHALL present the JSON and nothing else below the identity
row. The tabs SHALL NOT be offered, for any caller. A caller who wants the definition fields, the
version facts, or the referencing rules SHALL leave the editor to reach them — this is a mode, not a
panel that shares the page.

Once the draft differs from the version on screen, the toggle itself SHALL NOT be offered either,
following the console's established behaviour: while a change is pending, the identity row offers
Discard and Save in the toggle's place. Leaving the editor is therefore **discarding or registering**,
not toggling back — which is what keeps a pending change from being parked out of sight behind a
presentation the caller switched away from.

Discarding SHALL restore the version as stored and SHALL bring the toggle back. Disabling the editor
with nothing pending SHALL return the caller to the tab that was active when they enabled it.

The identity row SHALL otherwise remain: the evaluator name, the version control, and whichever of the
toggle or the Discard/Save pair applies.

#### Scenario: The tabs are withdrawn while the editor is open

- **WHEN** the caller enables the JSON editor
- **THEN** the tabs are no longer offered
- **AND** the referencing rules are not presented

#### Scenario: A caller with read-only rights also loses the tabs

- **WHEN** a caller who may not register a version enables the JSON editor
- **THEN** the tabs are no longer offered

#### Scenario: Editing the JSON withdraws the toggle

- **WHEN** the caller edits the JSON so that it differs from the version on screen
- **THEN** the toggle is no longer offered
- **AND** Discard and Save are offered instead

#### Scenario: Discarding from the editor restores the stored version and the toggle

- **WHEN** the caller discards while the JSON editor is open
- **THEN** the JSON holds the version as stored
- **AND** the toggle is offered again

#### Scenario: Leaving the editor with nothing pending returns to the tab that was active

- **WHEN** the caller enables the JSON editor from the `Rules` tab, changes nothing, and disables it
- **THEN** the tabs are offered again
- **AND** the referencing rules are presented

### Requirement: Registering carries every member on the draft, presented or not

Assembling the version to register SHALL carry through every member on the draft, including members no
control presents, rather than copying a fixed list of the members the console happens to name. Two things
depend on this: a member introduced in the JSON editor must survive to the request, and a member the
service has added since this console was built must not be dropped from the next version registered
through it.

The exceptions SHALL be exactly these, and each exists to keep a request the service would refuse from
being sent:

- the members the service assigns (`version`, `created_at`), which it rejects on write — including when
  they are typed back into the document;
- the llm-only members when the type is `sql`, since the service answers 422 for a member belonging to the
  other type;
- empty optional members, omitted rather than sent blank — which means an explicit `null`, `{}`, `[]` or
  `""` is the one value neither presentation can send;
- a declared variable that is not an object, or carries no name, which SHALL be dropped from the request
  rather than sent, because the service rejects the whole registration over one such entry rather than
  skipping it;
- a declared variable's expression, which SHALL be restated under the member its evaluator type uses —
  `sql` for a `sql` version, `jsonata` otherwise — so a document naming the other one registers
  successfully instead of being refused.

Carry-through SHALL reach inside a declared variable as well as the top level: a member the console does
not name on a variable SHALL survive to the request.

A value of the wrong type SHALL read as absent rather than raising: both assembling the request and
checking the shape run while the page renders, so a `"model"` holding a number or an `"output_vars"`
holding an object must not fault. Such a value SHALL still be carried to the request, where the service
refuses it — the console SHALL NOT be what fails.

Because a change is detected by comparing the assembled request against the stored version, an assembly
that discarded unnamed members would also report **no change** for an edit that only introduced one — the
editor would appear to accept the edit while offering no way to save it.

#### Scenario: A member the console does not present is registered as written

- **WHEN** the caller adds a member the fields do not present to the JSON and submits
- **THEN** the request carries that member

#### Scenario: An unnamed member on a declared variable is registered too

- **WHEN** the caller adds a member the fields do not present to one of the declared variables and submits
- **THEN** the request carries that member on that variable

#### Scenario: A value of the wrong type does not break the page

- **WHEN** the caller sets a member to a value of a type the service does not accept, such as an
  `output_vars` holding an object rather than a list
- **THEN** the page continues to present the document and the controls
- **AND** submitting reports the service's refusal rather than failing in the console

#### Scenario: Adding an unpresented member counts as a change

- **WHEN** the caller adds a member the fields do not present to the JSON
- **THEN** Discard and Save are offered

#### Scenario: The members the service assigns are still not sent

- **WHEN** a version is registered
- **THEN** the request carries neither `version` nor `created_at`

#### Scenario: A sql version still omits the members its type forbids

- **WHEN** the type is `sql` and the version is registered
- **THEN** the request carries no preset, model, params, request template, input variables, or response
  schema

### Requirement: JSON that does not parse blocks submission and reports where

While the JSON editor is open, the form's own shape check SHALL NOT block submission: the JSON is the
input, and JSON the form's controls could not have produced is not thereby wrong.

JSON that does not parse SHALL block submission, and each parse error SHALL be reported with the line
it occurred on.

Text that does not parse reaches no draft, so the controls SHALL be offered on the strength of the parse
failure itself and not only on a difference from the stored version. Otherwise a caller whose **first**
edit breaks the document is offered neither a Save to be told what is wrong nor a Discard to back out of
it — the page silently ignores everything typed into it. The controls SHALL withdraw again once the
document parses.

The Save control SHALL remain enabled and refuse on use, rather than being disabled —
a caller who has broken the JSON is better served by being told where than by a control that has gone
quiet. This deliberately differs from the two other JSON surfaces in this console, the query builder's
JSON view and the table Add-rows popup, which both disable their submit action while the content does
not parse; the alternative here is the entity JSON editor's own established behaviour, which this page
follows rather than re-deciding.

No evaluator-specific validation SHALL be added beyond parseability: contract violations SHALL continue
to surface as the service's own error, reported as the console reports every other failed registration.

#### Scenario: Unparseable JSON is reported per line and nothing is registered

- **WHEN** the caller submits JSON that does not parse
- **THEN** each parse error is reported with its line number
- **AND** no version is registered

#### Scenario: Breaking the document before changing anything still offers a way out

- **WHEN** the caller's first edit to the JSON leaves it unparseable
- **THEN** Discard and Save are offered
- **AND** using Save reports the parse errors

#### Scenario: The controls withdraw once the document parses again

- **WHEN** the caller repairs unparseable JSON back to the stored version
- **THEN** the toggle is offered again

#### Scenario: The Save control stays usable while the JSON does not parse

- **WHEN** the JSON does not parse
- **THEN** the Save control is still offered as enabled

#### Scenario: JSON the service rejects reports the service's message

- **WHEN** the caller submits parseable JSON the service rejects
- **THEN** the service's own message is reported
- **AND** no version is registered

#### Scenario: A value the fields could not have produced is accepted

- **WHEN** the caller submits parseable JSON carrying a `params` value the key/value editor cannot
  express, such as a boolean or a numeric-looking string
- **THEN** submission is not blocked by the console
- **AND** the registered version carries that value as written

## MODIFIED Requirements

### Requirement: Evaluator facts and params are presented as fields, not as a blob

The Properties tab SHALL present `type`, `preset`, and `model` as labelled controls, and `params` as a
key/value editor — one row per entry, each key labelled and its value beside it. In that presentation
`params` SHALL NOT be rendered as a JSON blob: the map holds a handful of model knobs such as
`max_tokens` and `temperature`, and those are read and changed one at a time.

This governs the tab's **form** presentation. It does not forbid the JSON editor, which presents the
whole definition — `params` among it — as one JSON document on purpose, as the escape hatch for the
values the key/value editor cannot type. The form remains what the tab opens on.

`preset` has exactly one value the service defines, `chat_completion`, which the model layer SHALL name as
an enum member rather than a bare string. A value the enum does not name SHALL still be rendered verbatim.

#### Scenario: Params are readable and changeable one entry at a time

- **WHEN** an `llm` version carrying `max_tokens` and `temperature` is opened
- **THEN** each key is presented with its own value
- **AND** the params are not presented as a single JSON document

#### Scenario: An unknown preset renders as reported

- **WHEN** a version reports a preset the console does not know
- **THEN** that value is presented as the service reported it
