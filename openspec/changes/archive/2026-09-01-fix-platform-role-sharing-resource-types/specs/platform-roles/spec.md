## MODIFIED Requirements

### Requirement: Properties tab content
The system SHALL render the role asset's Properties tab with a cost-limit toggle and, when enabled,
minute/day/week/month cost-limit number inputs, plus a sharing grid (invitation TTL and max accepted
users per shareable resource type with a reset-to-default action). Cost-limit values SHALL be plain
numbers, not strings. A token whose Core-side value is too large for JavaScript to represent exactly
(DIAL Core's `Long.MAX_VALUE` "unlimited" default) SHALL be treated as absent — shown as unset and
omitted from the write — rather than displayed or persisted as an approximate, rounded number.

The sharing grid SHALL list exactly the seven resource types DIAL Core allows a role to override —
`APPLICATION`, `TOOL_SET`, `PROMPT`, `FILE`, `CONVERSATION`, `CREDENTIALS`, and `SKILL` — keyed on the
role resource's `share` map by that exact uppercase name, matching Core's own
`ResourceTypes.name()`. Max accepted users SHALL default to `10` for `APPLICATION`, `TOOL_SET`,
`CREDENTIALS`, and `SKILL`, and SHALL have no specific default placeholder for `PROMPT`, `FILE`, and
`CONVERSATION`; invitation TTL SHALL default to `72` hours for every type. A stored value of `-1` for
either field (DIAL Core's own "not provided" sentinel) SHALL be treated as absent — shown as an empty
input with the default placeholder — rather than displayed as the literal value `-1`. Clearing a
field the user had set SHALL remove that field from the resource type's `share` entry entirely; a
stored value of `0` SHALL only be written when the user explicitly enters `0`.

#### Scenario: Cost limits are editable and persist
- **WHEN** a user enables the cost-limit toggle, sets a value for a token, and saves
- **THEN** the value is stored on the role resource's `costLimit` as a number and reappears on reload

#### Scenario: Disabling the cost-limit toggle clears every token
- **WHEN** a user disables the cost-limit toggle
- **THEN** every cost-limit token is removed from the resource's `costLimit`, rather than being set to
  an explicit sentinel value

#### Scenario: An out-of-range cost-limit token is treated as unlimited, not an approximate number
- **WHEN** a cost-limit token's stored value is too large for JavaScript to represent exactly
- **THEN** the field is shown as unset rather than a rounded number, and saving without changing it
  leaves that token unset on the resource

#### Scenario: Sharing settings are editable and persist under Core's uppercase resource-type keys
- **WHEN** a user sets an invitation TTL or max-accepted-users value for a resource type and saves
- **THEN** the value is stored on the role resource's `share` map under that type's uppercase name
  (e.g. `share.TOOL_SET.max_accepted_users`) and reappears on reload

#### Scenario: Resetting a sharing row clears its override
- **WHEN** a user resets a sharing row to default
- **THEN** that resource type's entry is removed from the `share` map

#### Scenario: Toolset max users defaults to 10, same as applications
- **WHEN** a user opens the sharing grid for a role with no `TOOL_SET` override
- **THEN** the max-users input for the Toolsets row is empty and shows a `10` placeholder, matching
  the Applications row

#### Scenario: A -1 stored value shows as unset, not as a literal -1
- **WHEN** a role's `share` map has an entry whose `max_accepted_users` or `invitation_ttl` is `-1`
- **THEN** the corresponding input is shown empty with its default placeholder, not the value `-1`

#### Scenario: Clearing one field of a sharing row leaves the other field intact and omits the cleared field
- **WHEN** a user clears the max-users value on a row that also has an invitation-TTL override, and
  saves
- **THEN** the resource type's `share` entry keeps its `invitation_ttl` and no longer has a
  `max_accepted_users` field at all — not a value of `0` or an empty string

#### Scenario: Credentials and Skills are available as shareable resource types
- **WHEN** a user opens the sharing grid
- **THEN** rows for Credentials (`CREDENTIALS`) and Skills (`SKILL`) are shown alongside Applications,
  Toolsets, Prompts, Files, and Conversations, each defaulting to 10 max users and a 72-hour
  invitation TTL
