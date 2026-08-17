// The single source of truth for which `.claude/` files are mirrored into the
// Cursor and Copilot trees, how, and where. `npm run sync:agent-mirrors` writes
// them; `validate-agent-docs` fails when one drifts from its source.
//
// These entries used to be committed symlinks. Git for Windows ships with
// `core.symlinks=false` (creating a symlink needs an Administrator privilege
// there), so it checked each one out as a regular file containing the link
// target — ~30 bytes of path text where a rule should be. The rule silently
// stopped loading for Cursor and Copilot on every Windows clone. Generated files
// work on every platform.
//
// Each entry picks a mode; `render-agent-mirror.mjs` documents what the two do
// and why Cursor can take a stub while Copilot cannot.
//
// Not listed here, deliberately:
//   - Skills. Cursor loads `.claude/skills/` as a compatibility path and Copilot
//     reads it as a default project skills location, so both see the canonical
//     files with no mirror at all.
//   - `.cursor/skills/openspec-*` and `.github/skills/openspec-*`. The openspec
//     CLI generates a distinct variant per tool; they are not copies of a
//     `.claude` source and `openspec init` owns them.
//
// Mirrors are COMMITTED rather than generated at install time: Copilot reads
// `.github/instructions/**` out of the repository itself (github.com, the web
// editor, code review, the coding agent), where no `postinstall` has ever run.

import { MirrorMode } from './render-agent-mirror.mjs';

export const AGENT_MIRRORS = [
  {
    source: '.claude/rules/a11y.md',
    mirrors: [
      { path: '.cursor/rules/a11y.mdc', mode: MirrorMode.Stub },
      { path: '.github/instructions/a11y.instructions.md', mode: MirrorMode.Copy },
    ],
  },
  {
    source: '.claude/rules/code-standards.md',
    mirrors: [
      { path: '.cursor/rules/code-standards.mdc', mode: MirrorMode.Stub },
      { path: '.github/instructions/code-standards.instructions.md', mode: MirrorMode.Copy },
    ],
  },
  {
    source: '.claude/rules/components.md',
    mirrors: [
      { path: '.cursor/rules/components.mdc', mode: MirrorMode.Stub },
      { path: '.github/instructions/components.instructions.md', mode: MirrorMode.Copy },
    ],
  },
  {
    source: '.claude/rules/testing.md',
    mirrors: [
      { path: '.cursor/rules/testing.mdc', mode: MirrorMode.Stub },
      { path: '.github/instructions/testing.instructions.md', mode: MirrorMode.Copy },
    ],
  },
  {
    source: '.claude/rules/utils.md',
    mirrors: [
      { path: '.cursor/rules/utils.mdc', mode: MirrorMode.Stub },
      { path: '.github/instructions/utils.instructions.md', mode: MirrorMode.Copy },
    ],
  },
  // Mirrored as a Cursor *rule* so the review checklist auto-applies rather than
  // waiting to be invoked. Cursor already loads the skill itself from
  // `.claude/skills/`, so this is the rule surface only.
  {
    source: '.claude/skills/code-review-and-quality/SKILL.md',
    mirrors: [{ path: '.cursor/rules/code-review-and-quality.mdc', mode: MirrorMode.Stub }],
  },
  {
    source: '.claude/skills/create-ticket/SKILL.md',
    mirrors: [{ path: '.cursor/rules/create-ticket.mdc', mode: MirrorMode.Stub }],
  },
];

export const SYNC_COMMAND = 'npm run sync:agent-mirrors';

// Mirror path -> { source, mode }, for callers that start from a mirror file.
export const MIRROR_BY_PATH = new Map(
  AGENT_MIRRORS.flatMap(({ source, mirrors }) => mirrors.map(({ path, mode }) => [path, { source, mode }])),
);
