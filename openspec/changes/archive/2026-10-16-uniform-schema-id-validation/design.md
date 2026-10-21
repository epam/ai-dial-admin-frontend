## Context

Platform App Runners and Catalog Schemas are Core-backed schema resources. Each has two identities: the Core storage `name` used for writes and the schema-body `$id` used in Core's merged configuration. Core remains the final authority on `$id` uniqueness, but only reports a collision after a write attempt.

Platform App Runner duplication already resolves `$id` on submit and feeds a found result into `IdControl.externalError`. Ordinary Platform App Runner creation and Catalog Schema creation do not yet have that preflight. Catalog Schemas currently suppress the shared list's duplicate action entirely, so adding equal duplicate behavior requires enabling a Catalog Schema branch rather than only adding a resolver call.

## Goals / Non-Goals

**Goals:**

- Make declared-ID collision feedback consistent for both resource types' Create and Duplicate actions.
- Keep the preflight opt-in, submit-time, resource-specific, and non-authoritative.
- Add a Catalog Schema duplicate path that preserves schema content while cloning and validating both identities.
- Reuse `IdControl.externalError`, `SaveValidationContext`, existing Core resolvers, and the established App Runner duplicate flow.

**Non-Goals:**

- Change Core's resource API, `$id` uniqueness/immutability semantics, or write-time conflict handling.
- Add keystroke-time asynchronous validation, ID reservations, retry logic, or a shared Core endpoint.
- Extend the behavior to legacy admin-backend Application Runners or other platform assets.

## Decisions

### Use an optional resolver in shared create orchestration

`CreateEntity` will accept an optional declared-ID resolver. Only Platform App Runner and Catalog Schema callers provide one, so all unrelated create forms retain their existing behavior. After synchronous field validation has enabled Create, the modal resolves `$id`; a successful response with a schema becomes the standard existing-ID error and prevents the create callback.

Passing the resolver from the resource-specific modal wiring avoids coupling the shared component to either resource's server action. Core's not-found response and thrown resolver errors both fall through to the unchanged create callback.

### Treat App Runners and Catalog Schemas as schema-aware duplicate branches

`DuplicatePlatformAsset` will identify both routes as schema resources. Each branch initializes a copied Core storage Name and copied declared `$id`, validates Name against the supplied storage-name list, and runs the resource-specific resolver after local validation when Duplicate is activated.

The Catalog Schema branch also exposes its required display name in the duplicate form, while retaining its entity type, default locale, and other schema body properties from the source. This matches the App Runner pattern: the modal makes the identities and human-readable display metadata editable without reconstructing unrelated schema content.

### Use one inline external error state per active duplicate form

A resolved schema sets the standard `NameExists` message on the `$id` `IdControl` through `externalError`. Its existing validation-context integration disables the action. Editing `$id` clears only that asynchronous error and lets ordinary URL and forbidden-character validation decide validity.

The existing App Runner duplicate implementation establishes this mechanism; the change generalizes it rather than creating a second modal-only error presentation.

### Preserve Core as the authority after a preflight

No resolver result reserves an ID. A missing response proceeds to the existing Core create action. A thrown resolver error also proceeds, because it cannot prove whether the ID is available. Core's normal conflict notification remains visible for concurrent writes, unavailable resolution, and any other final-write rejection.

## Risks / Trade-offs

- [A different admin creates the ID between lookup and write] → retain Core's final conflict handling.
- [Resolver lookup is temporarily unavailable] → proceed to the normal write rather than blocking an otherwise valid create/duplicate.
- [Catalog Schema duplication introduces an action currently suppressed by the list] → retain the same read-only and file-root action restrictions as other mutating Catalog Schema actions, and cover the new action plus unrelated asset regression behavior.
- [A reused shared create component broadens behavior accidentally] → supply the resolver only for the two schema routes and test that callers without it still invoke their unchanged create callback.

## Migration Plan

No data migration, API deployment, or rollout ordering is needed. The change is frontend-only and backward-compatible. Rolling back removes the preflight and Catalog Schema duplicate affordance; Core's write-time validation remains in force.

## Open Questions

None.
