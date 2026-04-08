## Why

Success notifications in the Admin UI disappear after 3 seconds, which is too short for users to read and comprehend them. This is especially problematic for notifications with both title and description, such as:
- "5 Models imported successfully" + "You can now see them in /production folder"
- "Toolset logged in successfully" + "List of available tools is in the Tools Overview tab"
- "Interceptor Template Image installed successfully" + "Latest config updates from source applied"

Users have complained that these messages disappear before they can read them completely.

**GitHub Issue**: #2905

## What Changes

Increase the default auto-dismiss duration for success notifications from 3 seconds to 6 seconds. This provides adequate time for users to:
- Notice the notification appeared (~0.5s)
- Read the title and description (~4-5s for longest messages)
- Process the information and decide if action is needed (~0.5s)

## Scope

### In Scope
- Change `DEFAULT_DURATION` constant in `NotificationContext.tsx` from 3000ms to 6000ms
- Update any tests that assert on the 3000ms timeout value
- Verify the change affects only success notifications (not errors, prepare, or dynamic notifications)

### Out of Scope
- Variable duration based on message length (keep it simple with one constant)
- Changes to error notification behavior (already manual-dismiss only)
- Changes to prepare or dynamic notification behavior (already manual-dismiss only)
- Accessibility enhancements beyond basic readability

## Impact

### Code
- **Modified**: `apps/ai-dial-admin/src/context/NotificationContext.tsx` — change DEFAULT_DURATION constant
- **Modified**: Test files that reference the 3000ms timeout value (if any)

### User Experience
- Success notifications will remain visible for 6 seconds instead of 3
- Users will have adequate time to read multi-line notifications
- No change to error/prepare/dynamic notifications (already manual-dismiss)
- Users can still manually dismiss any notification using the X button

### APIs
- No API changes

### Migration
- No migration required
- Existing notifications automatically use new duration
- No breaking changes

## Alternatives Considered

### 5 seconds instead of 6
Testing the longest message ("Interceptor Template Image installed successfully" + description) requires ~4-5 seconds to read at normal pace. 6 seconds provides a comfortable buffer without feeling sluggish. 5 seconds works but feels tight.

### Variable duration based on content length
More sophisticated but adds complexity. The issue requests "standardize notification display duration" — a single consistent value is simpler and meets the requirement.

### Longer duration (8-10 seconds)
Could feel too slow for short messages like "Saved" or "Copied successfully". 6 seconds balances readability for long messages without annoying users on short ones.

## Success Criteria

- Success notifications remain visible for 6 seconds
- All tests pass
- No regressions in notification dismissal behavior
- Error/prepare/dynamic notifications unchanged (manual dismiss only)
