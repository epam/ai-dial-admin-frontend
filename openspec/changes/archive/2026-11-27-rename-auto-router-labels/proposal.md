# Proposal

## Why

The AI Gateway lists Routers and Routes as separate entities, but their similar names are easy to confuse. Naming the router entity Auto Router makes the distinction clearer without changing its behavior.

## What Changes

- Use **Auto Router** and **Auto Routers** consistently in frontend-owned text that refers to the router entity, including navigation, breadcrumbs, lists, empty states, forms, action dialogs and notifications.
- Apply the same terminology to alias target and present-as selectors and explanatory text elsewhere in the app, including Analytics descriptions.
- Update the menu documentation and affected specifications to reflect the displayed labels.
- Keep the separate **Routes** entity and its labels unchanged.

## Non-goals

- Changing router behavior, resource names, API contracts, frontend URLs, stored values, or i18n keys.
- Rewriting messages returned verbatim by DIAL Core or changing user-supplied resource names and content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-routers`: Display the entity as Auto Router / Auto Routers in the menu and router-facing UI.
- `platform-entity-routes`: Name the existing `/platform-routers` sidebar entry Auto Routers while preserving its destination.
- `aliases`: Display Auto Router in the target type, target picker and present-as options without changing stored target paths or selection behavior.

## Impact

- UI text is primarily centralized in `apps/ai-dial-admin/src/locales/en.ts` and reused by the existing menu, asset-list, notification and alias components. Shared strings may also appear outside the router pages.
- Tests must cover actual English locale values as well as their use on representative surfaces; component tests normally mock `t()` to return keys.
- `docs/MENU-DOCUMENTATION.md` describes the current menu label and needs updating.
- No backend, API, URL, data migration or deployment change is intended. Existing Core validation messages remain verbatim and may still use “router”.
