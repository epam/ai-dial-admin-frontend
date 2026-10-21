## MODIFIED Requirements

### Requirement: Drawer displays two-run comparison for the clicked row

The compare row-detail panel SHALL display a side-by-side comparison between the primary and compared run results for the selected test case, including diff highlighting and counts. The Diff counts SHALL cover only the fields the panel currently shows, and SHALL be recalculated whenever the shown fields change in Display > Rows.

#### Scenario: Both runs have a matching result
- **WHEN** the user opens a row where both runs have a result
- **THEN** the panel shows primary and compared values
- **AND** diff count and highlighting are computed between the two sides

#### Scenario: No match in compared run
- **WHEN** the user opens a row whose `_compared` field is null
- **THEN** the panel opens and shows the primary result
- **AND** a placeholder indicates no match on the compared side

#### Scenario: Diff counter follows Display > Rows
- **WHEN** the user opens a row with differing values in several metric groups and, in Display > Rows, leaves only one group enabled
- **THEN** the panel shows only that group
- **AND** the Diff counter counts only the differing fields of that group

#### Scenario: Diff counter recalculates when a group is re-enabled
- **WHEN** the user enables another group in Display > Rows
- **THEN** the Diff counter increases by the differing fields of that group

#### Scenario: Diff counter is consistent in both panel positions
- **WHEN** the same Display > Rows selection is applied in the bottom panel and in the side panel
- **THEN** both panels show the same Diff counter
