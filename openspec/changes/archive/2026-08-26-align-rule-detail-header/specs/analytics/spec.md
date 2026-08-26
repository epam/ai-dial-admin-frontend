## ADDED Requirements

### Requirement: The rule detail header states the rule's status before its name

The rule detail header SHALL be composed the way the console's other entity headers are: the enabled-state
badge on its own line **above** the rule name, both aligned to the leading edge, and the header's actions on
the name's row at the trailing edge. Status is the first question a rule answers — an operator arriving from
the listing is asking whether this rule is running at all — and a badge trailing the opposite edge of the
header is read last, after the name and after the actions.

The enable/disable control SHALL carry the appearance its consequence warrants. While the rule is enabled the
control reads "Disable rule" and SHALL be rendered as an outlined danger button, the same treatment the
console gives Delete; while the rule is disabled it reads "Enable rule" and SHALL be rendered as a primary
button. The control SHALL carry no icon: the trash glyph that accompanies Delete would misstate a reversible
switch as a removal, and no other glyph distinguishes the two directions better than the label already does.

The control SHALL be offered only to a full admin, SHALL confirm before it applies, and SHALL be withheld
while the rule has unsaved edits — stating why, since toggling re-reads the rule and would discard them.

#### Scenario: An enabled rule leads with its status

- **WHEN** an enabled rule is opened
- **THEN** its enabled badge is presented above the rule name at the header's leading edge
- **AND** the control offering to disable it is presented as a danger action

#### Scenario: A disabled rule offers enabling as the primary action

- **WHEN** a disabled rule is opened
- **THEN** its disabled badge is presented above the rule name at the header's leading edge
- **AND** the control offering to enable it is presented as the primary action

#### Scenario: Pending edits withhold the toggle

- **WHEN** the rule has unsaved edits
- **THEN** the enable/disable control is not actionable
- **AND** the reason is stated rather than left to be guessed

## MODIFIED Requirements

### Requirement: Read-only rule facts are presented separately from editable ones

A rule carries members the service derives and the API refuses to accept: `id`, `grain_key`,
`version_column`, `generation`, `created_at`, `updated_at`, and the resolved `evaluator` definition. The
detail page SHALL present these as read-only, visually separated from the editable form, so it is
unambiguous which values an operator can change. `version_column` SHALL render as an em dash when the
read source declares no scan metadata.

The `id` SHALL be presented among these facts, labelled, rather than as unlabelled small print beneath the
rule name. It is a derived read-only fact like the others, and the header position gave it no label while
spending the most prominent line of the page on a value an operator reads only to quote it elsewhere. Because
quoting it is the only thing an operator does with it, it SHALL carry a copy control.

These members SHALL NOT be sent when the rule is saved.

#### Scenario: Derived facts are shown but not editable

- **WHEN** a rule is opened
- **THEN** its `grain_key`, `generation`, `created_at`, `updated_at`, and resolved evaluator are presented
  as read-only values

#### Scenario: An absent version column reads as an em dash

- **WHEN** the rule's read source declares no scan metadata
- **THEN** `version_column` renders as an em dash rather than as blank

#### Scenario: The rule id is read and copied from the facts

- **WHEN** a rule is opened
- **THEN** its `id` is presented as a labelled read-only fact alongside the others
- **AND** a control is offered that copies the id
