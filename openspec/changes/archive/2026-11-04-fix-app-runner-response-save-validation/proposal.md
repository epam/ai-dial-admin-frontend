## Why

A Platform App Runner route can show required Response errors while Save remains enabled. The form and save-time validation disagree about empty fields and invalid status values, so the editor must enforce the same response rules consistently.

## What Changes

- Disable form Save while any runner route has an invalid Response, even when another route or tab is selected.
- Reject invalid Response values on save, including edits made through the JSON editor, with the existing validation notification.
- Restore Save when all response errors are corrected or the invalid response is removed, subject to the existing save gates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-app-runners`: Define form Save gating and save-time validation for app-route responses.

## Impact

The Platform App Runner view and its Core-shaped validation utility change. Response validity is registered in the existing save-validation context. Shared `RouteProperties` derives its upstream requirement from the active route so stale endpoint errors clear after route switches; this also corrects that state for its other callers. Shared header behavior remains unchanged. No backend API changes are required.

## Non-goals

- Reworking unrelated validation rules or adding new behavior to other route editors.
- Changing the shared JSON editor's Save-button behavior.
