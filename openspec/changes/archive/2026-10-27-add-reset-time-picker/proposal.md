## Why

The Rate Limit Schedule's Reset time currently requires free-text `HH:mm` entry. Issue [#5166](https://github.com/epam/ai-dial-admin-frontend/issues/5166) requests visual hour/minute selection to improve usability; existing save validation already prevents invalid times from reaching Core.

## What Changes

- Replace the reset-time `Input` with the existing ui-kit `Calendar` in time mode: a masked 24-hour field with a clock-triggered hour/minute popover.
- Allow every hour `00–23` and minute `00–59`, retaining canonical `HH:mm` strings in the schedule.
- Validate incomplete or cleared typed drafts on blur, including an attempt to move to Save, rather than silently saving the previous complete value.
- Preserve displayed defaults without initial dirty state, first-edit materialization, Save/Discard, full schedule validation, and read-only behavior.
- Update the System Properties requirements and automated component tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-properties`: Replace the specified reset-time text input with a visual time picker and define selection, typed-draft validation, and keyboard behavior.

## Impact

- Feature wiring: `apps/ai-dial-admin/src/components/SystemProperties/RateLimitSchedule.tsx`.
- Tests: `components/SystemProperties/tests/RateLimitSchedule.spec.tsx` and targeted page integration cases in `tests/SystemProperties.spec.tsx`.
- Existing `SaveValidationContext`, schedule validation util, and page state remain the integration points; no shared-context behavior change is intended.
- No API/model change: Core's `v1/settings/platform/global` continues receiving `rateLimitSchedule.resetTime` as an `HH:mm` string.
- No dependency upgrade: the locked `@epam/ai-dial-ui-kit` version `0.16.0-dev.45` includes the visual picker introduced by ui-kit commit `e17aa72` (#954).
- Automated browser verification was offered and declined; unit/integration tests and quality gates remain required.

## Non-goals

- Changing timezone/week-start-day controls, per-role rate limits, or settings persistence.
- Date/timestamp conversion, viewer-timezone hints, or DST previews.
- A custom time picker, a new shared wrapper, or modifications to the ui-kit repository/vendor internals.
- Broad ui-kit upgrades or unrelated cleanup.
