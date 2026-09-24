## ADDED Requirements

### Requirement: The split plot draws each series from zero

The plot that splits the window across the view's leading dimension SHALL draw every series from a
shared zero baseline, not stacked. A stack draws each series at its cumulative height, so the
topmost series' line traces the bucket total and is read as that series' own figure — a model
credited with the whole window's spike while the share chart beside it states a fraction of that.

Each series' value SHALL therefore be readable against the axis, and a spike SHALL belong to the
series that caused it. Series areas SHALL be drawn faintly enough to read where they overlap, which
a stack's never did.

The window total SHALL NOT be stated by this plot. It is not lost from the page: the plain plot
states the total and the share chart states composition, so the three surfaces answer three
questions rather than two of them answering composition.

#### Scenario: A spike belongs to one series

- **GIVEN** one entity accounts for most of a bucket's calls
- **WHEN** the split plot renders
- **THEN** that entity's line reaches its own figure
- **AND** no other series' line is raised by it

#### Scenario: A value is read off the axis

- **WHEN** a reader follows a series to the axis
- **THEN** the value they read is that series' own

### Requirement: A breakdown row's label has one tooltip

A dimension cell SHALL truncate its label in exactly one element, and that element SHALL own the
tooltip revealing the full name. Where the cell and its inner element both clipped the text, each
believed it was the one truncated and the pointer drew two tooltips carrying the same name, beside
a third from the row's info icon.

The info icon's own tooltip SHALL remain its own: it explains what the row is, which is a different
question from what the row is called.

#### Scenario: A truncated label reveals itself once

- **GIVEN** a row whose name does not fit its column
- **WHEN** the reader hovers the name
- **THEN** one tooltip states the full name

#### Scenario: The icon keeps its own explanation

- **GIVEN** a fallback row carrying an info icon
- **WHEN** the reader hovers the icon
- **THEN** the explanation is shown
