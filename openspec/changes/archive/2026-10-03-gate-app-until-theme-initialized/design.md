## Context

`ThemeProvider` currently initializes `currentThemeId` to the default dark theme, renders its children immediately, and then reads the saved theme and calls `applyThemeColors` from a client effect. Server-rendered application components can therefore be painted with dark fallback tokens before the saved light or custom theme is applied. The provider wraps the main application shell and is also reused by themed error-page wrappers, making it the shared boundary for this behavior.

The user has explicitly rejected a synchronous document-head bootstrap. The accepted trade-off is an initially empty application surface until client hydration and theme initialization complete.

## Goals / Non-Goals

**Goals:**

- Prevent application components below `ThemeProvider` from rendering with pre-initialization colors.
- Apply configured or fallback colors before revealing the provider's children.
- Initialize theme-dependent context state, including the selected theme ID and logo, before revealing children.
- Guarantee that storage or theme initialization failures do not leave the application permanently hidden.
- Cover the initialization order, fallback paths, and failure behavior with focused automated tests.

**Non-Goals:**

- Applying theme colors before the browser's first paint.
- Adding scripts to the root document head.
- Replacing the temporary empty surface with a branded loader.
- Changing post-initialization theme switching, the theme-service API, or existing color-token filtering.
- Adding browser-based verification.

## Decisions

### Keep readiness state in `ThemeProvider`

`ThemeProvider` will own an `isThemeInitialized` boolean initialized to `false`. It is the component that performs color application and initializes theme-dependent state, so it can establish readiness without coupling theme lifecycle to `AppContextProvider`.

The provider will continue to mount while its descendants are withheld, allowing its initialization effect to run. Its context provider will render children only when readiness becomes true. This also applies the behavior consistently to every existing `ThemeProvider` consumer, including error-page wrappers.

**Alternative considered:** Store readiness in `AppContextProvider` and let `ThemeProvider` update it. This creates cross-context coupling, requires an additional gate below `ThemeProvider` to avoid preventing the initializer itself from mounting, and does not naturally cover `ThemeProvider` usages outside the main app-context stack.

### Complete theme setup before opening the gate

The initialization effect will resolve the stored theme ID or configured default, apply its colors, and initialize the current theme ID and logo. Readiness will be set only after those synchronous operations complete, ensuring consumers do not mount with placeholder theme context values.

Readiness is only an initial-load gate. Later calls to `setTheme` remain synchronous updates and do not hide or remount the application.

### Preserve and harden fallback behavior

When no matching configured theme is available, initialization will continue to call `applyThemeColors` without a theme so the existing `fallbackDarkTheme` is applied before children become visible. If reading storage or initializing the selected theme throws, initialization will attempt the same fallback color application and will open the gate in a `finally` path even if fallback application also fails.

This favors an accessible application with default styling over a permanently empty page. No startup notification is introduced because the existing theme-loading behavior does not expose one and notification infrastructure is itself below the gate.

### Render no interim application UI

While readiness is false, `ThemeProvider` will render no children. Rendering a loader would itself need a trustworthy theme and could reproduce the same incorrect-color flash. The document's existing default background can remain visible until hydration completes.

**Alternative considered:** Use a synchronous head script to apply saved colors before body parsing. This avoids the empty interval but is explicitly out of scope.

## Risks / Trade-offs

- **[Risk] Slower devices or delayed hydration show an empty surface longer.** → Keep initialization synchronous and limited to local storage, CSS-variable application, and local React state; do not add network work to the gate.
- **[Risk] An exception during initialization could leave the application hidden.** → Apply fallback colors in the error path and set readiness in `finally`.
- **[Risk] Gating children delays descendant effects and initial mounting.** → Gate only the first initialization; never close it during normal theme changes.
- **[Risk] Tests may accidentally use the globally mocked theme context.** → Add focused provider tests that exercise the real `ThemeProvider` module and mock only storage/theme helpers as needed.

## Migration Plan

No data or deployment migration is required. The change is limited to client rendering lifecycle behavior. Rollback consists of removing the readiness gate and restoring unconditional child rendering.

## Open Questions

None.
