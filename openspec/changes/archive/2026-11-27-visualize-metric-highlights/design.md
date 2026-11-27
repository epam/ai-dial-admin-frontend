## Context

`highlight` lives on the metric leaf's `metricInfos` entry, next to `reason` /
`verbose_logs` / `json_explanation`. The popup already splits those into cards via
`getDetailFields`. The pivot only walked `metricValues`, so the highlight never became
a column.

## Goals / Non-Goals

**Goals:**
- Add a pivot column per leaf that has `metricInfos[group][leaf].highlight`.
- Color chunks with the existing delta score palette in the cell.

**Non-Goals:**
- Touching the score popup.
- Main results grid / Compare surfaces.

## Decisions

**1. Source is `metricInfos`, not `metricValues`.**
Inject the column in `buildComparisonSections` after each value leaf when
`getMetricInfoHighlightRaw` finds a `highlight` key.

**2. Field key `leaf:highlight`, label `{leaf} highlight`.**
Keeps keys unique when several leaves have highlights; the header includes the leaf name
so multiple highlight columns in one group stay distinguishable (e.g. `precision highlight`).

**3. `isMetric: false` on highlight fields.**
They sit in a metric section but open the text popup, not `ScoreModal`.

**4. Cell coloring via `FieldValue` + `parseMetricHighlight`.**
No popup changes; clicking the column uses the existing fullscreen text viewer for the
raw JSON.

## Risks / Trade-offs

- [All-zero scores] Neutral chunks look uncolored — expected; positive/negative still grade.
- [Large corpora] Fill layout already scrolls inside the pivot value cell.
