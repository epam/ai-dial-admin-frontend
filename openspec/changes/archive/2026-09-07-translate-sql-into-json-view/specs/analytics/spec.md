## MODIFIED Requirements

### Requirement: Switching from a written mode to the Builder is guarded

SQL and JSON are "written" modes: they can hold queries the visual builder cannot display (edited SQL text; JSON with e.g. filter nesting deeper than two levels). When the user switches from the SQL view to the Builder view with an edited SQL buffer, the SQL SHALL first be translated to the structured DSL via `POST /v1/queries/translate-sql`. If the translation succeeds and the resulting query is representable in the two-level visual builder, the builder SHALL be hydrated from that query and the view SHALL switch with no confirmation and no data loss. If the translation fails (`400` — parse failure or an unsupported construct) or the resulting query is not builder-representable, a confirmation popup (danger variant) SHALL warn that switching will drop the current query and reset the builder to its starting point. From the JSON view the same guard applies when the JSON is valid but unrepresentable. Confirming SHALL discard the written query (clear the SQL buffer / discard the JSON edits), reset the builder state to its initial defaults for the selected entity, and switch to the Builder view. Cancelling SHALL keep the user in the written mode with the query intact. Switching to the Builder SHALL NOT prompt when nothing would be lost (empty or unedited generated SQL; SQL that translates to a representable query; JSON that round-trips into the builder).

Leaving the SQL view for the **JSON** view is guarded the same way, by the same translation and the same popup — see "Switching from the SQL view to JSON translates the SQL buffer". The two switches differ only in where a successful translation lands: the Builder switch requires a builder-representable body, while the JSON switch shows any translated body.

#### Scenario: Translatable SQL hydrates the builder without a prompt

- **WHEN** the user edits SQL that translates to a builder-representable query and selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects the translated query
- **AND** the SQL buffer is cleared

#### Scenario: Untranslatable SQL asks for confirmation

- **WHEN** the user edits SQL that the backend rejects (or that translates to an unrepresentable query) and selects the Builder view
- **THEN** a confirmation popup warns that the current query will be dropped and the builder reset

#### Scenario: Confirming drops the written query and resets the builder

- **WHEN** the confirmation popup is shown and the user confirms
- **THEN** the view switches to the view that was requested
- **AND** the written query is discarded
- **AND** the builder state is reset to its initial defaults for the selected entity

#### Scenario: Cancelling keeps the written query

- **WHEN** the confirmation popup is shown and the user cancels
- **THEN** the user remains in the written mode
- **AND** the written query text is unchanged

#### Scenario: Representable JSON switches silently

- **WHEN** the JSON editor holds a valid query the builder can represent and the user selects the Builder view
- **THEN** no confirmation is shown
- **AND** the builder reflects that query

## ADDED Requirements

### Requirement: Switching from the SQL view to JSON translates the SQL buffer

The JSON view SHALL show the query the user actually authored, never a body derived from builder state the SQL was never hydrated into. When the user leaves the SQL view for the JSON view with an **edited** SQL buffer, that SQL SHALL be translated through `POST /v1/queries/translate-sql` — the same endpoint and the same failure semantics as the Builder switch.

On a successful translation the JSON view SHALL show the translated body and the SQL buffer SHALL be cleared, so the body on screen is the body a save would persist. A translated body the visual builder can represent SHALL additionally hydrate the builder; one it cannot SHALL leave the JSON buffer marked as diverged, so a later switch to the Builder still goes through the written-mode guard.

On a rejected translation — a composite statement (a join, a CTE, a derived table, or a subquery), or any SQL the DSL cannot express — the same danger confirmation popup used for the Builder switch SHALL be shown. Confirming SHALL discard the SQL, reset the builder to its defaults for the selected source, and open the JSON view on that default body rather than on an empty buffer. Cancelling SHALL leave the user in the SQL view with the text unchanged.

The popup SHALL describe the switch the user actually asked for. Its header is shared, but its description SHALL name the destination: the Builder switch SHALL state that the query cannot be shown in the visual builder, while the JSON switch SHALL state that the SQL could not be translated into a structured query — the JSON view can display any structured body, so the failure there is the translation, not the display. Neither description SHALL name the construct the DSL lacks.

An empty or unedited generated SQL buffer SHALL NOT be translated: the JSON view SHALL be filled from the current builder state, as it is when entering JSON from the Builder view.

#### Scenario: Translatable SQL is shown as its translated body

- **WHEN** the user edits SQL that the service translates and selects the JSON view
- **THEN** the JSON view shows the translated body
- **AND** the SQL buffer is cleared
- **AND** no confirmation is shown

#### Scenario: A translated body the builder cannot hold stays diverged

- **WHEN** the edited SQL translates to a query the visual builder cannot represent and the user selects the JSON view
- **THEN** the JSON view shows that body
- **AND** switching from there to the Builder view goes through the written-mode confirmation

#### Scenario: A composite statement asks for confirmation

- **WHEN** the user edits SQL that joins two entities, which the service refuses to translate, and selects the JSON view
- **THEN** a confirmation popup warns that the current query will be dropped
- **AND** its description states that the SQL could not be translated into a structured query, not that it cannot be shown in the visual builder
- **AND** the JSON view is not shown while the popup is open

#### Scenario: The Builder switch keeps its own wording

- **WHEN** the same untranslatable SQL is switched to the Builder view instead
- **THEN** the popup description states that the query cannot be shown in the visual builder

#### Scenario: Confirming opens JSON on the default body

- **WHEN** that confirmation is shown and the user confirms
- **THEN** the JSON view is shown holding the default body for the selected source
- **AND** the SQL buffer is discarded

#### Scenario: Cancelling keeps the SQL view

- **WHEN** that confirmation is shown and the user cancels
- **THEN** the SQL view stays open with its text unchanged

#### Scenario: Unedited SQL is not translated

- **WHEN** the SQL buffer is empty, or holds SQL the page generated from the builder and the user has not edited, and the user selects the JSON view
- **THEN** no translation request is sent
- **AND** the JSON view shows the body derived from the current builder state
