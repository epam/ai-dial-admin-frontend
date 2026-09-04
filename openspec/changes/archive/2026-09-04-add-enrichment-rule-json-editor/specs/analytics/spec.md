## ADDED Requirements

### Requirement: The rule detail page can be edited as JSON instead of as fields

The rule detail page SHALL offer a JSON editor as an alternative to its fields: a toggle in the identity
row, and the rule as one JSON document in place of everything below that row.

The editor and the fields SHALL edit **one** draft. Enabling the editor SHALL seed it from the rule on
screen, and what the document holds at submission SHALL be what is submitted.

Submitting SHALL go through the same path either way — the same control and the same request — so the
same document produces the same request no matter which way it was submitted. The editor SHALL NOT
introduce a second write path.

The toggle SHALL be offered to every caller, and the document SHALL be read-only for a caller who may not
save, matching the gating the fields already apply. Reading a rule as JSON is useful without the rights to
change it, and it is the only way to read the members no control presents.

#### Scenario: Enabling the editor replaces the fields with JSON

- **WHEN** the caller enables the JSON editor
- **THEN** the rule is presented as one block of JSON
- **AND** the fields are no longer presented
- **AND** the rule name remains

#### Scenario: The document is seeded from the rule on screen

- **WHEN** the caller enables the JSON editor
- **THEN** the document holds that rule's values

#### Scenario: A caller who may not save may still read the JSON

- **WHEN** a caller without saving rights enables the JSON editor
- **THEN** the document is presented
- **AND** it cannot be edited

#### Scenario: A member no control presents is readable and changeable

- **WHEN** a rule carrying a member the fields do not present is opened as JSON, that member is changed,
  and the rule is saved
- **THEN** the request carries the changed value

### Requirement: The document is the request, not the form's working state

The document SHALL present the rule as it will be sent, not the form's intermediate state. Because the
save is a full replace, the request body and the rule are the same thing, and showing anything else would
mean the caller edits one document and the console sends another.

Two consequences SHALL be accepted rather than hidden. A rule that follows its target enrichment SHALL
appear without `source`, since omitting it is how following is expressed. Members left empty SHALL be
absent rather than present and blank. Both are visible on entering the editor.

Entering the editor SHALL seed the document from the rule as the fields currently hold it, and the
document SHALL then be the caller's to edit: the console SHALL NOT rewrite it while they type. Re-deriving
it on every accepted keystroke would replace the buffer with a re-normalized request under the cursor,
which among other things makes a trailing space impossible to type. The document SHALL be re-seeded only
when the rule underneath it is replaced — a discard, or a save that re-reads it.

#### Scenario: A rule that follows its target shows no source

- **WHEN** a rule that follows its target enrichment is opened as JSON
- **THEN** the document carries no `source`

#### Scenario: The document is not rewritten while the caller types

- **WHEN** the caller edits the document so that it still parses
- **THEN** the text stays exactly as they typed it, trailing spaces and all
- **AND** their cursor position and undo history are preserved

#### Scenario: Discarding re-seeds the document from the stored rule

- **WHEN** the caller discards while the editor is open
- **THEN** the document holds the rule as stored

### Requirement: The editor takes the whole view, and an unsaved change closes the way out

While the JSON editor is open, the page SHALL present the document and nothing else below the identity
row: the read-only facts, the fields, the status badge, and the enable/disable action SHALL all be
withdrawn. A caller who wants any of them SHALL leave the editor to reach it.

Once the draft differs from the rule on screen, the toggle SHALL NOT be offered either: the identity row
offers Discard and Save in its place. Leaving the editor is therefore discarding or saving, not toggling
back, which is what keeps a pending change from being parked behind a presentation the caller switched
away from.

Because the enable/disable action is absent in this mode, it needs no new guard. Its existing refusal
while edits are pending SHALL be unchanged.

Discarding SHALL restore the rule as stored and SHALL bring the toggle back.

#### Scenario: The rest of the page is withdrawn while the editor is open

- **WHEN** the caller enables the JSON editor
- **THEN** the read-only facts are no longer presented
- **AND** the enable/disable action is no longer offered

#### Scenario: Editing the document withdraws the toggle

- **WHEN** the caller edits the document so that it differs from the rule on screen
- **THEN** the toggle is no longer offered
- **AND** Discard and Save are offered instead

#### Scenario: Discarding restores the stored rule and the toggle

- **WHEN** the caller discards while the JSON editor is open
- **THEN** the document holds the rule as stored
- **AND** the toggle is offered again

### Requirement: Removing a member from the document erases it from the rule

`PUT /v1/rules/{id}` replaces the rule whole: the service applies every member of the request
unconditionally, so a member the request omits is set to nothing rather than left alone. The editor
therefore makes erasure a single keystroke, and this SHALL be treated as the meaning of the document
rather than as a mistake to intercept.

The console SHALL NOT prompt before a save that drops a member, and SHALL NOT present a comparison
against the stored rule. The operator is editing the request body and the page presents it as exactly
that; a guard here would be a check the fields themselves do not perform, and would put this editor out
of step with every other one in the console.

The sharpest case SHALL be understood as specified behaviour: deleting `evaluator_version` unpins the rule
from its pinned evaluator version and it resumes following the latest, with no error, because the service
accepts that request. Required members are the exception — the service rejects a request omitting one, and
that refusal surfaces as any other does.

#### Scenario: A member deleted from the document is erased from the rule

- **WHEN** the caller deletes an optional member from the document and saves
- **THEN** the saved rule no longer carries that member
- **AND** no confirmation was presented before the save

#### Scenario: Deleting the pinned evaluator version unpins the rule

- **WHEN** the caller deletes `evaluator_version` from the document and saves
- **THEN** the save succeeds
- **AND** the rule no longer pins an evaluator version

#### Scenario: Omitting a required member is refused by the service

- **WHEN** the caller deletes a member the service requires and saves
- **THEN** the service's own message is reported
- **AND** the rule is unchanged

### Requirement: JSON that does not parse blocks the save and reports where

While the JSON editor is open, the form's own checks — including the check that no other rule already
targets this enrichment — SHALL NOT block the save. The one exception is the grouping key: `group_by` is
rebuilt from the resolved target rather than carried from the document, so saving a group rule before that
resolves would send no grouping key and the full replace would erase it. That check SHALL keep applying in
both presentations. The document is the input, and a document those
controls could not have produced is not thereby wrong; the service's refusal is what surfaces instead.

JSON that does not parse SHALL block the save, and each parse error SHALL be reported with the line it
occurred on. The Save control SHALL remain enabled and refuse on use rather than being disabled — a
caller who has broken the document is better served by being told where than by a control that has gone
quiet.

Text that does not parse reaches no draft, so the controls SHALL be offered on the strength of the parse
failure itself and not only on a difference from the stored rule. Otherwise a caller whose **first** edit
breaks the document is offered neither a Save to be told what is wrong nor a Discard to back out of it.
The controls SHALL withdraw again once the document parses.

#### Scenario: Unparseable JSON is reported per line and nothing is saved

- **WHEN** the caller saves a document that does not parse
- **THEN** each parse error is reported with its line number
- **AND** the rule is unchanged

#### Scenario: Breaking the document before changing anything still offers a way out

- **WHEN** the caller's first edit to the document leaves it unparseable
- **THEN** Discard and Save are offered
- **AND** the Save control is offered as enabled

#### Scenario: A group rule cannot be saved before its grain key resolves

- **WHEN** a group rule's target has not resolved, so the grain key is not yet known
- **THEN** saving is refused by the console rather than sending a request without the grouping key

#### Scenario: A target another rule already uses is refused by the service

- **WHEN** the caller sets `target_enrichment` to one another rule already binds and saves
- **THEN** the save is not blocked by the console
- **AND** the service's own message is reported

#### Scenario: A value of the wrong type does not break the page

- **WHEN** the caller sets a member to a value of a type the service does not accept, such as a name
  holding a number
- **THEN** the page continues to present the document and the controls
- **AND** saving reports the service's refusal rather than failing in the console
