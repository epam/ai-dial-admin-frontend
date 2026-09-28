## Why

The span rail states ten facts about the selected span while the span query already reads more than twice
that many columns, and the hop-log schema declares roughly fifty queryable ones. The gap is not cosmetic: the
rail shows a dash for cost on an application span without saying that the chain spent anything, states zero
tokens beside a trace header reporting thousands, and names an endpoint whose deployment differs from the
tree's own label — each of which is answered by a column the read already returned and the rail drops. A
reader who needs any of them has to leave the console and query the hop log by hand.

## What Changes

- The span rail presents **every non-heavy column the fetched hop-log schema reports**, not a hand-picked
  list. The projection is resolved against the schema rather than written out, so a column the service
  withholds from this caller is never named.
- Fields are grouped by the schema's own `tag`, ordered by its `tag_order`, and presented as one section of
  collapsible groups where opening one closes the previous. Each group header carries a count of how many of
  its declared fields this span actually has a value for.
- A per-span figure tile keeps the facts read on every span — the recorded instant at the precision the log
  holds, and the span's own cost beside its chain cost — and the endpoint and upstream rows stay above the
  groups, outside any group. The token total moves into its group, beside the breakdown it belongs to.
- A control opens the whole span row in a JSON popup, reusing the existing `FullscreenViewer`
  (`DialPopup` + Monaco + copy) unchanged.
- Facts the tree, the trace header or the bodies section already state **in the same form** leave the rail:
  the trace id, the event kind, the success flag, the HTTP verb and status, both recorded sizes, the request
  message count, the MCP method and tool name, and the duration. A fact that can differ from what the tree
  shows stays — the routing path names deployments the tree has no row for, and a parent span id can point
  at a span the log never recorded.
- The rail's figure tile stops sharing i18n keys with the trace header. `TraceTokens` and `TraceCost` are
  reused verbatim by both surfaces today, so the same two words label a trace-wide sum in the header and a
  single span's own figure in the rail.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/conversation-trace-detail`: the span rail's field set becomes schema-resolved rather than
  hand-picked, gains grouped presentation with per-group counts and a JSON dump of the row; the requirement
  that the duration lives on the span's facts sheet and the rule that one fact has exactly one home are
  restated to account for the rail no longer curating its own list.

## Impact

- `ConversationSpanDetail` is restructured; a group component, a field-resolution utility and a JSON control
  are added beside it under `components/Analytics/ConversationsTrace/Detail/`.
- `buildConversationSpansQuery` stops carrying a literal column list and takes the resolved field set
  instead. The conversations-trace server action already fetches and caches the hop-log entity schema for the
  body grant, so the field set resolves from a read the page performs regardless — no additional request.
- `conversation-column-catalog` gains a span-field resolver alongside `hopBodyFields`, which stays the
  authority on the body columns.
- New i18n keys for the rail's own figure labels, for the group headers, and for the JSON control.
- Reuses `FullscreenViewer` as published. No new props on it, and no change to `CodeViewer`, which the bodies
  section keeps using for its inline raw view.

## Non-goals

- **Body columns.** `request_body`, `response_body` and `assembled_response` are `heavy` and stay out of both
  the groups and the JSON dump. The bodies section already presents them with its own tiered reads and its
  own raw mode, and the span query deliberately never selects them.
- **A frontend access check.** Which fields exist is the schema's answer; no role, scope or permission of the
  session is consulted, exactly as the body grant already works. A sensitive column the service does return —
  captured headers, token claims, the caller's email — is therefore presented: these are administrator-only
  pages, and a caller below the entitlement never sees those columns in the schema at all.
- **The trace header and the span tree.** Neither changes. The header keeps stating trace-wide aggregates and
  the tree keeps its row content; only the rail's own labels are disambiguated against the header's.
- **Enrichment coverage beyond what the schema reports.** No column is requested by name in the hope that an
  instance has it; whatever the fetched schema declares is what the rail shows.
