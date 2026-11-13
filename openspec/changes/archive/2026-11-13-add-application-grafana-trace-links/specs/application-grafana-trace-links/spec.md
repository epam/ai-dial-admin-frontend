## Purpose

Lets an admin jump from an asset application to its traces in Grafana, either all of them or only the
failing ones, without rebuilding the filter by hand. The links are built entirely from the application's
identity and the deployment's Grafana configuration, and disappear when Grafana is not configured.

## ADDED Requirements

### Requirement: Grafana traces dropdown on the asset application page
The asset application detail page (`/assets-applications/[id]`) SHALL offer, when Grafana is configured, one
"Traces in Grafana" button that opens a menu of two options: **All traces**, which opens Grafana showing every
trace of that application, and **Errors only**, which opens Grafana showing only the application's error
traces. Both views of that page (public-bucket application and platform application) SHALL offer it. Choosing
an option SHALL open Grafana in a new browser tab without giving the opened page access to the admin console
tab.

#### Scenario: Dropdown shown for a public-bucket application
- **WHEN** Grafana is configured and a user opens a public-bucket application
- **THEN** the page header shows one "Traces in Grafana" button and the menu is closed

#### Scenario: Dropdown shown for a platform application
- **WHEN** Grafana is configured and a user opens a platform-bucket application
- **THEN** the page header shows one "Traces in Grafana" button and the menu is closed

#### Scenario: Opening the menu
- **WHEN** a user activates the "Traces in Grafana" button
- **THEN** a menu with an "All traces" option and an "Errors only" option opens

#### Scenario: Options open in a new tab
- **WHEN** a user chooses either option
- **THEN** Grafana opens in a new browser tab, the admin console tab stays on the application page, and the
  opened page has no reference to it

### Requirement: Links are absent when Grafana is not configured
The dropdown SHALL NOT render, and no Grafana URL SHALL be built, when the Grafana traces URL (`GRAFANA_TRACES_URL`)
is unset, empty or whitespace-only. The Dashboard page's `GRAFANA_LINK` SHALL NOT be read for this. The rest of the page SHALL behave exactly as it does without the feature.

#### Scenario: No Grafana traces URL
- **WHEN** the Grafana traces URL is not set and a user opens an asset application
- **THEN** no dropdown is shown and the header is otherwise unchanged

#### Scenario: Whitespace-only traces URL
- **WHEN** the Grafana traces URL contains only whitespace
- **THEN** no dropdown is shown

#### Scenario: Only the Dashboard link is set
- **WHEN** `GRAFANA_LINK` is set and `GRAFANA_TRACES_URL` is not
- **THEN** no dropdown is shown

#### Scenario: Application without a Core path
- **WHEN** Grafana is configured but the application has no Core path (an application read from Core's
  configuration file)
- **THEN** no dropdown is shown, because there is no deployment to match

### Requirement: The dropdown sits with the entity's header actions
The dropdown SHALL be shown wherever the header shows the entity's own actions, that is, next to Delete in the
normal state. It SHALL NOT be shown while the application has unsaved changes, while the JSON editor is
open, or for a read-only admin, where the header shows no entity actions.

#### Scenario: Dropdown beside Delete
- **WHEN** Grafana is configured and the application has no unsaved changes
- **THEN** the dropdown appears in the same action row as the Delete button

#### Scenario: Dropdown hidden while editing
- **WHEN** the application has unsaved changes
- **THEN** the header shows only the save and discard actions and no Grafana dropdown

### Requirement: Grafana Explore URL contract
Each option SHALL target Grafana Explore on the Tempo datasource: the Grafana traces URL (a trailing slash on it
tolerated) followed by `/explore`, with `schemaVersion=1`, a URL-encoded `panes` document and the `orgId`.
The panes document SHALL contain a single TraceQL query on the configured datasource, grouped per trace, and
a time range of the last 24 hours (`now-24h` to `now`).

The "All traces" query SHALL select spans whose `dial.deployment` span attribute matches the application's
path as a suffix: `{ span.dial.deployment =~ ".*<path>" }`. The "Errors only" query SHALL select the
error-status spans that are descendants of those spans:
`{ span.dial.deployment =~ ".*<path>" } >> { status = error }`.

#### Scenario: All-traces URL
- **WHEN** the "All traces" option's URL is built for the application at path `public/ahQuickApp__1.0.0`
- **THEN** its URL starts with the normalized traces URL followed by `/explore?`, carries `schemaVersion=1`
  and the configured `orgId`, and its decoded panes document holds one query on the configured datasource
  uid with `tableType` `traces`, the range `now-24h` to `now`, and the TraceQL
  `{ span.dial.deployment =~ ".*public/ahQuickApp__1\\.0\\.0" }`

#### Scenario: Errors-only URL
- **WHEN** the "Errors only" option's URL is built for the same application
- **THEN** its URL is identical to the all-traces URL except that the TraceQL is
  `{ span.dial.deployment =~ ".*public/ahQuickApp__1\\.0\\.0" } >> { status = error }`

#### Scenario: Traces URL with or without trailing slash
- **WHEN** the traces URL is `https://grafana.example.com/` or `https://grafana.example.com`
- **THEN** both produce URLs starting `https://grafana.example.com/explore?` with no doubled slash

#### Scenario: Panes encoded exactly once
- **WHEN** a URL is built for an application
- **THEN** the `panes` value decodes, with a single URL-decode, to valid JSON

### Requirement: Datasource and organization configuration
The Tempo datasource uid SHALL come from `GRAFANA_TEMPO_DATASOURCE_UID` and default to `tempo`. The Grafana
organization id SHALL come from `GRAFANA_ORG_ID` and default to `1`. An unset or empty value SHALL use the
default. A non-numeric or non-positive organization id SHALL fall back to `1` rather than fail the page.

#### Scenario: Defaults applied
- **WHEN** neither variable is set
- **THEN** the URL uses datasource uid `tempo` and `orgId=1`

#### Scenario: Custom datasource uid
- **WHEN** `GRAFANA_TEMPO_DATASOURCE_UID` is `tempo-application-otel`
- **THEN** the URL uses that uid for the panes datasource and the query's datasource

#### Scenario: Custom organization id
- **WHEN** `GRAFANA_ORG_ID` is `3`
- **THEN** the URL carries `orgId=3`

#### Scenario: Empty variables fall back
- **WHEN** a variable is set to an empty string
- **THEN** its default is used

#### Scenario: Invalid organization id
- **WHEN** `GRAFANA_ORG_ID` is `abc`
- **THEN** the URL carries `orgId=1` and the page still renders

### Requirement: Application path is the match value and is escaped
The value matched against `dial.deployment` SHALL be the application's Core path: bucket-qualified, with the
`__version` suffix for a versioned public application (`public/ahQuickApp__1.0.0`), and `platform/<name>` for
a platform application. It SHALL NOT be the display name, the display version or the bare name. Because the
path is used inside a regular expression that sits inside a TraceQL string literal, regular-expression
metacharacters SHALL be escaped first and the result then escaped for the string literal (backslash and double
quote), so that any path yields a well-formed query that matches that path literally.

#### Scenario: Path taken from identity, not display name
- **WHEN** an application at path `public/ahQuickApp__1.0.0` has display name `Quick App`
- **THEN** the query matches `public/ahQuickApp__1.0.0` and does not mention `Quick App`

#### Scenario: Platform application path
- **WHEN** a platform application is named `chat-hub`
- **THEN** the query matches `platform/chat-hub`

#### Scenario: Version dots are literal
- **WHEN** a path contains `1.0.0`
- **THEN** each dot is escaped in the regular expression so it matches only a dot

#### Scenario: Regular-expression metacharacters in a path
- **WHEN** a path contains characters such as `(`, `+` or `[`
- **THEN** they are escaped and the query matches that path literally

#### Scenario: Quote in path
- **WHEN** a path contains a double quote
- **THEN** the quote is escaped in the TraceQL string and the decoded panes document remains valid JSON

#### Scenario: Backslash in path
- **WHEN** a path contains a backslash
- **THEN** it is escaped for both the regular expression and the string literal, and the decoded panes
  document remains valid JSON

### Requirement: Accessible dropdown control
The dropdown button SHALL be a button named by its visible label, and its two options SHALL be menu items
named by their visible labels. Each option SHALL convey that it opens in a new tab, and icons SHALL be marked
decorative. The menu SHALL be operable from the keyboard.

#### Scenario: Reachable by role and name
- **WHEN** assistive technology or a test queries the header controls
- **THEN** the button is found by its name, and once it is opened both options are found as menu items, each
  conveying that it opens in a new tab
