# Implementation Tasks

## Core Changes

- [x] Update `DEFAULT_DURATION` constant in `apps/ai-dial-admin/src/context/NotificationContext.tsx` from `3000` to `6000`

## Testing & Verification

- [x] Check and update any tests that assert on the 3000ms timeout value
- [x] Verify that only success notifications are affected (errors, prepare, and dynamic notifications should still use manual dismiss)
- [x] Run the test suite to ensure no regressions

## Documentation

- [ ] No documentation changes needed (internal implementation detail)

## Notes

- The change affects line 12 in `NotificationContext.tsx`: `const DEFAULT_DURATION = 3000;`
- Success notifications use this default when `duration` parameter is undefined
- Error notifications pass `duration: null` which means manual dismiss only (unchanged)
- Prepare notifications pass `duration: null` which means manual dismiss only (unchanged)
- Dynamic notifications inherently don't auto-dismiss (unchanged)
