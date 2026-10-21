## Context

See proposal.md — Why. The relevant current state: `AiPanel` reads `entityName` and `fields` from the
query-builder context, turns them into a system message via `utils/ai-context.ts`, and prepends it to the
transcript on every send. That message is the panel's only use of the builder context, and the only place
the admin console composes prompt text for a DIAL deployment.

## Goals / Non-Goals

**Goals**

- The console sends the transcript verbatim, with no message it authored itself.
- The privacy property the removed requirement guarded — schema only, never row data — survives as a
  stronger, structural one: nothing about the store is sent at all.

**Non-Goals**

- Replacing the schema message with a lighter hint (see Decisions, alternative 2).
- Any change to the failing tool-call behavior in the assistant deployment (proposal.md — Non-goals).

## Decisions

**D1: Remove the message entirely rather than trim it.** The deployment's tool catalog includes catalog and
schema lookups, so anything the console could say about the selected entity it can discover on its own, and
discover it fresh. The console's copy is a snapshot of whatever the builder had loaded, which can be stale
or empty.

*Alternative 1 — keep the entity name, drop the column list.* Preserves the "select the source, then ask"
flow at a fraction of the payload. Rejected because the console would still be composing prompt text, which
is the coupling this change is meant to end: the deployment's prompt would have to keep accommodating a
message from a client it does not control.

*Alternative 2 — send the entity name as a `custom_fields` value rather than a message.* Structured, and
invisible to the transcript. Rejected as speculative: nothing in the deployment reads such a field today, so
it would be dead weight on the request until the deployment is changed to consume it — a change outside this
repository.

**D2: The AI panel drops its `useQueryBuilder()` read.** With no source information to send, the panel has
no remaining use for the context. Keeping the call "in case" would leave a reader wondering which part of
the request depends on the selection.

**D3: Two requirements are replaced (REMOVED + ADDED), not amended in place.** A MODIFIED requirement
replaces its whole block, and the validator refuses to let one silently drop a scenario the main spec still
carries — correctly, since "The schema message leads the request" and "The assistant follows the selected
source" assert behavior this change removes. Renaming the two requirements makes the replacement explicit
and keeps the scenario names honest. Consequence to expect at archive time: the two new requirements are
appended rather than left in their original positions in the master spec, so a follow-up may want to move
them back next to the other assistant requirements.

## Risks / Trade-offs

**The toolbar selection no longer reaches the assistant** → Accepted, and stated in the proposal as a
behavioral break. A user who needs a specific source names it in the request; a generated query targeting
another entity was already honored, so nothing downstream breaks. Mitigation is the AI panel's existing
description text, which is where a hint about naming the source belongs if the flow proves confusing —
tracked as an open question rather than pre-emptively reworded.

**Fewer input tokens, potentially more tool calls** → The deployment may now spend a catalog or schema
lookup on work the message used to hand it. That trade is the deployment's to make, and it caches its
toolset config.

## Migration Plan

Single commit, no data or configuration migration; `DIAL_QUERY_ASSISTANT_DEPLOYMENT` and
`DIAL_CORE_API_URL` keep their roles. Rollback is a revert — nothing persists between requests, so a
reverted build resumes sending the schema message with no cleanup.

## Open Questions

- Should the AI panel's description text tell the user to name the source in their request? Deferrable: it
  is an i18n string change that alters no requirement in this change's specs, and it is better decided after
  someone uses the panel without the schema message.
