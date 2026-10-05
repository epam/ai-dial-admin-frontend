## 1. Source-mode composition

- [x] 1.1 Update `apps/ai-dial-admin/src/components/Assets/Resources/ResourceSourceField.tsx` and its source option definitions so Assets Application creation can expose a UI-only Interfaces mode first, while retaining Endpoints, App Runner, and conditional Code App behavior without persisting Interfaces as a Core source discriminator.
- [x] 1.2 Reuse `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfacesField.tsx` with the asset application interface types, translators, and snake_case resource field handling when the creation source mode is Interfaces.

## 2. Guided Assets Application creation

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Assets/Apps/CreateApplication.tsx` using the `DialFormPopup` step pattern from `Assets/Platform/Keys/CreateKeyModal.tsx`; implement the identity step with id, display name, destination-aware version, and description validation.
- [x] 2.2 Implement the source step in `CreateApplication` with Interfaces selected by default, source-specific configuration, a 540px maximum content height, accessible scrolling, and previous/create actions.
- [x] 2.3 Wire the Assets Applications create entry point to `CreateApplication` while preserving the existing create action, protected request handling, asset refresh, notifications, bucket-aware navigation, and platform `user_roles` initialization.

## 3. Automated tests

- [x] 3.1 Add component tests for `CreateApplication` covering identity-first progression, public/platform version behavior, Interfaces as the first default source, conditional Code App visibility, source-specific editor rendering, and second-step height/scroll behavior using role- and label-based queries.
- [x] 3.2 Update `apps/ai-dial-admin/src/components/Assets/Resources` and `apps/ai-dial-admin/src/components/Assets/Apps` tests to cover resource draft updates for Interfaces and to ensure no Interfaces Core source discriminator is submitted.

## 4. Quality checks

- [x] 4.1 Run the focused Vitest suites from `apps/ai-dial-admin/`, then `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, `npm run format`, and the applicable full test gate; investigate isolated failures before attributing known Windows full-suite flakiness to this change. (Focused tests, typechecks, changed-file lint, and formatting passed; the full Windows `--runInBand` suite has 34 unrelated known flaky failures.)

> Browser verification task omitted at the user's request. The change has browser-observable scenarios, but the user chose not to add the automated `spec-browser-verify` task.
