## Purpose

Defines the dashboard's activity heatmap: a day-by-hour grid of call volume that shows when traffic
arrives, which a time series at the page's own resolution flattens away.

## ADDED Requirements

### Requirement: The heatmap paints the figure the reader picks

The heatmap SHALL offer a switch between the figures it can paint per hour — requests and cost —
placed with the week pager, since both decide what the grid shows: one which week, the other which
figure.

Both figures SHALL be read from the heatmap's own hourly response rather than a second request, so
switching paints what is already in hand. The shading ceiling SHALL follow the active figure: an
hour's cost has nothing to do with the busiest hour's call count.

Cost SHALL be offered in the LLM view only. An MCP row carries no price, so the grid there would be
a week of empty cells. An hour with no price SHALL read as nothing rather than as its call count.

A cell SHALL state the active figure in its own words — a count of requests, or an amount spent —
in both its tooltip and the label a screen reader reads.

#### Scenario: Switching the figure repaints the grid

- **GIVEN** the LLM view's heatmap on requests
- **WHEN** the reader switches to cost
- **THEN** the cells shade by the cost of each hour
- **AND** no further request is issued

#### Scenario: The MCP view offers no cost

- **WHEN** the MCP view's heatmap renders
- **THEN** it offers requests alone

#### Scenario: A cell names the figure it carries

- **GIVEN** the grid is painting cost
- **WHEN** the reader hovers an hour
- **THEN** the tooltip states that hour and the amount, with no word between them

### Requirement: The heatmap is a day-by-hour grid over the current window

The dashboard SHALL render a heatmap whose rows are days and whose columns are the 24 hours of a
day, each cell carrying the call count for that hour of that day within the current window. Cells
SHALL be read from the bucketed request, restricted to the current window; the previous window SHALL
NOT be plotted.

The hour axis SHALL state the timezone it is drawn in, because an hour-of-day reading is meaningless
without one. A window shorter than one day SHALL still render, showing the hours it covers.

A window whose span exceeds what the grid can show legibly SHALL render the most recent days that
fit and state that it is truncated, rather than compressing every day into an unreadable row.

#### Scenario: Seven-day window renders seven day rows

- **GIVEN** the period covers seven days
- **WHEN** the heatmap renders
- **THEN** it shows seven day rows and 24 hour columns
- **AND** the hour axis states its timezone

#### Scenario: Sub-day window renders the hours it covers

- **GIVEN** the period covers six hours
- **WHEN** the heatmap renders
- **THEN** it renders the covered hours rather than an empty grid

#### Scenario: Over-long window is truncated with a statement

- **GIVEN** the period covers more days than the grid can render legibly
- **WHEN** the heatmap renders
- **THEN** it shows the most recent days that fit
- **AND** it states that earlier days are not shown

### Requirement: Intensity is relative to the window and readable without colour alone

Cell intensity SHALL be scaled against the window's own maximum cell, so the grid always uses its
full range. The heatmap SHALL carry a legend naming the low and high ends of that scale with their
values, so intensity is quantified rather than merely ordered.

An hour with no calls SHALL be visually distinct from the lowest non-zero intensity — an empty hour
and a quiet hour are different facts. Every cell's exact value SHALL be reachable on hover and
through its accessible name, so the grid does not depend on colour discrimination to be read.

#### Scenario: Scale is relative to the window maximum

- **GIVEN** the busiest hour in the window carries 500 calls
- **WHEN** the heatmap renders
- **THEN** that cell renders at the high end of the scale
- **AND** the legend names the value at each end

#### Scenario: Empty hour differs from a quiet hour

- **GIVEN** one hour carries no calls and another carries one call
- **WHEN** the heatmap renders
- **THEN** the two cells are visually distinct

#### Scenario: Cell value is reachable without colour

- **WHEN** the user hovers or focuses a cell
- **THEN** the cell's day, hour and exact call count are stated

### Requirement: The heatmap follows the view and the page filters

The heatmap SHALL plot the active view's calls — model calls or MCP calls — and SHALL
honour the page's applied entity and project filters. Switching view SHALL replot it from the new
view's bucketed request without leaving the previous view's cells in place.

#### Scenario: Switching view replots the grid

- **GIVEN** the heatmap shows model calls
- **WHEN** the user switches `View by` to MCP
- **THEN** the grid replots MCP calls
- **AND** no cell from the previous view remains

#### Scenario: Filters narrow the grid

- **GIVEN** a project filter is applied
- **WHEN** the heatmap renders
- **THEN** its cells count only calls matching that filter
