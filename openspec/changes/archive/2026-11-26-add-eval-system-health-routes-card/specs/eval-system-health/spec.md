## MODIFIED Requirements

### Requirement: Coverage card row

The System Health page SHALL show five coverage cards: **Total Evaluatees**, **Total Models**, **Total
Applications**, **Total Toolsets** and **Total Routes**. Total Evaluatees SHALL be the first card of the key
figures row at the top of the page; the other four SHALL form the block beside the health distribution chart,
in the order Total Models, Total Applications, Total Toolsets, Total Routes. Each coverage card SHALL show its
coverage percentage, a progress bar of that percentage beneath it, and a caption of the form
`N total · M uncovered`. The progress bar SHALL expose the percentage and the card title as its accessible
value and name.

#### Scenario: Four cards in order

- **WHEN** the operator opens the System Health page
- **THEN** the four coverage cards beside the chart are titled Total Models, Total Applications, Total
  Toolsets and Total Routes, in that order

#### Scenario: A card shows percentage, bar and caption

- **WHEN** 118 models are deployed and 112 of them are covered
- **THEN** the Total Models card shows `94.9%`
- **AND** its progress bar is filled to 94.9%
- **AND** its caption reads `118 total · 6 uncovered`

#### Scenario: The Total Routes card

- **WHEN** 14 routes exist and 11 of them are covered
- **THEN** the Total Routes card shows `78.6%`
- **AND** its caption reads `14 total · 3 uncovered`

#### Scenario: Total Evaluatees is in the key figures row

- **WHEN** the operator opens the System Health page
- **THEN** the Total Evaluatees card is the first card of the key figures row
- **AND** it is not among the cards beside the chart

### Requirement: Coverage definition

An evaluatee is either a deployment of one of three kinds, told apart by the type its listing entry reports —
a **model** (`dial-model`), an **application** (`dial-application`) or a **toolset** (`dial-toolset`) — or a
**route**. An application that also exposes the MCP interface is an application, not a toolset. The page SHALL
read the deployments with one listing request and split them into the three kinds itself, and SHALL read the
routes with one further request to the platform route listing, counting its items and not its folders. A route
is not a deployment and SHALL NOT be looked for in the deployment listing.

An evaluatee SHALL be **covered** when at least one test suite run targeting it started within the last
30 days, counting back from the current time, and the suite that produced the run still exists. A deployment
SHALL be matched by its deployment id whichever of the suite's deployment reference or MCP
deployment reference carries it, so an application that a suite reaches through an MCP tool is covered just
as one the suite calls directly. A route SHALL be matched by its name through the suite's route reference,
however the name is written: the suite stores it with the platform route prefix and the listing does not, and
the two SHALL count as the same route. A route reference SHALL cover only a route, and a deployment reference
only a deployment. The covered count of a kind SHALL count each evaluatee once, however many suites or runs
target it, and SHALL count only evaluatees that still exist. The uncovered count SHALL be the total minus the
covered count, and the percentage SHALL be covered divided by total.

#### Scenario: Many runs on one evaluatee count once

- **WHEN** one model has three runs in the last 30 days, from two different suites
- **THEN** that model adds one to the Total Models covered count

#### Scenario: Runs older than 30 days do not cover

- **WHEN** a model's only run started 31 days ago
- **THEN** that model is counted as uncovered

#### Scenario: A deleted suite's runs do not cover

- **WHEN** a model's only run in the last 30 days belongs to a test suite that has since been deleted
- **THEN** that model is counted as uncovered

#### Scenario: An evaluatee that is no longer deployed is not counted

- **WHEN** a run in the last 30 days targets a model that no longer appears in the deployment listing
- **THEN** neither the total nor the covered count of Total Models includes it

#### Scenario: Evaluatees are split by the type the listing reports

- **WHEN** the one deployment listing holds 425 `dial-model`, 1572 `dial-application` and 490 `dial-toolset` entries
- **THEN** the Total Models card counts 425, Total Applications 1572 and Total Toolsets 490

#### Scenario: An application that exposes MCP is not counted as a toolset

- **WHEN** a `dial-application` entry also exposes the MCP interface
- **THEN** it is counted once, as an application, and not in Total Toolsets

#### Scenario: An application reached through an MCP tool is covered

- **WHEN** a `dial-application` entry exposes the MCP interface, and its only run in the last 30 days belongs
  to a suite that targets it through an MCP tool
- **THEN** that application is counted as covered in Total Applications

#### Scenario: A route targeted by a suite is covered

- **WHEN** a route named `echo` is listed and a run started 5 days ago belongs to a suite whose route
  reference names `routes/platform/echo`
- **THEN** that route is counted as covered in Total Routes

#### Scenario: Many runs on one route count once

- **WHEN** one route has three runs in the last 30 days, from two different suites
- **THEN** that route adds one to the Total Routes covered count

#### Scenario: A route's runs older than 30 days do not cover

- **WHEN** a route's only run started 31 days ago
- **THEN** that route is counted as uncovered

#### Scenario: A deleted suite's runs do not cover a route

- **WHEN** a route's only run in the last 30 days belongs to a test suite that has since been deleted
- **THEN** that route is counted as uncovered

#### Scenario: A route that no longer exists is not counted

- **WHEN** a run in the last 30 days targets a route that no longer appears in the route listing
- **THEN** neither the total nor the covered count of Total Routes includes it

#### Scenario: Folders are not routes

- **WHEN** the route listing holds 9 items and 2 folders
- **THEN** the Total Routes card counts 9

#### Scenario: A route is not looked for among deployments

- **WHEN** the deployment listing holds no entry that stands for a route
- **THEN** the Total Routes card still counts the routes the route listing holds

### Requirement: Total Evaluatees aggregates the kinds

The Total Evaluatees card SHALL be computed over the union of the four kinds: its total SHALL be the sum
of the model, application, toolset and route totals, and its covered count the sum of their covered counts.
The card SHALL carry an info control whose tooltip states the coverage rule: an evaluatee is covered if at
least one test suite has run on it in the last 30 days, and an uncovered evaluatee has no quality signal.
The tooltip SHALL be reachable by keyboard focus as well as hover.

#### Scenario: Totals are summed

- **WHEN** there are 118 models, 224 applications, 45 toolsets and 12 routes, with 6, 11, 7 and 2 uncovered
- **THEN** the Total Evaluatees card shows `399 total · 26 uncovered` and `93.5%`

#### Scenario: Routes alone make up the evaluatees

- **WHEN** no model, application or toolset is deployed, and 4 routes exist with 1 uncovered
- **THEN** the Total Evaluatees card shows `4 total · 1 uncovered` and `75%`

#### Scenario: Tooltip explains coverage

- **WHEN** the operator hovers or focuses the info control on the Total Evaluatees card
- **THEN** a tooltip states that an evaluatee is covered if at least one test suite has run on it in the
  last 30 days

### Requirement: Card loading and error states

Each card SHALL show a loading indicator while its data is pending, and an error message with an alert
role if its data failed to load. A card depends on the sources that feed its figures, and SHALL be in the
error state as soon as any of them has failed and otherwise in the loading state until all have returned. The
three sources are the deployment listing, the route listing and the coverage query. Total Models, Total
Applications and Total Toolsets depend on the deployment listing and the coverage query; Total Routes on the
route listing and the coverage query; Total Evaluatees on all three, since without each it cannot state its
total and covered count. A card SHALL NOT wait for, or be put in error by, a source it does not depend on.

#### Scenario: Loading

- **WHEN** the page has just opened and no data has returned
- **THEN** every card shows a loading indicator and no percentage

#### Scenario: Only one source has returned

- **WHEN** the deployment listing has returned and the coverage query has not
- **THEN** every card still shows a loading indicator

#### Scenario: The route listing is the last to return

- **WHEN** the deployment listing and the coverage query have returned and the route listing has not
- **THEN** Total Models, Total Applications and Total Toolsets show their figures
- **AND** Total Routes and Total Evaluatees still show a loading indicator

#### Scenario: The deployment listing fails

- **WHEN** the deployment listing fails
- **THEN** Total Models, Total Applications, Total Toolsets and Total Evaluatees show an error message
- **AND** Total Routes shows its figure once the route listing and the coverage query have returned

#### Scenario: The route listing fails

- **WHEN** the route listing fails
- **THEN** Total Routes and Total Evaluatees show an error message
- **AND** Total Models, Total Applications and Total Toolsets show their figures

#### Scenario: The coverage query fails

- **WHEN** the coverage query fails
- **THEN** all five cards show an error message

### Requirement: Run trends table

The System Health page SHALL show an **Evaluation Run Trends** table below the summary cards and the health
distribution chart, at the full width of the page. Each row
SHALL stand for one test suite that has at least one recorded completed run, and SHALL show, in order, the
**Test suite**, the **Evaluatee** it targets, the **Run trends - 10 runs** bars of its recent pass rate, the
**Latest** pass rate, and the **Δ prev** change. There SHALL be no separate Type column: the evaluatee's type
is part of the Evaluatee cell. The table SHALL read its rows from the evaluation analytics endpoint
`GET /api/v1/analytics/test-suites/run-trends`, and SHALL NOT offer sorting or filtering.

#### Scenario: Columns and heading

- **WHEN** the page has loaded run trends
- **THEN** a table headed Evaluation Run Trends is shown below the summary cards and the chart
- **AND** its columns are Test suite, Evaluatee, Run trends - 10 runs, Latest and Δ prev, in that order

#### Scenario: Backend order is kept

- **WHEN** the endpoint returns suites ordered by latest pass rate ascending
- **THEN** the rows appear in that order, the lowest latest pass rate first
- **AND** a suite with no latest pass rate appears after those that have one
- **AND** no column can be sorted

### Requirement: Run trends placement

The Evaluation Run Trends table SHALL take the full width of the page, on a row of its own below the summary
cards and the Test suite health distribution chart, on every screen width.

#### Scenario: Standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the Evaluation Run Trends table takes the full width of the page
- **AND** the summary cards and the Test suite health distribution chart are above it, not beside it

#### Scenario: Small screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Evaluation Run Trends table takes the full width
- **AND** it is shown below the chart

## REMOVED Requirements

### Requirement: Test suites added this month

**Reason**: It states that a test suite targeting a route targets no evaluatee. Routes are evaluatees now, so
that rule and its scenario are wrong; the requirement is restated below under a name that says what changed.

**Migration**: See "Test suites added counts evaluatees including routes". The count, the caption form, the
delta and every scenario but the route one are unchanged.

### Requirement: Activity card row

**Reason**: The activity cards no longer have a row of their own under the coverage cards: they share the key
figures row with the Total Evaluatees card.

**Migration**: See "Key figures row".

## ADDED Requirements

### Requirement: Test suites added counts evaluatees including routes

The **Test suites added this month** card SHALL show the number of test suites created in the current
period. Its caption SHALL state across how many evaluatees they are: the number of distinct models,
applications, toolsets and routes that those test suites target, each counted once. Its delta SHALL be the
count minus the number of test suites created in the previous period.

#### Scenario: Count and evaluatees

- **WHEN** 47 test suites were created in the current period and together they target 31 distinct
  deployments
- **THEN** the card shows `47`
- **AND** its caption reads `across 31 evaluatees`

#### Scenario: Singular caption

- **WHEN** the test suites created in the current period target one deployment
- **THEN** the caption reads `across 1 evaluatee`

#### Scenario: A route-targeted suite adds an evaluatee

- **WHEN** a test suite created in the current period targets a route
- **THEN** it adds one to the count and one to the number of evaluatees

#### Scenario: Suites on one route count it once

- **WHEN** three test suites created in the current period target the same route
- **THEN** they add three to the count and one to the number of evaluatees

#### Scenario: Routes and deployments are counted together

- **WHEN** test suites created in the current period target 2 models, 1 toolset and 3 routes
- **THEN** the caption reads `across 6 evaluatees`

#### Scenario: Delta against the previous period

- **WHEN** 47 test suites were created in the current period and 38 in the previous period
- **THEN** the delta badge reads `+9 vs prev. period`

### Requirement: Key figures row

The first row of the page SHALL hold four cards, in this order: **Total Evaluatees**, **Test suites run this
month**, **Test suites added this month** and **Eval cost this month**. Each activity card SHALL show its
figure, a line beneath it, and a delta badge against the previous period. On a standard screen the four cards
SHALL share one line. As the screen narrows they SHALL be laid out three to a line, then two, then one.

#### Scenario: Four cards in order

- **WHEN** the operator opens the System Health page
- **THEN** the first row holds four cards, titled Total Evaluatees, Test suites run this month, Test suites
  added this month and Eval cost this month, in that order

#### Scenario: One line on a standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the four cards of the first row share one line

#### Scenario: Fewer to a line as the screen narrows

- **WHEN** the screen is narrower than the standard width but still wide
- **THEN** the first row shows three cards to a line, and the fourth alone on the next
- **AND** on a narrower screen two cards to a line, and on a phone-width screen one

### Requirement: Coverage cards beside the health distribution chart

Below the key figures row the page SHALL render a block of four coverage cards — **Total Models**, **Total
Applications**, **Total Toolsets** and **Total Routes** — beside the Test suite health distribution chart. On a
standard screen the block SHALL take the left half of the row, two cards wide and two lines tall, read left to
right and top to bottom, and the chart the right half; the two lines SHALL stretch so that the block is as tall
as the chart. On a narrower screen the chart SHALL take the full width, below the block, and the block's cards
SHALL be laid out three to a line, then two, then one, as the screen narrows.

#### Scenario: Two cards to a line

- **WHEN** the page is shown on a standard-width screen
- **THEN** Total Models and Total Applications share the first line of the block
- **AND** Total Toolsets and Total Routes share the second

#### Scenario: Block and chart share a row

- **WHEN** the page is shown on a standard-width screen
- **THEN** the block takes the left half of its row
- **AND** the Test suite health distribution chart takes the right half
- **AND** the block is as tall as the chart

#### Scenario: Narrower screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Test suite health distribution chart takes the full width, below the block
- **AND** the block's cards are three to a line, then two, then one as the screen narrows
