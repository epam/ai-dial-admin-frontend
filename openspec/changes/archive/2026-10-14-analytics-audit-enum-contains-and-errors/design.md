## Context

`getGridFilters` turns each grid filter into one backend operator, for every audit view. The Analytics list is
fetched through `fetchActivities`, which answers a failed request with `null`, so the grid cannot tell an empty
list from a refused one. The backend takes an enum column only as `eq`, `ne` or an `in` list, and each value
is checked against the enum.

## Decisions

### D1. Value lists, written once, driven by column parameters

`EnumValuesFilter` is a custom AG Grid filter in the shape of `RunStatusValueFilter` (a checkbox list, Select
all, Reset, model `{ filter: "a,b", type: INCLUDES }`). The values arrive as a filter parameter, so one component
serves Activity type and Resource type, and the grid's `components` map registers it for the audit list. The
`INCLUDES` model already becomes the backend's `in` operator in `getRequestFilters`, so no request code changes.
The grid's own set filter is an enterprise feature, which is why the repository writes these.

The columns use the list only in the Analytics view. The values are the backend's (three activity types, four
resource types), not the frontend enums', which also hold Core's.

*Alternative:* match typed text against labels and send the matches as `in`. Rejected: it keeps a way to type a
value that matches nothing, and needs an empty-result path.

### D2. A UUID guard on the identifier columns

An *Equals* on text that is not a UUID can match nothing, and a *Does not equal* restricts nothing, so
`applyAnalyticsIdentifierFilters` resolves both before any request: an empty page, or the filter dropped. This
also covers an import group's `import:<id>` parent, which matches no row by an existing requirement.

### D3. Errors travel as a result, and are raised only for the page request

`AnalyticsAuditApi` gains a result-returning form of the list call (`postAction`); the server action returns it,
and the Analytics `fetchActivities` unwraps it, throwing an `AuditRequestError` that carries the header, message
and request identifier. The existing `getActivitiesList` stays, because the detail page's lookups use it.
`getRows` already catches around the page loop; there, for the Analytics view only, it shows the notification
and fails the page. The parent and import lookups sit in their own `try`/`catch` blocks, which keep swallowing
the same error, so they stay fail-open without any special case.

*Alternative:* have the existing fetcher keep returning `null` and add a flag. Rejected: a thrown error carries
the detail the notification needs without widening the fetcher's return shape for the other two views.

## Risks / Trade-offs

- **The value lists are the backend's current values.** → A new backend value needs a new entry.
