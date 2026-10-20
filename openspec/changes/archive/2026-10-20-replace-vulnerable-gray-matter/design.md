## Context

The app uses `gray-matter@4.0.3` in `MdViewer` to remove YAML frontmatter before rendering markdown and in `skill-manifest.ts` to parse and reassemble `SKILL.md`. Its nested `js-yaml@3.15.2` depends on `argparse`, which installs vulnerable `sprintf-js@1.0.3`. The app already declares `yaml@2.8.3`, which is maintained and not part of this chain.

## Goals / Non-Goals

**Goals:**
- Remove the vulnerable production dependency chain reported by `npm audit --omit=dev`.
- Preserve delimiter-aware frontmatter extraction, YAML parsing, and the skill-manifest serialization contract.
- Retain unknown manifest fields when updating `name`, `description`, and the body.

**Non-Goals:**
- Change the `SKILL.md` schema, markdown rendering, or the behavior of the rich markdown editor.
- Make YAML parsing more permissive than the current parser.
- Remediate audit findings outside this chain.

## Decisions

### Centralize frontmatter handling in a local utility backed by `yaml`

Create a pure `frontmatter` utility that recognizes the leading `---` block, parses it with the existing `yaml` package, returns the body unchanged when there is no frontmatter, and serializes a document with a leading delimiter. Both callers use this shared utility.

**Rationale:** It removes `gray-matter` and its vulnerable dependency graph while avoiding duplicated delimiter and YAML-handling logic.

**Alternatives considered:**
- Downgrade `gray-matter` to the audit tool's suggested `2.0.1`: rejected because it is a major downgrade and would silently alter a direct dependency rather than provide a maintained remediation path.
- Override `sprintf-js`: rejected because every published version through `1.1.3` is vulnerable and the parent range only permits the vulnerable line.
- Upgrade nested `js-yaml` to v4: rejected because it removes the legacy API `gray-matter` uses and is not a compatible transitive substitution.

### Preserve the current caller contracts

`MdViewer` only consumes parsed body content. `parseSkillManifest` continues to expose string values for `name` and `description` with empty-string fallbacks, while `buildSkillManifest` merges edited fields into all parsed frontmatter fields before serialization.

**Rationale:** Existing UI behavior and Core's manifest format are unchanged, and the dedicated utility tests can make the parsing boundary explicit.

## Risks / Trade-offs

- [Delimiter or newline differences during serialization] → Cover round-trip output and field-retention cases, and preserve the existing final newline behavior expected by `SKILL.md` tests.
- [Unexpected YAML input differs from `gray-matter`] → Keep parsing scoped to a leading, closed `---` block and add missing-frontmatter and malformed-input cases before removing the old dependency.
- [A lockfile retains the old chain] → Regenerate the lockfile through npm and verify the production audit reports no `sprintf-js`, `argparse`, or nested `js-yaml@3` vulnerability.

## Migration Plan

1. Add and test the shared frontmatter utility using the existing `yaml` dependency.
2. Migrate `MdViewer` and skill-manifest helpers to it, then remove `gray-matter` from the manifest and regenerate the lockfile.
3. Run targeted tests, typechecks, lint/format checks, and `npm audit --omit=dev`.
4. Roll back by restoring the previous package manifest, lockfile, and `gray-matter` imports if a compatibility issue is discovered.

## Open Questions

- None.
