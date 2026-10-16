# shared-json-editor Specification

## Purpose

TBD: document baseline behavior shared by the application's JSON and JSONata editors.

## Requirements

### Requirement: Shared JSON editors disable sticky scrolling

Every JSON or JSONata editor that receives its Monaco construction options through the shared `JsonEditorBase` defaults SHALL disable Monaco sticky scrolling. A consumer MAY explicitly override that default when its editor requires different behavior.

#### Scenario: Scrolling a long Application JSON document

- **WHEN** an administrator opens an Application containing a long JSON configuration, enables JSON Editor mode, and scrolls through the document
- **THEN** the editor SHALL continue rendering the document content throughout the scroll

#### Scenario: Consumer-specific options remain intact

- **WHEN** a shared JSON-editor consumer supplies options in addition to the shared defaults
- **THEN** its supplied options SHALL remain effective while sticky scrolling remains disabled unless that consumer explicitly overrides it
