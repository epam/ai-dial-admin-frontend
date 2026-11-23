## RENAMED Requirements

- FROM: `### Requirement: Activating a row opens the run`
- TO: `### Requirement: A run opens through its name link`

## MODIFIED Requirements

### Requirement: A run opens through its name link

Clicking a run's name link SHALL open that run's details page in the same tab. A click with ctrl / cmd
held, or a middle click, SHALL open it in a new tab instead. A click elsewhere in the row, including the
row-actions column, SHALL NOT navigate. This SHALL hold on both the unscoped runs list and a
suite-scoped one.

#### Scenario: A plain click navigates in place

- **WHEN** the operator clicks a run's name link on a suite's Runs tab
- **THEN** the app navigates to that run's details page in the same tab

#### Scenario: A modified click opens a new tab

- **WHEN** the operator ctrl / cmd clicks or middle-clicks a run's name link
- **THEN** that run's details page opens in a new tab and the list stays as it is

#### Scenario: A click outside the name does not navigate

- **WHEN** the operator clicks a run row outside its name link
- **THEN** no navigation occurs

#### Scenario: The actions column does not navigate

- **WHEN** the operator clicks within a row's actions column
- **THEN** no navigation occurs
