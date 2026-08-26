## ADDED Requirements

### Requirement: Try Out is available on the case row, not on nested turns

On the Test Suites Test Cases grid, the Try Out (green play) control SHALL appear only on a row that represents the whole test case: a `GROUP` row or a `SINGLE` row. A nested `TURN` row under an expanded group SHALL NOT show Try Out, because execution always runs every turn of the case in sequence.

When column search flattens multi-turn groups into bare `TURN` rows (`isFlattened`), Try Out SHALL appear only on the first turn of each case (`turnNumber === 1`), so the case remains runnable without repeating the control on every turn.

#### Scenario: Nested turn rows hide Try Out

- **WHEN** a multi-turn test case is expanded
- **THEN** the `GROUP` row shows Try Out and each nested `TURN` row does not

#### Scenario: Single-turn rows keep Try Out

- **WHEN** a single-turn test case is displayed
- **THEN** its `SINGLE` row shows Try Out

#### Scenario: Flattened search keeps one Try Out per case

- **WHEN** a column filter flattens a three-turn case into turn rows
- **THEN** only the first turn row of that case shows Try Out

### Requirement: Multi-turn Try Out results show per-turn history

When a test-case Try Out response includes a non-empty `history` array (genuine multi-turn sequence, N>1 turns executed), the Try Out Response tab SHALL present the envelope status (and Grafana link when present) and then one section per history entry in order, each labeled as that turn and showing that entry’s resolved request and response. The duplicated top-level request/response pair SHALL NOT also be rendered when history is shown.

When `history` is absent (single-turn or collapsed multi-turn), the Response tab SHALL keep the existing single request/response presentation.

#### Scenario: History present shows each turn

- **WHEN** Try Out returns two history entries
- **THEN** the result panel shows Turn 1 and Turn 2 request/response sections and does not duplicate a separate top-level request/response pair outside those turns

#### Scenario: History absent keeps the single pair

- **WHEN** Try Out returns no history
- **THEN** the result panel shows one request section and one response section as before

### Requirement: Multi-turn Try Out Request shows Dynamic configuration per turn

When a test-case Try Out Request preview is opened for a case with `multiTurnData` of length greater than 1, the preview SHALL show one Dynamic configuration section per turn in order, each labeled as that turn, with template-variable values resolved for that turn (shared fields from `data`, per-turn fields from that turn's `multiTurnData` entry, using the suite's input bindings).

When the case is single-turn (`multiTurnData` absent or length ≤ 1), the Request preview SHALL keep a single Dynamic configuration section.

#### Scenario: Multi-turn Request shows one Dynamic configuration per turn

- **WHEN** Try Out is opened for a three-turn test case
- **THEN** the Request preview shows Turn 1, Turn 2, and Turn 3 Dynamic configuration sections with that turn's resolved values

#### Scenario: Single-turn Request keeps one Dynamic configuration

- **WHEN** Try Out is opened for a single-turn test case
- **THEN** the Request preview shows one Dynamic configuration section and no turn labels

## MODIFIED Requirements

### Requirement: Schema field values respect their scope

A multi-turn case's cells SHALL read their value from the side of the split that matches the field's current scope: a per-turn column from that turn's own entry in `multiTurnData`, a shared column from the case's `data`. A value stored on the other side SHALL NOT be displayed — a field whose scope was changed after its value was saved therefore renders empty until a value is entered under the new scope. The stored value SHALL NOT be moved, copied, or deleted to make this so, which makes changing a scope reversible: toggling it back displays the original value again.

#### Scenario: A per-turn column previews all turns when collapsed

- **WHEN** a three-turn case is collapsed
- **THEN** each per-turn column shows three stacked values in turn order, with an em dash for an empty turn value

#### Scenario: The stacked preview clears when expanded

- **WHEN** that group is expanded
- **THEN** the `GROUP` row's per-turn cells show an em dash placeholder, because the turn rows below now show each value

#### Scenario: A shared field is edited once

- **WHEN** a shared field is edited on a `GROUP` row
- **THEN** the value is applied to every turn of the case, and the case's `TURN` rows show that column blank
