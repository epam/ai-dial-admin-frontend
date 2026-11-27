## MODIFIED Requirements

### Requirement: Activity card row

Below the coverage cards the page SHALL render a second row with three activity cards, in this order: **Test
suites run this month**, **Test suites added this month** and **Eval cost this month**. Each card SHALL show
its figure, a line beneath it, and a delta badge against the previous period. The cards SHALL share the grid
of the four coverage columns and sit in its first three columns.

#### Scenario: Two cards in order

- **WHEN** the operator opens the System Health page
- **THEN** the first two cards of the second row are titled Test suites run this month and Test suites added
  this month, in that order, below the four coverage cards

#### Scenario: Three cards in order

- **WHEN** the operator opens the System Health page
- **THEN** a second row holds three cards, titled Test suites run this month, Test suites added this month and
  Eval cost this month, in that order, below the four coverage cards

### Requirement: Figures follow the calendar while the page is open

The page SHALL reload its coverage, activity and eval cost figures when the local calendar day changes while
it stays open, deriving the 30-day coverage window and the month periods from the new day, and showing each
card's loading state until the figures return. It SHALL NOT reload while the day stays the same.

#### Scenario: The page stays open across a month boundary

- **WHEN** the page is open at 23:59 on 30 November and the clock passes midnight
- **THEN** the activity cards and the Eval cost card load again for 1 December against 1 November
- **AND** the coverage cards load again with their window counted back from the new time

#### Scenario: The day does not change

- **WHEN** the page stays open for an hour within one day
- **THEN** no figures are loaded again

## ADDED Requirements

### Requirement: Eval cost this month

The Eval cost card SHALL show the cost of all evaluation traffic over the current period, as US dollars with
thousands grouping, whole dollars when the amount has no cents and two decimals otherwise (`$4,218`,
`$4,218.50`). The cost is the platform-wide total of test-case execution and metric-evaluation judge calls,
over every deployment, with a request nested under an application counted once. The current and previous
periods SHALL be those of the other activity cards.

Beneath the total the card SHALL show the split as `<amount> evaluatees · <amount> judges`, the first being
the cost of running test cases against the evaluatees and the second the cost of the judge calls that score
them. An amount the backend did not report SHALL be shown as an em dash. When the period has no recorded cost
at all, the card SHALL show an em dash in place of the total and SHALL NOT show the split or a delta badge,
because no usage recorded is not the same as a measured zero.

#### Scenario: Cost recorded

- **WHEN** the current period's total is 4218, of which 2840 is test cases and 1378 judges
- **THEN** the card shows `$4,218`
- **AND** beneath it `$2,840 evaluatees · $1,378 judges`

#### Scenario: Cents

- **WHEN** the current period's total is 12.5
- **THEN** the card shows `$12.50`

#### Scenario: A phase with no usage

- **WHEN** the backend reports a total with a judge cost of 0
- **THEN** the split reads `$0 judges` for that part, not an em dash

#### Scenario: No cost recorded

- **WHEN** the backend reports no cost for the current period
- **THEN** the card shows an em dash instead of a total
- **AND** no split and no delta badge are shown

### Requirement: Eval cost delta badge

The Eval cost card SHALL show a badge with the signed difference between the current period's total and the
previous period's, in dollars formatted like the total, followed by `vs prev. period` (`+$342 vs prev.
period`). Because spending less is the better outcome, an increase SHALL be shown in the error colour and a
decrease in the success colour, the reverse of the count cards. No badge SHALL be shown when the difference
rounds to no change at the displayed precision of a cent, or when either period has no recorded cost. The
badge's periods SHALL be available to assistive technology as text naming the current and previous periods.

#### Scenario: Cost rose

- **WHEN** the current total is 4218 and the previous period's was 3876
- **THEN** an error-coloured badge reads `+$342 vs prev. period`

#### Scenario: Cost fell

- **WHEN** the current total is 3000 and the previous period's was 3214
- **THEN** a success-coloured badge reads `-$214 vs prev. period`

#### Scenario: Less than a cent of change

- **WHEN** the two totals differ by 0.003
- **THEN** no delta badge is shown

#### Scenario: Previous period has no cost

- **WHEN** the previous period has no recorded cost and the current one does
- **THEN** the current total is shown and no delta badge is shown

### Requirement: Eval cost loading and error states

The Eval cost card SHALL show a loading indicator while its figures are pending and an error message with an
alert role when either period's cost could not be loaded; it SHALL NOT show a total computed from only one of
the two periods, nor treat a failed period as a cost of zero. The card's state SHALL depend only on its own
cost request: a failure there SHALL NOT put a count card or a coverage card into the error state, and a failed
count query SHALL NOT put this card into the error state.

#### Scenario: Loading

- **WHEN** the page has just opened and the cost request has not returned
- **THEN** the Eval cost card shows a loading indicator and no total

#### Scenario: The cost request fails

- **WHEN** the cost request for the previous period fails and the one for the current period succeeds
- **THEN** the Eval cost card shows an error message
- **AND** both count cards show their counts

#### Scenario: A count query fails

- **WHEN** a count query of an activity card fails and the cost request succeeds
- **THEN** the Eval cost card shows its total
