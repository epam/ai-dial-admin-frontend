## Context

Each row of the shared list popup validates itself in `NewItemInput` with `getTopicError` and registers the result
in `SaveValidationContext`, which gates the popup's Apply. The row sits five components below `Multiselect`
(`MultiselectModal`, the content, the two list variants, `NewItem`).

## Decisions

### D1. An optional prop on `Multiselect`, passed down to the row

`Multiselect` gains `getItemError`, passed through the popup's components to `NewItemInput`, which defaults to the
topic rule when it is absent. Each component in the chain only forwards it, and a caller that does not pass it is
unchanged.

*Alternative:* carry it by a React context so the intermediate components stay untouched. Rejected: a new context
file and provider for one optional value, where the other props of the same chain are already passed down.

### D2. The enum check is the row's length rule, not a copy

`getAnalyticsEnumValueError` holds the length rule (trimmed, at most 64) and `getAnalyticsEnumValuesError`, which
checks the whole list on the row, uses it for each value, so the popup and the row cannot drift.

*Alternative:* keep the popup's message and limit independent. Rejected: that is the reported defect.

## Risks / Trade-offs

- **The shared popup gains an extension point.** → One optional prop defaulting to the topic rule; `NewItemInput`'s
  spec covers the default and an override.
