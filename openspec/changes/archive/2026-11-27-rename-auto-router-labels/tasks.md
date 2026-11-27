# Tasks

## 1. Auto Router terminology

- [x] 1.1 Update existing router-entity display values in `apps/ai-dial-admin/src/locales/en.ts`, including navigation, shared asset actions and empty states, alias selectors, field labels and frontend-owned descriptions. Preserve i18n keys, Route labels, `/platform-routers`, Core identifiers and backend messages; verify the locale unit tests in 1.2 cover the changed values.
- [x] 1.2 Add focused unit and component coverage in `apps/ai-dial-admin/src/locales/tests/en.spec.ts`, `src/components/Menu/tests/menu-configuration.spec.ts` and `src/components/Assets/Entities/Aliases/tests/TargetField.spec.tsx` as needed. Assert real English singular/plural, action, empty-state, alias and explanatory values; unchanged Route labels; menu key and destination; alias picker/present-as keys and preserved `routers/` targets. Run the affected Vitest files from `apps/ai-dial-admin/`.
- [x] 1.3 Update the Auto Routers menu entry and description in `docs/MENU-DOCUMENTATION.md`; verify the documented label and `PlatformRouters` key match the locale and existing menu configuration.

## 2. Final quality checks

- [ ] 2.1 Run `npm run lint`, `npm run lint:specs`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; record and address any failures.

Automated browser verification was offered and declined for this change.
