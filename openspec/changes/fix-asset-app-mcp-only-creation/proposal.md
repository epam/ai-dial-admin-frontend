# Proposal

## Why

Asset application creation incorrectly disables Create when an administrator configures a valid MCP endpoint without a chat endpoint. Issue #5677 reports this valid source configuration cannot be submitted.

## What Changes

- Accept a valid chat or MCP endpoint for the Endpoints creation mode, while retaining validation of all enabled fields.
- Move suitable creation-modal calculations and constants out of `CreateApplication` without changing the other source modes.
- Add regression coverage for endpoint combinations and the creation flow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `application-source`: asset application creation accepts an MCP endpoint without a chat endpoint.

## Impact

The asset application creation modal, feature-local helpers, tests, and application-source specification change. The existing `ResourceSourceField`, endpoint editor, validation context, and Core resource payload remain in use; no backend API changes are planned.

## Non-goals

- Changing regular application or asset editing behavior, other source modes, or endpoint field validation rules.
- Changing backend resource contracts or adding an automated browser-verification task, which the user declined.
