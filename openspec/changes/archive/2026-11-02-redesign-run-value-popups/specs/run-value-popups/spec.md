## Purpose

The two popups a run's value cells open: the text popup for plain values and the score popup for metric
values. Shared by the single run's side panel and bottom panel and by the Compare panels, so every surface
shows a value's details the same way.

## ADDED Requirements

### Requirement: Text popup shows the full value

Opening a non-metric value SHALL show a popup titled with the field name, with a close control, and the
complete value in a monospace font that scrolls when it does not fit. A value that is JSON SHALL be shown
pretty-printed; any other value SHALL be shown as is. The popup SHALL close on its close control and on
Escape.

#### Scenario: Plain text value
- **WHEN** a non-metric value cell is opened
- **THEN** a popup opens with the field name as its title and the complete text in monospace

#### Scenario: Long value scrolls
- **WHEN** the value is taller than the popup
- **THEN** the popup body scrolls and the title stays visible

#### Scenario: JSON value is pretty-printed
- **WHEN** the value is a JSON object or array
- **THEN** it is shown indented over several lines

#### Scenario: Popup closes
- **WHEN** the user activates the close control or presses Escape
- **THEN** the popup closes and focus returns to the cell that opened it

### Requirement: Metric values open a score popup

Opening a metric value SHALL show a popup titled with the metric name. It SHALL contain one column per
displayed run, in the displayed run order; a single run's popup has one column and no run header, a
comparison's popup has a run tag and name above each column. Each column SHALL start with a Score card
holding the label `Score` and the score as a chip. The chip SHALL be coloured by the same absolute score
bucket as the value's cell, SHALL read `Error` when the metric failed, and SHALL read `—` when the run has
no value. A run without a match in a comparison SHALL show the no-match text instead of the cards.

#### Scenario: Score chip follows the score bucket
- **WHEN** a metric value cell with a numeric score is opened
- **THEN** the popup shows the Score card with the score as a chip in that score's bucket colour

#### Scenario: Failed metric shows the error chip
- **WHEN** a failed metric value cell is opened
- **THEN** the Score card shows an `Error` chip in the neutral colour

#### Scenario: Single run has one column
- **WHEN** a metric cell of a single run is opened
- **THEN** the popup shows one column with no run tag

#### Scenario: Comparison has one column per run
- **WHEN** a metric cell of a comparison is opened
- **THEN** the popup shows a column for each run in the displayed order, each headed by its run tag and name

#### Scenario: Run without a match
- **WHEN** the compared run has no counterpart row
- **THEN** its column shows the no-match text and no Score, reason or logs cards

### Requirement: Score popup shows reason and logs

Below the Score card each column SHALL show a `reason` card and a `logs` card. `reason` is the metric
leaf's `reason` from the run's metric info and `logs` is its `verbose_logs`. Each card SHALL be collapsible,
SHALL show a size label and a Copy button, and its body SHALL show the text with line numbers and syntax
highlighting for its language. No card SHALL have a fullscreen button. The `reason` card SHALL be open when
the popup opens and the `logs` card
closed. Only one card SHALL be open at a time: opening one closes the other, in every column. A run with
nothing under a card SHALL get no such card. For a failed metric that has no reason of its own, the first
card SHALL be titled `Error` and SHALL show the metric's error message: the one on the metric's own info entry,
or, when it has none, the one on its metric group.

#### Scenario: Reason is open by default
- **WHEN** the score popup opens for a metric that has a reason and logs
- **THEN** the `reason` card is expanded and the `logs` card is collapsed

#### Scenario: Opening a card closes the other
- **WHEN** the `reason` card is open and the user opens the `logs` card
- **THEN** the `reason` card closes and the `logs` card opens

#### Scenario: Card is shown only when there is content
- **WHEN** a run has no `verbose_logs`
- **THEN** its column shows no `logs` card

#### Scenario: Failed metric shows the metric's own error
- **WHEN** a metric failed and its own info entry holds an error message and no reason
- **THEN** the Score card shows `Error` and an `Error` card shows that message

#### Scenario: Failed metric shows the group error
- **WHEN** a metric failed and its metric group holds an error message and no reason of its own
- **THEN** the Score card shows `Error` and an `Error` card shows the message

#### Scenario: Copy a card's text
- **WHEN** the user activates a card's Copy button
- **THEN** the card's text is copied and the copy is announced

#### Scenario: Expanding in a comparison expands every column
- **WHEN** the user expands the `logs` card in one column of a comparison
- **THEN** the `logs` card is expanded in the other columns too

### Requirement: Comparison score popup highlights differing reasons

In a comparison's score popup, when both runs have a reason and the `reason` cards are open, the words that
differ SHALL be highlighted in each run's text with the diff colours of the Execution Results grid: a word
changed between the runs carries the change highlight on both sides, a word only the first run has carries
the removal highlight, and a word only the other run has carries the addition highlight.

#### Scenario: Differing words are highlighted
- **WHEN** both runs have a reason and the `reason` cards are open
- **THEN** the differing words are highlighted in each run's text

#### Scenario: A word changed between the runs is highlighted on both sides
- **WHEN** the same word position holds a different word in each run
- **THEN** both words carry the change highlight

#### Scenario: A single run has no diff
- **WHEN** a single run's score popup is open
- **THEN** no text is highlighted
