## ADDED Requirements

### Requirement: An llm transform's call preset selects chat completions or an application route

For an `llm` transform the enrichment section SHALL present the transform's **preset** as a labelled
selection of two values: `chat_completion`, which calls the deployment's chat-completions endpoint, and
`dial_app_route`, which calls one of a DIAL application's custom routes. A transform that declares no preset
SHALL be presented as `chat_completion`, which is the service's default, and the console SHALL NOT write the
member into a declaration only because it was presented.

The members presented SHALL follow the preset:

- **`chat_completion`** — no route control is presented, and the request carries no `transform.route`. The
  service refuses a route on this preset.
- **`dial_app_route`** — a **route** control is presented beside the deployment, and the request carries
  `transform.route`.

For a `sql` transform neither the preset nor the route SHALL be presented or sent.

Changing the preset away from `dial_app_route`, or the type to `sql`, SHALL remove `transform.route` from the
request, so a declaration that was valid under one preset is not refused under the other for a member the
form no longer shows. The typed route SHALL be kept in the form for the session, so changing the preset back
restores it.

A preset value the console does not know SHALL be presented as the stored value and kept on save.

#### Scenario: A transform with no preset reads as chat completion

- **WHEN** an enrichment pipeline whose `llm` transform declares no preset is opened
- **THEN** the preset selection shows chat completion
- **AND** no route control is presented

#### Scenario: Choosing the route preset presents the route

- **WHEN** the author chooses the application-route preset
- **THEN** a route control is presented beside the deployment

#### Scenario: The route is sent only under the route preset

- **WHEN** the author enters a route under the application-route preset, changes the preset to chat
  completion, and saves
- **THEN** the request carries no `transform.route`

#### Scenario: A sql transform shows neither

- **WHEN** the transform's type is `sql`
- **THEN** neither a preset selection nor a route control is presented

### Requirement: An llm transform's deployment and route are picked from DIAL Core's listings

Under `dial_app_route` the deployment control SHALL suggest the DIAL Core applications the console can list,
and the route control SHALL suggest the paths of the routes declared on the application the deployment
control names. Both SHALL accept a typed value that matches no suggestion.

Under `chat_completion` the deployment control SHALL suggest the DIAL Core models and applications the
console can list, since either can serve chat completions, and SHALL accept a typed value that matches no
suggestion.

For a `sql` transform no listing SHALL be read.

A route that is present and breaks the service's path rule — segments of letters, digits and `._~-`
separated by single `/`, no leading or trailing `/`, no `.` or `..` segment, at most 256 characters — SHALL
be marked invalid on the field with the rule stated. It SHALL NOT block the save: a disabled declaration is
stored as written and the service states the same rule at enable. A blank route SHALL NOT be marked.

When a listing cannot be read, the controls SHALL remain usable as free-text fields and no error SHALL be
reported for the missing suggestions.

#### Scenario: Routes follow the chosen application

- **WHEN** the author picks an application that declares two route paths under the route preset
- **THEN** the route control suggests those two paths

#### Scenario: A typed value outside the suggestions is kept

- **WHEN** the author types a deployment that matches no listed application
- **THEN** the field holds the typed value and the pipeline can be saved

#### Scenario: A malformed route is marked without blocking the save

- **WHEN** the author enters a route that begins with `/`
- **THEN** the route field states the path rule
- **AND** the save is still offered

#### Scenario: The chat-completion deployment suggests models and applications

- **WHEN** the preset is chat completion and the deployment control is opened
- **THEN** it suggests the listed models and the listed applications

#### Scenario: A typed model outside the suggestions is kept

- **WHEN** the author types a deployment that matches no listed model or application under chat completion
- **THEN** the field holds the typed value and the pipeline can be saved

#### Scenario: A sql transform reads no listing

- **WHEN** the transform's type is `sql`
- **THEN** no request is made for the models or the applications

### Requirement: A route output reads its value through a source

Under `dial_app_route` an output's transform refinement SHALL be **`source`** — a JSONata expression over
the route's response body — presented in the place the `jsonata` refinement holds under `chat_completion`.
The refinement selection SHALL keep its two choices, the transform and the value list, and under the route
preset the transform choice SHALL be labelled as the source and SHALL write `source`, never `jsonata`: the
service refuses `jsonata` on a route output and `source` on a chat-completion output.

An output with no source reads the response member of its own name, so an empty source field SHALL send no
`source` member.

A source that repeats the output's own name is the **identity** expression, which the service refuses. It
SHALL be handled as the identity `jsonata` is: dropped on read, and marked invalid on the row when typed,
without blocking the save.

Changing the preset SHALL NOT carry an expression across: what was typed as `jsonata` SHALL NOT be sent as
`source`, nor the reverse. Each SHALL be kept on the row for the session, so changing the preset back
restores it.

#### Scenario: The transform refinement writes source under the route preset

- **WHEN** the author enters an expression in an output's transform field under the route preset and saves
- **THEN** that output is sent with `source` holding the expression
- **AND** it is sent with no `jsonata`

#### Scenario: An empty source sends nothing

- **WHEN** an output's source field is empty under the route preset
- **THEN** that output is sent with no `source` member

#### Scenario: An identity source is marked

- **WHEN** the author types an output's own name as its source
- **THEN** the row is marked invalid
- **AND** the save is still offered

#### Scenario: A jsonata expression does not become a source

- **WHEN** an output carries a `jsonata` expression under chat completion and the author changes the preset
  to the application route and saves
- **THEN** that output is sent with neither `jsonata` nor `source`

### Requirement: A placeholder carrying the json suffix is read as a use of its name

The request template accepts a placeholder in two forms: `{{name}}`, which renders the value as an escaped
string, and `{{name:json}}`, which renders it as a JSON literal. The console SHALL read both as a use of
`name` wherever it reads the template's placeholders: the row-grain correspondence between placeholders and
inputs, and the group-grain check that the template references `{{members}}`.

The reference listed beside the template SHALL state that the `:json` form exists and what it renders.

A template using the `:json` form in value position is not valid JSON; it SHALL be presented as text and stay
editable, as any template that does not parse is.

#### Scenario: A json placeholder covers its input

- **WHEN** a row-grain pipeline's template references `{{payload:json}}` and an input named `payload` is
  declared
- **THEN** the placeholder is listed once, as `payload`, and marked as covered
- **AND** the input is not marked as unused

#### Scenario: A json members placeholder satisfies the group rule

- **WHEN** a group-triggered pipeline's template references `{{members:json}}` and no `{{members}}`
- **THEN** no error is reported against the request template

#### Scenario: The suffix is documented beside the template

- **WHEN** an enrichment pipeline's template is presented
- **THEN** the reference beside it names the `:json` form

### Requirement: A route pair the instance does not allow is stated before enable

The service enables a `dial_app_route` pipeline only when its `(deployment, route)` pair is on the instance
allowlist specified by `analytics/app-routes`. Where the preset is `dial_app_route` and both the deployment
and the route are entered, the console SHALL compare the pair, exactly and case-sensitively, with the
allowlist it can read, and SHALL state beside the route that the pair is not allowed when it is absent. The
statement SHALL name the Enrichment routes tab and link to the System Properties page.

The statement is guidance, not a gate: it SHALL NOT block the save or the enable control, because the service
judges the pair at enable and a disabled declaration is stored as written. It SHALL be announced to assistive
technology as a status rather than as an error.

An allowlist the service reports as not stored allows no route, so every entered pair SHALL be stated as not
allowed.

An author whose read of the allowlist is refused or fails SHALL be shown no statement and no error for it:
that author meets the service's own refusal at enable, reported as any other action failure is.

The allowlist SHALL be read only once the preset is `dial_app_route`; a pipeline that never uses the preset
SHALL cause no allowlist request.

#### Scenario: An unlisted pair is stated

- **WHEN** the author enters a deployment and a route that the allowlist does not hold
- **THEN** text beside the route states that the pair is not allowed and names the Enrichment routes tab
- **AND** the save and the enable control are still offered

#### Scenario: A listed pair shows nothing

- **WHEN** the entered pair is on the allowlist
- **THEN** no statement is shown

#### Scenario: No stored allowlist states every pair

- **WHEN** the service answers that no allowlist is stored and the author enters a pair
- **THEN** the pair is stated as not allowed

#### Scenario: An author who cannot read the allowlist sees no statement

- **WHEN** the read of the allowlist is refused
- **THEN** no statement and no error notification is shown

#### Scenario: Enabling an unlisted pair reports the service's refusal

- **WHEN** a pipeline whose pair is not allowed is enabled and the service refuses it
- **THEN** the service's own message is reported
- **AND** the pipeline is still presented as saved and disabled

#### Scenario: A chat-completion pipeline reads no allowlist

- **WHEN** an enrichment pipeline whose preset is chat completion is opened
- **THEN** no request is made for the allowlist
