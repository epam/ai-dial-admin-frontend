## Context

The Metrics tab already loads each bound metric with description, condition, bindings, and `outputSchema` via the aggregated + plain-list merge. The list UI was a separator row without Outputs. Figma node `11637:271525` defines a layer-2 card with fixed-width field labels and tag chips.

## Goals / Non-Goals

**Goals**
- Match the card shell, header actions, description expand, and field rows from Figma.
- Surface Outputs from existing `outputSchema.properties` without new requests.
- Keep Delete / Edit behavior and binding display values unchanged.

**Non-Goals**
- Add/Edit metric modal redesign.
- Overall Score card/modal (separate change).
- Backend or aggregated-fetch contract changes.

## Decisions

1. **Extract `MetricCard`** — Keeps `Metrics.tsx` orchestration-only; card owns presentation.
2. **Reuse `getBindingDisplayValue`** — Configuration/Inputs tags stay `{property}: {value}`; long values (≥80 chars or containing newlines) use `w-full whitespace-pre-wrap`.
3. **Outputs = schema property keys** — Same source as ScoreSettings (`Object.keys(outputSchema.properties)`); hide the row when empty.
4. **MetricCardDescription** — Card-local clamp + Show more control (tiny-semi accent + chevron per Figma). Shared `ExpandableText` stays on `DialLinkButton` for other call sites.
5. **Ghost Base actions** — `DialGhostButton` Base + 20px icons (error Delete, accent Edit), matching Overall Score card patterns.

## Risks / Trade-offs

- Long tags may wrap densely for metrics with many short bindings — acceptable per Figma wrap behavior.
- Property names stay API casing (not title-cased in Figma mock) to avoid inventing display names.

## Migration Plan

None — pure UI on already-fetched data.
