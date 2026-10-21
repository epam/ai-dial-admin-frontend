## Why

Saving the System Properties page (`/system-properties`) fails with `412 Precondition Failed —
"Resource must exist"` whenever the admin has never saved global settings via the API before. Core's
`v1/settings/platform/global` singleton has no blob yet in that case, and the frontend always attaches
`If-Match: *` on the write (`DEFAULT_ETAG` fallback in `putActionWithEtag`) intending it as an
"unconditional write" sentinel. Core correctly rejects that per RFC 7232: `If-Match` — any value,
including `*` — asserts the resource currently exists, and the singleton doesn't yet. The very first
save of global interceptors on a fresh environment is broken.

## What Changes

- The System Properties save flow distinguishes "no global settings blob exists yet" from "a blob
  exists, guard the write against concurrent edits": when the prior read found no blob, the write
  omits `If-Match` entirely instead of sending `If-Match: *`.
- `BaseApi.putActionWithEtag` gains a way for a caller to send no `If-Match` header at all, rather than
  always falling back to `DEFAULT_ETAG` when the etag is falsy.
- The System Properties read path (`page.tsx`) tracks "settings blob exists" as an explicit tri-state
  (no read yet / confirmed absent / confirmed present with etag `X`) instead of collapsing "no etag
  returned" into the same `DEFAULT_ETAG` sentinel used elsewhere to mean "don't care, write anyway."
- `GlobalSettings` (frontend model) gains the `retriableErrorCodes` field already present on Core's
  `GlobalSettings`, so the save path's existing "spread the previously-read settings, only replace
  `globalInterceptors`" merge is backed by the type rather than working only by accident of how the
  merge happens to be written.
- The full-settings read on `page.tsx` starts checking `res.success` and surfaces a warning
  (mirroring the `optionWarnings` pattern already used on the same page for the interceptor option
  list) when the read fails for a reason other than "no blob yet."

## Capabilities

### New Capabilities

- `system-properties`: the System Properties page's read/save behavior against Core's global-settings
  singleton — no spec currently exists for this page, so this proposal introduces its baseline spec
  alongside the fix.

### Modified Capabilities

(none — no existing capability spec covers this page)

## Impact

- `apps/ai-dial-admin/src/server/base-api.ts` — `putActionWithEtag` (or a sibling method) gains an
  omit-`If-Match` path.
- `apps/ai-dial-admin/src/server/core/settings-api.ts` — `updateSystemProperties` call shape.
- `apps/ai-dial-admin/src/app/[lang]/system-properties/page.tsx` and `actions.ts` — etag tri-state
  tracking.
- `apps/ai-dial-admin/src/components/SystemProperties/SystemProperties.tsx` — save wiring, if the
  tri-state needs to be threaded through as a prop/state.
- `apps/ai-dial-admin/src/models/system-properties.ts` — `GlobalSettings` type gains
  `retriableErrorCodes`.
- No other entity is affected: `interceptors-api.ts`/`keys-api.ts` already avoid this failure mode via
  separate create (`POST`, no `If-Match`) and update (`PUT`, `If-Match`) methods, which this proposal
  does not change.
