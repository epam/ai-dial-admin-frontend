## ADDED Requirements

### Requirement: Per-interface override paths editor
Each passthrough interface row SHALL render an override paths editor on Assets → Models, Assets →
Applications (platform) and Assets → Platform Interceptors. The editor SHALL list only the operations
the admin has added, and SHALL offer only the Core operations the row's interface type supports. The
supported operations SHALL be: `openaiChatCompletions` → `postAzureOpenaiChatCompletions`;
`openaiEmbeddings` → `postAzureOpenaiEmbeddings`; `openaiResponses` → `postOpenaiResponses`,
`getOpenaiResponsesById`, `deleteOpenaiResponsesById`, `postOpenaiResponsesCancel`; `anthropicMessages`
→ `postAnthropicMessages`, `postAnthropicMessagesCountTokens`. Values SHALL be stored under the camelCase
`overridePaths` field of the interface entry on every surface.

#### Scenario: No path inputs are shown until one is added
- **WHEN** an admin views an interface row that has no override paths
- **THEN** no path input is shown, only an "Add override path" button

#### Scenario: Add with several available operations opens a dropdown
- **WHEN** an admin clicks "Add override path" on an `openaiResponses` row
- **THEN** a dropdown lists the Responses operations not yet added, and no operation of another
  interface type

#### Scenario: Selecting an operation adds its input
- **WHEN** an admin selects `getOpenaiResponsesById` in the dropdown
- **THEN** the dropdown closes, a path input for that operation appears, and that operation is no longer
  offered

#### Scenario: A single available operation is added directly
- **WHEN** an admin clicks "Add override path" and only one operation is available (for example on an
  `openaiChatCompletions` row)
- **THEN** its input appears immediately with no dropdown, and the add button is hidden once every
  operation has been added

#### Scenario: Entering a path stores it under overridePaths
- **WHEN** an admin enters `/v1/chat/completions` for `postAzureOpenaiChatCompletions` and saves
- **THEN** the payload's interface entry carries
  `overridePaths: { postAzureOpenaiChatCompletions: '/v1/chat/completions' }`

#### Scenario: Emptying an input keeps the row but sends no value
- **WHEN** an admin empties a path input
- **THEN** the input stays on screen, and no value for that operation reaches the payload

#### Scenario: Deleting a row removes the operation
- **WHEN** an admin clicks the delete control on an added operation
- **THEN** its input is removed, the operation is offered again, and `overridePaths` is cleared when no
  operation remains

#### Scenario: Unknown keys survive a round trip
- **WHEN** an entity is loaded whose `overridePaths` contains a key this editor has no input for, an
  admin edits another field, and saves
- **THEN** the saved `overridePaths` still contains the unknown key with its original value

### Requirement: Override path `{id}` validation
The editor SHALL validate `{id}` per operation: a path input for an operation that carries no id
(`postOpenaiResponses`, `postAnthropicMessages`, `postAnthropicMessagesCountTokens`) SHALL show a field
error and block save when its value contains the literal `{id}`. Operations that carry an id SHALL accept
`{id}` and `{overrideName}`. No other token SHALL be validated.

#### Scenario: `{id}` rejected on an id-less operation
- **WHEN** an admin enters `/v1/{id}/responses` for `postOpenaiResponses`
- **THEN** the input shows an error and the entity cannot be saved

#### Scenario: `{id}` accepted on an id operation
- **WHEN** an admin enters `/v1/responses/{id}` for `getOpenaiResponsesById`
- **THEN** no error is shown

### Requirement: Translator mode clears override paths
Switching an interface row to `translator` mode SHALL remove its `overridePaths` from draft state and
hide the override path editor, because Core rejects `overridePaths` on a translated interface.

#### Scenario: Switching to translator drops the paths
- **WHEN** an admin switches a row that has override paths to `translator` mode and saves
- **THEN** the saved interface entry carries no `overridePaths`

### Requirement: Skills switch in the per-interface Features popup
The per-interface Features popup SHALL include the `skills_supported` switch in the tools group, for the
same surfaces as the entity-level Features tab (Assets → Models and Assets → Applications).

#### Scenario: Popup shows the skills switch
- **WHEN** an admin opens the Features popup on an interface row on Assets → Models
- **THEN** a `skills_supported` switch is shown in the tools group
