## Why

Saving an edited pending Application or Toolset publication request currently fails with HTTP 500 because the post-update resource write resolves a legacy flat path that is no longer present after the resource metadata-model migration. This blocks reviewers from updating otherwise valid approval requests.

## What Changes

- Resolve the Core content-write path for Application and Toolset publication resources from their current metadata shape.
- Preserve the existing two-stage publication-update flow and Core payload sanitization.
- Add regression coverage that verifies Application and Toolset publication edits write to the correct Core resource URL.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `publications-core-api`: Publication updates for Application and Toolset resources persist edited resource bodies through the current Core metadata identity model.

## Impact

- `apps/ai-dial-admin/src/app/api/api.ts` publication enrichment client.
- Publication-update API tests under `apps/ai-dial-admin/src/app/api/tests/` and/or `src/server/entities/tests/`.
- No route, UI, server-action signature, backend endpoint, or user-facing notification changes.

## Non-goals

- Changing approval, rejection, deletion, or publication creation behavior.
- Refactoring the broader resource metadata model or changing resource concurrency behavior.
- Adding a fallback to the admin backend.
