## Context

See proposal.md — Why. Three existing mechanics decide the shape of the fix:

- `sqlEdited = !!sqlText.trim() && sqlText !== lastGeneratedSql.current` already separates "the user
  wrote this SQL" from "the page generated it from the builder". The Builder switch keys on it; the
  JSON switch must key on the same flag, or entering JSON from the Builder would fire a pointless
  translation.
- `captureFrom` treats a non-empty SQL buffer as the authored body **whatever view is open**, with a
  comment saying that keying it on the active view once let a SQL query be replaced by
  never-hydrated builder state. So a successful SQL → JSON translation has to clear the buffer;
  leaving it would save SQL while the user is looking at JSON.
- `onConfirmDiscard` resets builder state and clears both written buffers, then switches to
  `pendingView`. It was written for `pendingView === Form`, where an empty `jsonText` is invisible.

## Goals / Non-Goals

**Goals:**

- One translation path shared by both switches out of the SQL view, so the two cannot drift.
- The JSON view never shows a body the SQL buffer contradicts.
- The discard confirmation works for either destination view.

**Non-Goals:**

- See proposal.md — Non-goals.

## Decisions

**Extend `onChangeView`, don't add a second handler.** The SQL → Builder branch already sits there and
the two paths share the translate call, the representability check, and the guard; splitting them
into separate handlers would duplicate all three. The branch becomes: leaving the SQL view with an
edited buffer → translate once, then dispatch on the destination.

**A successful translation lands differently per destination, and that is the only difference.**

| Destination | Translated body representable | Not representable |
| ----------- | ----------------------------- | ----------------- |
| Builder     | hydrate, clear SQL, switch    | discard guard     |
| JSON        | hydrate, clear SQL, switch, `jsonDiverged = false` | show body, clear SQL, switch, `jsonDiverged = true` |

The JSON view exists precisely to hold bodies the builder cannot, so an unrepresentable-but-valid
translation is a success there, not a guard case. Alternative considered — routing it to the guard for
symmetry with the Builder switch — rejected: it would discard a body the destination view can display.

**`jsonText` comes from the translated query, not from `buildQuery(state, …)`.** For a representable
body the two would agree; for an unrepresentable one they would not, and the buffer must show what
the service returned. This also keeps the diverged path consistent with `onChangeJson`, which marks
divergence from the parsed body rather than from builder state.

**`onConfirmDiscard` seeds `jsonText` when the pending view is JSON.** It resets builder state to the
defaults for the selected source, so the JSON buffer is seeded from that same reset state rather than
left empty — otherwise confirming would open an empty editor. The seed is computed from the freshly
built state object, not read back from `state` after `setState`, because the reset has not rendered
yet (the same reason `onRunAiMessage` builds its request from `hydrateBuilderFromQuery`'s return
value).

**The popup's description is chosen by destination, its header is not.** `DiscardQueryPopup` takes the
pending view and picks between two descriptions: the Builder one keeps today's "cannot be shown in the
visual builder", while the JSON one says the SQL could not be translated into a structured query —
because the JSON view *can* show a body, and what failed is the translation. The header ("Discard
current query?") is true of both and stays shared. Alternative considered — passing the description key
in from `QueryBuilder` — rejected: the popup is the only place that renders the text, so the mapping
belongs there rather than at the two call sites of the guard.

**No loading indicator.** The Builder switch awaits the same call with none; adding one only here
would make the two switches visibly different for the same round trip. If the wait proves noticeable
it belongs on both, as its own change.

## Risks / Trade-offs

- **A slow or failing translate call delays the view switch.** → Same exposure the Builder switch has
  carried since it was introduced; a rejected translation is an ordinary outcome here, handled by the
  guard rather than an error.
- **Clearing the SQL buffer on a successful switch loses the user's formatting** (the body comes back
  as DSL, and re-entering SQL re-seeds from `translate`). → Already true for SQL → Builder, and the
  alternative — keeping the buffer — means the saved body and the visible body disagree, which is the
  bug being fixed.
- **Both descriptions still say the builder is reset.** → It is, on either switch, and the JSON view
  then shows that reset body — so the sentence stays accurate for both destinations.
