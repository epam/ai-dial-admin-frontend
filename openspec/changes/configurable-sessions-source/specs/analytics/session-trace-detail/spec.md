## ADDED Requirements

### Requirement: A span states the rating of the response it recorded

A span whose own usage-log row carries the response rating enrichment SHALL state that response's rating counts on
its tree row, and the span rail SHALL state, when the span is selected, the rating's direction, when it was rated,
whether its ratings disagree, and its comments under the same comment-text gate the session's feedback panel
applies.

The rating SHALL be read from the span's **own row**: the enrichment is grained by the response id the row
recorded, so the join is exact by construction and MUST NOT fall back to the trace's root or to any position in
the tree.

A response id recorded on more than one span of the trace SHALL be stated on **one** span only: the shallowest that
carries it, and of siblings at that depth the earliest. One rating MUST NOT read as two.

A trace opened without a session — from an entity's listing — SHALL state ratings on the same terms, because the
rating travels with the usage-log row rather than with the session.

Where the usage log's schema reports no response rating enrichment, no span SHALL state a rating.

#### Scenario: The rated span shows its rating in the tree

- **WHEN** a span's own row carries a rating with one positive event
- **THEN** that span's tree row shows the positive count

#### Scenario: An in-turn hop shows no rating

- **WHEN** a span's own row carries no rating
- **THEN** its tree row shows no rating counts
- **AND** its rail has no rating section

#### Scenario: A relayed response id is rated once

- **WHEN** the rated response id is recorded on a span and on a span nested beneath it
- **THEN** only the outer span's tree row shows the rating counts

#### Scenario: A trace opened from a listing still shows ratings

- **WHEN** a trace is opened from an entity's listing and one of its spans carries a rating
- **THEN** that span's tree row shows the rating counts

## REMOVED Requirements

### Requirement: The span that answered a rated response states its rating

**Reason**: The rating is now a field of the span's own usage-log row, so it no longer depends on the session's
bounded rating list, and a trace opened without a session can state it too.

**Migration**: See "A span states the rating of the response it recorded".
