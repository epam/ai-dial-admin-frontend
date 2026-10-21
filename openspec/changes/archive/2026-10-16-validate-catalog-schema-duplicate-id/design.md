## Context

The Catalog Schema create form keeps Core storage `name` and schema-body `$id` separate. It currently applies synchronous required, URL, length, and Core-representability validation to `$id`, then writes through the existing Core-backed create action. A duplicate declared `$id` is therefore reported only after Core rejects the write.

The completed `fix-platform-app-runner-duplicate-validation` change established the appropriate local precedent: an asynchronous schema lookup happens only after the user activates the valid duplicate form; a resolved schema becomes an `IdControl` external error; editing the ID clears that error; and the final Core write remains authoritative.

Catalog Schemas already expose the parallel `getCatalogSchemaById` action, backed by Core's merged declared-ID resolver. It can find both API-written and configuration-file schemas, matching the namespace Core uses to enforce `$id` uniqueness.

## Goals / Non-Goals

**Goals:**

- Give users inline, actionable feedback in the Create Catalog Schema modal when the proposed declared `$id` already resolves in Core.
- Reuse the existing `IdControl` external-error and `SaveValidationContext` validity mechanism.
- Avoid network traffic while the user edits and preserve the existing Core create action as the final authority.

**Non-Goals:**

- Change the separate storage Name field, Core resource naming, or Catalog Schema update behavior.
- Reserve `$id` values, validate on each keystroke, or turn a preflight into a replacement for Core conflict handling.
- Change Platform App Runner, legacy Application Runner, or other asset create/duplicate forms.

## Decisions

### Resolve only when Create is activated after local validation succeeds

The create-form orchestration will request `getCatalogSchemaById` only when the form is otherwise valid and the user activates Create. A successful resolver response means the declared `$id` already exists; it sets the standard existing-name message as the `$id` field's external error and does not invoke the existing create callback.

This follows the App Runner duplicate precedent and avoids asynchronous validation noise, stale responses, and Core traffic on every edit. Valid local format checks remain the first gate.

### Reuse `IdControl.externalError` rather than add modal-specific UI

The form will pass the resolved-ID state through the shared `IdControl` external-error API. That preserves the existing inline error layout and causes `SaveValidationContext` to disable Create consistently with synchronous field errors.

A bespoke error banner or a notification-only response was rejected because neither locates the issue at the editable field, and the issue explicitly requires modal validation.

### Clear the external error when the user edits `$id`

Changing `$id` clears only the resolved-ID error. The control then returns to its standard local validation state; a user can submit again once all fields are valid.

The implementation will not cache or debounce resolver results. The next activation provides a fresh answer and keeps the behavior deterministic.

### Fail open on resolver errors; let the existing create action decide

An unresolved lookup proceeds to the current Core create flow. A failed lookup also proceeds, because failure cannot prove an ID is unused and blocking valid creates during transient lookup errors would change availability semantics. Core's existing 409 handling remains the authority for duplicate races and lookup outages.

## Risks / Trade-offs

- [A concurrent write occurs after a successful unresolved lookup] → Core's existing write conflict remains visible and authoritative.
- [A lookup error conceals an existing ID] → The create action still reaches Core, whose conflict message remains the fallback.
- [A configuration-file schema resolves even though it is not editable here] → Treat it as occupied, matching Core's merged declared-ID namespace.
- [The external error remains after a corrected ID] → Clear it directly in the `$id` change path and cover recovery in component tests.

## Migration Plan

No migration or backend rollout is required. This is a frontend-only, backward-compatible change. Rollback removes the client-side preflight while Core continues enforcing `$id` uniqueness on writes.

## Open Questions

None.
