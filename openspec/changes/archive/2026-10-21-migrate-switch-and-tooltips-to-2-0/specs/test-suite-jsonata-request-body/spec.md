## MODIFIED Requirements

### Requirement: JSONata toggle in the Request Template header

The Request Template header row (`RequestTemplate.tsx`) SHALL render a `Switch` labelled "JSONata",
positioned before the existing `ContentTypeSelect`, wired to the derived JSONata mode.

The switch SHALL be rendered when the body `contentType` is `application/json` **or** when `jsonataContent` is
present, regardless of `contentType`. The second clause is required, not defensive: `contentType` is optional
on `TestSuiteRequestTemplateBody` and `ContentTypeSelect` never writes it until the user actively changes the
dropdown, so a backend body of `{ jsonataContent: "..." }` with no `contentType` is reachable. Because the Body
tab branches on `jsonataContent` before it looks at `contentType`, a visibility rule keyed on `contentType`
alone would render the JSONata editor with no way to leave it.

#### Scenario: Toggle renders for JSON content type

- **WHEN** the request template body `contentType` is `application/json`
- **THEN** the header SHALL render the JSONata switch
- **AND** the switch SHALL appear before the content-type dropdown

#### Scenario: Toggle is hidden for form-data with no JSONata expression

- **WHEN** the request template body `contentType` is `multipart/form-data` and `jsonataContent` is absent
- **THEN** the header SHALL NOT render the JSONata switch
- **AND** the content-type dropdown SHALL still render

#### Scenario: Toggle rendered when jsonataContent is present under a non-JSON or absent content type

- **WHEN** the body carries a `jsonataContent` value and its `contentType` is `multipart/form-data`, or is
  absent entirely
- **THEN** the header SHALL still render the JSONata switch, in the on state
- **AND** turning it off SHALL return the user to a normal body editor for the current content type
- **AND** the user SHALL NOT be able to reach a state where the JSONata editor is shown with no switch

#### Scenario: Toggle reflects current mode

- **WHEN** the body has a `jsonataContent` value
- **THEN** the switch SHALL be rendered in the on state
- **WHEN** the body has no `jsonataContent` value
- **THEN** the switch SHALL be rendered in the off state
