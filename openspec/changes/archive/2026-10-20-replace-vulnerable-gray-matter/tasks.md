## 1. Frontmatter utility

- [x] 1.1 Add `apps/ai-dial-admin/src/utils/frontmatter.ts` with delimiter-aware YAML frontmatter parsing and serialization backed by the existing `yaml` dependency.
- [x] 1.2 Migrate `apps/ai-dial-admin/src/utils/skill-manifest.ts` to the shared frontmatter utility while preserving empty-string fallbacks and unrelated frontmatter fields.
- [x] 1.3 Migrate `apps/ai-dial-admin/src/components/Common/MdViewer/MdViewer.tsx` to strip leading frontmatter through the shared utility before sanitizing and rendering markdown.

## 2. Dependency remediation

- [x] 2.1 Remove `gray-matter` from root `package.json` and regenerate `package-lock.json` so the `js-yaml@3` → `argparse` → `sprintf-js` chain is absent.

## 3. Automated coverage

- [x] 3.1 Add `apps/ai-dial-admin/src/utils/tests/frontmatter.spec.ts` covering valid leading frontmatter, no or unclosed frontmatter, later body delimiters, YAML field parsing, serialization, and invalid YAML behavior.
- [x] 3.2 Update `apps/ai-dial-admin/src/utils/tests/skill-manifest.spec.ts` to verify manifest parsing and reassembly retain its existing contract through the new utility.
- [x] 3.3 Add `apps/ai-dial-admin/src/components/Common/MdViewer/tests/MdViewer.spec.tsx` covering rendering of markdown after leading frontmatter has been removed.

## 4. Quality checks

- [x] 4.1 Run the targeted frontmatter, skill-manifest, and MdViewer Vitest specifications from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, `npm run format`, and the full `npm run test` suite.
- [x] 4.3 Run `npm audit --omit=dev --json` and confirm it reports no `sprintf-js` vulnerability or vulnerable `gray-matter` chain.
- [x] 4.4 No browser-verification task is needed because the acceptance scenarios cover dependency resolution and pure parsing/serialization outputs rather than browser-observable UI behavior.
