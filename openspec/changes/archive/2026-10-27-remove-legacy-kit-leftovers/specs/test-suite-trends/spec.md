## MODIFIED Requirements

### Requirement: Trends tab-line Preview runs badge
When the Trends tab is active, the system SHALL render a Preview runs badge on the entity tab line
(trailing the tabs). Preview runs SHALL reflect the Trends-window `runCount`: “Last 10 Runs”
when at least 10 runs are shown, “Last {N} Runs” when fewer than 10, and “Last 1 Run” when N is 1.

#### Scenario: Preview runs shows full window
- **WHEN** the Trends tab is active and the Trends window has at least 10 runs
- **THEN** the Preview runs badge shows “Last 10 Runs”

#### Scenario: Preview runs shows partial window
- **WHEN** the Trends tab is active and the Trends window has 3 runs
- **THEN** the Preview runs badge shows “Last 3 Runs”

#### Scenario: Preview runs shows singular for one run
- **WHEN** the Trends tab is active and the Trends window has exactly 1 run
- **THEN** the Preview runs badge shows “Last 1 Run”
