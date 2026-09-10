## MODIFIED Requirements

### Requirement: Evaluators listing grid

The Evaluators page SHALL render the fetched evaluators as a grid whose columns are **name**, **latest
version**, **registered at**, and **used by**. Every data column SHALL remain sortable and filterable
through the grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar.

The grid SHALL NOT carry a **type** column. `GET /v1/evaluators` returns only `{name, latest_version,
created_at}`, so a type column could be filled only by a per-row version read — which the pipelines listing
requirement already forbids for its own evaluator cell — or by a join from the pipelines listing, which
leaves every unreferenced evaluator blank, where an em dash reads as "this evaluator has no type" rather
than "no pipeline names it". Type is presented on the detail page instead.

Activating a row SHALL navigate to that evaluator's detail route, `/evaluators/{name}`, honouring the
modifier keys that open a new tab. The **name** cell SHALL be plain text rather than a link, for the same
reason the pipelines listing renders its name as text: the column is read and compared across rows, and a link
per row makes it harder to scan.

The listing SHALL offer **no edit and no delete action**, on a row or anywhere else on the page, and the grid
SHALL carry no action column — *A registered version is never changed or removed; the only mutation is
appending a new one* forbids both for every caller. It SHALL offer exactly one write: a **page-level create
control in the page header**, opening the create-evaluator modal specified by *The listing's create modal
presents the members registration requires and nothing else*. The control is page-level rather than
per-row because registering is not an operation on any row: it names a new evaluator, and posting against
an existing name is how a *version* is made, which the detail page owns.

The header control SHALL be rendered only for a caller carrying `FULL_ADMIN`, per *Registering a version
requires full-admin rights*. The listing's empty state SHALL offer no create control of its own; the header
is the single door, matching the pipelines listing.

#### Scenario: Listing renders the four columns

- **WHEN** the listing renders a registered evaluator
- **THEN** its name, latest version, registration timestamp, and used-by count are presented
- **AND** no type column is present

#### Scenario: Navigating to an evaluator

- **WHEN** the user activates an evaluator's row
- **THEN** the browser navigates to `/evaluators/{name}` for that evaluator

#### Scenario: The name is plain text

- **WHEN** the listing renders an evaluator
- **THEN** its name is presented as text rather than as a link

#### Scenario: Data columns stay sortable and filterable

- **WHEN** the listing renders
- **THEN** no data column disables sorting or filtering
- **AND** no separate filter toolbar is rendered above the grid

#### Scenario: No row offers a mutation

- **WHEN** the listing renders for a full admin
- **THEN** no row exposes a create, edit, or delete action
- **AND** the grid carries no action column
- **AND** the only write the page offers is the create control in its header

#### Scenario: An empty registry offers no create control of its own

- **WHEN** the listing renders for a full admin and the registry holds no evaluator
- **THEN** the empty state states that there are no evaluators
- **AND** the page's only create control is the one in its header

### Requirement: Registering a version requires full-admin rights

`POST /v1/evaluators` is the one evaluator endpoint the service marks `@FullAdminOnly`; every read is open.
The console SHALL therefore gate the write on the caller's application role (`isFullAdmin` from
`AppContext`) and SHALL NOT gate anything else on this surface.

The gate SHALL be `isFullAdmin`, **not** `isReadOnlyAdmin`. The two are not complements — a caller carrying
neither role satisfies neither predicate — so gating on `isReadOnlyAdmin` would leave a role-less caller an
enabled submit. A `READ_ONLY_ADMIN` and a caller with no role SHALL be treated identically, because the
service distinguishes only `FULL_ADMIN`.

On the **detail page** a caller without the right SHALL see the same tabs and the same values, with every
control rendered as disabled rather than hidden, and no submit or discard offered. Reading is what the
service permits them; withholding it would be the console's own invention.

On the **listing** the one control this gate governs is the header's create control, and it SHALL be
**withheld entirely rather than rendered disabled**. This is not an exception to the sentence above but its
consequence: disabled-not-hidden exists so a caller who may not write can still read every value of a
definition, and a create control carries no value to read. A permanently disabled create button on a page
that is otherwise fully readable states a permission rather than a fact. Nothing else on the listing SHALL be
gated — every column, every row, and every value SHALL be presented to every caller, and no evaluator read
SHALL be withheld.

The client gate is presentation, not enforcement. A submission that reaches the service anyway SHALL surface
the service's own rejection.

#### Scenario: A full admin can edit and submit

- **WHEN** a full admin edits a field
- **THEN** a discard and a submit are offered

#### Scenario: A read-only admin reads everything and edits nothing

- **WHEN** a caller carrying only `READ_ONLY_ADMIN` opens the detail page
- **THEN** both tabs and every value are presented
- **AND** every control is disabled
- **AND** no submit or discard is offered

#### Scenario: A caller with no role is treated the same

- **WHEN** a caller carrying neither role opens the detail page
- **THEN** the surface matches what a read-only admin sees

#### Scenario: A rejected submission reports the service's message

- **WHEN** a submission is rejected by the service
- **THEN** the service's own error is surfaced

#### Scenario: The listing offers a full admin the create control

- **WHEN** a full admin opens the evaluators listing
- **THEN** a create control is present in the page header

#### Scenario: The listing withholds the create control from a caller without the right

- **WHEN** a caller carrying only `READ_ONLY_ADMIN`, or carrying neither role, opens the evaluators listing
- **THEN** no create control is present anywhere on the page, disabled or otherwise
- **AND** every row and every column is presented, with nothing withheld

## ADDED Requirements

### Requirement: The listing's create modal presents the members registration requires and nothing else

The listing's header control SHALL open a modal that registers version 1 of a new evaluator through the
existing `createEvaluator` server action (`src/app/[lang]/evaluators/actions.ts`, `POST /v1/evaluators`).
No new route and no new server action SHALL be introduced.

The modal SHALL present exactly the members registration requires, and no member registration treats as
optional:

- **Name** — required; validated by *An evaluator's name is validated for format and for uniqueness
  against the listing, inline*.
- **Type** — required, one of `llm` or `sql`, presented **before** the members that depend on it as a
  radio group (the shape the pipelines create popup uses for a pipeline's kind).
- **Output variables** — at least one, each carrying a non-blank name and a type; for a `sql` evaluator
  each SHALL also carry a non-blank expression. The rows SHALL be authored by the same
  `EvaluatorVarsEditor` the detail page uses, reused **without new props**: a mismatch between that editor
  and this caller is handled in the modal, not by widening the shared editor. While no variable is
  declared the section SHALL present **only the control that adds one** — no empty-state text and no
  validation message. The detail page keeps both, because there an existing version's variables have been
  taken away; here nothing has been lost yet.
- **Preset** and **Model** — presented and required **only** when the selected type is `llm`.

For a `sql` evaluator the modal SHALL present **no control at all** for `preset`, `model`, `params`,
`request_template`, `input_vars`, or `response_schema` — the service answers 422 for any of them on that
type, so a disabled or empty control would state that they could be set. This is the same rule *A sql
evaluator omits the members its type forbids* applies to the detail page.

Validity SHALL be decided by `isEvaluatorShapeValid` (`src/utils/analytics/evaluator-dto.ts`) reused
unchanged, so one POST has one notion of a valid shape across both surfaces. That function is deliberately
stricter than the service on one point — it requires at least one output variable for an `llm` evaluator
too, which the service requires only for `sql` — and that SHALL NOT be re-decided here. Submission SHALL be
disabled while the shape is invalid, and no request SHALL be sent from a disabled submit.

**When a validation message appears.** An untouched form SHALL report no error. It SHALL withhold
submission and nothing more; the disabled submit is the whole feedback for a member the operator has not
reached yet. A validation message SHALL appear only once the operator has entered something that is
wrong. Two consequences, both stated here so neither reads as an omission: a blank name carries no inline
error (*An evaluator's name is validated for format and for uniqueness against the listing, inline*), and a
missing output variable carries **no message at all**. The second is stronger than touch-gating because a
missing output variable cannot be reached by a submit attempt — the submit is disabled until one exists —
so the only path to such a message would be adding a variable and then removing it. A message the operator
sees before doing anything states a rule rather than reporting a mistake, which is what the two duplicate-name
bugs (#3551, #3580) were filed about from the other direction.

The modal SHALL offer **no** editor for a member registration treats as optional — no params key/value
editor, no request template, no input variables, no response schema — and **no** JSON-editing mode. Each is
authored on the detail page, whose presentation the shipped spec constrains in detail, by registering a
further version. The consequence is deliberate and SHALL NOT be worked around: an `llm` evaluator created
here is a valid registered version that carries no request template until a second registration adds one.

#### Scenario: The header control opens the create-evaluator modal

- **WHEN** a full admin activates the create control on the evaluators listing
- **THEN** a modal opens presenting a name field, a type choice, and an output-variables editor

#### Scenario: An llm evaluator requires a preset and a model

- **WHEN** `llm` is the selected type and either the preset or the model is blank
- **THEN** submission is disabled and no registration request is sent
- **AND** once both are set alongside one named, typed output variable, submission is offered

#### Scenario: A sql evaluator offers none of the members its type forbids

- **WHEN** `sql` is the selected type
- **THEN** no preset, model, params, request-template, input-variables, or response-schema control is
  present in the modal
- **AND** the name, type, and output-variables controls are present

#### Scenario: At least one output variable is required for either type

- **WHEN** the selected type is `llm` or `sql` and no output variable is declared
- **THEN** submission is disabled
- **AND** no validation message and no empty-state text is shown for the missing output variable
- **AND** the output-variables section presents the control that adds one

#### Scenario: A sql output variable requires its expression

- **WHEN** `sql` is the selected type and an output variable carries a name and a type but no expression
- **THEN** submission is disabled

#### Scenario: An llm evaluator is registered with no request template

- **WHEN** a full admin submits a valid `llm` evaluator through the modal
- **THEN** the registration request carries no `request_template` member
- **AND** the registration is not blocked by its absence

#### Scenario: The modal offers no optional-member editor and no JSON mode

- **WHEN** the modal renders for either type
- **THEN** no params editor, request-template field, input-variables editor, response-schema editor, or
  JSON toggle is present

### Requirement: A type change rebuilds the registration request rather than accumulating it

The request SHALL be **rebuilt from the selected type at submission** by `buildEvaluatorDto`
(`src/utils/analytics/evaluator-dto.ts`) rather than posted as the accumulated draft. That function already
deletes the six llm-only members for a `sql` draft and restates each output variable's expression under
`sql` for a `sql` evaluator and `jsonata` for an `llm` one. This is what keeps a type flipped mid-modal from
carrying a member the service answers 422 for.

While the modal is open the values already entered for the other type SHALL be kept on screen, so flipping
the type and flipping back does not silently discard what the operator typed. Correctness is therefore a
property of the request that is built, not of the draft that is held: the presentation withdraws the
forbidden controls, and the rebuild is what guarantees the wire.

#### Scenario: Flipping to sql drops the llm-only members from the request

- **WHEN** a preset and a model are entered as an `llm` evaluator, the type is then switched to `sql`, and a
  valid evaluator is submitted
- **THEN** the registration request carries neither `preset` nor `model`
- **AND** it carries no `params`, `request_template`, `input_vars`, or `response_schema`

#### Scenario: Flipping the type back restores what was typed

- **WHEN** the type is switched from `llm` to `sql` and back to `llm`
- **THEN** the model that was entered before the switch is still presented in the modal

#### Scenario: A sql output variable's expression is posted as a sql expression

- **WHEN** an output variable's expression is entered while `llm` is selected, the type is switched to
  `sql`, and the evaluator is submitted
- **THEN** that variable carries its expression under `sql` in the request
- **AND** it carries no `jsonata` member

### Requirement: An evaluator's name is validated for format and for uniqueness against the listing, inline

The service constrains an evaluator name to `@NotBlank` and nothing more, and no surface renames an
evaluator, so this modal is the only place the console can ever constrain it.

**Format.** The name SHALL match `/^[a-z][a-z0-9_-]{0,63}$/` — the pattern the console already applies to
the sibling registry name (`isValidPipelineName`), itself a console convention rather than a mirror of a
service constraint. Because nothing renames an evaluator, no already-registered name is retro-invalidated,
and no name already on the listing SHALL be re-validated against this pattern.

**Uniqueness.** It SHALL be decided **client-side, before the request**, against the names the listing
already holds. `EvaluatorService.register` reads a name that already exists as *append
`latest_version + 1`* and answers `201`, so a duplicate typed here would silently add a version to an
evaluator somebody else owns and be reported as a success. No request SHALL be issued to the analytics
service to decide uniqueness, and none SHALL be sent while the name duplicates one on the listing.
Comparison and submission SHALL both use the trimmed value.

**Reporting.** A format violation and a duplicate SHALL both be reported **inline on the name field** and
SHALL disable submission. Neither SHALL be reported as a notification — a duplicate name surfacing as a
backend notification instead of inline validation in a create modal was filed twice as a bug (#3551,
#3580). A **blank** name SHALL NOT be reported as an inline error: emptiness is carried by the field's
required marker and the disabled submit, matching `getAnalyticsIdentifierError`, the sibling validator for
an analytics identifier.

The decision SHALL be a pure function of the entered value and the names already on the listing, so it is
decidable and testable without a server round trip.

#### Scenario: A name that does not match the pattern is reported inline

- **WHEN** a name that does not match the pattern is entered — an uppercase letter, a leading digit, a
  space, or more than 64 characters
- **THEN** the name field carries an inline error stating the format
- **AND** submission is disabled and no notification is shown

#### Scenario: A name already on the listing is reported inline and sends no request

- **WHEN** a name equal to one already on the listing is entered
- **THEN** the name field carries an inline error stating that the name is already registered
- **AND** submission is disabled and no registration request is sent

#### Scenario: A blank name is not reported as an inline error

- **WHEN** the name field is empty
- **THEN** no inline error is shown on it
- **AND** submission is disabled

#### Scenario: Correcting the name clears the inline error

- **WHEN** an invalid or duplicate name is corrected to a valid, unused one
- **THEN** the inline error is gone
- **AND** submission is offered once the rest of the shape is valid

### Requirement: A successful registration reports which of the two happened and refreshes the listing without a per-row request

**Where the operator ends up.** On success the modal SHALL close and the operator SHALL stay on the
listing. The competing rule *Saving creates the next version after the latest, not after the version
shown* — "a successful registration SHALL report success and open the created version" — governs the detail
page, where the operator was already looking at a version; it is not the listing's rule.

**What the success message says.** Success SHALL be reported by notification, and the message SHALL be told
apart by the `version` the response carries: `1` means a new evaluator was created; any other number means
the request appended a version to an evaluator that already existed, and the message SHALL say so and name
the version. This is the only signal available for the residual race the client-side uniqueness check
cannot close — a name registered elsewhere since the page loaded — because the service answers `201`
either way. Where the response carries no version the console SHALL report success **without naming a
version** rather than guessing one, as *Saving creates the next version after the latest* already requires
of an unknown version number.

**How the listing is refreshed.** The created evaluator SHALL appear in the grid with a **real used-by count
of 0**, never as unknown. The count is joined on the server in `src/app/[lang]/evaluators/page.tsx` from a
single pipelines fetch, `getEvaluators()` carries no `usedBy`, and *The used-by count is derived from one
pipelines listing and never guesses zero* forbids the grid from issuing a per-row request. The refresh
SHALL therefore re-run the page's server component, keeping the join where that requirement puts it. A
client-side re-read of the evaluators listing alone SHALL NOT be used — it would leave the new row's count
unknown — and no per-row request SHALL be issued for any evaluator.

**A rejection.** A registration the service rejects SHALL surface the service's own error as an error
notification, carrying its message and its request id where the response provides them, and SHALL leave the
modal open with the entered values intact so the operator can correct and resubmit.

#### Scenario: A created evaluator is reported as created and the modal closes

- **WHEN** a registration succeeds and the response carries version 1
- **THEN** a success notification states that the evaluator was created
- **AND** the modal closes and the listing is still the page shown

#### Scenario: The refreshed listing reports the created evaluator's used-by count as a real zero

- **WHEN** a registration succeeds and no pipeline references the created evaluator
- **THEN** the created evaluator is present in the grid with a used-by count of 0 rather than unknown
- **AND** no per-row request is issued for any evaluator

#### Scenario: A version other than 1 is reported as a version appended to an existing evaluator

- **WHEN** a registration succeeds and the response carries a version other than 1
- **THEN** the notification states that a version was appended to an evaluator that already existed and
  names that version
- **AND** it does not report a plain creation

#### Scenario: A response carrying no version is not guessed

- **WHEN** a registration succeeds and the response carries no version
- **THEN** the notification reports success without naming a version

#### Scenario: A rejected registration keeps the modal open and shows the service's error

- **WHEN** the service rejects the registration
- **THEN** the service's own error message is shown as an error notification
- **AND** the modal stays open with the entered values still present
