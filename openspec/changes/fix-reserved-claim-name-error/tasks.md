# Tasks

## 1. Reserved claim feedback

- [x] 1.1 In `apps/ai-dial-admin/src/components/FoldersStorage/AddHolderForm.tsx`, derive reserved-name feedback from the existing reserved-key set using trimmed, case-sensitive matching, and pass the existing `HolderClaimKeyReserved` translation and invalid state to the claim-name input. Preserve Add validation and leave claim-value feedback independent; verify the focused `UnitRolesCard` test passes.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/FoldersStorage/tests/UnitRolesCard.spec.tsx` with component tests for all three reserved names, whitespace, blank and valid values, clearing the error after correction, alternate case, and non-reserved incomplete inputs; verify with `npx vitest run src/components/FoldersStorage/tests/UnitRolesCard.spec.tsx` from `apps/ai-dial-admin/`.
- [x] 1.3 Update `openspec/specs/org-units-folders-storage/spec.md` to match the modified requirement in this change's delta, preserving all other scenarios; verify the consolidated requirement matches the delta.

## 2. Final quality checks

- [ ] 2.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; verify their results and report any failures or environmental blockers.

Automated browser verification was offered and declined for this change.
