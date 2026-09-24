## Context

See `proposal.md` — Why. What matters for the approach is the shape of the current code.

Three things are entangled today. `usePipelineForm` computes one composed `isSharedValid` that mixes
identity (name, kind, target), resolution (the target has loaded) and completeness (the trigger branch is
filled in). `useEnrichForm` and `useAggregateForm` each extend it into an `isValid` that adds their kind's
completeness, and both the create modal and the detail frame consult that single flag — the modal to
enable Create, the frame to enable Save. And the two kind-specific create popups exist only because the
modal collects kind-specific members: each mounts its kind's section with `isModal`, which every section
below threads down to hide the members the modal does not ask for.

Removing completeness from the gate therefore touches the flag, both popups, and the `isModal` plumbing
underneath them.

The service side is verified against the local instance, not inferred: `POST` with name, kind and target
returns 201 with the pipeline disabled; a `PATCH` on a disabled pipeline stores an `llm` transform
carrying neither model nor request template; a `PATCH` whose body is only `{"enabled": …}` is not read as
a declaration at all, so the enable toggle keeps working as it does today and the gate runs over the
stored row.

## Goals / Non-Goals

**Goals:**

- One create modal, three fields, no kind-specific mounting.
- A gate that blocks on contradiction and never on absence.
- The request stays honest for a partial declaration: an unset member is absent from the body rather than
  present and empty.

**Non-Goals:**

- Any change to how the detail page presents the declaration once it is there.
- Any console-side reproduction of the service's gate, including a "what is missing" summary.
- Touching `PipelineJsonEditor`, whose save path already defers to the service by design.

## Decisions

### D1 — `isSharedValid` splits into `isRegistrationValid` and nothing else

`isRegistrationValid` is name + kind + target + the target resolved. The resolution stays in it because
the target list is built from resolved tables, so an unresolved target in the modal means the pick has not
landed yet, not that the author is mid-thought.

The completeness half — `isTriggerSatisfied`, `hasInput`, `hasMeasures`, `isTransformValid` — is deleted
rather than kept behind a flag. Keeping it would leave two answers to "is this pipeline valid" in the
codebase, and the second one would drift: the next author to add a required member would add it to a check
nothing reads.

The field-level flags (`isCronValid`, `isCostCeilingValid`, `isMemberSelectValid`,
`isSampleFractionValid`, `hasDistinctWithoutColumn`) stay exactly as they are, and the detail frame's save
guard becomes their conjunction. **Alternative considered:** dropping those too and letting the service
refuse. Rejected for the cron, which the service never parses — the console is the only guard there, and
`Six-field cron control` says so — and then kept for the rest so the rule is one sentence rather than a
list of exceptions.

### D2 — One `CreatePipelinePopup`, no kind-specific popups

With the modal collecting no kind-specific member, `CreateEnrichPopup` and `CreateAggregatePopup` differ
only in which tables the target list offers, which `usePipelineForm.availableTargets` already derives from
`draft.kind`. Both files go, and `CreatePipelinePopup` renders the three fields directly through
`CreatePipelineShell`.

`CreatePipelineShell` stays: it owns the submit, the notification and the refresh, which is worth keeping
separate from the fields. **Alternative considered:** folding the shell into the popup as well. Rejected —
it would put the server action next to the markup for no gain, and the shell is what the spec's "mounted
only while open" and "refreshes the listing" scenarios attach to.

### D3 — `isModal` is removed, not left unused

`EnrichSection`, `TransformSection`, `ReadyWhenEditor`, `AggregateSection` and `PipelineSharedFields` take
an `isModal` prop that now has exactly one caller value — `undefined`. The prop goes along with the
branches it guards: the modal ordering in `EnrichSection`, the `!isModal` guards around member selection,
the read scope, the advanced accordion, and `getControlClassName(isModal)`, which collapses to the detail
page's width cap.

**Alternative considered:** leaving the prop in place in case a future modal wants a compact rendering.
Rejected: a prop no caller sets is a branch no test covers, and this repo's sections are already the
exemplar for "read how a sibling does it" — a dead mode in them misleads the next author.

### D4 — An unset trigger is omitted by `buildPipelineDto`, not by the caller

`buildTrigger` returns `{ kind }` unconditionally, so a draft with no trigger kind serialises to
`trigger: {}` — which the service reads as a declared trigger with no kind and refuses. The fix belongs in
`buildPipelineDto`, which already drops empty members: `buildTrigger` returns `undefined` when the kind is
unset and the pipeline is not an aggregate, and `dropEmptyMembers` removes the key.

An aggregate keeps its unconditional `{ kind: 'schedule' }`: its trigger kind is not a choice, and the
service accepts a schedule trigger with no cron on a disabled pipeline.

### D5 — The enable toggle is left alone

`onToggleEnabled` already sends `{ enabled: !enabled }` and already reports the service's message through
`getErrorNotification`. Nothing in this change touches it; the spec scenario that the control is offered
whatever the declaration holds is satisfied because no completeness flag ever reached it. It is called out
here so the implementation does not "fix" something that is already right.

### D6 — Registration stops sending `enabled: false`

The modal's initial draft carries `enabled: false` with a comment about the service refusing an enrich
registration that omits it. The service now defaults it. Dropping it keeps the body to what the author
supplied, and the created pipeline is disabled either way.

## Risks / Trade-offs

- **An author can now save a pipeline that will never run and get no warning until enable.** That is the
  accepted trade: the alternative is a console-side gate that is a partial copy of the service's, which
  was considered and declined. The service's message names the absent members, and the header badge says
  the pipeline is disabled.
- **The 422 arrives as a toast rather than beside the field it concerns.** Toast is where every other
  pipeline action failure already lands, so this is consistent rather than new; pinning a service message
  to a control would need a field-level mapping of the service's prose, which nothing in this codebase
  does today.
- **Removing `isModal` touches five components for no user-visible reason.** It is bounded — the branches
  are small and the tests that cover them are the modal tests being rewritten anyway — and leaving them
  would mean shipping dead code paths in the repo's most-copied components.
