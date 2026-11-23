# Design

## Context

See `proposal.md` for the motivation and scope. Router-facing labels already flow through the English locale in `apps/ai-dial-admin/src/locales/en.ts`, with existing keys reused across navigation, shared asset actions and aliases. Analytics also has a frontend-owned session deployment description containing the term. DIAL Core's resource and target paths use `routers`, and Core validation messages are displayed verbatim.

## Goals / Non-Goals

**Goals:**
- Make the display terminology consistent across modules without changing their shared behavior.
- Verify both the actual English text and the existing key-to-surface wiring.

**Non-Goals:**
- Renaming internal symbols, localization keys, routes, persisted identifiers or API types.
- Translating or modifying backend-supplied messages or user content.

## Decisions

### Change locale values, not keys or entity identifiers

Update the existing router-related English values, preserving their keys and the code paths that consume them. Use sentence casing where the surrounding text calls for it. Keep the separate Route values as they are. This reuses the existing i18n and shared-component patterns and avoids changing API or navigation semantics. Renaming enums, paths or model types was rejected because those identifiers encode contracts rather than user-facing terminology.

Review all router references in the locale rather than just the menu label: entity names are interpolated into shared create, duplicate, delete and update messages, while empty-state text, alias selectors, field labels and explanatory descriptions have their own entries. Do not replace unrelated uses of “route” or router-shaped technical data.

### Test translated values and surface wiring separately

The global component test setup returns i18n keys rather than translated text. Assert the English values directly in locale tests, including representative singular, plural, empty-state, alias and explanatory strings, and assert the existing translation keys are selected by representative menu and alias UI tests. Cover unchanged Route labels, the existing `/platform-routers` link and the `routers/` alias target encoding. Key-only component assertions cannot prove the new wording; locale-only assertions cannot prove a surface selects the correct key.

### Preserve Core response text

The frontend updates only its own labels, including success messages assembled from entity names. Core's rejected-write messages remain verbatim through the existing error path, even if they say “router”. Rewriting responses would obscure the backend's diagnostics and is outside the agreed scope.

## Risks / Trade-offs

- [Shared locale entries can affect several screens] → Review all consumers and cover router action and alias cases as well as the list and menu.
- [Key-mocked tests can pass with old English text] → Add direct locale-value assertions alongside representative component wiring tests.
- [A blind rename could affect technical identifiers, Routes or user content] → Limit changes to frontend-owned display values and preserve existing route and target-path tests.
- [Core messages may use the old terminology] → Keep them verbatim and document this boundary rather than altering diagnostic text.

## Migration Plan

Deploy as a frontend-only text change; existing bookmarks and persisted resources continue to work. Roll back by reverting the frontend change; no data migration is needed.
