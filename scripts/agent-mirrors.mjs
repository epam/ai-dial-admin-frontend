// The single source of truth for which `.claude/` files are mirrored into the
// Cursor and Copilot trees, and where.
//
// One canonical file under `.claude/` carries a union frontmatter that all three
// tools read (`paths` for Claude Code, `globs`/`alwaysApply` for Cursor,
// `applyTo` for Copilot), so a mirror entry is a BYTE-IDENTICAL copy of its
// source — there is no per-tool transform.
//
// These used to be committed symlinks. Git for Windows ships with
// `core.symlinks=false` (creating a symlink needs an Administrator privilege
// there), so it checked each one out as a regular file containing the link
// target — ~30 bytes of path text where a rule should be. The rule then silently
// stopped loading for Cursor and Copilot on every Windows clone. Generated
// copies work on every platform; `npm run sync:agent-mirrors` writes them and
// `validate-agent-docs` fails when a copy drifts from its source.
//
// Mirrors are COMMITTED, not generated at install time: Copilot reads
// `.github/instructions/**` and `.github/skills/**` out of the repository
// itself (github.com, the web editor, Copilot code review), where no
// `postinstall` has ever run.
//
// Adding a rule or skill to a tool is a deliberate per-entry choice — the
// validator checks that the entries listed here are faithful, never that some
// other file ought to be listed.
export const AGENT_MIRRORS = [
  {
    source: '.claude/rules/a11y.md',
    mirrors: ['.cursor/rules/a11y.mdc', '.github/instructions/a11y.instructions.md'],
  },
  {
    source: '.claude/rules/code-standards.md',
    mirrors: ['.cursor/rules/code-standards.mdc', '.github/instructions/code-standards.instructions.md'],
  },
  {
    source: '.claude/rules/components.md',
    mirrors: ['.cursor/rules/components.mdc', '.github/instructions/components.instructions.md'],
  },
  {
    source: '.claude/rules/testing.md',
    mirrors: ['.cursor/rules/testing.mdc', '.github/instructions/testing.instructions.md'],
  },
  {
    source: '.claude/rules/utils.md',
    mirrors: ['.cursor/rules/utils.mdc', '.github/instructions/utils.instructions.md'],
  },
  // Also mirrored as a Cursor *rule*, not just a skill: Cursor picks rules up
  // automatically, so the review checklist applies without being invoked.
  {
    source: '.claude/skills/code-review-and-quality/SKILL.md',
    mirrors: [
      '.cursor/rules/code-review-and-quality.mdc',
      '.cursor/skills/code-review-and-quality/SKILL.md',
      '.github/skills/code-review-and-quality/SKILL.md',
    ],
  },
  // Cursor rule only — Copilot has no equivalent issue-filing surface.
  {
    source: '.claude/skills/create-ticket/SKILL.md',
    mirrors: ['.cursor/rules/create-ticket.mdc'],
  },
  {
    source: '.claude/skills/address-current-branch-review/SKILL.md',
    mirrors: [
      '.cursor/skills/address-current-branch-review/SKILL.md',
      '.github/skills/address-current-branch-review/SKILL.md',
    ],
  },
  {
    source: '.claude/skills/dial-admin-reference/SKILL.md',
    mirrors: ['.cursor/skills/dial-admin-reference/SKILL.md', '.github/skills/dial-admin-reference/SKILL.md'],
  },
  {
    source: '.claude/skills/git-commit/SKILL.md',
    mirrors: ['.cursor/skills/git-commit/SKILL.md', '.github/skills/git-commit/SKILL.md'],
  },
];

export const SYNC_COMMAND = 'npm run sync:agent-mirrors';

// Mirror path -> source path, for callers that start from a mirror file.
export const MIRROR_SOURCE_BY_PATH = new Map(
  AGENT_MIRRORS.flatMap(({ source, mirrors }) => mirrors.map((mirror) => [mirror, source])),
);
