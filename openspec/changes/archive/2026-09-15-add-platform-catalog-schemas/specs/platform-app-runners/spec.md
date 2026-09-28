## MODIFIED Requirements

### Requirement: Parameters tab shows the Core-resolved schema

The system SHALL populate the app-runner Parameters tab from DIAL Core's resolved-schema read, which already performs the external-schema download declared by `dial:applicationTypeSchemaEndpoint`.

Editing a runner's parameters SHALL preserve every schema declaration the tab does not itself render.
The app-runner meta-schema lets a property carry a file-valued declaration, the encoded-file format
that accompanies it, and per-property metadata at any nesting depth; the tab exposes only a subset of
these as editable fields. A declaration the tab cannot edit is data the runner's author put there —
losing it on save silently breaks the behavior that depended on it, so it SHALL survive an edit
untouched.

#### Scenario: Parameters reflect a resolved external schema

- **WHEN** a runner declares `dial:applicationTypeSchemaEndpoint` and its Parameters tab is opened
- **THEN** the properties contributed by the external schema are shown alongside the runner's own properties

#### Scenario: Resolution failure is reported

- **WHEN** Core cannot download the declared external schema
- **THEN** the Parameters tab surfaces an error rather than rendering an empty parameter set silently

#### Scenario: A file-valued property survives an unrelated edit

- **WHEN** a user edits one property of a runner whose schema declares another property file-valued,
  and saves
- **THEN** that property is still declared file-valued, with its format intact
- **AND** DIAL Core still resolves it as a file reference when the runner is published or shared

#### Scenario: Nested per-property metadata survives an edit

- **WHEN** a user edits a runner whose schema carries per-property metadata below the first level of
  `properties`, and saves
- **THEN** that nested metadata is unchanged in the saved schema
