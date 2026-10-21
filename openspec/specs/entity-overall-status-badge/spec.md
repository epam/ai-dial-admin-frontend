# entity-overall-status-badge Specification

## Purpose

Defines the overall status badge shown above the id in an entity's detail header, driven by the
`status` and `validationWarnings` DIAL Core reports in `_metadata`, and the generic status badge it is
built on — a variant-driven pill that future statuses (for example run statuses) extend by adding
variants. Created by archiving change `add-entity-overall-status-badge`.

## Requirements

### Requirement: Overall status badge in the entity header
The system SHALL render a validity badge in the entity header status row, above the entity id, for every
entity that reports a validity, from whichever source the entity carries:

- `_metadata.status` of `valid` or `invalid` (Core entities);
- `validityState.valid` (Applications and Keys);
- `valid` (test suites only; datasets carry the same field but SHALL NOT show a badge).

`valid` SHALL render a success-toned "Valid" badge and `invalid` an error-toned "Invalid" badge, each with a
dot. The badge SHALL be rendered by the same header status row in `SimpleEntityHeader` and `AssetHeader`.
An entity that reports no validity, or a `_metadata.status` other than `valid` / `invalid`, SHALL render no
badge and no placeholder, so the header layout is unchanged.

#### Scenario: Platform entity with a valid status
- **WHEN** a platform entity's detail view opens and `_metadata.status` is `valid`
- **THEN** a "Valid" badge is shown in the status row above the id
- **THEN** no info icon is shown

#### Scenario: Platform entity with an invalid status
- **WHEN** a platform entity's detail view opens and `_metadata.status` is `invalid`
- **THEN** an "Invalid" badge is shown in the status row above the id

#### Scenario: Application or key
- **WHEN** an Application or Key detail view opens and `validityState.valid` is `true` or `false`
- **THEN** a "Valid" or "Invalid" badge is shown above the id

#### Scenario: Test suite
- **WHEN** a test suite detail view opens and `valid` is `true` or `false`
- **THEN** a "Valid" or "Invalid" badge is shown above the id

#### Scenario: Dataset
- **WHEN** a dataset detail view opens, even though the dataset carries a `valid` flag
- **THEN** no validity badge is rendered

#### Scenario: Entity without a status
- **WHEN** a detail view opens for an entity that reports none of the sources above (for example a public
  application, a public toolset or a prompt)
- **THEN** no validity badge is rendered and the id sits where it did before this change

#### Scenario: Unrecognised status value
- **WHEN** `_metadata.status` holds a value other than `valid` or `invalid` and no other source applies
- **THEN** no validity badge is rendered

#### Scenario: Both header types
- **WHEN** an entity that reports a validity is shown under `SimpleEntityHeader` and under `AssetHeader`
- **THEN** the badge renders identically in both

### Requirement: Validity badge hint
The validity badge SHALL carry a hint only for the invalid state, only when the entity's source yields
non-empty text, and the hint SHALL be shown through the generic badge hint. The hint text SHALL be:

- for `_metadata.validationWarnings`: each warning as `field: message` (or the single non-empty part when
  one is missing), joined with `; `;
- for `validityState`: its `message`;
- for a test suite's `validationWarnings`: each warning as `code: message` (or the single non-empty part),
  joined with `; `.

A valid badge SHALL never carry a hint, even if the source holds warnings.

#### Scenario: Invalid with warnings
- **WHEN** `_metadata.status` is `invalid` and `validationWarnings` holds `{ field: "endpoint", message: "must not be empty" }`
- **THEN** an info icon follows the "Invalid" badge and its tooltip reads `endpoint: must not be empty`

#### Scenario: Multiple warnings
- **WHEN** the source holds two warnings
- **THEN** the tooltip lists both, separated by `; `

#### Scenario: Application or key message
- **WHEN** an Application's `validityState` is invalid with message "Missing deployment"
- **THEN** the tooltip reads "Missing deployment"

#### Scenario: Test suite warnings
- **WHEN** a test suite is invalid with a warning whose code is `MISSING_DATASET` and message is `Dataset is required`
- **THEN** the tooltip reads `MISSING_DATASET: Dataset is required`

#### Scenario: Invalid without text
- **WHEN** the entity is invalid and its source yields no hint text (for example a non-admin user, for whom Core omits warnings)
- **THEN** the "Invalid" badge is shown with no info icon

#### Scenario: Valid never has a hint
- **WHEN** the entity is valid
- **THEN** no info icon is shown, even if warnings are present

### Requirement: Validity is shown once, in the header
For Applications, Keys and test suites, the validity SHALL be shown only by the header badge. The
Properties tab SHALL NOT repeat it as a labelled status. This requirement does not apply to validity
shown for individual rows of a grid (test cases, datasets, import preview), which keep their existing
presentation.

#### Scenario: Application properties
- **WHEN** an Application's Properties tab is open
- **THEN** the header shows the validity badge and the Properties tab shows no separate Status label

#### Scenario: Key properties
- **WHEN** a Key's Properties tab is open
- **THEN** the header shows the validity badge and the Properties tab shows no separate Status label

#### Scenario: Test suite properties
- **WHEN** a test suite's Properties tab is open
- **THEN** the header shows the validity badge and the Properties tab shows no separate Status label

#### Scenario: Test case rows are unchanged
- **WHEN** a test suite's test cases are listed
- **THEN** each row keeps its existing validity indicator
