## ADDED Requirements

### Requirement: Interfaces section on Platform Routers
`Platform > Routers` SHALL render the "Interfaces" section with the same title, bordered container, and
per-row fields as `Platform > Models`, allowing the four types `openaiChatCompletions`, `openaiResponses`,
`anthropicMessages`, and `openaiEmbeddings`. This is the sixth supported view.

#### Scenario: Section renders on a router
- **WHEN** an admin opens the properties of a router
- **THEN** an "Interfaces" section with title and bordered container is visible alongside `baseUrl`

#### Scenario: All four types can be added
- **WHEN** a router has all four interface types configured
- **THEN** the "+ Add" button is no longer rendered

### Requirement: Translator mode is unavailable while a router is in decision mode
An interface row SHALL offer only the Passthrough mode when its owning view disables translators, and a
router SHALL disable them while its `mode` is `decision`. Changing a router's `mode` to `decision` SHALL
switch every interface row in Translator mode to Passthrough and remove its `translator`. Views that do not
disable translators SHALL render the mode selector as before.

#### Scenario: Mode selector offers only Passthrough in decision mode
- **WHEN** a router is in `decision` mode and an interface row's mode selector is opened
- **THEN** Passthrough is the only option

#### Scenario: Switching to decision clears translated rows
- **WHEN** a router has a Translator-mode interface and the user switches its `mode` to `decision`
- **THEN** that interface becomes Passthrough with no `translator` and an empty required base URL, unless
  the router's own `baseUrl` is set

#### Scenario: Proxy mode keeps the translator option
- **WHEN** a router is in `proxy` mode
- **THEN** the interface mode selector offers both Passthrough and Translator

#### Scenario: Other views are unchanged
- **WHEN** an admin opens an interface row of a Platform Model
- **THEN** the mode selector still offers both Passthrough and Translator
