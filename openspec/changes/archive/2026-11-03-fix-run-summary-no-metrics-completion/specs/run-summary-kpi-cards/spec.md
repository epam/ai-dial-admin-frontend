## ADDED Requirements

### Requirement: Test case counts do not depend on metrics

The Test Cases Completed and rate cards SHALL show correct counts for a run whose suite has no metrics, where
the per-test-case score table has no rows. The *total* SHALL be the run's reported number of test cases once
the run has finished (any status other than PENDING, RUNNING or CANCELLING); for a run still in flight it
SHALL be the number of test cases seen so far. When the run has score rows the counts SHALL come from them
exactly as for any run with metrics. When it has none, the counts SHALL be derived from the run's executions:
each test case is **completed** only when every one of its executions succeeded; every other executed test
case, and every test case of the run with no execution, is **Error or N/A**. Repeat executions of one test case
SHALL count as one test case. The threshold treatment — the Threshold Pass Rate title, the Threshold line and the
Above threshold and Below threshold rows — SHALL apply only when score rows exist; without them the counts are
rated by completion. In the Run Comparison with matching-only enabled, the executions considered SHALL be limited to the
matched ones and the total SHALL be the number of matched test cases seen.

#### Scenario: A run without metrics completes normally
- **WHEN** a COMPLETED run reports 4 test cases, has no score rows, and all 4 test cases have only successful
  executions
- **THEN** Test Cases Completed shows `4` with `/4` and no error line
- **AND** the rate card is titled Completion Rate and shows `100%`
- **AND** neither card shows the Error badge

#### Scenario: Repeat executions count as one test case
- **WHEN** a run without metrics reports 2 test cases and each was executed 3 times, all successfully
- **THEN** Test Cases Completed shows `2` with `/2`, not `/6`

#### Scenario: A test case with a failed execution is not completed
- **WHEN** a run without metrics reports 3 test cases, one with executions SUCCESS and FAILED, one with only
  SUCCESS, and one with only SUCCESS
- **THEN** Test Cases Completed shows `2` with `/3` and an error line reading `1 Error`

#### Scenario: A test case that never executed is N/A
- **WHEN** a finished run without metrics reports 3 test cases but only 1 has any execution, and it succeeded
- **THEN** Test Cases Completed shows `1` with `/3` and an error line reading `2 Error`
- **AND** the tooltip lists Total test cases 3, Completed 1 and Error or N/A 2

#### Scenario: A threshold without score rows is rated by completion
- **WHEN** the run's suite snapshot has a threshold but the run has no score rows yet
- **THEN** the rate card is titled Completion Rate and shows no Threshold line
- **AND** the Test Cases Completed tooltip shows no Above threshold or Below threshold rows

#### Scenario: A run with metrics is unchanged
- **WHEN** a run has score rows
- **THEN** its counts and its Above threshold and Below threshold rows come from those rows
- **AND** no execution query is made for it

#### Scenario: No threshold rows without scores
- **WHEN** the counts were derived from executions
- **AND** the user hovers the value
- **THEN** the tooltip shows no Above threshold or Below threshold rows

#### Scenario: An in-flight run reports what has been seen
- **WHEN** a RUNNING run without metrics reports 10 test cases and 3 have finished successfully
- **THEN** the total reflects the 3 seen so far, not 10, and the card does not count the unstarted ones as errors

#### Scenario: Matching-only limits the fallback to matched executions
- **WHEN** the comparison is limited to matching test cases and a run without metrics has executions outside the
  matched set
- **THEN** only the matched executions are counted for that run

## MODIFIED Requirements

### Requirement: Test Cases Completed card

The Test Cases Completed card SHALL show `<completed> /<total>` as its value, where *total* is every test
case of the run and *completed* is the number of test cases that finished successfully: when the suite
snapshot has a threshold, SUCCESS cases whose `passed` is true or false; when it has none, every SUCCESS
case. Everything else (non-SUCCESS execution, or SUCCESS with no threshold outcome while a threshold is set)
is **Error or N/A**. How the counts are obtained for a run without metrics is specified in "Test case counts do
not depend on metrics". Below the value the card SHALL show the Error-or-N/A count with the error glyph and an
"Error" label, and SHALL show nothing there when that count is zero. Hovering or focusing the value SHALL open a
tooltip listing **Total test cases**, **Completed**, and — only when a threshold is set and score rows exist —
indented **Above threshold** and **Below threshold** rows, then **Error or N/A**, each with its count. When the
run reports no test cases the value SHALL be an em dash; the card SHALL show the Error badge when the run is not
in an incomplete status and an em dash otherwise. The absence of score rows alone SHALL NOT produce the Error
badge.

#### Scenario: Value and error line
- **WHEN** a run has 55 test cases, 45 completed and 10 Error or N/A
- **THEN** the card shows `45` with `/55` and an error line reading `10 Error`

#### Scenario: No errors hides the error line
- **WHEN** every test case completed, so Error or N/A is 0
- **THEN** the card shows the completed count and total
- **AND** no error glyph, count or "Error" label is shown

#### Scenario: Hover breakdown with a threshold
- **WHEN** the threshold is set, 20 completed cases are at or above it, 25 below it and 10 are Error or N/A
- **AND** the user hovers the value
- **THEN** the tooltip shows Total test cases 55, Completed 45, Above threshold 20, Below threshold 25 and
  Error or N/A 10

#### Scenario: Hover breakdown without a threshold
- **WHEN** the suite has no threshold and the user hovers the value
- **THEN** the tooltip shows Total test cases, Completed and Error or N/A
- **AND** it shows no Above threshold or Below threshold rows

#### Scenario: Keyboard users reach the breakdown
- **WHEN** the value receives keyboard focus
- **THEN** the same tooltip opens

#### Scenario: No test cases
- **WHEN** a COMPLETED run reports no test cases at all
- **THEN** the card shows the Error badge in place of the value
- **AND** the same run in an incomplete status shows an em dash
