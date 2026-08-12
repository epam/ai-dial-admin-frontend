#!/usr/bin/env node
// Guards AI-assistant configuration against changes that would make a file
// stop being readable by an agent, or inconsistently formatted. The goal is
// narrow and deliberate: every rule, skill, command, settings, and MCP file
// must keep PARSING and LOADING. This is a structural gate, NOT a content or
// quality audit.
//
// IN SCOPE — a file must never silently break or become unloadable:
//   - prettier formatting (also catches files prettier can no longer parse)
//   - JSON / YAML / frontmatter parse correctness
//   - unterminated frontmatter blocks
//   - required frontmatter keys (skills/commands need `name` + `description`)
//   - cross-agent frontmatter field shapes (paths/globs/applyTo/alwaysApply)
//   - duplicate Claude skill names (one would silently shadow the other)
//   - broken `@file` references in docs
//   - broken `references/*` pointers from a skill to its deferred content
//   - mirror integrity — the .cursor/.github trees are symlinks back into
//     .claude; a broken or FLATTENED symlink means a whole rule silently stops
//     loading for Cursor or Copilot (full scan only)
//   - hidden/invisible characters — bidi controls, zero-width chars, BOM, and
//     U+FFFD from invalid UTF-8 — that corrupt parsing or silently alter text
//   - floating MCP package versions (`@latest`) that break reproducibility
//   - Tailwind breakpoints in source match the app's tailwind.config.js
//     (full scan only)
//   - committed secrets (known token shapes) in any config file, and
//     approval-gate-disabling permissions in .claude/settings.json. These are
//     OBJECTIVE security facts (a leaked key, a `*` grant), not quality opinions.
//
// OUT OF SCOPE — by design; do NOT add these here. They are subjective quality
// judgements that belong in a code review, not in a load-bearing gate:
//   - skill/command length, dedup, or "unique value" verdicts
//   - whether referenced MCP/tool names exist or are worth keeping
//   - mirror COMPLETENESS (whether every rule has a Cursor/Copilot counterpart
//     is a deliberate per-rule choice; only integrity of what exists is checked)
//   - freshness / ownership / staleness opinions
//
// Shared by three callers: the CI gate and the .husky/pre-commit gate both run
// it with no args (full scan), and the Claude PostToolUse hook runs it with the
// single edited file as an argument. Behaviour is covered by
// scripts/validate-agent-docs.spec.mjs (`npm run validate:agent-docs:test`).
//
// Usage: node scripts/validate-agent-docs.mjs <file...>
//        node scripts/validate-agent-docs.mjs
// Exit 0 = clean. Exit 1 = problems listed on stderr.
//
// With no file arguments, every tracked agent-config location is validated.

import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import * as prettier from 'prettier';

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

// `.claude` first so that when a mirror symlink collapses onto its target
// during dedup, the canonical path is the one reported in any error.
const AGENT_CONFIG_DIRECTORIES = [
  '.claude/commands',
  '.claude/rules',
  '.claude/skills',
  '.cursor/commands',
  '.cursor/rules',
  '.cursor/skills',
  '.github/instructions',
  '.github/prompts',
  '.github/skills',
];
const AGENT_CONFIG_FILES = ['.claude/settings.json', '.mcp.json', 'AGENTS.md', 'CLAUDE.md', 'openspec/config.yaml'];
// The mirror trees: every entry is expected to be a symlink back into .claude.
const MIRROR_DIRECTORIES = [
  '.cursor/commands',
  '.cursor/rules',
  '.cursor/skills',
  '.github/instructions',
  '.github/prompts',
  '.github/skills',
];
const IGNORED_DIRECTORIES = new Set(['.git', '.next', '.nx', 'coverage', 'dist', 'node_modules', 'tmp']);

const listFiles = (directory) => {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) return [];

    const path = `${directory}/${entry.name}`;
    // withFileTypes reports a symlinked directory as a symlink, not a
    // directory, so resolve it before deciding whether to recurse.
    const isDirectory = entry.isDirectory() || isSymlinkedDirectory(path);
    return isDirectory ? listFiles(path) : [path];
  });
};

const isSymlinkedDirectory = (path) => {
  try {
    return lstatSync(path).isSymbolicLink() && lstatSync(realpathSync(path)).isDirectory();
  } catch {
    return false; // broken link — checkMirrorIntegrity reports it
  }
};

// The mirror trees are symlinks into .claude, so a naive scan would validate
// the same bytes up to three times and report every error three times. Collapse
// by real path, keeping the first (canonical) occurrence.
const dedupeByRealPath = (files) => {
  const seen = new Set();
  return files.filter((file) => {
    let key;
    try {
      key = realpathSync(file);
    } catch {
      key = file; // broken link — keep it so the read error surfaces
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const allAgentConfigFiles = () =>
  dedupeByRealPath([
    ...AGENT_CONFIG_FILES.filter(existsSync),
    ...AGENT_CONFIG_DIRECTORIES.flatMap(listFiles).filter((file) => ['.md', '.mdc'].includes(extname(file))),
  ]);

const lineNumberAt = (src, index) => src.slice(0, index).split(/\r?\n/).length;

const classify = (f) =>
  f.endsWith('.json')
    ? 'json'
    : f.endsWith('config.yaml')
      ? 'config'
      : f.includes('.claude/skills/') || f.includes('.cursor/skills/') || f.includes('.github/skills/')
        ? 'skill'
        : f.includes('.claude/commands/')
          ? 'command'
          : f.includes('.claude/rules/') || f.includes('.cursor/rules/')
            ? 'rule'
            : 'doc'; // AGENTS.md / CLAUDE.md / .github/{instructions,prompts}

// Returns the parsed frontmatter object, null when there is none (valid for
// rules/docs), or undefined when the block is malformed (error already recorded).
const frontmatter = (src, file) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!match) {
    if (src.startsWith('---')) {
      fail(file, 'unterminated frontmatter block');
      return undefined;
    }
    return null; // no frontmatter at all — fine for rules/docs
  }
  try {
    return parse(match[1]) ?? {};
  } catch (e) {
    fail(file, `frontmatter YAML: ${e.message}`);
    return undefined;
  }
};

const checkFormatting = async (src, file) => {
  const info = await prettier.getFileInfo(file, {
    ignorePath: '.prettierignore',
    resolveConfig: true,
  });
  if (info.ignored || !info.inferredParser) return; // prettier wouldn't format it
  const config = (await prettier.resolveConfig(file)) ?? {};
  let formatted = false;
  try {
    formatted = await prettier.check(src, { ...config, filepath: file });
  } catch (e) {
    fail(file, `prettier could not parse: ${e.message}`);
    return;
  }
  if (!formatted) fail(file, 'prettier --check failed (run `npm run format:write`)');
};

// Invisible characters that would not survive a careful human review: bidi
// controls (used to hide or reorder text), zero-width characters, the BOM, and
// U+FFFD (which only appears when a file was decoded from invalid UTF-8). Any of
// these can corrupt frontmatter parsing or silently change what an instruction
// says, so they must never reach an agent-config file.
const HIDDEN_CHARACTERS = new Map(
  [
    [0x200b, 'ZERO WIDTH SPACE'],
    [0x200c, 'ZERO WIDTH NON-JOINER'],
    [0x200d, 'ZERO WIDTH JOINER'],
    [0x200e, 'LEFT-TO-RIGHT MARK'],
    [0x200f, 'RIGHT-TO-LEFT MARK'],
    [0x202a, 'LEFT-TO-RIGHT EMBEDDING'],
    [0x202b, 'RIGHT-TO-LEFT EMBEDDING'],
    [0x202c, 'POP DIRECTIONAL FORMATTING'],
    [0x202d, 'LEFT-TO-RIGHT OVERRIDE'],
    [0x202e, 'RIGHT-TO-LEFT OVERRIDE'],
    [0x2066, 'LEFT-TO-RIGHT ISOLATE'],
    [0x2067, 'RIGHT-TO-LEFT ISOLATE'],
    [0x2068, 'FIRST STRONG ISOLATE'],
    [0x2069, 'POP DIRECTIONAL ISOLATE'],
    [0xfeff, 'BYTE ORDER MARK / ZERO WIDTH NO-BREAK SPACE'],
    [0xfffd, 'REPLACEMENT CHARACTER (invalid UTF-8)'],
  ].map(([code, name]) => [String.fromCodePoint(code), name]),
);
const HIDDEN_CHARACTER_PATTERN = new RegExp(`[${[...HIDDEN_CHARACTERS.keys()].join('')}]`, 'gu');

const checkHiddenCharacters = (src, file) => {
  for (const match of src.matchAll(HIDDEN_CHARACTER_PATTERN)) {
    const codePoint = match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    fail(
      file,
      `line ${lineNumberAt(src, match.index)} contains hidden character U+${codePoint} (${HIDDEN_CHARACTERS.get(match[0])})`,
    );
  }
};

const checkFileReferences = (src, file) => {
  for (const match of src.matchAll(/^@([^\s]+)\s*$/gm)) {
    const referencedPath = match[1];
    if (!existsSync(resolve(referencedPath))) {
      fail(file, `line ${lineNumberAt(src, match.index)} references missing file \`${referencedPath}\``);
    }
  }
};

// Skills use progressive disclosure: a thin SKILL.md defers detail to
// `references/*.md` loaded on demand. A pointer that no longer resolves loses
// that content silently — the skill still loads, just without the part that
// mattered. Nothing else here would catch it, since the pointer is ordinary prose.
const SKILL_REFERENCE_PATTERN = /references\/[A-Za-z0-9._\-/]+\.(?:md|json|ya?ml|mjs|sh|txt)/g;

const checkSkillReferences = (src, file) => {
  const skillDirectory = dirname(file);

  for (const match of src.matchAll(SKILL_REFERENCE_PATTERN)) {
    if (!existsSync(resolve(skillDirectory, match[0]))) {
      fail(file, `line ${lineNumberAt(src, match.index)} points at missing \`${match[0]}\``);
    }
  }
};

const checkMcpVersions = (config, file) => {
  for (const [name, server] of Object.entries(config.mcpServers ?? {})) {
    for (const argument of server.args ?? []) {
      if (typeof argument === 'string' && argument.endsWith('@latest')) {
        fail(file, `MCP server \`${name}\` uses floating package version \`${argument}\`; pin an exact version`);
      }
    }
  }
};

// A committed credential must never reach an agent-config file. Match only
// well-known token shapes — deterministic, near-zero false positives. Generic
// high-entropy detection is intentionally omitted: in a docs-heavy repo it
// floods on hashes, ids, and base64 examples. Obvious placeholders (xxxx,
// <...>, your-, example, redacted, sample) are allowed so a doc can show a fake
// key without tripping the gate.
const SECRET_PATTERNS = [
  ['Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{16,}/g],
  ['OpenAI API key', /\bsk-[A-Za-z0-9]{20,}/g],
  ['GitHub token', /\b(?:ghp|gho|ghs|ghr)_[A-Za-z0-9]{20,}/g],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{20,}/g],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g],
];
const PLACEHOLDER_PATTERN = /x{4,}|\.\.\.|<[^>]*>|your[-_]|example|placeholder|redacted|dummy|sample|\*{3,}/i;

const checkSecrets = (src, file) => {
  for (const [label, pattern] of SECRET_PATTERNS) {
    for (const match of src.matchAll(pattern)) {
      if (PLACEHOLDER_PATTERN.test(match[0])) continue;
      fail(
        file,
        `line ${lineNumberAt(src, match.index)} looks like a committed ${label}; remove it and rotate the credential`,
      );
    }
  }
};

// Permission grants that effectively disable the approval gate. Only
// `.claude/settings.json` carries these; `.mcp.json` secrets are caught by
// checkSecrets. A healthy entry is scoped, e.g. `Bash(npm run test:*)`; the
// danger is a bare sensitive tool or a pure-wildcard argument.
const SENSITIVE_BARE_TOOL = /^(?:Bash|Write|Edit|MultiEdit)$/;
const WILDCARD_GRANT = /^[A-Za-z]+\(\s*:?\*\s*\)$/;

const checkSettingsSecurity = (config, src, file) => {
  const permissions = config.permissions ?? {};
  for (const entry of permissions.allow ?? []) {
    if (typeof entry !== 'string') continue;
    const value = entry.trim();
    if (value === '*') {
      fail(file, 'permissions.allow grants every tool with `*`');
    } else if (SENSITIVE_BARE_TOOL.test(value)) {
      fail(file, `permissions.allow grants the entire \`${value}\` tool; scope it like \`${value}(...)\``);
    } else if (WILDCARD_GRANT.test(value)) {
      fail(file, `permissions.allow entry \`${entry}\` is a wildcard grant; scope it to specific commands`);
    }
  }
  if (permissions.defaultMode === 'bypassPermissions') {
    fail(file, 'permissions.defaultMode `bypassPermissions` disables the approval gate');
  }
  if (src.includes('--dangerously-skip-permissions')) {
    fail(file, 'contains `--dangerously-skip-permissions`, which bypasses all approvals');
  }
};

// The .cursor and .github trees are symlinks back into .claude so one edit
// updates every tool. Two failure modes make a rule silently stop loading, and
// neither is visible in a diff or caught by any other check here:
//   1. a broken link — e.g. a trailing newline baked into the link target, which
//      `git diff` renders as an ordinary path
//   2. a FLATTENED link — a regular file whose entire content is the relative
//      path it was supposed to point at, so the tool loads ~30 bytes of text
// Both exist in the sibling ai-dial-chat repo today. This is integrity only:
// whether a given rule SHOULD have a mirror entry is a per-rule choice.
const FLATTENED_LINK_PATTERN = /^\.{1,2}\/[^\s]+\.(?:md|mdc)$/;
const FLATTENED_LINK_MAX_BYTES = 512;

const checkMirrorIntegrity = () => {
  let checked = 0;

  for (const directory of MIRROR_DIRECTORIES) {
    if (!existsSync(directory)) continue;

    for (const file of listMirrorEntries(directory)) {
      checked += 1;
      let stat;
      try {
        stat = lstatSync(file);
      } catch {
        continue;
      }

      if (stat.isSymbolicLink()) {
        const target = readlinkSync(file);
        if (/\s$/.test(target)) {
          fail(
            file,
            `symlink target \`${target.replace(/\s+$/, '')}\` has trailing whitespace baked into the link; recreate it with \`ln -sfn\``,
          );
        } else if (!existsSync(file)) {
          fail(file, `broken symlink -> \`${target}\``);
        }
        continue;
      }

      if (!stat.isFile() || stat.size > FLATTENED_LINK_MAX_BYTES) continue;

      const content = readFileSync(file, 'utf8').trim();
      if (FLATTENED_LINK_PATTERN.test(content)) {
        fail(
          file,
          `looks like a flattened symlink: a regular file whose only content is \`${content}\`; recreate it with \`ln -sfn ${content} ${file}\``,
        );
      }
    }
  }

  return checked;
};

// Walks a mirror tree WITHOUT following symlinks, so a symlinked skill folder is
// returned as the single entry to check rather than being descended into.
const listMirrorEntries = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.name === '.DS_Store') return [];
    if (entry.isDirectory()) return listMirrorEntries(path);
    return [path];
  });

const TAILWIND_CONFIG = 'apps/ai-dial-admin/tailwind.config.js';

const readTailwindBreakpoints = () => {
  if (!existsSync(TAILWIND_CONFIG)) return new Set();

  const src = readFileSync(TAILWIND_CONFIG, 'utf8');
  const screensBlock = /screens:\s*\{([\s\S]*?)\n\s*\},/.exec(src)?.[1] ?? '';
  return new Set([...screensBlock.matchAll(/^\s*([A-Za-z][\w-]*):/gm)].map((match) => match[1]));
};

const checkSourceBreakpoints = () => {
  const allowedBreakpoints = readTailwindBreakpoints();
  if (allowedBreakpoints.size === 0) return 0;

  const sourceFiles = listFiles('apps').filter((file) =>
    ['.css', '.js', '.jsx', '.scss', '.ts', '.tsx'].includes(extname(file)),
  );
  const projectBreakpointPattern = /\b(mobile|desktop|[A-Za-z][\w-]*(?:_tablet|_desktop)):/g;

  for (const file of sourceFiles) {
    const src = readFileSync(file, 'utf8');
    for (const match of src.matchAll(projectBreakpointPattern)) {
      if (!allowedBreakpoints.has(match[1])) {
        fail(file, `line ${lineNumberAt(src, match.index)} uses unknown Tailwind breakpoint \`${match[1]}:\``);
      }
    }
  }

  return sourceFiles.length;
};

const checkUniqueClaudeSkillNames = (skillNames) => {
  const seen = new Map();
  for (const { file, name } of skillNames) {
    if (!file.includes('.claude/skills/')) continue;

    const previousFile = seen.get(name);
    if (previousFile) {
      fail(file, `skill name \`${name}\` duplicates ${previousFile}`);
    } else {
      seen.set(name, file);
    }
  }
};

// The PostToolUse hook passes ABSOLUTE paths while CI and pre-commit pass
// repo-relative ones. prettier's `.prettierignore` matching is relative to the
// ignore file, so an absolute path silently misses every pattern in it — the
// same file would then be formatting-checked by one caller and not another.
// Normalize so all three callers see identical behaviour. Paths outside the repo
// are left as-is (the test suite runs fixtures from a temp dir).
const toRepoRelative = (file) => {
  const rel = relative(process.cwd(), resolve(file));
  return rel && !rel.startsWith('..') ? rel : file;
};

// Explicit files (hook, tests) validate only those files. The repo-wide Tailwind
// breakpoint scan and the mirror-integrity walk are full-scan concerns (CI,
// pre-commit): editing one config file cannot introduce a source breakpoint
// regression, and mirror integrity is a property of whole directories.
const explicitFiles = process.argv.length > 2;
const files = explicitFiles ? process.argv.slice(2).map(toRepoRelative) : allAgentConfigFiles();
const skillNames = [];
let checkedConfigFiles = 0;

for (const file of files) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    continue; // deleted/missing path — nothing to validate
  }
  checkedConfigFiles += 1;

  await checkFormatting(src, file);
  checkHiddenCharacters(src, file);
  checkSecrets(src, file);

  const kind = classify(file);

  if (kind === 'json') {
    try {
      const config = JSON.parse(src);
      if (file.endsWith('.mcp.json')) checkMcpVersions(config, file);
      if (file.endsWith('.claude/settings.json')) checkSettingsSecurity(config, src, file);
    } catch (e) {
      fail(file, `JSON: ${e.message}`);
    }
    continue;
  }

  if (kind === 'config') {
    try {
      parse(src);
    } catch (e) {
      fail(file, `YAML: ${e.message}`);
    }
    continue;
  }

  checkFileReferences(src, file);

  const fm = frontmatter(src, file);
  if (fm === undefined) continue; // malformed — already reported
  if (fm === null) continue; // no frontmatter — valid for rules/docs

  if (kind === 'skill') {
    checkSkillReferences(src, file);
    if (!fm.name) fail(file, 'skill frontmatter missing `name`');
    if (!fm.description) fail(file, 'skill frontmatter missing `description`');
    if (fm.name) skillNames.push({ file, name: fm.name });
  }

  if (kind === 'command') {
    if (!fm.name) fail(file, 'command frontmatter missing `name`');
    if (!fm.description) fail(file, 'command frontmatter missing `description`');
  }

  // Cross-agent scoping keys share one canonical frontmatter block: Claude Code
  // reads `paths`, Cursor reads `globs`/`alwaysApply`, Copilot reads `applyTo`.
  // Enforce the shape each dialect expects so they stay in sync. Checks fire
  // only when a key exists.
  if (fm.paths !== undefined && !Array.isArray(fm.paths)) {
    fail(file, '`paths` (Claude) must be a list'); // YAML list of globs
  }
  if (fm.globs !== undefined && typeof fm.globs !== 'string') {
    fail(file, '`globs` (Cursor) must be a comma-separated string');
  }
  if (fm.applyTo !== undefined && typeof fm.applyTo !== 'string') {
    fail(file, '`applyTo` (Copilot) must be a comma-separated string');
  }
  if (fm.alwaysApply !== undefined && typeof fm.alwaysApply !== 'boolean') {
    fail(file, '`alwaysApply` (Cursor) must be a boolean');
  }
}

checkUniqueClaudeSkillNames(skillNames);
const checkedMirrorEntries = explicitFiles ? 0 : checkMirrorIntegrity();
const checkedSourceFiles = explicitFiles ? 0 : checkSourceBreakpoints();
const summary = `${checkedConfigFiles} config files, ${checkedMirrorEntries} mirror entries, ${checkedSourceFiles} source files`;

if (errors.length) {
  console.error(`Agent-config validation failed (${summary}):\n` + errors.map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}

console.log(`Agent-config validation passed (${summary}).`);
console.log(
  'Checks: formatting, JSON/YAML/frontmatter, hidden characters, secrets, settings permissions, file and skill-reference links, mirror integrity, skill names, MCP versions, Tailwind breakpoints.',
);
