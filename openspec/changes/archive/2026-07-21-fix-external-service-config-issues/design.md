## Context

Three bugs (#3970, #3971, #3976) were reported against the External Services section of
Applications → Properties, all rooted in the same small cluster of files:
`ResourceMultiAuth.tsx`, `ResourceAuthentication.tsx`/`ResourceAuthTypeSection.tsx`, and the
`signInExternalService`/`signOutExternalService` server actions in `actions.ts`.
`ResourceAuthentication` is shared with the Toolset auth UI (`ResourceAuthTypeSection.tsx` renders
one card per `AuthConfig` in a fixed `authOptions` array of OAuth/API_KEY/NONE), so changes there
must not affect Toolset behavior.

While investigating #3971, a discrepancy surfaced between the current consolidated spec and the
actual code: `openspec/specs/app-external-services-auth/spec.md` states the Service ID field is
"read-only for existing services" / "not editable" in edit mode, but `ResourceMultiAuth.tsx`
already renders `serviceId` as a normal controlled `DialInput` with no such restriction, and
`onSave` already handles the rename case (`if (originalId && originalId !== currentId) delete
updated[originalId]`). Renaming already works in the shipped app; the spec text was simply stale.
This change corrects that spec text to match reality as part of fixing the duplicate-ID bug, since
the duplicate check needs to explicitly cover the rename path.

## Goals / Non-Goals

**Goals:**
- Remove "Without authentication" from the external-service auth type selector without touching
  Toolset auth options.
- Reject duplicate Service IDs on both Add and rename-during-Edit, with a visible field error and
  a disabled Apply button (consistent with how other required-field validation already blocks
  Apply in this form).
- Make external-service sign-in/sign-out work when the app's resource path contains characters
  that aren't valid unencoded in a URL segment (starting with spaces, per #3976).
- Bring `app-external-services-auth` spec back in sync with actual Service-ID-editable behavior.

**Non-Goals:**
- Case-insensitive or whitespace-normalized duplicate ID comparison — the report describes exact
  duplicates only; broader normalization is out of scope unless it resurfaces later.
- Any change to Toolset auth type options or Toolset ID handling.
- Backend changes — the fix for #3976 is entirely on the request-construction side; the backend
  already handles encoded paths correctly per the issue's own diagnosis.

## Decisions

### 1. New `excludeAuthTypes?: ToolsetAuthType[]` prop on `ResourceAuthentication`
Filters the `authOptions` array before both the disabled-view and interactive-view render paths in
`ResourceAuthentication.tsx`. `ResourceMultiAuth` passes `excludeAuthTypes={[ToolsetAuthType.NONE]}`;
the Toolset caller passes nothing, so it's fully backward compatible.

**Alternative considered:** repurpose `hideWithLoginOption` to also drop NONE from the options
list. Rejected — that prop currently controls a narrower, unrelated concern (whether the
"With login" vs "With login and config" radio choice shows inside the OAuth card in
`ResourceAuthTypeSection.tsx`). Overloading it would make future changes to either concern
ambiguous about which behavior they're touching.

### 2. Duplicate Service ID check lives in `ResourceMultiAuth`, gates Apply
`onSave`'s pre-condition already gates Apply on `!editState.currentId || !isValid`. We add a
derived `isDuplicateId` check (`currentId !== originalId && !!services[currentId]`) computed in
the component body and combine it into the Apply `disabled` expression, plus render an inline
error under the Service ID `DialInput` when true. A single check expression covers both Add
(`originalId === ''`) and rename-during-Edit (`originalId !== '' && originalId !== currentId`)
because both cases reduce to "does another entry already own this ID."

**Alternative considered:** validate only on Add, per the literal wording of #3971's repro steps.
Rejected per explicit product decision — the same silent-overwrite bug exists on rename via the
identical `updated[currentId] = service` line in `onSave`, so leaving it unfixed there would just
relocate the bug rather than fix it.

### 3. Encode `appPath` with the existing `encodeCorePath` helper
`encodeCorePath` (`@/src/server/publications/path.ts`) already implements exactly the needed
per-segment `encodeURIComponent` + rejoin-with-`/` behavior, and is already a cross-feature import
used elsewhere in `actions.ts` (`getVersionedName` from the same module). Reusing it means no new
utility, no duplicated logic, and no relocation — apply it at the two `url:` template-literal call
sites in `signInExternalService` and `signOutExternalService`.

**Alternative considered:** `encodeURIComponent(appPath)` as a single call. Rejected — `appPath`
contains `/` folder separators; a blind whole-string encode would turn those into `%2F` and break
the path structure the backend expects.

## Risks / Trade-offs

- [Existing e2e/manual flows that relied on selecting "Without authentication" for an external
  service] → None expected: per the issue, that option was never valid for external services in
  the first place; no legitimate saved data depends on it.
- [Spec correction for Service-ID-editable-on-edit could be read as an unrelated scope-creep change
  by reviewers] → Called out explicitly in this design doc and scoped to a one-line factual
  correction, not a behavior change.
- [Duplicate-ID check does not normalize case or whitespace] → Acceptable per Non-Goals; can be
  revisited if a future report asks for it.
