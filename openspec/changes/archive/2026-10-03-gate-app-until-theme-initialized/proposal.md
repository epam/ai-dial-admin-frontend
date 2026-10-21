## Why

The application currently renders its page shell before `ThemeProvider` reads the saved theme and applies its CSS variables, so users can briefly see components styled with the default dark colors. The initial page content should remain hidden until theme initialization finishes, including when the configured theme is unavailable and the existing fallback colors must be used.

## What Changes

- Track initial theme readiness within `ThemeProvider`, where theme colors and theme-dependent state are initialized.
- Withhold the provider's children until the initial color application and related theme state updates complete.
- Reveal the application even when initialization encounters an error so a storage or theme failure cannot leave the page permanently blank.
- Preserve the current `fallbackDarkTheme` behavior when no theme configuration or matching stored theme is available.
- Add focused automated tests for configured-theme, fallback, and initialization-failure paths.

## Non-goals

- Running a synchronous theme bootstrap script in the document `<head>`.
- Eliminating the temporary empty surface before client hydration.
- Changing the theme service contract, theme switching behavior after initialization, or the existing color-token compatibility filtering.
- Adding browser-based verification to this change; focused automated tests and the standard quality gates will be used.

## Capabilities

### New Capabilities

- `initial-theme-rendering`: Defines when application content becomes visible during initial theme setup and how fallback or failed initialization behaves.

### Modified Capabilities

None.

## Impact

- `apps/ai-dial-admin/src/context/ThemeContext.tsx` will own initial readiness and gate its children.
- Existing consumers wrapped by `ThemeProvider`, including the main application shell and themed error-page wrappers, will render only after initialization.
- Theme utility behavior in `apps/ai-dial-admin/src/utils/themes/apply-theme-colors.ts` remains the source of configured and fallback color application.
- Theme-provider and utility tests will cover the new initial rendering contract without API or dependency changes.
