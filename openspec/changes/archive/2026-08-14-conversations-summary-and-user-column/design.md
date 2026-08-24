## Context

See `proposal.md` — Why. The constraints that shape the approach:

- The page's rows come from an AG Grid **infinite** row model (`infiniteGridOptions`: `cacheBlockSize` 100,
  `maxBlocksInCache` 10). A block that scrolls out of the cache is discarded and re-requested on scroll-back,
  so any accumulator fed from `getRows` sees the same conversation more than once.
- The whole-result count and cost come from their own aggregate query (`getConversationTotals`). Today that
  query is driven by a `useEffect` on the filter state that deliberately skips its first run and leans on the
  server component's prefetch, so on the default filter state the pills never re-resolve.
- Both the row query and the totals query need the feedback filter's candidate ids, resolved once per filter
  state by `resolveCandidates()` and memoised in a ref.
- `user_hash` is already an entity field, already selected by the detail query, already labelled "User" by the
  detail page, and catalogued non-sensitive by the analytics service. Nothing about the backend contract
  changes here.
- The summary's mixed scope stays mixed. Making rated/negative whole-result requires rating counts on the
  rollup; see `proposal.md` for why the client cannot fake it.

## Goals / Non-Goals

**Goals**

- One fetch cycle produces every figure the pill row shows, so no pair of pills can describe different
  observations of the rollup.
- The loaded-scope figures are honest at a glance, not only to a reader who hovers or uses a screen reader.
- `user_hash` reaches the grid reusing the detail page's label and placeholder, so the same field reads the
  same way in both views.

**Non-Goals**

- No change to the totals *query* itself, to the candidate-resolution strategy, or to the ratings-per-page
  lookups.
- No new column-level affordance: the added column is as read-only as the six beside it. Sorting, filtering
  and column selection are separate changes.
- No attempt to make the search box reach `user_hash`.

## Decisions

### Totals are resolved inside the first-page fetch, not by a filter effect

`getRows` already knows when it is fetching row 0 (`isFirstPage`) and has already awaited
`resolveCandidates()`. Loading the totals there — reusing the candidate ids it just resolved — makes "same
fetch cycle" a structural property rather than a timing coincidence, and it lets the standalone
`useEffect` on `[filters, resolveCandidates]`, its `isFirstTotalsRunRef` skip flag, and its second
`resolveCandidates()` call all go away. A filter change already produces a new datasource identity, which makes
AG Grid purge its blocks and re-request row 0, so every filter change still refreshes the totals with no extra
trigger.

The existing `totalsRequestRef` monotonic guard stays: two first-page fetches can overlap when a debounced
search lands next to a period change, and the later request must win.

A first-page failure has two distinct causes and they do not get the same treatment. When the **row** query
fails, the figures are left alone: they came from their own query, and clearing them would assert an
unavailability this cycle never established. When **candidate resolution** fails, the totals query never ran at
all, so the figures still on screen belong to the previous filter state — those are cleared, and the pills
report them unavailable.

*Alternative considered:* simply deleting the `isFirstTotalsRunRef` skip. It is a one-line change, but it keeps
two independent triggers reading a moving table, so it only narrows the window in which the pills disagree
instead of closing it — and it keeps the duplicate `resolveCandidates()` call.

*Consequence accepted:* the server prefetch is now always superseded by a client fetch on mount, so page load
costs one extra totals request. The prefetch keeps its purpose — the pills paint with real figures on first
render instead of flashing placeholders.

### The loaded-row accumulator is keyed by conversation id, and reset by filter state

The accumulator becomes `{ key, byId: Map<string, ConversationRow> }`. `byId` is keyed by `chat_id` — the same
identity AG Grid already uses for `getRowId`, so uniqueness is an assumption the grid makes anyway.
`summariseConversations` runs over its values and `loadedCount` is its size. A re-delivered block overwrites its
own entries, which also means a row's refreshed rating counts replace the stale ones rather than being
double-counted.

The `key` is the filter key, and it — not a zero offset — is what resets the accumulator. `startRow === 0`
looks like "a new result has started", but with a bounded row cache it also means "block 0 was evicted and
re-requested on scroll-back", and treating that as a new result drops every conversation loaded after it. That
would leave the pill reporting a *smaller* loaded count than the operator has actually scrolled through — the
same class of wrong figure this change exists to remove, in the other direction.

*Alternative considered:* keying by request offset (a `Map<number, ConversationRow[]>`). It also dedupes, but it
makes the accumulator's shape depend on the paging arithmetic, and a page whose offset shifts under a changed
`cacheBlockSize` would silently split into two entries.

### The scope caveat becomes a visible third line on the pill, with its own short wording

`SummaryPill` gains an optional `scope` rendered as visible muted text beneath the label. It is a **second**
string, not the existing hint: the hint is a full sentence ("Covers the conversations loaded so far. Scroll to
load more.") and the pill is 92px wide, so rendering the hint itself would take three wrapped lines. The short
`scope` names the boundary at a glance; the hint keeps explaining it on hover.

`title` stays on the pill. The `sr-only` copy is dropped for pills that carry a visible `scope`, because the
scope is already in the pill's content and assistive technology would otherwise announce the boundary twice.

The whole-result pills keep the current behaviour — their hint stays hover/assistive-only, since "this figure
covers the whole result" is the default reading and does not need to compete for space.

*Alternative considered:* folding the caveat into the pill's label (`RATED (LOADED)`). It costs no vertical
space, but it fuses a caveat into a heading, and the unavailable-figure hint would then have nowhere to go.

### `user_hash` gets its own cell renderer, modelled on `ProjectCellRenderer`

The column sits between project and turns. Its renderer follows `ProjectCellRenderer` exactly — the value
inside `DialEllipsisTooltip` so a truncated hash stays reachable, and an explicit placeholder when the field is
absent. It reuses the detail page's `UNAVAILABLE_VALUE` placeholder and the detail page's existing "User"
label, so the same field reads the same way in both views and no new i18n key is needed for either.

*Alternative considered:* generalising `ProjectCellRenderer` into a shared optional-text renderer factory now.
Two call sites do not yet justify it under this repo's rule-of-three guidance, and the schema-driven column
picker change will need a type-driven renderer factory with a different shape — better to build that once, with
its real requirements in hand, than to guess it here.

### The provenance group is extended, not restructured

`user_hash` is appended to the `conversations` entry in `CONVERSATION_PROVENANCE_GROUPS`, which is what makes
the band span it and what keeps every column attributed to exactly one source. `marryChildren` then prevents it
from being dragged out of the group at no extra cost.

## Risks / Trade-offs

- **A seventh column squeezes the six existing ones** under `autoSizeStrategy: fitGridWidth`, and the
  conversation column is already the tightest at `minWidth: 280`. The user column's `minWidth: 140` raises the
  sum of minimums from 1020px to 1160px, so the grid begins scrolling horizontally at viewports where it
  previously fit. → Accepted rather than verified: a narrow-viewport check was consciously skipped, since a
  dense analytics grid scrolling horizontally is AG Grid's normal behaviour and no requirement forbids it.
  Revisit if the column-selection change (which lets an operator hide columns) does not settle it.
- **One extra request per page load** for the superseded totals prefetch. → Accepted: it is one small aggregate
  query, and it is what makes the pill row internally consistent.
- **The totals now depend on the grid asking for row 0.** If a future change ever renders the summary without
  the grid, the figures would stop loading. → The summary and grid are parts of one view and the spec ties the
  figures to the first page; a view that shows one without the other would be a different requirement.
- **Operators will paste a user hash into the search box and get nothing**, now that the column is visible. →
  The spec keeps search's advertised scope honest, and the per-column filtering change gives that value a real
  input. Worth watching whether it surfaces as a complaint before then.
- **The pill row grows a line taller**, which shifts the header height slightly on the busiest analytics page.
  → Contained to the two loaded-scope pills; the pills already stack two lines, so the row already owns
  vertical space.
