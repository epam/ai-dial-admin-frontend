## Context

The failures card reads its figures through a hook that starts its counters at zero and only moves them
when the runtime service answers. The card used zero as its reason to be absent, which made "not asked
yet" and "nothing failed" the same state by construction, and that coincidence is what kept the card
from flashing an empty frame before the first answer. Stating zero (see proposal.md — Why) removes the
coincidence, so the two states need telling apart some other way.

The card is mounted only for a model-calling enrichment, and the read is issued only for a full admin
with analytics enabled; neither gate changes.

## Goals / Non-Goals

**Goals:**

- A zero is drawn only after the service has said so.
- The existing silent states (no runner, not yet answered) and the failed-read state stay as they are.

**Non-Goals:**

- No loading placeholder for the card: the first read resolves within the tab's own load, and a frame
  that fills a moment later is what the earlier requirement avoided.

## Decisions

**The hook exposes whether the service has answered.** A `hasAnswered` flag, set on the first successful
summary and never reset for the life of the hook. The card is absent while it is false and the read has
not failed.

- *Alternative — gate on `isLoading`.* Rejected: it starts false and only turns true inside the effect,
  so the first render is "not loading, zero" and the card would flash "No failures" before the request
  is even sent.
- *Alternative — start the counters at `undefined`.* Rejected: every consumer of the counts (the card,
  the tab's error mark, the status text beside the tab strip) would have to handle a missing total for
  one transient render, to say what a single boolean says.
- *Not reset on a later failed read.* A failed re-read already has its own state (`hasFailed`), which
  the card renders in preference to any zero; resetting `hasAnswered` would only hide that state.

**The zero state reuses what exists.** The "No failures" line the card already showed after a re-run
drained the queue now also covers the never-failed case; no expand control and no retry controls render
at zero, as before. The previous rule that a re-run outcome kept the card alive at zero is subsumed:
once answered, the card is always present.

## Risks / Trade-offs

- [The card occupies space on every model-calling pipeline, including healthy ones] → It is one heading
  and one line; the trade is deliberate, since its absence was the ambiguity this change removes.
- [A zero after the service's own cleanup reads as "never failed"] → Out of scope: the service exposes
  no retention signal, so the console states only what the service reports.
