# Proposal

## Why

In the org-unit role form, a reserved Custom claim name silently disables Add, leaving the user unable to tell what needs correcting. Issue #5688 requests restoring the existing explanatory message without bringing back the misleading claim-value error fixed in #5598.

## What Changes

- Mark the claim-name field invalid and show its existing reserved-name message for `email`, `roles`, and `sub`, including when surrounded by whitespace.
- Keep validation and feedback for the claim value independent of the claim name; retain the current silent behavior for blank and other invalid Custom claim inputs.
- Update the org-unit form specification and component tests to reflect the targeted change.

## Non-goals

- Changing the reserved names, their case-sensitive matching, subject classification, or Core API contracts.
- Adding general inline validation for other invalid Custom claim names or values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `org-units-folders-storage`: Explain reserved Custom claim names inline while preserving the other holder-form behavior.

## Impact

The change is confined to the Folders Storage `AddHolderForm`, its `UnitRolesCard` tests, and the existing org-unit specification. It reuses the existing `HolderClaimKeyReserved` translation and reserved-name definitions; no shared UI component, context, API, or dependency contract changes are intended.
