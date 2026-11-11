# Spec Delta

## ADDED Requirements

### Requirement: Eval Trends tab on Models and Applications

When `evaluationEnabled` is true, the Entities Models and Applications entity views SHALL include an
**Eval Trends** tab after Audit (when Audit is present), always as the last tab. When
`evaluationEnabled` is false, the tab SHALL be omitted.

#### Scenario: Tab present when evaluation is enabled

- **WHEN** a user opens an Entities Model or Application view and `evaluationEnabled` is true
- **THEN** the tab list includes Eval Trends as the last tab, after Audit when Audit is present

#### Scenario: Tab omitted when evaluation is disabled

- **WHEN** `evaluationEnabled` is false
- **THEN** the Entities Models and Applications tab lists do not include Eval Trends

### Requirement: Eval Trends tab on Ai Gateway Models and Applications

When `evaluationEnabled` is true, Ai Gateway Platform Models and both Ai Gateway Applications
buckets (public and platform) SHALL include an **Eval Trends** tab as the last tab, after Audit
when Audit is present. When `evaluationEnabled` is false, the tab SHALL be omitted. Adding the tab
to Applications MUST NOT unlock the asset Audit tab solely because evaluation is enabled.

#### Scenario: Platform Models tab present when evaluation is enabled

- **WHEN** a user opens an Ai Gateway Platform Model view and `evaluationEnabled` is true
- **THEN** the tab list includes Eval Trends as the last tab, after Audit when Audit is present

#### Scenario: Applications tab present without unlocking Audit

- **WHEN** a user opens an Ai Gateway Applications view with `evaluationEnabled` true and
  `analyticsUsageEnabled` false
- **THEN** the tab list includes Eval Trends as the last tab and does not include Audit

#### Scenario: Ai Gateway tab omitted when evaluation is disabled

- **WHEN** `evaluationEnabled` is false
- **THEN** Ai Gateway Platform Models and Applications tab lists do not include Eval Trends

### Requirement: Suites for the current entity

On the Eval Trends tab, the system SHALL load test suites whose `deployment_ref.id` or
`mcp_deployment_ref.id` equals the entity’s deployment id, sorted by suite name, including every
page of results. While the list is loading, the tab SHALL show a loading indicator.

For Platform Models the deployment id is `getModelDeploymentId(name)` (the bare model name). For
applications the deployment id is `getApplicationDeploymentId(view, application)`: public-bucket
asset applications use `applications/<metadata.path>`; platform-bucket and Entities applications
use `name`.

#### Scenario: Suites match the entity deployment id

- **WHEN** the entity deployment id is `gpt-4` and suites exist with `deployment_ref.id` or
  `mcp_deployment_ref.id` equal to `gpt-4`
- **THEN** those suites appear in the suite dropdown, sorted by name

#### Scenario: Public-bucket application uses applications path id

- **WHEN** the view is Assets Applications, the application is not on the platform bucket, and
  `_metadata.path` is `folder/my-app__1.0.0`
- **THEN** suites are loaded for deployment id `applications/folder/my-app__1.0.0`

#### Scenario: No matching suites

- **WHEN** no suites match the entity deployment id
- **THEN** the tab shows an informational empty state and does not render the suite Trends view

### Requirement: Suite picker and open in new tab

When at least one suite is available, the tab SHALL show a “View in Test Suite” control: a
searchable select of suite names (defaulting to the first by name) and an “Open in new tab” action
that opens the selected suite’s detail page in a new browser tab. Changing the selection SHALL show
Trends for the newly selected suite.

#### Scenario: Default selection and switch suite

- **WHEN** suites `alpha` and `beta` are loaded
- **THEN** `alpha` is selected by default, and selecting `beta` shows Trends for `beta`

#### Scenario: Open selected suite in a new tab

- **WHEN** the user activates Open in new tab with suite id `suite-1` selected
- **THEN** the suite detail route for `suite-1` opens in a new browser tab

#### Scenario: Searchable suite list

- **WHEN** suites are listed in the select
- **THEN** the select is searchable by suite name

### Requirement: Reuse suite Trends with Preview runs in the tab body

For the selected suite, the tab SHALL render the existing suite Trends view (same empty, single-run,
and multi-run layout and data). The Preview runs badge SHALL appear in the Eval Trends tab body
(trailing the suite picker row) and SHALL reflect that suite’s Trends-window run count. The tab
SHALL NOT offer Start Run from this surface.

#### Scenario: Preview runs follows the selected suite window

- **WHEN** the selected suite’s Trends window has 3 runs
- **THEN** the Preview runs badge in the tab body shows Last 3 Runs

#### Scenario: Trends empty state without Start Run

- **WHEN** the selected suite has no runs in its Trends window
- **THEN** the Trends empty state is shown without a Run action button

### Requirement: Month-to-date deployment eval cost

When at least one suite is available, the Eval Trends tab SHALL show a “Trends in All Test Suites”
header with the loaded suite count and an **Eval Cost this Month Across All Test Suites** card.
The card SHALL load deployment costs from `GET /api/v1/costs/deployment/{deploymentId}` for the
local calendar month-to-date window and for the matching day-clamped span in the previous month
(inclusive epoch-millisecond `from`/`to`). The displayed amount SHALL be the sum of
`totalTestCaseCost` and `totalMetricEvalCost` (a null phase counts as zero when the other phase
has a figure; both null means no figure). When both periods have a figure and they differ, the
card SHALL show a MoM delta badge (cost up is negative tone; cost down is positive tone). Hovering
the amount row SHALL show a tooltip with both period date ranges and amounts. Cost loading or
failure SHALL not block the suite picker or Trends; missing or failed cost data SHALL render an
em dash without a delta badge. The cost strip SHALL be omitted from the empty-suite state.

#### Scenario: Cost card with MoM delta

- **WHEN** suites exist and the current window totals `$1842` while the previous matching window
  totals `$1628`
- **THEN** the card shows `$1,842`, a `+$214 vs prev. period` increase badge, and a footer based on
  the suite count

#### Scenario: Cost periods use month-to-date and prior matching span

- **WHEN** today is 10 Nov and the entity has suites
- **THEN** the cost requests use local `1 Nov 00:00:00.000`–`10 Nov 23:59:59.999` and
  `1 Oct 00:00:00.000`–`10 Oct 23:59:59.999`

#### Scenario: Cost strip omitted when no suites

- **WHEN** no suites match the entity
- **THEN** the Trends in All Test Suites header and cost card are not shown
