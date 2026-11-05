## 1. Validation and status

- [x] 1.1 Move schedule validation registration from `RateLimitSchedule.tsx` to `SystemProperties.tsx`, including re-registration after reset and cleanup on page unmount.
- [x] 1.2 Share cost-object validation in a feature-local utility and apply accessible error statuses to the affected tabs in `Header.tsx`.
- [x] 1.3 Handle rejected update requests with a localized error while preserving edits and existing failure-envelope behavior.

## 2. Tests and specifications

- [x] 2.1 Update component and utility tests for hidden-tab validation, all schedule fields, resets, status, correction, discard, and rejected updates; correct validation mock shape.
- [x] 2.2 Fold the archived Spending Limits requirements into `openspec/specs/system-properties/spec.md` and sync this change's requirements.

## 3. Quality checks

- [x] 3.1 Run focused tests, lint, format, both typechecks, and the full test suite; record results.
  - Focused tests (65), lint, spec lint and format passed. Both typechecks failed on the unchanged `BreadcrumbsSize.Tiny` error in `Breadcrumbs.tsx:116`. The full suite was stopped before completion. The user requested archiving with these checks unresolved.
