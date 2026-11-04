## Why

Invalid Rate Limit Schedule values stop blocking Save when their tab unmounts, and validation resets can similarly lose a newer invalid edit. An invalid hidden tab also gives no indication of the reason Save is disabled, and a rejected update can leave the user without feedback.

## What Changes

- Keep schedule and spending-limit validation active for the page lifetime and share the cost-object rule between the page and tab.
- Mark invalid tabs with the existing accessible error status.
- Show a localized error notification for rejected update requests, keeping edits intact.
- Restore the archived Spending Limits requirements missing from the consolidated specification.

## Capabilities

### Modified Capabilities

- `system-properties`: validation across tabs and resets, invalid-tab status, and rejected-save feedback.

## Non-goals

- New cost-object format rules, automatic tab navigation, or changes to the Core settings API.

## Impact

System Properties components, their tests and feature-local utilities; existing shared tab status, notification and save-validation facilities; consolidated system-properties specification.
