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
//   - mirror integrity — the .cursor/.github entries listed in
//     scripts/agent-mirrors.mjs are generated copies of a .claude source; a copy
//     that drifts means Cursor or Copilot silently loads a stale rule, and a copy
//     replaced by anything else means the rule stops loading (full scan only)
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

import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import * as prettier from 'prettier';

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

// `.claude` first so that the canonical source is the path reported in any
// error; generated mirror entries are filtered out of this scan entirely.
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
// Declares which mirror entries are generated and from where. Resolved against
// `cwd` like every other path here, so a repo without it simply has no mirrors
// to check.
const MIRROR_MANIFEST = 'scripts/agent-mirrors.mjs';
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
    return false;
  }
};

// A generated mirror is a byte-identical copy of its source, so validating it
// again would report every finding up to three times — and would flag its
// `name:` as a duplicate Claude skill. checkMirrorIntegrity covers these paths
// by proving they still match the source that IS validated here.
const allAgentConfigFiles = (manifest) => {
  const generated = manifest?.MIRROR_SOURCE_BY_PATH ?? new Map();
  return [
    ...AGENT_CONFIG_FILES.filter(existsSync),
    ...AGENT_CONFIG_DIRECTORIES.flatMap(listFiles).filter((file) => ['.md', '.mdc'].includes(extname(file))),
  ].filter((file) => !generated.has(file));
};

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

// One canonical rule or skill under .claude feeds Cursor and Copilot as
// generated copies (see scripts/agent-mirrors.mjs). A copy that no longer
// matches its source makes a tool load a stale rule — or, when it is not a copy
// at all, load nothing usable. Neither is obvious in a diff or caught by any
// other check here, so this proves every declared mirror is still faithful.
//
// The mirrors were symlinks until Windows clones exposed the flaw: Git for
// Windows defaults to `core.symlinks=false` and writes a regular file holding
// the link target instead, so the rule silently stopped loading there. Such a
// leftover is still recognised below to give an old working tree a clear fix.
const FLATTENED_LINK_PATTERN = /^\.{1,2}\/[^\s]+\.(?:md|mdc)$/;

const loadMirrorManifest = async () => {
  if (!existsSync(MIRROR_MANIFEST)) return null;

  try {
    return await import(pathToFileURL(resolve(MIRROR_MANIFEST)).href);
  } catch (e) {
    fail(MIRROR_MANIFEST, `mirror manifest could not be loaded: ${e.message}`);
    return null;
  }
};

const checkMirrorIntegrity = (manifest) => {
  if (!manifest) return 0;

  const syncHint = `run \`${manifest.SYNC_COMMAND}\``;
  let checked = 0;

  for (const { source, mirrors } of manifest.AGENT_MIRRORS) {
    if (!existsSync(source)) {
      fail(source, `is listed in ${MIRROR_MANIFEST} as a mirror source but does not exist`);
      continue;
    }

    const expected = readFileSync(source, 'utf8');

    for (const mirror of mirrors) {
      checked += 1;

      if (!existsSync(mirror)) {
        fail(mirror, `missing generated mirror of \`${source}\`; ${syncHint}`);
        continue;
      }

      // A symlink pointing at the right bytes still passes the content check, so
      // name it explicitly — it is the pattern that breaks on Windows checkout.
      if (lstatSync(mirror).isSymbolicLink()) {
        fail(mirror, `is a symlink; mirror entries are generated copies now — ${syncHint}`);
        continue;
      }

      const content = readFileSync(mirror, 'utf8');
      if (content === expected) continue;

      if (FLATTENED_LINK_PATTERN.test(content.trim())) {
        fail(mirror, `is a flattened symlink left by a Windows checkout, not a copy of \`${source}\`; ${syncHint}`);
      } else {
        fail(mirror, `has drifted from \`${source}\`; edit the source, then ${syncHint}`);
      }
    }
  }

  return checked;
};

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
const mirrorManifest = await loadMirrorManifest();
const explicitFiles = process.argv.length > 2;
const files = explicitFiles ? process.argv.slice(2).map(toRepoRelative) : allAgentConfigFiles(mirrorManifest);
const skillNames = [];
let checkedConfigFiles = 0;

for (const file of files) {
  // Reached only in explicit-file mode — the full scan filters these out. Editing
  // a generated copy is the drift this gate exists to prevent, so say so at the
  // moment of the edit rather than letting the next full scan report it.
  const mirrorSource = mirrorManifest?.MIRROR_SOURCE_BY_PATH.get(file);
  if (mirrorSource) {
    fail(file, `is generated from \`${mirrorSource}\`; edit that file, then run \`${mirrorManifest.SYNC_COMMAND}\``);
    continue;
  }

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
const checkedMirrorEntries = explicitFiles ? 0 : checkMirrorIntegrity(mirrorManifest);
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
