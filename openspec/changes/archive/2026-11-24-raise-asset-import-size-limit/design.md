# Design

## Context

See `proposal.md` and `specs/asset-import-limits/spec.md` for the scope and contract. `getImportSizeLimits` currently gives all non-Files routes a 4 MiB per-file limit and a 64 MiB total. `ImportModal` also accepts preselected files directly, bypassing the upload field's per-file validation. For JSON, the modal parses and combines the files, applies edits, and serializes a new document; an archive is sent unchanged. The shared Next.js Server Action body limit is 64 MB for the entire request.

## Goals / Non-Goals

**Goals:** Apply a consistent source-file limit on every entry path, preserve the import preview and edits, and make permitted boundary-size imports fit through the application transport.

**Non-Goals:** Change Core import semantics, configure upstream deployment limits, alter archive extraction safety checks, or change unrelated routes' source-file limits.

## Decisions

### Scope the limits at the asset route boundary

Give Prompts, Assets Applications and Assets Toolsets 64 MiB per file and 64 MiB total through `src/utils/import/get-import-size-limits.ts`, leaving the existing Files and other-route defaults intact. Keep the shared `FileUploadField` behavior and 30-file count; update `src/constants/import.tsx` and `src/locales/en.ts` so both radio descriptions disclose the correct limits. Replacing the global 4 MiB constant would unintentionally change other consumers.

### Validate preselection as well as the picker

In `ImportModal`, apply equivalent size and count checks to preselected files before enabling the wizard. Show the existing accessible validation feedback and do not silently truncate a selection over 30. Picker, Add, drop and preselection must agree at and above the boundary. Preserve the field's existing treatment of an oversized combined list. This closes the preselection bypass rather than relying on the upload component alone.

### Allow for the actual action payload

Keep the preview, conflict resolution and client-secret edits. Prompts submit through `api/prompts/import`, while applications and toolsets use Server Actions. The user chose a 64 MiB limit for the prepared JSON blob as well as the source files; check it after edits and before submitting, with a clear error instead of truncation. The server must independently reject an archive or JSON blob over 64 MiB before reading or extracting it. Since the server receives transformed JSON, it cannot reconstruct the original files' combined size.

Increase the finite Next.js Server Action body budget only enough to accommodate a 64 MiB file plus bounded config, filename and request framing. Normalize the submitted filename and bound config data so that this overhead has a defensible maximum. The prompts route handler is not governed by the Server Action HTTP body limit and needs its own request handling checks. A separate route for all assets would avoid the global action change but duplicate authenticated transport and is outside this change. Real application HTTP boundary testing was declined after the local app could not load without Core; unit checks cover the configured budget and prompt multipart guard, but do not establish actual Next.js action framing at the boundary.

### Preserve ZIP protections and results

Keep `src/server/zip/` entry-count, per-entry and total-inflated-size limits, traversal checks and their deployment overrides. Uploaded ZIP size is separate from inflated content size. Leave `asset-import-progress` success, error, skipped and loading notification semantics unchanged.

## Risks / Trade-offs

- **[Larger shared action-body allowance]** The Next.js setting affects every action and can increase memory exposure before action-specific validation. → Keep the budget finite, use the smallest justified bound, validate the payload promptly in the asset handler, and document the global impact; do not claim this enforces a global 64 MiB cap.
- **[JSON expansion and edits]** A 64 MiB source selection can produce prepared JSON larger than 64 MiB. → The user chose the same 64 MiB cap for prepared JSON; show a clear error and retain edits so the user can reduce the content.
- **[External deployment limits]** A proxy or Core may still reject an otherwise valid request or entity. → Preserve existing failure notifications and document that those independently configured limits are outside this change.
- **[Memory and decompression]** Large files require parsing and an archive can expand substantially. → Preserve existing ZIP safeguards and test the application-side limits; no new decompression allowance is introduced.

## Migration Plan

Deploy the updated application and its Next.js configuration together. No stored-data migration is needed. Roll back the application and configuration together to restore the previous limits; external infrastructure configuration remains unchanged.
