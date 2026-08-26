## ADDED Requirements

### Requirement: Enrichment rule detail route and access guard

The system SHALL expose a rule detail page at `/enrichment-rules/{id}`, with the route directory
`src/app/[lang]/enrichment-rules/[id]/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'` that calls `isAnalyticsForbidden()` before any data access and
renders `Page403` when it returns `true`.

The page SHALL read the rule by id on the server. Unlike the listing — where an empty or failed result is
an ordinary state worth rendering — a detail page addressed by id has nothing to show when that id does not
resolve, so a `null` result SHALL produce a not-found result.

The route SHALL be registered in the breadcrumb configuration so the trail reads from the Enrichment rules
listing to the rule. The listing grid SHALL render the rule name as plain text: the name is a value an
operator reads and compares across rows, and turning every one of them into a link makes the column harder
to scan for the sake of a navigation affordance the page does not yet commit to.

#### Scenario: A permitted caller opens a rule

- **WHEN** `isAnalyticsForbidden()` returns `false` and `/enrichment-rules/{id}` is requested for a
  registered rule
- **THEN** the rule is read on the server and the detail view renders seeded with it

#### Scenario: An unknown id is not found

- **WHEN** the rule read resolves to no rule
- **THEN** the page resolves to a not-found result

#### Scenario: Forbidden caller sees Page403 and no rule is fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/enrichment-rules/{id}` is requested
- **THEN** `Page403` is rendered
- **AND** no rule request is issued

#### Scenario: The listing renders the rule name as plain text

- **WHEN** the rules listing renders a rule
- **THEN** its name is presented as text rather than as a link

### Requirement: The rule detail page presents every editable member

The create modal deliberately collects only what a rule needs to exist. The detail page SHALL present
**every** editable member of a rule, so that a rule registered through the API can be inspected and
corrected in the console: `name`, `evaluator_name`, `evaluator_version`, `target_enrichment`,
`trigger_kind` and the members its branch admits, `source`, `filter_sql`, `sampling`, `input_bindings`,
`output_bindings`, `cadence`, `batch_scan_limit`, `batch_chunk`, `rate_rpm`, `priority`, and `enabled`.

Members SHALL be grouped so an operator can find one without reading the whole form. Controls that the
create modal already provides SHALL be the same controls here, differing only in width and layout.

#### Scenario: A member set only through the API is visible

- **WHEN** a rule carrying `filter_sql` and `input_bindings` — neither of which the create modal
  collects — is opened
- **THEN** both are presented with their current values

#### Scenario: The trigger branch follows the selected kind

- **WHEN** the trigger kind is changed
- **THEN** only the members that kind admits are presented
- **AND** the members belonging to the previous kind are no longer presented

### Requirement: Read-only rule facts are presented separately from editable ones

A rule carries members the service derives and the API refuses to accept: `id`, `grain_key`,
`version_column`, `generation`, `created_at`, `updated_at`, and the resolved `evaluator` definition. The
detail page SHALL present these as read-only, visually separated from the editable form, so it is
unambiguous which values an operator can change. `version_column` SHALL render as an em dash when the
read source declares no scan metadata.

These members SHALL NOT be sent when the rule is saved.

#### Scenario: Derived facts are shown but not editable

- **WHEN** a rule is opened
- **THEN** its `grain_key`, `generation`, `created_at`, `updated_at`, and resolved evaluator are presented
  as read-only values

#### Scenario: An absent version column reads as an em dash

- **WHEN** the rule's read source declares no scan metadata
- **THEN** `version_column` renders as an em dash rather than as blank

### Requirement: Saving replaces the rule whole without discarding unpresented members

`PUT /v1/rules/{id}` is a full replace: an omitted member is erased. The detail page SHALL therefore save
by sending a complete rule, and a member the form does not present SHALL be preserved rather than dropped.
An operator who edits a rule's name MUST NOT thereby delete a member the console never showed them.

The trigger branch is the exception and SHALL be **constructed** from the selected kind rather than carried
over, because the service rejects a member that does not belong to the selected kind with HTTP 422 rather
than ignoring it. Changing the trigger kind SHALL drop the previous kind's members from the request.

A successful save SHALL report success and re-read the rule, so the read-only facts — `generation` in
particular — reflect the accepted mutation. A failed save SHALL surface the service's own message and leave
the edited values intact.

#### Scenario: An unpresented member survives an unrelated edit

- **WHEN** a rule carrying a member the form does not present is opened, its name is changed, and it is saved
- **THEN** the request carries that member unchanged

#### Scenario: Switching trigger kind drops the previous branch

- **WHEN** a scheduled rule's trigger kind is changed to on-ingest and the rule is saved
- **THEN** the request carries no `trigger_cron`

#### Scenario: Read-only members are not sent

- **WHEN** a rule is saved
- **THEN** the request carries none of `id`, `grain_key`, `version_column`, `generation`, `created_at`,
  `updated_at`, or the resolved `evaluator`

#### Scenario: A successful save refreshes the derived facts

- **WHEN** a save succeeds
- **THEN** success is reported
- **AND** the rule is re-read so the presented `generation` and `updated_at` reflect the mutation

#### Scenario: A failed save keeps the edits

- **WHEN** a save is rejected
- **THEN** the service's message is surfaced
- **AND** the edited values remain in the form

### Requirement: A rule's read source either follows its target enrichment or is pinned

A rule may declare a `source`, or declare none and read from whatever its target enrichment's
`source_table` points at. **The service resolves the two into the same response shape**, so a rule that
follows is indistinguishable from one pinned to the same table.

Because the only way to express "follows" is to omit `source` from the request, saving forces a decision
whether or not the control is presented. The console SHALL therefore infer the state: a `source` equal to
the target enrichment's `source_table` SHALL be treated as following and omitted from the request; any
other value SHALL be treated as pinned and sent.

The inference SHALL be presented rather than applied invisibly — the control SHALL offer an explicit choice
between following the target enrichment and pinning a named table, seeded from the inference, so an
operator can see and correct it. When following is selected, the table currently being followed SHALL be
named.

#### Scenario: A following rule keeps following after an unrelated edit

- **WHEN** a rule whose `source` equals its target enrichment's `source_table` is opened, edited elsewhere,
  and saved
- **THEN** the request omits `source`

#### Scenario: A pinned rule stays pinned

- **WHEN** a rule whose `source` differs from its target enrichment's `source_table` is saved
- **THEN** the request carries that `source`

#### Scenario: The inference is visible and correctable

- **WHEN** a rule is opened
- **THEN** the read-source control shows whether it is following or pinned
- **AND** the followed table is named when following is shown
- **AND** the operator can switch between the two

### Requirement: Rule editing resolves the read source in addition to the evaluator and target

Input bindings read from the rule's **read source**, not from its target enrichment, and every SQL
predicate a rule admits is scoped to that source's columns. The read source is itself derived — it is the
rule's declared `source`, or the target enrichment's `source_table` — so it cannot be resolved until the
target is.

Rule editing SHALL therefore resolve three entities in a chain: the evaluator (for `input_vars`,
`output_vars`, and `type`), the target enrichment (for its columns, its `grain_key`, and its
`source_table`), and the read source (for its columns and its `version_column`). Controls scoped to the
read source SHALL report a pending state while it resolves and SHALL report a failed resolution rather
than presenting themselves as having no options.

#### Scenario: Input bindings offer the read source's columns

- **WHEN** the read source resolves
- **THEN** the input-bindings editor offers that source's columns, not the target enrichment's

#### Scenario: Changing the target re-resolves the followed source

- **WHEN** the rule follows its target enrichment and the target is changed
- **THEN** the read source is re-resolved from the new target's `source_table`

#### Scenario: A failed source resolution is reported

- **WHEN** reading the resolved source table fails
- **THEN** the failure is reported
- **AND** the controls scoped to that source do not present themselves as having no options

### Requirement: Unsaved rule edits are tracked and discardable

The detail page SHALL track whether the rule differs from the one it was loaded with, and SHALL offer save
and discard only while it does. Discarding SHALL restore the loaded rule and SHALL require confirmation,
because a discard is unrecoverable.

Comparison SHALL treat an absent member and a member explicitly set to `undefined` as equal, so clearing an
optional field and never having set it do not read as a difference.

#### Scenario: An unedited rule offers nothing to save

- **WHEN** a rule is opened and not edited
- **THEN** no save or discard action is offered

#### Scenario: Editing offers save and discard

- **WHEN** any editable member is changed
- **THEN** save and discard are offered

#### Scenario: Discard restores the loaded rule after confirmation

- **WHEN** discard is chosen and confirmed
- **THEN** every edited member returns to the value the rule was loaded with

#### Scenario: Editing back to the original value clears the edited state

- **WHEN** a member is changed and then changed back to its loaded value
- **THEN** save and discard are no longer offered

### Requirement: Saving a rule requires full-admin rights

Editing a rule is a mutation and SHALL be gated on the same right the console already requires to create
and delete one. A caller without full-admin rights SHALL be able to open and read a rule but SHALL NOT be
offered save. The gate SHALL be the same predicate the listing uses, so a caller sees a consistent set of
rights on both screens.

#### Scenario: A caller without full-admin rights cannot save

- **WHEN** a caller lacking full-admin rights opens a rule and changes a member
- **THEN** save is not offered

#### Scenario: The detail page and the listing agree

- **WHEN** a caller is not offered rule deletion on the listing
- **THEN** that same caller is not offered save on the detail page

### Requirement: Input bindings editor

An input binding maps one of the evaluator's `input_vars` to a value drawn from the read source, either as
a column or as a JSONata expression over the row. The two are alternatives: a binding SHALL carry a column
or an expression, never both.

The editor SHALL offer the evaluator's `input_vars` and the read source's columns, SHALL NOT offer a
variable already bound by another row, and SHALL report a row whose variable or column no longer exists on
the resolved evaluator or source — a rule can outlive the definitions it was written against. A row that is
incomplete SHALL be omitted from the saved rule rather than sent as a partial binding.

#### Scenario: A variable bound elsewhere is not offered again

- **WHEN** an input variable is already bound by one row
- **THEN** it is not offered in the other rows

#### Scenario: Column and expression are alternatives

- **WHEN** a row's binding is switched from a column to an expression
- **THEN** the column is cleared

#### Scenario: A stranded binding is reported

- **WHEN** a row binds a variable that the resolved evaluator no longer declares
- **THEN** that row is reported as unresolvable
- **AND** the stranded value remains visible rather than rendering as empty

#### Scenario: An incomplete row is not sent

- **WHEN** a row names a variable but neither a column nor an expression
- **THEN** the saved rule omits that binding

### Requirement: SQL predicate fields are presented as bounded expressions

A rule admits three SQL predicates — `filter_sql`, the readiness `signal` of a group rule, and the
`prefer_sql` of its member selection. Each is a boolean expression over the read source's columns, and none
admits a join, a subquery, or a CTE.

Each SHALL be presented as a multi-line expression input, in a monospaced face, captioned with the source
its columns come from. The console SHALL NOT attempt to validate the expression — the grammar is the
service's and a client-side approximation would reject valid predicates — so an invalid expression SHALL be
reported by surfacing the service's rejection on save.

#### Scenario: A predicate names its source

- **WHEN** a SQL predicate field is presented
- **THEN** it states which table its columns come from

#### Scenario: An invalid predicate is reported by the service

- **WHEN** a rule carrying an unparseable predicate is saved
- **THEN** the service's rejection message is surfaced
- **AND** the edited values remain in the form

### Requirement: Member selection for a group rule

A group rule may declare how members of a group are chosen: a `prefer_sql` preference, an `order_by`
sequence of column and direction, and a `limit`. `limit` is required whenever member selection is declared
at all, and SHALL be a positive integer no greater than the service's configured group fetch maximum.

`prefer_sql` is a **preference, not a filter**: when no member satisfies it, every member becomes a
candidate. The control SHALL say so, because an operator reading it as a filter would expect an empty
result instead.

Member selection SHALL be presentable only for a group rule, and SHALL be omitted entirely from the saved
rule when nothing has been declared.

#### Scenario: Declaring member selection requires a limit

- **WHEN** an order or preference is declared without a limit
- **THEN** the rule cannot be saved and the missing limit is reported

#### Scenario: Member selection is omitted when empty

- **WHEN** no member-selection member has been declared
- **THEN** the saved rule omits member selection entirely

#### Scenario: The preference is described as a preference

- **WHEN** the `prefer_sql` control is presented
- **THEN** it states that all members become candidates when none satisfies it

#### Scenario: Member selection is only offered for a group rule

- **WHEN** the trigger kind is not group
- **THEN** member selection is not presented

### Requirement: Execution knobs are presented without invented validation

A rule carries `sampling`, `cadence`, `batch_scan_limit`, `batch_chunk`, `rate_rpm`, and `priority`. The
service validates none of these beyond type, and the runner interprets `cadence`. The console SHALL present
them and SHALL NOT impose constraints the service does not, beyond `sampling` being a fraction between 0
and 1 — a bound that follows from its meaning rather than from a guessed policy.

An empty knob SHALL be omitted from the saved rule rather than sent as a zero, because zero is a meaningful
value for several of them.

#### Scenario: A cleared knob is omitted, not zeroed

- **WHEN** a numeric knob is cleared
- **THEN** the saved rule omits that member

#### Scenario: Sampling is bounded to a fraction

- **WHEN** a sampling value outside 0 to 1 is entered
- **THEN** it is reported as invalid and the rule cannot be saved

## MODIFIED Requirements

### Requirement: The modal resolves the evaluator and the target table on demand

Neither list response carries what the form needs: `GET /v1/evaluators` returns no version definitions, and
`GET /v1/tables` returns neither `grain` nor `columns`. Rule editing — in the create modal and on the detail
page alike — SHALL therefore read the full evaluator whenever the selected evaluator or its version changes
— the pinned version via `GET /v1/evaluators/{name}/versions/{version}`, "latest" via
`GET /v1/evaluators/{name}` — and the full target table via `GET /v1/tables/{name}` whenever the target
enrichment changes. Resolved values SHALL be cached by their key for as long as the surface is open, so
re-selecting a previously chosen evaluator, version, or table issues no second request.

Controls that depend on a resolution SHALL report a pending state while it is in flight rather than rendering
as empty, and a failed resolution SHALL be reported in the form rather than leaving a control silently
unpopulated.

#### Scenario: Selecting an evaluator resolves its variables

- **WHEN** the user selects an evaluator
- **THEN** its full definition is read and its `output_vars` become available to the output-bindings editor

#### Scenario: Pinning a version re-resolves

- **WHEN** the user changes the evaluator version from "latest" to a concrete version
- **THEN** that version is read and the available output variables are those of the pinned version

#### Scenario: Resolutions are cached

- **WHEN** the user selects a target enrichment, switches to another, and switches back
- **THEN** no second request is issued for the first table

#### Scenario: A failed resolution is reported

- **WHEN** reading the selected target table fails
- **THEN** the form reports the failure
- **AND** the controls that depend on that table do not present themselves as having no options

### Requirement: Target enrichments already bound to a rule are not offered

An enrichment table admits **at most one** rule — a UNIQUE constraint, because an enrichment is a
replacing-merge table whose rows are replaced whole by grain, so two rules writing different columns of the
same row would clobber one another. A second rule on the same target is rejected with HTTP 409.

The target-enrichment control SHALL therefore offer only enrichment tables that no existing rule already
targets, derived by excluding the rules listing's target enrichments from the enrichment tables. Learning
about the constraint from a 409 after filling in an entire form is a preventable failure.

When an existing rule is being edited, its **own** target SHALL remain on offer. That target is bound by the
rule doing the editing, so excluding it would strand the control on a value it does not list and make the
rule unsaveable without repointing it.

The 409 SHALL still be handled: the exclusion is computed from data that can be stale by the time the form is
submitted, so a rejection SHALL surface the service's message and leave the form open with its values intact.

#### Scenario: A bound enrichment is not offered as a target

- **WHEN** an enrichment table is already the target of a registered rule
- **THEN** it does not appear among the target-enrichment options

#### Scenario: An edited rule still offers its own target

- **WHEN** an existing rule is opened for editing
- **THEN** its current target enrichment is among the offered options

#### Scenario: Every enrichment is already bound

- **WHEN** every enrichment table already has a rule
- **THEN** the target-enrichment control offers no options and states why

#### Scenario: A racing 409 is surfaced without losing the form

- **WHEN** submission is rejected with HTTP 409 because another rule claimed the target first
- **THEN** the service's message is shown
- **AND** the modal stays open with the entered values intact
