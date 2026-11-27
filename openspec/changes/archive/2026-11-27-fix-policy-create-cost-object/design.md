## Context

Core treats a policy body cost object as a pin independent of its folder. An assignment carries its folder cost object in its body; Core rejects pinning a cost object in both the policy and assignment. Core also requires a subject to be pinned exactly once across a policy and each assignment. Policy creation currently cannot set subjects; assignment creation already uses `SubjectRulesEditor`. Both currently use `CreateEntity` and write directly to Core.

## Goals / Non-Goals

**Goals:** Give both create forms a Details → Subjects flow with optional subject rules, retain edits across steps, and pin a policy's folder cost object only when the new policy has subjects and a folder.

**Non-Goals:** Change updates or duplicates, assignment payloads, Core validation, or automatically pin a cost object on later subject edits. Do not require subjects on each individual form or fetch the referenced policy to validate subject ownership.

## Decisions

- Use a dedicated two-step modal for policy and assignment creation, wired in `Assets/BaseAssetList/Modals.tsx` like `CreateKeyModal`. Keep the draft above the steps so Back and Next preserve both sets of edits. Leave the generic `CreateEntity` and other asset flows unchanged. A single expanded form was considered, but the two-step flow keeps details and optional subjects distinct.
- Validate the name and entity-specific Details before enabling Next, separately from subjects. On Subjects, allow an empty list and require each entered rule to pass `areRulesValid` before Create. Validation must survive step unmounts and not let stale or removed validation registrations enable an invalid submit. Reuse `SubjectRulesEditor`; every rule requires a nonblank source and recognized function, `TRUE`/`FALSE` have no targets, and other functions require at least one target. Core remains the semantic validator, including subject ownership across policy and assignment.
- At policy create submission, derive `costObject` from the final folder only when the final subject list is nonempty and the folder identifies a cost object; otherwise omit it. Normalize empty subjects as before. Do not change shared policy serialization: updates and duplicates may have a body pin independent of the folder. Assignment submission continues to derive its body cost object from its folder and otherwise uses its existing body.
- Preserve existing success navigation and notifications and the existing failure handling: retain the open form and edits, and show Core's error details unchanged, without duplicate notifications. Include an explanatory localized hint that a subject is pinned by the policy or the assignment, not both.

## Risks / Trade-offs

- A dedicated modal could diverge from the existing create flow → retain the existing protected request, success navigation, folder refresh, and error handling; cover an unrelated route in tests.
- Unmounting Details can drop validation state or reset fields → retain entity state and check detail validity independently on each transition and submission.
- Subjects added after creation do not automatically pin a policy cost object → the existing editable Properties field remains available.
- Client shape checks cannot determine whether the selected policy and assignment pin a subject exactly once → let Core reject invalid combinations and surface its message unchanged.
