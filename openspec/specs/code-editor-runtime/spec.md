# code-editor-runtime Specification

## Purpose

Defines how the console's code editors obtain their editor engine, which language the engine's own interface
uses, and how JSON validation errors reach the user in the app's language — in the editor and in the
notification that blocks a save.

## Requirements

### Requirement: Code editors load the bundled editor engine

Every code editor in the console — JSON editors, diff views, the SQL and JSONata editors, the log viewer and the
read-only content viewers — SHALL load the editor engine and its background workers from the console's own
origin. Opening an editor SHALL NOT request any resource from a third-party host. The engine SHALL load only in
the browser: server rendering of a page that contains an editor SHALL NOT evaluate it.

#### Scenario: Opening an entity's JSON editor

- **WHEN** an administrator opens an entity's detail page and switches it to JSON Editor mode
- **THEN** the editor SHALL render the entity's JSON with syntax highlighting
- **AND** every script, stylesheet and worker the editor requests SHALL be served by the console's own origin
- **AND** no request SHALL go to `cdn.jsdelivr.net` or any other third-party host

#### Scenario: Editors on a server-rendered page

- **WHEN** a page that contains a code editor is rendered on the server and hydrated in the browser
- **THEN** the page SHALL render without a server error or a hydration error caused by the editor
- **AND** the editor SHALL appear once the engine has loaded in the browser

#### Scenario: Validation runs in a background worker

- **WHEN** an administrator edits JSON in a JSON editor
- **THEN** validation SHALL run in a background worker served by the console's own origin
- **AND** the browser console SHALL NOT report that the editor fell back to running without workers

### Requirement: Code editors support the languages the console uses

The editor engine SHALL highlight JSON and SQL and SHALL display plain text, and the console's own `log` and
`jsonata` languages SHALL keep working as they do today. A language the engine does not register SHALL render as
plain text instead of failing.

#### Scenario: SQL highlighting in the Analytics SQL tab

- **WHEN** an administrator opens a saved query's SQL tab
- **THEN** the SQL editor SHALL render the query with SQL tokenization

#### Scenario: Log and JSONata editors

- **WHEN** an administrator opens an image's installation log, or a test suite request body in JSONata mode
- **THEN** the log viewer and the JSONata editor SHALL render their content as they did before this change

#### Scenario: Unregistered language

- **WHEN** an editor is given a language the engine does not register
- **THEN** the editor SHALL render its content as plain text

### Requirement: Editor interface follows the app locale

The editor engine's own interface text — the context menu, the find and replace widget, the command palette,
the read-only notice and its accessibility labels — SHALL be shown in the console's current locale when the
engine provides a translation for that locale. For a locale the engine does not translate, that text SHALL be
shown in English. The editor language SHALL be decided once per page load.

#### Scenario: Locale the engine translates

- **WHEN** the console runs in a locale for which the engine ships translations and an administrator opens an editor's context menu
- **THEN** the context menu entries SHALL be shown in that locale

#### Scenario: Locale the engine does not translate

- **WHEN** the console runs in a locale for which the engine ships no translations
- **THEN** the editor's interface text SHALL be shown in English
- **AND** the editor SHALL behave the same as in English otherwise

#### Scenario: English locale

- **WHEN** the console runs in English and an administrator opens an editor's context menu or find widget
- **THEN** the entries SHALL read exactly as they did before this change

### Requirement: JSON validation errors use the app's translations

Every message a JSON editor reports for invalid JSON syntax, or for a value that violates the JSON schema
applied to that editor, SHALL be shown in the console's current locale using the console's own translations.
The same translated message SHALL appear in the editor's error hover, in its problem navigation (⌥F8 / Alt+F8), and in the
notification raised when a save is blocked by that error. A message that carries a value — a property name, an
expected type, a limit — SHALL keep that value in the translated text. A message the console has no
translation for SHALL be shown as the editor reports it.

In English, every message SHALL read exactly as the editor reported it before this change.

#### Scenario: Syntax error in the editor hover

- **WHEN** an administrator removes a required comma from the JSON in a JSON editor and hovers the error underline
- **THEN** the hover SHALL show the "expected comma" message in the console's current locale
- **AND** the editor SHALL NOT show the untranslated message in its place, even briefly while the administrator keeps typing

#### Scenario: Schema violation with a value

- **WHEN** a JSON editor's schema requires a top-level object and an administrator replaces the content with an array
- **THEN** the hover SHALL show the "incorrect type" message in the console's current locale
- **AND** the message SHALL name the expected type, `object`

#### Scenario: Save blocked by a validation error

- **WHEN** an administrator tries to save an entity while its JSON editor reports an error
- **THEN** the save SHALL be blocked as it is today
- **AND** the error notification's title SHALL be the same translated message the editor hover shows
- **AND** its description SHALL name the line of the error, as it does today

#### Scenario: Message without a translation

- **WHEN** the editor reports a JSON message the console has no translation for
- **THEN** the hover and the notification SHALL show the message as the editor reported it

#### Scenario: English locale

- **WHEN** the console runs in English and a JSON editor reports a syntax or schema error
- **THEN** the hover and the notification SHALL show the same English text as before this change

#### Scenario: Error messages of other editors are untouched

- **WHEN** an editor shows errors or highlights that do not come from JSON validation, such as the Analytics row-limit editor's highlighted field
- **THEN** that text and those highlights SHALL stay unchanged
