## ADDED Requirements

### Requirement: The span that answered a rated response states its rating

A trace opened from a session SHALL state, on the tree row of the span that answered a rated response of that
session, that response's rating counts, and the span rail SHALL state that response's rating when the span is
selected: its direction, when it was rated, whether its ratings disagree, and its comments, under the same
comment-text gate the session's feedback panel applies.

Attribution SHALL be an **exact join on the span's own response id**. The rating source is grained by the
response id the client was answered under; a hop made inside the turn normally records its upstream's own
response id, which no rating names. The join MUST NOT fall back to the trace's root or to any position in the
tree, so a rating is never shown on a span that did not record the rated response.

A response id recorded on more than one span of the trace — an application relaying its model's response
unchanged — SHALL be stated on **one** span only: the shallowest that carries it, and of siblings at that
depth the earliest. One rating MUST NOT read as two.

The session's rating list is bounded. When it is partial, the trace view SHALL say once that a span may carry
a rating it does not show, rather than presenting an unmarked span as unrated.

A trace opened without a session — from an entity's listing — has no ratings to join, and SHALL state none on
any span.

#### Scenario: The rated span shows its rating in the tree

- **WHEN** a trace is opened from a session and one of its spans recorded the response id a rating names
- **THEN** that span's tree row shows the rating counts in the matching direction

#### Scenario: An in-turn hop shows no rating

- **WHEN** a span recorded a response id that no rating of the session names
- **THEN** its tree row shows no rating counts
- **AND** its rail has no rating section

#### Scenario: A relayed response id is rated once

- **WHEN** the rated response id is recorded on a span and on a span nested beneath it
- **THEN** only the outer span's tree row shows the rating counts

#### Scenario: The rail states the selected span's rating

- **WHEN** the reader selects the span that answered a rated response
- **THEN** the rail states that response's rating direction and rating time
- **AND** it names the comment text only where the caller may read it, and otherwise says the text is restricted

#### Scenario: A partial rating list is disclosed

- **WHEN** the session holds more rated responses than were read
- **THEN** the trace view states that a span may carry a rating it does not show

#### Scenario: A trace opened without a session states no rating

- **WHEN** a trace is opened from an entity's listing
- **THEN** no span's tree row or rail states a rating
