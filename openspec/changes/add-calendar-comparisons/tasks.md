## 1. Calendar comparisons

- [x] 1.1 Add `PreviousMonth` and `PreviousYear` to the module's compare enum and offer both in the
      `Compare` selector, after `Previous period`.
- [x] 1.2 Add the calendar shift to `Usage/utils/windows.ts`: take the window back by whole months,
      keep its duration rather than its end date, and clamp a day the target month does not have.
      Set the day to the 1st before moving the month, so 31 March does not roll into early March.
- [x] 1.3 Name the compared window in a KPI card's footnote, and take the period out of the delta's
      screen-reader text, which renders where the selection is not known.
- [x] 1.4 Unit tests: the shift's date, duration, year crossing, clamped day and leap day; the
      selector offering both options; the footnote naming the selected one.
