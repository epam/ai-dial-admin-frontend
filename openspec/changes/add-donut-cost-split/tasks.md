## 1. Cost split on the share chart

- [x] 1.1 Add the module's donut-measure enum and offer `Calls` and `Cost` on the card, with `Calls`
      first and selected, and the choice absent in the MCP view.
- [x] 1.2 Give the tab query an explicit ranking key and rank the donut's request on the chosen
      measure, treating a change of measure as a new scope so the rows are re-read.
- [x] 1.3 Take the ring's values, its denominator, its centre figure and its legend from the chosen
      measure, rendering money with its marker.
- [x] 1.4 Reset the measure to `Calls` when the view switches, since the MCP view prices nothing.
- [x] 1.5 Unit tests: the ranking key, the measure switch per view, the money rendering, and the
      callback that re-takes the ranking.
