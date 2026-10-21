## Context

`ACTIVITY_AUDIT_COLUMNS` builds one column set for all three audit views and takes the view. The grid is a
server-side (infinite) model, so a filter is sent to the backend as typed, with the first operator of the column's
list as the default. `expandResourceTypeFilter` rewrites a *contains* filter to *equals* when the typed text
matches one resource-type label, for the Core backend's benefit.

## Decisions

### D1. An `exactMatchFilter` column fragment, applied for the Analytics view only

It mirrors `baseStringFilter` with `filterOptions` reduced to equals and not-equal, and `defaultOption` set to
equals. The four columns spread it when `view === Analytics`; otherwise they keep `baseStringFilter`. The
operator list lives in one fragment next to the others in `filters.ts`.

*Alternative:* change `baseStringFilter` for everyone. Rejected: Core accepts *contains* on these columns and
the Config view's behaviour must not change.

### D2. Resource type resolves by exact label under equals and not-equal

The existing branch (contains, unique substring match, rewrite to equals) is left as it is. A new branch handles
equals and not-equal: an exact, case-insensitive label match that names exactly one resource type is replaced
by that type's value, keeping the operator; anything else passes through, so an enum name typed directly still
works (the backend matches enum names ignoring case).

*Alternative:* a unique-substring match under equals. Rejected: under an exact operator `col` meaning
"table column" would be a surprise, and the label list is short enough to type.

### D3. No set filter

A pick-list would suit an enum, but the grid library's set filter is an enterprise feature. Typed exact match is
the available form,.

## Risks / Trade-offs

- **Partial text no longer matches on these columns under the Analytics view.** → Intended: it never worked
  there, since the backend rejected it.
- **An Import row's activity type and Parent ID match no row** (existing requirement). → Unchanged.
