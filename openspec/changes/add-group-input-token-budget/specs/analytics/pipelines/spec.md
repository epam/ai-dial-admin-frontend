## MODIFIED Requirements

### Requirement: An enrichment pipeline's execution knobs are grouped under Advanced

An enrichment pipeline carries four execution knobs the runner applies to every trigger kind: how many rows
one scan may claim, how many rows it evaluates per call, a per-minute model-call ceiling, and the fraction of
eligible rows to evaluate. A `group` pipeline carries a fifth: the **input token budget**, the ceiling the
runner trims a group's members to before the model call. They are hints to the runner rather than part of the
transform, so the console SHALL present them together in one collapsible **Advanced** block placed last in the
section, after the members that describe what the pipeline does.

An empty knob SHALL be omitted from the saved pipeline rather than sent as a zero: an omitted knob means
the runner's own configured default, which a zero does not.

The sample fraction SHALL be validated by the console as strictly greater than zero and at most one.
Zero is refused by the service, which names disabling the pipeline as the way to express evaluating
nothing, and a value above one is refused rather than read as a percentage.

The input token budget SHALL be validated by the console as a whole number of zero or more; the service
refuses a negative value. Zero is a value, not an empty knob: it turns the runner's trimming off for this
pipeline, and the console SHALL send it. The field SHALL say that an empty value means the runner's default
and zero means no trimming.

The service accepts the input token budget only on a `group` pipeline and refuses it on a `schedule`
pipeline with HTTP 422 on every write, a disabled draft included. The console SHALL therefore present it only
while the trigger kind is `group`, and SHALL omit `advanced.input_token_budget` from the request whenever the
trigger kind is anything else — hiding the control is not sufficient, because a value entered before the
trigger kind was changed would otherwise still be submitted.

The other knobs the console SHALL present without imposing constraints the service does not.

How often the pipeline scans is not one of them. It is the trigger's cron, and the service refuses
`advanced.scan_every` with HTTP 400 naming the member, so the console SHALL neither present nor send it.

These members belong to the enrichment kind and SHALL NOT be presented for an aggregate pipeline.

#### Scenario: The knobs are grouped and placed last

- **WHEN** an enrichment pipeline is opened
- **THEN** its knobs are presented together in a collapsible block at the end of the section

#### Scenario: No scan cadence is presented or sent

- **WHEN** an enrichment pipeline is opened and saved
- **THEN** no scan-cadence control is presented in the Advanced block
- **AND** the request carries no `advanced.scan_every`

#### Scenario: A cleared knob is omitted, not zeroed

- **WHEN** a numeric knob is cleared
- **THEN** the saved pipeline omits that member

#### Scenario: A sample fraction of zero is refused

- **WHEN** zero is entered as the sample fraction
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: A sample fraction above one is refused

- **WHEN** a value above one is entered as the sample fraction
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: The input token budget is presented only for a group trigger

- **WHEN** an enrichment pipeline's trigger kind is `group`
- **THEN** the Advanced block presents the input token budget
- **AND** when the trigger kind is `schedule` or unset, it does not

#### Scenario: A zero input token budget is sent

- **WHEN** zero is entered as the input token budget of a `group` pipeline and the pipeline is saved
- **THEN** the request carries `advanced.input_token_budget` equal to `0`

#### Scenario: A cleared input token budget is omitted

- **WHEN** the input token budget of a `group` pipeline is cleared and the pipeline is saved
- **THEN** the request carries no `advanced.input_token_budget`

#### Scenario: A negative or fractional input token budget is refused

- **WHEN** a negative or a fractional value is entered as the input token budget
- **THEN** it is reported as invalid and the pipeline cannot be saved, or the field does not accept it

#### Scenario: Switching away from group drops the input token budget

- **WHEN** the user enters an input token budget, then switches the trigger kind to `schedule`, then saves
- **THEN** the request carries no `advanced.input_token_budget`
- **AND** the request carries no `advanced` member at all when no other knob is set

#### Scenario: An aggregate pipeline presents no execution knobs

- **WHEN** an aggregate pipeline is opened
- **THEN** none of these knobs is presented
