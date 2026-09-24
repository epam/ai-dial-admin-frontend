## MODIFIED Requirements

### Requirement: A tool row is one tool on one server

A tool name is not unique across servers — the same `get_me` lives on dozens of toolsets — so the
`Tools` tab SHALL group by the MCP server as well as the tool name. Each row SHALL be one tool on
one server and SHALL state that server under the tool's own name.

A row's identity SHALL carry both group values, so two servers' same-named tools are two rows
wherever rows are matched by id. A request for the previous window's figures SHALL therefore ask by
both parts of a key: matching on the dimension alone returns nothing, and every row's change reads
as absent.

The tab's search SHALL match the server as well as the tool, since a row is a tool on a server and a
reader typing a server name means the tools it serves.

A name SHALL be shown as a reader can take it in — without the `toolsets/` prefix, which the column
already implies, and with Core's own percent-escapes decoded. A name that is not valid encoding SHALL
be shown as it stands rather than dropped.

#### Scenario: One tool name on two servers is two rows

- **GIVEN** two MCP servers each expose a tool called `execute_python`
- **WHEN** the `Tools` tab renders
- **THEN** it shows two rows
- **AND** each names its own server under the tool's name

#### Scenario: The previous window is asked by both parts

- **GIVEN** the `Tools` tab's full list is open with comparison on
- **WHEN** the previous window's figures are requested
- **THEN** the request groups by the server and the tool
- **AND** each row states its change rather than an absent one

#### Scenario: Searching by server finds its tools

- **GIVEN** the `Tools` tab
- **WHEN** the reader searches for a server's name
- **THEN** the tools that server serves are listed

#### Scenario: A tab without a qualifier is unchanged

- **WHEN** the `Models` tab renders
- **THEN** its rows are grouped by the deployment alone
