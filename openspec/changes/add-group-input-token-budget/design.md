## Context

See proposal.md — Why. The Advanced block in `EnrichSection` renders three numeric knobs from one list and the
sample fraction separately, because only the sample fraction is validated. `buildPipelineDto` already strips
members by pipeline kind and trigger branches by trigger kind, then drops empty members. A knob that depends on
the trigger kind is new: every existing `advanced` member applies to both triggers.

## Goals / Non-Goals

**Goals:**

- One new knob that follows the existing Advanced shape, without a new component.
- The `group`-only rule enforced where the request is built, so no UI path can leak the member.

**Non-Goals:**

- Generalizing the Advanced block into a per-trigger knob table. One conditional knob does not justify it.

## Decisions

**Strip in `buildPipelineDto`, keep the value in the draft.** Switching the trigger kind leaves
`draft.advanced.input_token_budget` untouched. `buildPipelineDto` deletes it when the trigger kind is not
`group`, before `dropEmptyMembers`, so an `advanced` block emptied by the strip is dropped too. This follows how
`buildTrigger` treats `cron` and `group_by`: the draft keeps what the author typed, the request carries only
the selected branch. An author who toggles `group` → `schedule` → `group` gets the value back. Alternative:
clear the member in `onTriggerChange`. Rejected: the strip would then live in a form callback, and the DTO
builder would no longer guarantee the service's rule on its own.

**Render it as its own `Input`, not as a `NUMERIC_KNOBS` entry.** It needs a caption, an error, `step={1}`
and a trigger condition, which the list entries carry none of. It sits after the sample fraction, so the four
knobs shared by both triggers keep their order.

**Validate a non-negative integer.** `isInputTokenBudgetValid` in `useEnrichForm` is
`value == null || (Number.isInteger(value) && value >= 0)`. The service refuses negatives. The member is an
integer on the service, so a fractional value has no meaning either. The validity counts toward
`hasFieldErrors` only while the trigger kind is `group`. Otherwise an invalid value hidden by a trigger switch
would block the save with no visible error, and that value is not sent anyway.

**Zero survives as a value.** `onChange` maps `''` to `undefined` and `'0'` to `0`, the same as the other
knobs, and `dropEmptyMembers` keeps a `0`. No new logic is needed. A test pins it.

## Risks / Trade-offs

- [The console talks to an Analytics service older than 0.24] → the strict binder refuses the unknown member
  with HTTP 400. The console sends it only when the author fills the field, so existing pipelines save as
  before. The save error surfaces through the existing notification path.
- [PATCH replaces `advanced` whole] → the console already sends the full `advanced` block from the draft, so a
  save keeps a budget it did not touch. A read that predates the field returns no member, and a save keeps it
  absent.
