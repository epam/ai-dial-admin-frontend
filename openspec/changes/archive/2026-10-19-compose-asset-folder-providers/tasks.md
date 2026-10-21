## 1. Composition helper

- [x] 1.1 Add `apps/ai-dial-admin/src/context/compose-providers.tsx` exporting `composeProviders(providers)`: folds a `ComponentType<{ children: ReactNode }>[]` with `reduceRight`, first entry outermost, returns one provider component. JSDoc states it must be called at module scope (design D3).
- [x] 1.2 Add `apps/ai-dial-admin/src/context/tests/compose-providers.spec.tsx`: nesting order (first listed is outermost), children render through the composition, an empty list renders children as-is, and the composed component keeps its identity across re-renders (no remount).

## 2. Asset folder composition

- [x] 2.1 Add `apps/ai-dial-admin/src/context/assets/AssetFolderProviders.tsx` (`'use client'`) exporting `AssetFolderProviders = composeProviders([...])` with the 14 factory-made providers in the current layout order: Apps, Models, AppRunners, CatalogSchemas, Interceptors, Translators, Routes, Roles, Keys, Prompt, Toolset, File, Conversation, Skill.
- [x] 2.2 In `apps/ai-dial-admin/src/app/[lang]/layout.tsx`, replace the 14 nested providers and their imports with `<AssetFolderProviders>` directly inside `RuleFolderProvider`, wrapping `NotificationProvider` as before. Leave `RuleFolderProvider` and everything outside it as is.

## 3. Docs

- [x] 3.1 Update the "Provider stack ([lang]/layout.tsx)" section of `openspec/config.yaml` to the real stack, with `AssetFolderProviders` as a single entry.

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs`, all at zero errors.
- [x] 4.2 Run the touched specs with `npx vitest run src/context` from `apps/ai-dial-admin/`, then the full `npm run test` as the final gate.

<!--
No browser-verification task: the change is a behavior-preserving restructure of the provider tree. It
has no delta specs and no scenario whose THEN clause describes UI, so there is nothing for
spec-browser-verify to check. Order and children pass-through are covered by the unit test in 1.2.
-->
