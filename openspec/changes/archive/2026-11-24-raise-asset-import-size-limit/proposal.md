# Proposal

## Why

Asset imports reject an archive or JSON file over 4 MiB even though a batch of JSON files may total 64 MiB. This prevents users from importing a single larger file or archive within the existing batch allowance.

## What Changes

- Allow one archive of up to 64 MiB, or up to 30 JSON files totaling at most 64 MiB, for the existing Prompts, Assets Applications and Assets Toolsets imports.
- Update the import radio descriptions and size errors to reflect those limits, consistently across file selection and preselected files.
- Limit the prepared JSON document to 64 MiB as well; if rewriting or edits exceed it, show a clear error before submission.
- Ensure the app's import transport can handle a permitted payload plus request overhead, without weakening existing ZIP extraction safeguards.

## Capabilities

### New Capabilities

- `asset-import-limits`: Size, count and explanatory text for existing asset archive and JSON imports.

### Modified Capabilities

None.

## Impact

- The shared import modal, size-limit helper and translated descriptions are used beyond these asset routes; preserve other routes' behavior, including the Files route's 100 MiB limits.
- The Next.js Server Action body limit is shared globally, so transport changes may affect other actions and need bounded request handling. ZIP safety limits and Core or deployment infrastructure limits remain independent.
- Existing import parsing, conflict resolution and notifications remain in use.

## Non-goals

- Add import actions for Skills or Conversations, or change skill file uploads.
- Change the Files route limits, configure external proxies or Core, or change archive extraction limits.
- Change import radio-button labels or unrelated typo messages; the requested wording change is the size text.
