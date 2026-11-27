## ADDED Requirements

### Requirement: A metered span row states its own cache read and write

A span row whose secondary line states its own tokens SHALL also state the prompt tokens that span read from
cache and the tokens it wrote to cache, as one figure labelled as cache read and write, placed after its
tokens. Both are recorded on the span's own row, so the figure is the span's own and never a sum over its
descendants.

**The figure SHALL be stated only where the span read or wrote a non-zero amount.** Most model calls in a
tree carry no cache activity, and a `0 / 0` on every such row is noise that buries the calls that did. Where
one side is non-zero and the other is zero or unrecorded, the figure SHALL state the other side as zero.
The exact counts, zeros included, remain stated in the rail's token usage group.

**A span row whose secondary line states only its chain cost SHALL state no cache figure.** Such a span
recorded no tokens of its own, so any cache figure on it would belong to the calls beneath it.

#### Scenario: A model call that reused its prompt states its cache

- **WHEN** a span records its own tokens, cached prompt tokens and cache creation tokens
- **THEN** its row states its tokens followed by its cache read and its cache write

#### Scenario: A model call with no cache activity states no cache figure

- **WHEN** a span records its own tokens and records zero or no cached prompt and cache creation tokens
- **THEN** its row states no cache figure

#### Scenario: A read with no write states the write as zero

- **WHEN** a span records cached prompt tokens and zero cache creation tokens
- **THEN** its row states its cache read and a write of zero

#### Scenario: An application span states no cache figure

- **WHEN** a span records no tokens of its own and a chain cost
- **THEN** its row states its chain cost and no cache figure

### Requirement: A span row's figures are visibly separated

When a span row's secondary line states more than one figure, a separator SHALL stand between each adjacent
pair, and none SHALL lead or trail the line. A row stating tokens, cache, messages and cost in one monospaced
run reads as a single figure; the separator lets each be read on its own. The separator SHALL be
presentational and SHALL NOT be part of any figure's text.

#### Scenario: Four figures render three separators

- **WHEN** a span row states tokens, cache read and write, request messages and cost
- **THEN** a separator stands between each adjacent pair of figures
- **AND** no separator precedes the first figure or follows the last

#### Scenario: A single figure renders no separator

- **WHEN** a span row states only its chain cost
- **THEN** no separator renders on its secondary line
