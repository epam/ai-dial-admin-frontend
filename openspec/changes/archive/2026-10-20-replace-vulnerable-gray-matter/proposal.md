## Why

`npm audit --omit=dev` reports that the production `gray-matter` dependency chain installs `sprintf-js@1.0.3`, which is affected by GHSA-hp3w-g68c-fv3c. The advisory has no patched `sprintf-js` release, so resolving the issue requires replacing the vulnerable frontmatter parser without changing the app's markdown or skill-manifest behavior.

## What Changes

- Replace `gray-matter` with the existing maintained YAML dependency for parsing and serializing markdown frontmatter.
- Preserve frontmatter stripping in `MdViewer` and skill-manifest parsing/serialization semantics, including retention of unrelated frontmatter fields.
- Remove the vulnerable transitive dependency chain and verify the production audit result.

## Non-goals

- Changing the supported `SKILL.md` frontmatter schema or user-facing editor behavior.
- Changing markdown rendering, sanitization, or Core API contracts.
- Remediating unrelated audit findings.

## Capabilities

### New Capabilities
- `dependency-security`: Production dependency remediation that preserves required frontmatter behavior while removing known vulnerable transitive packages.

### Modified Capabilities
- None.

## Impact

- Affected code: `apps/ai-dial-admin/src/components/Common/MdViewer/MdViewer.tsx`, `apps/ai-dial-admin/src/utils/skill-manifest.ts`, and their tests.
- Affected dependencies: root `package.json` and `package-lock.json`; `gray-matter` and its `js-yaml@3`/`argparse`/`sprintf-js` transitive chain are removed.
- No backend APIs or user-facing flows are intentionally changed.
