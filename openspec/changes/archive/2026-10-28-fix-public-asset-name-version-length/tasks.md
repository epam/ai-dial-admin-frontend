## 1. Shared validation

- [x] 1.1 Add `MAX_ASSET_NAME_VERSION_SYMBOLS = 255` in `apps/ai-dial-admin/src/constants/validation.ts` and a localized `AssetNameVersionTooLong` error key/message in `src/constants/i18n.ts` and `src/locales/en.ts`.
- [x] 1.2 Update `getAssetDestinationError` in `apps/ai-dial-admin/src/utils/validation/asset-version.ts` to validate the assembled name/version leaf including `__`, reuse `getVersionedName`, and preserve existing path-byte, invalidity, and uniqueness checks. Reuse existing `AssetVersion` and create-action wiring rather than adding duplicate checks.

## 2. Regression tests

- [x] 2.1 Extend `apps/ai-dial-admin/src/utils/validation/tests/asset-version.spec.ts` with both resource types' 255/256 boundaries, the reported 100+160 case, multibyte characters, and distinct localized length errors. Adjust the 900-byte boundary fixtures to use valid long parent paths and short leaves; assert 900 passes and 901 fails independently of the leaf limit.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/BaseControls/tests/AssetVersion.spec.tsx` to assert Version-field feedback and invalid validation-context registration for oversized leaves, and revalidation/error recovery after name or version changes for applications and toolsets. Reuse centralized mocks from `test-setup.tsx`.
- [x] 2.3 Extend `apps/ai-dial-admin/src/app/[lang]/assets-applications/actions.spec.ts` and `src/app/[lang]/assets-toolsets/actions.spec.ts` to assert exact localized rejection and no PUT at 256 combined characters, successful creation at 255, and preservation of platform/legacy behavior. Preserve existing byte-limit rejection expectations.

## 3. Specification and quality gates

Browser-observable scenarios exist. The user was asked about the automated `spec-browser-verify` task and selected **Tests only**, so no browser-verification task is included.

- [x] 3.1 Update `openspec/specs/public-asset-versions/spec.md` with the complete modified requirement and new scenarios from this change's delta, preserving existing scenarios and legacy-identity exceptions.
- [x] 3.2 Run targeted Vitest regression files from `apps/ai-dial-admin/`, then the final lint, spec lint, formatting, both typecheck gates, and full coverage suite using the project scripts. Validate the OpenSpec change and review the diff for unrelated changes. Record actual outcomes and any pre-existing failures; do not bypass hooks or touch the unrelated untracked handoff/planning files.

### Verification results (2026-10-28)

- Targeted Vitest run: 4 files passed, 138 tests passed.
- Full `npm run test` coverage gate: passed, exit code 0, signal=none; Nx suppressed the detailed test-count output.
- `npm run lint` and `npm run lint:specs`: passed.
- `npm run typecheck`: passed.
- `npm run typecheck:specs`: Nx plugin-worker startup failed before TypeScript ran. The equivalent direct `npx tsc -p tsconfig.spec.json --noEmit` from `apps/ai-dial-admin/` passed with zero errors.
- Changed code files: Prettier check passed; `git diff --check` passed.
- Repository-wide `npm run format`: blocked by pre-existing untracked files outside this change: HTML parse error in `Org Units UI Handoff.html` at line 437 and formatting warning in `org-units-doc.md`. Neither file was modified.
- Strict OpenSpec validation: change and consolidated `public-asset-versions` specification passed.
- Quality review: no blocking findings. No GitHub posts, commits, or pushes. Browser verification omitted as explicitly requested.
