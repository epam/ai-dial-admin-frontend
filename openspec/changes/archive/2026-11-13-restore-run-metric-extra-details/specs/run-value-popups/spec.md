## MODIFIED Requirements

### Requirement: Score popup shows reason and logs

Below the Score card each column SHALL show a `reason` card, a `details` card and a `logs` card, in that
order. `reason` is the metric leaf's `reason` from the run's metric info and `logs` is its `verbose_logs`.
`details` is every other key of that leaf's metric info entry, shown as indented JSON; a leaf entry that is
not an object SHALL be shown as is. A key whose value is `0`, `false`, an empty string or an empty list
SHALL still be shown. Each card SHALL be collapsible, SHALL show a size label and a Copy button, and its body
SHALL show the text with line numbers and syntax highlighting for its language. No card SHALL have a
fullscreen button. The `reason` card SHALL be open when the popup opens and the others closed, except that
when no column has a `reason` the first card any column has SHALL be open instead. Only one card SHALL be open
at a time: opening one closes the others, in every column. A run with nothing under a card SHALL get no such
card. For a failed metric that has no reason of its own, the first card SHALL be titled `Error` and SHALL show
the metric's error message: the one on the metric's own info entry, or, when it has none, the one on its
metric group. The message SHALL NOT also appear under `details`.

#### Scenario: Reason is open by default
- **WHEN** the score popup opens for a metric that has a reason, details and logs
- **THEN** the `reason` card is expanded and the `details` and `logs` cards are collapsed

#### Scenario: Opening a card closes the other
- **WHEN** the `reason` card is open and the user opens the `logs` card
- **THEN** the `reason` card closes and the `logs` card opens

#### Scenario: Card is shown only when there is content
- **WHEN** a run has no `verbose_logs`
- **THEN** its column shows no `logs` card

#### Scenario: Metric-specific keys appear under details
- **WHEN** a metric's info entry holds `tp`, `fp`, `fn`, `true_positives`, `false_positives` and
  `false_negatives` and no `reason`
- **THEN** the popup shows a `details` card whose JSON holds all six keys, with `0` counts and empty lists
  included

#### Scenario: Details is open when there is no reason
- **WHEN** the score popup opens for a metric that has details and no reason in any column
- **THEN** the `details` card is expanded

#### Scenario: Details is shown in every surface
- **WHEN** a metric cell with extra info keys is opened from the side panel, the bottom drawer, or a comparison
- **THEN** the score popup shows the `details` card

#### Scenario: Reserved keys are not repeated under details
- **WHEN** a metric's info entry holds `reason`, `verbose_logs` and `tp`
- **THEN** `details` holds `tp` only

#### Scenario: Non-object entry is shown as is
- **WHEN** a metric's info entry is a plain string
- **THEN** the `details` card shows that string

#### Scenario: Failed metric shows the metric's own error
- **WHEN** a metric failed and its own info entry holds an error message and no reason
- **THEN** the Score card shows `Error` and an `Error` card shows that message, and `details` does not repeat it

#### Scenario: Failed metric shows the group error
- **WHEN** a metric failed and its metric group holds an error message and no reason of its own
- **THEN** the Score card shows `Error` and an `Error` card shows the message

#### Scenario: Copy a card's text
- **WHEN** the user activates a card's Copy button
- **THEN** the card's text is copied and the copy is announced

#### Scenario: Expanding in a comparison expands every column
- **WHEN** the user expands the `logs` card in one column of a comparison
- **THEN** the `logs` card is expanded in the other columns too
