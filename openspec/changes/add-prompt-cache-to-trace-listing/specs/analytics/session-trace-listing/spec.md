## ADDED Requirements

### Requirement: A trace states the share of its prompt read from cache

A trace's figures SHALL state, beside its token total, the share of its prompt tokens the provider served
from cache, as a percentage labelled as cached. The share SHALL be the trace's summed cached prompt tokens
over its summed prompt tokens, both summed over **every hop of the trace** — the same scope as its token
total and its price. A trace's token total and its price disagree exactly where most of a prompt was read
from cache, and the share is the figure that reconciles them.

The prompt token count already includes the cached part, so it SHALL be the denominator; adding the cached
count to it would understate every share.

**The share SHALL be resolved by the query that resolves the trace's other figures**, under the same scope —
the page's trace ids and the padded window, with no session id and no project. A second query for it would
be a second scope to keep in step with the first, which is the divergence the three-query invariant exists to
prevent.

**A trace whose hops recorded no prompt tokens SHALL state no share.** A trace of protocol and routing hops
alone has nothing to divide, and `0% cached` would read as a cache that missed. A trace whose hops recorded
prompt tokens and no cache hit SHALL state `0% cached`: that is a measured miss.

**The share SHALL be stated wherever the trace's figures are stated** — on a trace whose single root renders
with it, in the trace tier of a trace with several cards, and on a trace whose root was not recorded.

**The share SHALL be read only where the hop log schema reports the cached prompt column.** Naming a column
the instance does not publish rejects the whole figures query, which would cost every trace its span count,
tokens and price for want of one optional figure. Where the column is not reported, the listing SHALL render
as it does without it, stating no share.

#### Scenario: An agent trace states its cached share

- **WHEN** a trace's hops recorded prompt tokens and cached prompt tokens
- **THEN** the trace's figures state its token total followed by the cached share as a percentage
- **AND** the share is computed over every hop of the trace, not over its root alone

#### Scenario: A trace with no prompt tokens states no share

- **WHEN** a trace's hops recorded no prompt tokens
- **THEN** its figures state no cached share

#### Scenario: A measured miss states zero

- **WHEN** a trace's hops recorded prompt tokens and no cached prompt tokens
- **THEN** its figures state `0% cached`

#### Scenario: An instance without the cache column keeps its listing

- **WHEN** the hop log schema does not report the cached prompt column
- **THEN** the figures query does not name it
- **AND** every trace still states its span count, tokens and price, with no cached share

### Requirement: A card's own facts carry no cache figure

A card's own facts SHALL NOT state cache usage. A card's facts are read from its root's own row, and an
application root records no tokens of its own, so its own cache is always zero while the cache its trace
consumed sits in the calls beneath it; stating `0` there reads as a cache that missed. A model root's trace
and call coincide, so a card fact would repeat the trace's share. The cache a single call consumed SHALL be
stated on that call's span row inside the trace.

#### Scenario: An application root states no cache fact

- **WHEN** a card's root records no tokens of its own and its trace recorded cached prompt tokens
- **THEN** the card's own facts state no cache figure
- **AND** the trace's figures state the cached share
